import { createClient } from 'npm:@supabase/supabase-js@2.110.3';

const baseUrl = (Deno.env.get('WERSEE_PUBLIC_SITE_URL') || 'https://wersee.com').replace(/\/+$/, '');

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const cookieValue = (header: string | null, name: string) =>
  header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);

const deviceCategory = (userAgent: string) =>
  /tablet|ipad/i.test(userAgent) ? 'tablet' : /mobile|iphone|android/i.test(userAgent) ? 'mobile' : 'desktop';

const ATTRIBUTION_DAYS = 30;
const ATTRIBUTION_SECONDS = ATTRIBUTION_DAYS * 24 * 60 * 60;
const safeCampaignValue = (value: string | null) => value?.trim().slice(0, 160) || null;

Deno.serve(async (req) => {
  if (!['GET', 'HEAD'].includes(req.method)) return new Response('Method not allowed', { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const route = decodeURIComponent(url.pathname.split('/creator-referral/')[1] || '').replace(/^\/+|\/+$/g, '');
  const [usernameRaw, ...slugParts] = route.split('/').filter(Boolean);
  const username = (usernameRaw || '').toLowerCase();
  const linkSlug = slugParts.join('/') || 'main';

  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) return Response.redirect(baseUrl, 302);

  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('id, public_profile_enabled, attribution_model, attribution_window_days, affiliate_accounts!inner(id, status)')
    .eq('username', username)
    .eq('status', 'active')
    .maybeSingle();

  let account = Array.isArray(creator?.affiliate_accounts) ? creator.affiliate_accounts[0] : creator?.affiliate_accounts;
  let publicProfileEnabled = Boolean(creator?.public_profile_enabled);
  if (!account) {
    const { data: platformAffiliate } = await supabase
      .from('affiliate_accounts')
      .select('id,status')
      .eq('external_referral_key', username)
      .eq('status', 'active')
      .not('onboarding_completed_at', 'is', null)
      .maybeSingle();
    account = platformAffiliate;
    publicProfileEnabled = false;
  }
  if (!account || account.status !== 'active') return Response.redirect(baseUrl, 302);

  const { data: link } = await supabase
    .from('affiliate_links')
    .select('id, campaign_id, destination_path, source_platform, medium, status')
    .eq('affiliate_account_id', account.id)
    .eq('slug', linkSlug)
    .eq('status', 'active')
    .maybeSingle();

  if (!link) {
    const fallback = publicProfileEnabled ? `/creator/${encodeURIComponent(username)}` : '/';
    return Response.redirect(`${baseUrl}${fallback}`, 302);
  }

  const visitorToken = cookieValue(req.headers.get('cookie'), 'wersee_creator_attribution') || crypto.randomUUID();
  const visitorHash = await sha256(visitorToken);
  const sessionToken = cookieValue(req.headers.get('cookie'), 'wersee_creator_session') || crypto.randomUUID();
  const sessionHash = await sha256(sessionToken);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from('affiliate_clicks').select('id', { count: 'exact', head: true })
    .eq('affiliate_link_id', link.id).eq('anonymous_visitor_hash', visitorHash).gte('occurred_at', since);
  const now = new Date();

  await supabase.from('affiliate_clicks').insert({
    affiliate_link_id: link.id,
    affiliate_account_id: account.id,
    campaign_id: link.campaign_id,
    anonymous_visitor_hash: visitorHash,
    session_hash: sessionHash,
    landing_page: url.pathname,
    destination_path: link.destination_path,
    referrer: req.headers.get('referer'),
    utm_source: url.searchParams.get('utm_source') || link.source_platform || 'creator',
    utm_medium: url.searchParams.get('utm_medium') || link.medium || 'creator',
    utm_campaign: url.searchParams.get('utm_campaign'),
    utm_content: url.searchParams.get('utm_content'),
    device_category: deviceCategory(req.headers.get('user-agent') || ''),
    country_code: req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry'),
    is_unique: !count,
  });

  const { data: existing } = await supabase.from('affiliate_attributions').select('*')
    .eq('anonymous_visitor_hash', visitorHash).maybeSingle();
  const existingExpired = Boolean(existing?.expires_at && new Date(existing.expires_at) <= now);
  const expiresAt = new Date(now.getTime() + ATTRIBUTION_SECONDS * 1000).toISOString();
  let activeExpiresAt = expiresAt;
  let firstAttributedAt = now.toISOString();

  if (!existing || existingExpired) {
    const attribution = {
      anonymous_visitor_hash: visitorHash,
      original_affiliate_id: account.id,
      latest_affiliate_touch_id: account.id,
      original_link_id: link.id,
      latest_link_id: link.id,
      first_attributed_at: now.toISOString(),
      last_touched_at: now.toISOString(),
      attribution_model: 'first_touch',
      expires_at: expiresAt,
      locked: true,
    };
    if (existing) await supabase.from('affiliate_attributions').update(attribution).eq('id', existing.id);
    else await supabase.from('affiliate_attributions').insert(attribution);
  } else {
    activeExpiresAt = existing.expires_at || expiresAt;
    firstAttributedAt = existing.first_attributed_at;
    await supabase.from('affiliate_attributions').update({
      latest_affiliate_touch_id: account.id,
      latest_link_id: link.id,
      last_touched_at: now.toISOString(),
    }).eq('id', existing.id);
  }

  const destination = new URL(link.destination_path, `${baseUrl}/`);
  if (destination.origin !== new URL(baseUrl).origin) return Response.redirect(baseUrl, 302);
  destination.searchParams.set('utm_source', url.searchParams.get('utm_source') || link.source_platform || username);
  destination.searchParams.set('utm_medium', url.searchParams.get('utm_medium') || 'creator');
  if (url.searchParams.get('utm_campaign')) destination.searchParams.set('utm_campaign', url.searchParams.get('utm_campaign')!);

  const headers = new Headers({ Location: destination.toString(), 'Cache-Control': 'no-store, private' });
  const remainingSeconds = Math.max(0, Math.min(ATTRIBUTION_SECONDS, Math.floor((new Date(activeExpiresAt).getTime() - now.getTime()) / 1000)));
  const referralDetails = encodeURIComponent(JSON.stringify({
    creator: creator ? username : null,
    affiliate: username,
    link: linkSlug,
    source: safeCampaignValue(url.searchParams.get('utm_source') || link.source_platform || 'creator'),
    medium: safeCampaignValue(url.searchParams.get('utm_medium') || link.medium || 'creator'),
    campaign: safeCampaignValue(url.searchParams.get('utm_campaign')),
    content: safeCampaignValue(url.searchParams.get('utm_content')),
    clicked_at: firstAttributedAt,
    expires_at: activeExpiresAt,
  }));
  headers.append('Set-Cookie', `wersee_creator_attribution=${visitorToken}; Path=/; Max-Age=${remainingSeconds}; Secure; SameSite=Lax`);
  headers.append('Set-Cookie', `wersee_creator_referral=${referralDetails}; Path=/; Max-Age=${remainingSeconds}; Secure; SameSite=Lax`);
  headers.append('Set-Cookie', `wersee_creator_session=${sessionToken}; Path=/; Max-Age=86400; Secure; SameSite=Lax`);
  return new Response(null, { status: 302, headers });
});
