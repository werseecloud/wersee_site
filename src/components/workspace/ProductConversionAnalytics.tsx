import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, BarChart3, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ProductConversionAnalyticsProps = { productId: string; autoOptimize?: boolean };

const rate = (value: number, total: number) => total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '—';

export function ProductConversionAnalytics({ productId, autoOptimize = false }: ProductConversionAnalyticsProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [purchases, setPurchases] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const [eventResult, orderResult] = await Promise.all([
        supabase.from('product_conversion_events').select('event_type,card_variant,surface,created_at').eq('listing_id', productId).gte('created_at', since).limit(10000),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('listing_id', productId).in('status', ['completed', 'paid']),
      ]);
      if (!active) return;
      setEvents(eventResult.data || []);
      setPurchases(orderResult.count || 0);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [productId]);

  const metrics = useMemo(() => {
    const count = (type: string) => events.filter((event) => event.event_type === type).length;
    return { impressions: count('impression'), clicks: count('click'), views: count('view'), carts: count('add_to_cart'), checkouts: count('checkout_started') };
  }, [events]);

  const variants = useMemo(() => (['a', 'b'] as const).map((variant) => {
    const impressions = events.filter((event) => event.card_variant === variant && event.event_type === 'impression').length;
    const clicks = events.filter((event) => event.card_variant === variant && event.event_type === 'click').length;
    return { variant, impressions, clicks, ctr: rate(clicks, impressions) };
  }), [events]);

  useEffect(() => {
    if (!autoOptimize || variants.some((variant) => variant.impressions < 100)) return;
    const winner = [...variants].sort((a, b) => (b.clicks / b.impressions) - (a.clicks / a.impressions))[0];
    void supabase.from('listings').update({ winning_thumbnail: winner.variant }).eq('id', productId);
  }, [autoOptimize, productId, variants]);

  const recommendation = metrics.impressions > 50 && Number.parseFloat(rate(metrics.clicks, metrics.impressions)) < 3
    ? 'Your CTR is low. Test a clearer thumbnail, shorter title, or stronger card description.'
    : metrics.clicks > 20 && purchases / metrics.clicks < 0.02
      ? 'Your product gets clicks but few purchases. Improve the description, reviews, offer, or pricing.'
      : 'Keep collecting real traffic. Recommendations become more useful as the funnel grows.';

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>;

  const funnel = [
    ['Impressions', metrics.impressions, ''],
    ['Product clicks', metrics.clicks, `CTR ${rate(metrics.clicks, metrics.impressions)}`],
    ['Product views', metrics.views, rate(metrics.views, metrics.clicks)],
    ['Add to carts', metrics.carts, rate(metrics.carts, metrics.views)],
    ['Checkouts', metrics.checkouts, rate(metrics.checkouts, metrics.carts)],
    ['Purchases', purchases, rate(purchases, metrics.checkouts)],
  ];

  return <div className="space-y-6">
    <div className="rounded-3xl border border-white/10 bg-[#151515] p-6"><div className="mb-6 flex items-center gap-3"><BarChart3 className="h-5 w-5 text-indigo-300" /><div><h3 className="font-bold text-white">90-day conversion funnel</h3><p className="text-xs text-gray-500">Only measured customer activity is shown.</p></div></div><div className="mx-auto max-w-xl">{funnel.map(([label, value, detail], index) => <React.Fragment key={String(label)}><div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4"><div><p className="text-sm font-bold text-white">{label}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div><p className="text-2xl font-black text-white">{Number(value).toLocaleString()}</p></div>{index < funnel.length - 1 && <ArrowDown className="mx-auto my-1.5 h-4 w-4 text-gray-700" />}</React.Fragment>)}</div></div>
    <div className="grid gap-4 sm:grid-cols-2">{variants.map((variant) => <div key={variant.variant} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center gap-2 text-sm font-bold text-white"><ImageIcon className="h-4 w-4 text-indigo-300" />Thumbnail {variant.variant.toUpperCase()}</div><p className="mt-4 text-3xl font-black text-white">{variant.ctr} CTR</p><p className="mt-1 text-xs text-gray-500">{variant.clicks} clicks from {variant.impressions} impressions</p></div>)}</div>
    <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.08] p-5"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-indigo-300" /><div><p className="font-bold text-white">Conversion recommendation</p><p className="mt-2 text-sm leading-6 text-indigo-100/70">{recommendation}</p></div></div></div>
  </div>;
}
