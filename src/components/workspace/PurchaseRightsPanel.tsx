import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, PackageCheck, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { trustCenterAction } from '../../lib/trustCenter';

export const PurchaseRightsPanel = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const [orderResult, requestResult] = await Promise.all([
      supabase.from('orders').select('id,listing_id,status,amount,currency,created_at,listings(title,type)').eq('buyer_id', auth.user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('consumer_rights_requests').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (!orderResult.error) setOrders(orderResult.data || []);
    if (!requestResult.error) setRequests(requestResult.data || []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async (orderId: string, requestType: string) => {
    setBusy(`${orderId}:${requestType}`);
    setMessage('');
    try {
      const result = await trustCenterAction<{ request: any }>('consumer-rights-request', { orderId, requestType });
      setMessage(`Request ${result.request.case_id} received. Eligibility is reviewed under the applicable rules.`);
      await load();
    } catch (error: any) {
      setMessage(error?.message || 'The request could not be submitted.');
    } finally { setBusy(''); }
  };

  return <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
    <h2 className="flex items-center gap-2 text-lg font-black"><PackageCheck className="h-5 w-5 text-emerald-300" /> Purchase rights</h2>
    <p className="mt-1 text-sm text-white/45">Start a withdrawal, return, refund, warranty or complaint workflow. Deadlines and digital-delivery choices are recorded for review.</p>
    {message && <p role="status" className="mt-4 rounded-xl bg-white/[0.04] p-3 text-xs text-white/60">{message}</p>}
    <div className="mt-5 space-y-3">{orders.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/35">No eligible order history is visible.</p> : orders.map((order) => {
      const current = requests.find((request) => request.order_id === order.id && !['closed', 'rejected'].includes(request.status));
      return <article key={order.id} className="rounded-2xl border border-white/[0.07] p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-bold">{order.listings?.title || 'Wersee order'}</p><p className="mt-1 text-xs text-white/35">{new Date(order.created_at).toLocaleDateString()} · {order.status}</p></div>{current ? <span className="rounded-full bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100">{current.case_id} · {current.status}</span> : <div className="flex flex-wrap gap-2">{['withdrawal', 'refund', 'return', 'warranty', 'complaint'].map((type) => <button key={type} disabled={busy === `${order.id}:${type}`} onClick={() => submit(order.id, type)} className="flex h-9 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[11px] font-bold capitalize hover:bg-white/10 disabled:opacity-40">{busy === `${order.id}:${type}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}{type}</button>)}</div>}</div></article>;
    })}</div>
  </section>;
};
