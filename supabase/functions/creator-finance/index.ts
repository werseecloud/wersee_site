import { createClient } from 'npm:@supabase/supabase-js@2.110.3';
import Stripe from 'npm:stripe@20.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const authToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: authData } = await supabase.auth.getUser(authToken);
    if (!authData.user) return json({ error: 'Unauthorized' }, 401);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');
    const { data: creator } = await supabase.from('creator_profiles')
      .select('*, affiliate_accounts!inner(id)').eq('user_id', authData.user.id).single();
    if (!creator) return json({ error: 'Creator mode is not active' }, 404);
    const affiliateAccount = Array.isArray(creator.affiliate_accounts) ? creator.affiliate_accounts[0] : creator.affiliate_accounts;
    const { data: profile } = await supabase.from('profiles').select('stripe_account_id, country, name, full_name')
      .eq('id', authData.user.id).single();
    let stripeAccountId = creator.stripe_account_id || profile?.stripe_account_id || null;

    if (action === 'connect') {
      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          country: String(body.country || profile?.country || 'GB').slice(0, 2).toUpperCase(),
          email: authData.user.email,
          capabilities: { transfers: { requested: true } },
          business_profile: { product_description: 'Wersee creator commissions' },
          metadata: { wersee_user_id: authData.user.id, creator_id: creator.id },
        });
        stripeAccountId = account.id;
        await Promise.all([
          supabase.from('profiles').update({ stripe_account_id: account.id }).eq('id', authData.user.id),
          supabase.from('creator_profiles').update({ stripe_account_id: account.id, payout_status: 'onboarding' }).eq('id', creator.id),
        ]);
      }
      const returnUrl = `${Deno.env.get('WERSEE_PUBLIC_SITE_URL') || 'https://wersee.com'}/creators/payouts`;
      const link = await stripe.accountLinks.create({ account: stripeAccountId, refresh_url: returnUrl, return_url: returnUrl, type: 'account_onboarding' });
      return json({ url: link.url });
    }

    if (!stripeAccountId) return json({ status: 'not_connected' });
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const active = !account.deleted && account.payouts_enabled && account.details_submitted;
    const payoutStatus = account.deleted ? 'not_connected' : active ? 'active' : account.requirements?.currently_due?.length ? 'verification_required' : 'onboarding';
    await supabase.from('creator_profiles').update({ payout_status: payoutStatus }).eq('id', creator.id);

    if (action === 'status') return json({ status: payoutStatus, payoutsEnabled: !account.deleted && account.payouts_enabled, detailsSubmitted: !account.deleted && account.details_submitted });
    if (action !== 'request_payout') return json({ error: 'Unknown action' }, 400);
    if (!active) return json({ error: 'Complete Stripe verification before requesting a payout' }, 409);

    const currency = String(body.currency || 'eur').toLowerCase();
    const { data: ledger } = await supabase.from('affiliate_commission_ledger').select('amount_minor')
      .eq('affiliate_account_id', affiliateAccount.id).eq('currency', currency).lte('effective_at', new Date().toISOString());
    const available = (ledger || []).reduce((sum, row) => sum + Number(row.amount_minor || 0), 0);
    const requested = Math.floor(Number(body.amountMinor || available));
    if (!Number.isSafeInteger(requested) || requested < 100 || requested > available) return json({ error: 'Invalid or unavailable payout amount', availableMinor: available }, 400);

    const { data: payout, error: payoutError } = await supabase.from('affiliate_payouts').insert({
      affiliate_account_id: affiliateAccount.id, amount_minor: requested, currency, status: 'processing', stripe_account_id: stripeAccountId,
    }).select().single();
    if (payoutError) throw payoutError;
    try {
      const transfer = await stripe.transfers.create({
        amount: requested, currency, destination: stripeAccountId,
        metadata: { wersee_creator_payout_id: payout.id, creator_id: creator.id },
      }, { idempotencyKey: `creator-payout-${payout.id}` });
      await supabase.from('affiliate_commission_ledger').insert({
        affiliate_account_id: affiliateAccount.id, payout_id: payout.id, entry_type: 'payout', amount_minor: -requested,
        currency, source_event_id: `payout:${payout.id}`, description: 'Creator payout sent to Stripe Connect',
      });
      await supabase.from('affiliate_payouts').update({ status: 'paid', stripe_transfer_id: transfer.id, processed_at: new Date().toISOString() }).eq('id', payout.id);
      return json({ success: true, payoutId: payout.id, transferId: transfer.id });
    } catch (error) {
      await supabase.from('affiliate_payouts').update({ status: 'failed', failure_message: error instanceof Error ? error.message : 'Stripe transfer failed', processed_at: new Date().toISOString() }).eq('id', payout.id);
      throw error;
    }
  } catch (error) {
    console.error('creator-finance failed', error);
    return json({ error: error instanceof Error ? error.message : 'Creator finance request failed' }, 500);
  }
});
