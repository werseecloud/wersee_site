import { createClient } from 'npm:@supabase/supabase-js@2.110.3';
import Stripe from 'npm:stripe@20.0.0';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});
const hash = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const MARKETPLACE_CREATOR_COMMISSION_PERCENT = 5;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_CREATOR_WEBHOOK_SECRET') || Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !webhookSecret) return json({ error: 'Webhook is not configured' }, 500);
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    return json({ error: 'Invalid Stripe signature', detail: error instanceof Error ? error.message : undefined }, 400);
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error: eventInsertError } = await supabase.from('creator_webhook_events').insert({
    event_id: event.id, event_type: event.type, livemode: event.livemode, payload_hash: await hash(rawBody),
  });
  if (eventInsertError?.code === '23505') return json({ received: true, duplicate: true });
  if (eventInsertError) return json({ error: eventInsertError.message }, 500);

  try {
    const object = event.data.object as any;
    const paymentIntentId = typeof object.payment_intent === 'string'
      ? object.payment_intent
      : object.object === 'payment_intent' ? object.id
      : object.object === 'charge' && typeof object.payment_intent === 'string' ? object.payment_intent
      : null;
    const sessionId = object.object === 'checkout.session' ? object.id : null;
    const orderId = object.metadata?.wersee_order_id || object.metadata?.order_id || null;
    let orderQuery = supabase.from('orders').select('*');
    if (orderId) orderQuery = orderQuery.eq('id', orderId);
    else if (paymentIntentId) orderQuery = orderQuery.eq('stripe_payment_intent_id', paymentIntentId);
    else if (sessionId) orderQuery = orderQuery.eq('stripe_session_id', sessionId);
    else orderQuery = orderQuery.eq('id', '00000000-0000-0000-0000-000000000000');
    const { data: order } = await orderQuery.maybeSingle();

    const paymentEvents = new Set(['checkout.session.completed', 'payment_intent.succeeded', 'invoice.paid']);
    if (paymentEvents.has(event.type) && order?.buyer_id && order?.listing_id) {
      const { data: attribution } = await supabase.from('affiliate_user_attributions').select('*')
        .eq('user_id', order.buyer_id).maybeSingle();
      const attributionValid = attribution && (!attribution.expires_at || new Date(attribution.expires_at) >= new Date(event.created * 1000));
      if (attributionValid) {
        const { data: affiliate } = await supabase.from('affiliate_accounts').select('user_id').eq('id', attribution.original_affiliate_id).single();
        if (affiliate?.user_id === order.buyer_id) {
          await supabase.from('affiliate_fraud_flags').insert({
            affiliate_account_id: attribution.original_affiliate_id, signal_type: 'self_purchase', severity: 'high', details: { order_id: order.id },
          });
        } else {
          const amountMinor = Number(object.amount_total ?? object.amount_received ?? object.amount_paid ?? Math.round(Number(order.total_amount ?? order.amount ?? 0) * 100));
          const currency = String(object.currency || order.currency || 'eur').toLowerCase();
          const conversionType = event.type === 'invoice.paid' ? 'subscription_renewal' : 'purchase';
          const { data: conversion, error: conversionError } = await supabase.from('affiliate_conversions').insert({
            affiliate_account_id: attribution.original_affiliate_id,
            affiliate_link_id: attribution.original_link_id,
            user_id: order.buyer_id,
            order_id: order.id,
            conversion_type: conversionType,
            source_event_id: event.id,
            amount_minor: amountMinor,
            currency,
            occurred_at: new Date(event.created * 1000).toISOString(),
            metadata: { stripe_payment_intent_id: paymentIntentId, stripe_event_type: event.type },
          }).select().single();
          if (conversionError && conversionError.code !== '23505') throw conversionError;

          if (conversion) {
            const { data: rules } = await supabase.from('creator_commission_rules').select('*')
              .eq('affiliate_account_id', attribution.original_affiliate_id).eq('status', 'active').order('priority').order('created_at');
            const rule = (rules || []).find((candidate) => !candidate.listing_id || candidate.listing_id === order.listing_id);
            if (rule) {
              const eligible = amountMinor;
              const commissionAmount = Math.max(0, Math.round(eligible * MARKETPLACE_CREATOR_COMMISSION_PERCENT / 100));
              if (commissionAmount > 0) {
                const availableAt = new Date((event.created + Number(rule.holding_period_days || 0) * 86400) * 1000).toISOString();
                const { data: commission, error: commissionError } = await supabase.from('affiliate_commissions').insert({
                  conversion_id: conversion.id,
                  affiliate_account_id: attribution.original_affiliate_id,
                  order_id: order.id,
                  commission_rule_id: rule.id,
                  rule_snapshot: { ...rule, commission_type: 'percentage_purchase', rate: MARKETPLACE_CREATOR_COMMISSION_PERCENT, enforced_scope: 'marketplace_order_total' },
                  eligible_amount_minor: eligible,
                  commission_amount_minor: commissionAmount,
                  currency,
                  status: new Date(availableAt) <= new Date() ? 'available' : 'pending',
                  available_at: availableAt,
                  source_event_id: event.id,
                }).select().single();
                if (commissionError && commissionError.code !== '23505') throw commissionError;
                if (commission) await supabase.from('affiliate_commission_ledger').insert({
                  affiliate_account_id: attribution.original_affiliate_id,
                  commission_id: commission.id,
                  entry_type: 'commission',
                  amount_minor: commissionAmount,
                  currency,
                  source_event_id: `commission:${event.id}`,
                  description: `Creator commission for order ${order.id}`,
                  effective_at: availableAt,
                });
              }
            }
          }
        }
      }
    }

    if (['charge.refunded', 'charge.dispute.created'].includes(event.type) && order) {
      const { data: commissions } = await supabase.from('affiliate_commissions').select('*').eq('order_id', order.id);
      for (const commission of commissions || []) {
        const originalAmount = Math.max(1, Number(object.amount || Math.round(Number(order.total_amount ?? order.amount ?? 0) * 100)));
        const affectedAmount = event.type === 'charge.refunded' ? Number(object.amount_refunded || originalAmount) : Number(object.amount || originalAmount);
        const targetAdjustment = Math.min(Number(commission.commission_amount_minor), Math.round(Number(commission.commission_amount_minor) * affectedAmount / originalAmount));
        const { data: adjustments } = await supabase.from('affiliate_commission_ledger').select('amount_minor')
          .eq('commission_id', commission.id).in('entry_type', ['refund_adjustment','partial_refund_adjustment','chargeback_adjustment']);
        const alreadyAdjusted = Math.abs((adjustments || []).reduce((sum, row) => sum + Math.min(0, Number(row.amount_minor)), 0));
        const delta = Math.max(0, targetAdjustment - alreadyAdjusted);
        if (delta > 0) await supabase.from('affiliate_commission_ledger').insert({
          affiliate_account_id: commission.affiliate_account_id,
          commission_id: commission.id,
          entry_type: event.type === 'charge.dispute.created' ? 'chargeback_adjustment' : affectedAmount < originalAmount ? 'partial_refund_adjustment' : 'refund_adjustment',
          amount_minor: -delta,
          currency: commission.currency,
          source_event_id: `adjustment:${event.id}:${commission.id}`,
          description: `${event.type} adjustment for order ${order.id}`,
          metadata: { stripe_event_id: event.id, affected_amount_minor: affectedAmount },
        });
        if (targetAdjustment >= Number(commission.commission_amount_minor)) await supabase.from('affiliate_commissions').update({ status: 'reversed' }).eq('id', commission.id);
      }
    }

    await supabase.from('creator_webhook_events').update({ status: order ? 'processed' : 'ignored', processed_at: new Date().toISOString() }).eq('event_id', event.id);
    return json({ received: true });
  } catch (error) {
    console.error('creator-stripe-webhook failed', event.id, error);
    await supabase.from('creator_webhook_events').update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Unknown error', processed_at: new Date().toISOString() }).eq('event_id', event.id);
    return json({ error: 'Webhook processing failed' }, 500);
  }
});
