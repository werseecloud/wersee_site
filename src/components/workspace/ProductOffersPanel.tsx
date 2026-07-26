import React, { useEffect, useState } from 'react';
import { CalendarClock, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatProductPrice, ProductOffer } from '../../lib/productOffers';
import { appToast } from '../../lib/feedback';

type ProductOffersPanelProps = {
  productId: string;
  originalPrice: number;
  onOfferChanged: () => void;
};

export function ProductOffersPanel({ productId, originalPrice, onOfferChanged }: ProductOffersPanelProps) {
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'Summer Sale',
    salePrice: '',
    startsAt: '',
    endsAt: '',
    limitType: 'none',
    maxRedemptions: '',
  });

  const loadOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('product_offers').select('*').eq('listing_id', productId).order('starts_at', { ascending: false });
    if (error) console.error('Could not load offers', error);
    setOffers((data || []) as ProductOffer[]);
    setLoading(false);
  };

  useEffect(() => { void loadOffers(); }, [productId]);

  const createOffer = async () => {
    const salePrice = Number(form.salePrice);
    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);
    if (!form.name.trim() || !Number.isFinite(salePrice) || salePrice < 0 || salePrice >= originalPrice) {
      appToast('Sale price must be lower than the original price.');
      return;
    }
    if (!form.startsAt || !form.endsAt || endsAt <= startsAt || endsAt <= new Date()) {
      appToast('Use a real start and end time. The end must be in the future.');
      return;
    }
    if (form.limitType === 'first_customers' && Number(form.maxRedemptions) < 1) {
      appToast('Enter how many customers can use this offer.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to create an offer.');
      const { error } = await supabase.from('product_offers').insert({
        listing_id: productId,
        seller_id: user.id,
        name: form.name.trim(),
        sale_price: salePrice,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        limit_type: form.limitType,
        max_redemptions: form.limitType === 'first_customers' ? Number(form.maxRedemptions) : null,
      });
      if (error) throw error;
      await loadOffers();
      onOfferChanged();
      setForm({ name: '', salePrice: '', startsAt: '', endsAt: '', limitType: 'none', maxRedemptions: '' });
      appToast('Offer scheduled. Wersee will start and stop it automatically.');
    } catch (error: any) {
      appToast(error?.message || 'Could not create the offer.');
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id?: string) => {
    if (!id) return;
    const { error } = await supabase.from('product_offers').delete().eq('id', id);
    if (error) return appToast(error.message);
    await loadOffers();
    onOfferChanged();
  };

  const inputClass = 'w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#151515] p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-300"><Tag className="h-5 w-5" /></div>
          <div><h3 className="font-bold text-white">Schedule a real offer</h3><p className="mt-1 text-sm text-gray-400">Discounts only appear while these dates and limits are genuinely active.</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-gray-400">Campaign name<input className={`mt-2 ${inputClass}`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Summer Sale" /></label>
          <label className="text-xs font-bold text-gray-400">Sale price<input className={`mt-2 ${inputClass}`} type="number" min="0" step="0.01" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} placeholder="69.00" /></label>
          <label className="text-xs font-bold text-gray-400">Sale starts<input className={`mt-2 ${inputClass}`} type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
          <label className="text-xs font-bold text-gray-400">Sale ends<input className={`mt-2 ${inputClass}`} type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></label>
          <label className="text-xs font-bold text-gray-400">Offer rule<select className={`mt-2 ${inputClass}`} value={form.limitType} onChange={(event) => setForm({ ...form, limitType: event.target.value })}><option value="none">Date range only</option><option value="first_customers">First customers</option><option value="until_sold_out">Until sold out</option><option value="weekend">Weekend deal</option></select></label>
          {form.limitType === 'first_customers' && <label className="text-xs font-bold text-gray-400">Customer limit<input className={`mt-2 ${inputClass}`} type="number" min="1" value={form.maxRedemptions} onChange={(event) => setForm({ ...form, maxRedemptions: event.target.value })} placeholder="100" /></label>}
        </div>
        {Number(form.salePrice) >= 0 && Number(form.salePrice) < originalPrice && form.salePrice !== '' && (
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold"><span className="rounded-full bg-white/5 px-3 py-2 text-gray-400 line-through">{formatProductPrice(originalPrice)}</span><span className="rounded-full bg-white px-3 py-2 text-black">{formatProductPrice(Number(form.salePrice))}</span><span className="rounded-full bg-emerald-500/10 px-3 py-2 text-emerald-300">Save {formatProductPrice(originalPrice - Number(form.salePrice))} · {Math.round(((originalPrice - Number(form.salePrice)) / originalPrice) * 100)}% OFF</span></div>
        )}
        <button onClick={createOffer} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Schedule offer</button>
      </div>

      <div className="space-y-3">
        {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" /> : offers.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">No offers scheduled yet.</p> : offers.map((offer) => {
          const now = Date.now();
          const starts = new Date(offer.starts_at).getTime();
          const ends = new Date(offer.ends_at).getTime();
          const state = now < starts ? 'Scheduled' : now >= ends ? 'Ended' : 'Live';
          return <div key={offer.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><CalendarClock className="h-5 w-5 text-indigo-300" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-bold text-white">{offer.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${state === 'Live' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-gray-400'}`}>{state}</span></div><p className="mt-1 text-xs text-gray-500">{formatProductPrice(Number(offer.sale_price))} · {new Date(offer.starts_at).toLocaleString()} → {new Date(offer.ends_at).toLocaleString()}</p></div><button onClick={() => deleteOffer(offer.id)} aria-label={`Delete ${offer.name}`} className="rounded-xl p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>;
        })}
      </div>
    </div>
  );
}
