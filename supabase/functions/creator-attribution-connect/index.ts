import { createClient } from 'npm:@supabase/supabase-js@2.110.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: authData } = await supabase.auth.getUser(token);
  if (!authData.user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const attributionToken = String(body.attributionToken || '');
  if (!/^[0-9a-f-]{20,80}$/i.test(attributionToken)) return json({ connected: false });
  const visitorHash = await sha256(attributionToken);
  const { data: attribution } = await supabase.from('affiliate_attributions').select('*')
    .eq('anonymous_visitor_hash', visitorHash).maybeSingle();
  if (!attribution || (attribution.expires_at && new Date(attribution.expires_at) < new Date())) return json({ connected: false });

  const { data: affiliate } = await supabase.from('affiliate_accounts').select('user_id')
    .eq('id', attribution.original_affiliate_id).single();
  if (affiliate?.user_id === authData.user.id) {
    await supabase.from('affiliate_fraud_flags').insert({
      affiliate_account_id: attribution.original_affiliate_id,
      signal_type: 'self_referral', severity: 'high', details: { user_id: authData.user.id },
    });
    return json({ connected: false, reason: 'self_referral' });
  }

  const { data: existing } = await supabase.from('affiliate_user_attributions').select('*')
    .eq('user_id', authData.user.id).maybeSingle();
  if (!existing) {
    await supabase.from('affiliate_user_attributions').insert({
      user_id: authData.user.id,
      original_affiliate_id: attribution.original_affiliate_id,
      latest_affiliate_touch_id: attribution.latest_affiliate_touch_id,
      original_link_id: attribution.original_link_id,
      latest_link_id: attribution.latest_link_id,
      first_attributed_at: attribution.first_attributed_at,
      last_touched_at: attribution.last_touched_at,
      attribution_model: attribution.attribution_model,
      expires_at: attribution.expires_at,
      locked: attribution.locked,
    });
    await supabase.from('affiliate_conversions').upsert({
      affiliate_account_id: attribution.original_affiliate_id,
      affiliate_link_id: attribution.original_link_id,
      user_id: authData.user.id,
      conversion_type: 'signup',
      source_event_id: `signup:${authData.user.id}`,
      amount_minor: 0,
      currency: 'eur',
    }, { onConflict: 'source_event_id,conversion_type', ignoreDuplicates: true });
  } else if (!existing.locked) {
    await supabase.from('affiliate_user_attributions').update({
      latest_affiliate_touch_id: attribution.latest_affiliate_touch_id,
      latest_link_id: attribution.latest_link_id,
      last_touched_at: attribution.last_touched_at,
      expires_at: attribution.expires_at,
    }).eq('id', existing.id);
  }
  return json({ connected: true });
});
