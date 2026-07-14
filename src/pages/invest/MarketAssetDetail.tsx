import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Plus, RefreshCcw, Star } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { invokeApiRunner } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ranges = ['1D', '1W', '1M', '3M', '1Y', 'MAX'];

export default function MarketAssetDetail() {
  const { slug = '', username, sessionId } = useParams();
  const { user } = useAuth();
  const [asset, setAsset] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [range, setRange] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [assetResponse, quoteResponse, historyResponse] = await Promise.all([
        invokeApiRunner('invest/assets/get', { slug }, 1, 300),
        invokeApiRunner('invest/assets/quote', { slug }, 1, 300).catch((error) => ({ providerError: error })),
        invokeApiRunner('invest/assets/history', { slug }, 1, 300).catch(() => ({ history: [] })),
      ]);
      setAsset(assetResponse.asset);
      setProfile(assetResponse.profile);
      setQuote(quoteResponse.quote || assetResponse.quote);
      setHistory(historyResponse.history || []);
      if (quoteResponse.providerError) setMessage('Latest quote is currently unavailable. Stored data is shown where available.');
    } catch (error: any) {
      setMessage(error.message || 'Asset could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  const addToWatchlist = async () => {
    if (!asset || !user) {
      setMessage('Sign in to add this asset to your watchlist.');
      return;
    }
    await invokeApiRunner('invest/watchlists/items/add', { assetId: asset.id }, 1, 300);
    setMessage('Added to watchlist.');
  };

  const chartData = useMemo(() => {
    const cutoff = cutoffForRange(range);
    return history
      .filter((point) => (cutoff ? new Date(point.captured_at).getTime() >= cutoff : true))
      .map((point) => ({
        time: new Date(point.captured_at).toLocaleDateString(),
        price: Number(point.price),
      }));
  }, [history, range]);

  if (loading) return <main className="min-h-screen bg-black pt-32 text-center text-gray-500">Loading market asset...</main>;
  if (!asset) return <main className="min-h-screen bg-black pt-32 text-center text-red-200">{message || 'Asset not found.'}</main>;

  const isCrypto = asset.type === 'crypto';
  const investBasePath = username && sessionId ? `/@${username}/invest/${sessionId}` : '/invest';

  return (
    <main className="min-h-screen bg-black pt-24 text-white">
      <Helmet>
        <title>{asset.displaySymbol} {asset.name} | Wersee Invest</title>
        <meta name="description" content={`Market information for ${asset.name} on Wersee Invest.`} />
        <link rel="canonical" href={`https://wersee.com/invest/${asset.type === 'etf' ? 'etfs' : isCrypto ? 'crypto' : 'stocks'}/${asset.canonicalSlug}`} />
      </Helmet>

      <section className="mx-auto max-w-7xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
        <Link to={investBasePath} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Invest
        </Link>

        {message && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">{message}</div>}

        <header className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[1fr_auto]">
          <div className="flex gap-4">
            {asset.logoUrl ? <img src={asset.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="h-16 w-16 rounded-2xl bg-white/10" />}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black">{asset.name}</h1>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-black uppercase text-black">{asset.type}</span>
                <span className="rounded-full border border-amber-300/30 px-2 py-1 text-xs font-bold text-amber-100">Delayed data</span>
              </div>
              <p className="mt-2 text-gray-400">
                {asset.displaySymbol} {isCrypto ? `on ${asset.providerExchange || 'provider exchange'}` : `${asset.exchangeCode || 'Exchange unavailable'} · ${asset.country || 'Country unavailable'} · ${asset.currency || 'Currency unavailable'}`}
              </p>
              <p className="mt-2 text-xs text-gray-500">Latest update: {quote?.fetchedAt ? new Date(quote.fetchedAt).toLocaleString() : 'Not available'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button onClick={addToWatchlist} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-black hover:bg-white/5">
              <Star className="h-4 w-4" />
              Watchlist
            </button>
            <Link to="/workspace/finance/investments" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black">
              <Plus className="h-4 w-4" />
              Virtual transaction
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Quote</h2>
              <button onClick={load} className="rounded-xl border border-white/10 p-2 text-gray-400 hover:text-white" aria-label="Refresh quote">
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Current price" value={money(quote?.price, asset.currency)} />
              <Metric label="Daily change" value={money(quote?.dailyChange, asset.currency)} />
              <Metric label="Daily change %" value={percent(quote?.dailyChangePercentage)} />
              <Metric label="Open" value={money(quote?.open, asset.currency)} />
              <Metric label="High" value={money(quote?.high, asset.currency)} />
              <Metric label="Low" value={money(quote?.low, asset.currency)} />
              <Metric label="Previous close" value={money(quote?.previousClose, asset.currency)} />
              <Metric label="Provider" value="Finnhub" />
              <Metric label="Cache" value={quote?.stale ? 'Stale cached' : quote?.cached ? 'Cached' : 'Fresh'} />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-black">Where this asset may be available</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Wersee does not execute this transaction. Availability, pricing, eligibility, fees and account requirements are determined by the external provider.
            </p>
            <p className="mt-4 text-sm text-gray-500">Verified venues appear after administrator review for this asset type and country.</p>
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">Stored price chart</h2>
            <div className="flex gap-2">
              {ranges.map((item) => (
                <button key={item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-1 text-xs font-black ${range === item ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          {chartData.length < 2 ? (
            <div className="rounded-2xl border border-white/10 p-8 text-center text-gray-500">Wersee is still collecting historical quote snapshots for this range.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={['dataMin', 'dataMax']} />
                  <Tooltip contentStyle={{ background: '#050505', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="price" stroke="#60a5fa" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <InfoSection title={isCrypto ? 'Crypto information' : 'Company information'}>
            <Detail label="Description" value={asset.description || profile?.description || 'Not available'} />
            <Detail label="Industry" value={asset.industry || profile?.industry || 'Not available'} />
            <Detail label="Country" value={asset.country || profile?.country || 'Not available'} />
            <Detail label="Exchange" value={asset.exchangeName || asset.exchangeCode || asset.providerExchange || 'Not available'} />
            <Detail label="Currency" value={asset.currency || 'Not available'} />
            {asset.websiteUrl && (
              <a href={asset.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-300">
                Website
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </InfoSection>
          <InfoSection title="News and metrics">
            <p className="text-sm leading-relaxed text-gray-400">Metrics and company-specific news are displayed only when Finnhub returns valid values. Missing values are never replaced with zero.</p>
          </InfoSection>
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-gray-400">
          Wersee provides market information for informational purposes only. Wersee does not execute trades or provide personalized investment advice. Prices may be delayed, incomplete, or exchange-specific. Verify information with your chosen regulated provider before making a financial decision.
        </div>
      </section>
    </main>
  );
}

function cutoffForRange(range: string) {
  if (range === 'MAX') return null;
  const days = range === '1D' ? 1 : range === '1W' ? 7 : range === '1M' ? 30 : range === '3M' ? 90 : 365;
  return Date.now() - days * 86_400_000;
}

function money(value: unknown, currency?: string | null) {
  if (value === null || value === undefined || value === '') return 'Not available';
  return `${currency ? currency.toUpperCase() + ' ' : ''}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 })}`;
}

function percent(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not available';
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })}%`;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-widest text-gray-500">{label}</div><div className="mt-2 font-black">{value}</div></div>;
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><h2 className="text-xl font-black">{title}</h2><div className="mt-4 space-y-3">{children}</div></section>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-xs uppercase tracking-widest text-gray-500">{label}</div><div className="mt-1 text-sm text-gray-300">{value}</div></div>;
}
