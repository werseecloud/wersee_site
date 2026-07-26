import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, CreditCard, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { trustCenterAction } from '../../../lib/trustCenter';

export const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      return;
    }
    const [subscriptionResult, cancellationResult] = await Promise.all([
      supabase.from('user_subscriptions').select('id,subscription_id,status,current_period_end,cancel_at_period_end,created_at,metadata').eq('user_id', auth.user.id).order('created_at', { ascending: false }),
      supabase.from('subscription_cancellations').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }),
    ]);
    if (subscriptionResult.error) setError(subscriptionResult.error.message);
    else setSubscriptions(subscriptionResult.data || []);
    if (!cancellationResult.error) setCancellations(cancellationResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cancel = async (subscription: any) => {
    if (!window.confirm('Cancel this subscription at the end of the current billing period?')) return;
    setBusy(subscription.id);
    setError('');
    setMessage('');
    try {
      const result = await trustCenterAction<{ cancellation: any }>('cancel-subscription', { userSubscriptionId: subscription.id });
      const effectiveAt = result.cancellation?.effective_at;
      setMessage(effectiveAt ? `Cancellation confirmed. Access continues until ${new Date(effectiveAt).toLocaleDateString()}.` : 'Cancellation confirmed for the end of the billing period.');
      await load();
    } catch (cancelError: any) {
      setError(cancelError?.message || 'The cancellation could not be scheduled.');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div>;

  return (
    <div className="space-y-6">
      {(message || error) && <div role="status" className={`rounded-2xl border p-4 text-sm ${error ? 'border-red-400/20 bg-red-400/10 text-red-100' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>{error || message}</div>}
      <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="flex items-center gap-2 text-lg font-black text-white"><CreditCard className="h-5 w-5 text-blue-300" /> Billing &amp; subscriptions</h2><p className="mt-1 text-sm text-white/45">Cancellation is sent to Stripe server-side and recorded with a confirmation trail.</p></div>
          <button onClick={load} aria-label="Refresh subscriptions" className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 space-y-3">
          {subscriptions.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">No subscriptions found.</p> : subscriptions.map((subscription) => {
            const cancellation = cancellations.find((item) => item.user_subscription_id === subscription.id && !['failed', 'reversed'].includes(item.status));
            const scheduled = Boolean(subscription.cancel_at_period_end || cancellation);
            return <article key={subscription.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div><p className="text-sm font-bold text-white">{subscription.metadata?.name || 'Wersee subscription'}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-white/40"><CalendarClock className="h-3.5 w-3.5" /> {subscription.current_period_end ? `Current period ends ${new Date(subscription.current_period_end).toLocaleDateString()}` : 'Billing period managed by Stripe'}</p></div>
                {scheduled ? <span className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200"><CheckCircle2 className="h-3.5 w-3.5" /> Cancellation scheduled</span> : <button disabled={busy === subscription.id || !['active', 'trialing', 'past_due'].includes(subscription.status)} onClick={() => cancel(subscription)} className="flex h-10 items-center justify-center gap-2 rounded-full border border-red-400/20 px-4 text-xs font-bold text-red-200 hover:bg-red-400/10 disabled:opacity-40">{busy === subscription.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Cancel subscription</button>}
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/25">{subscription.status}</p>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
};
