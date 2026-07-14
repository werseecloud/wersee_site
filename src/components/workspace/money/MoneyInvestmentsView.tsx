import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, RefreshCcw } from 'lucide-react';
import { invokeApiRunner, isMissingSupabaseSchemaError, supabase } from '../../../lib/supabase';

const tabs = ['Overview', 'Watchlist', 'Virtual Portfolio', 'Wersee Support', 'Interest Registrations', 'Transactions', 'Documents'];

export default function MoneyInvestmentsView() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [portfolio, setPortfolio] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaUnavailable, setSchemaUnavailable] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const portfolioResponse = await invokeApiRunner('invest/virtual-portfolio/get', {}, 1, 300);
      setPortfolio(portfolioResponse);

      const [contributionResponse, interestResponse] = await Promise.all([
        supabase
          .from('wersee_listing_contributions')
          .select('*, listing:wersee_invest_listings(title,slug,funding_mode,business:businesses(name,logo_url))')
          .order('created_at', { ascending: false }),
        supabase
          .from('wersee_listing_interest_registrations')
          .select('*, listing:wersee_invest_listings(title,slug,funding_mode,business:businesses(name,logo_url))')
          .order('created_at', { ascending: false }),
      ]);

      if (contributionResponse.error) {
        if (isMissingSupabaseSchemaError(contributionResponse.error)) setSchemaUnavailable(true);
        else throw contributionResponse.error;
      } else {
        setContributions(contributionResponse.data || []);
      }

      if (interestResponse.error) {
        if (!isMissingSupabaseSchemaError(interestResponse.error)) throw interestResponse.error;
      } else {
        setRegistrations(interestResponse.data || []);
      }
    } catch (error: any) {
      setLoadError(error?.message || 'Investment workspace could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const paidSupport = contributions
      .filter((item) => ['paid', 'partially_refunded'].includes(item.status))
      .reduce((sum, item) => sum + Number(item.amount_minor || 0), 0);
    const virtualValue = (portfolio?.positions || []).reduce((sum: number, position: any) => sum + Number(position.quantity || 0) * Number(position.asset?.quote?.price || 0), 0);
    return {
      paidSupport,
      contributions: contributions.length,
      registrations: registrations.length,
      virtualPositions: portfolio?.positions?.length || 0,
      virtualValue,
    };
  }, [contributions, registrations, portfolio]);

  const exportCsv = () => {
    const rows = [
      ['type', 'company_or_asset', 'status', 'amount_or_quantity', 'currency', 'created_at'],
      ...contributions.map((item) => ['wersee_support', item.listing?.title || '', item.status, String(item.amount_minor || ''), item.currency || '', item.created_at || '']),
      ...(portfolio?.transactions || []).map((item: any) => ['virtual_transaction', item.asset?.display_symbol || '', item.transaction_type, String(item.quantity || ''), item.currency || '', item.created_at || '']),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wersee-finance-investments.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Loading finance workspace...</div>;
  if (schemaUnavailable) return <StateBox text="Apply the Wersee Invest market discovery migration to use this workspace." onRetry={load} />;
  if (loadError) return <StateBox text={loadError} onRetry={load} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Finance Investments</h1>
          <p className="mt-2 text-sm text-gray-500">Watchlists, virtual portfolio simulations, Wersee support payments, interest registrations, transactions, and documents.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/5">
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/5">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100">
        <div className="mb-1 flex items-center gap-2 font-black"><AlertTriangle className="h-5 w-5" /> Required labels</div>
        Virtual portfolio - no real assets are owned or purchased. Wersee support, reward, and preorder contributions are not equity positions.
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Virtual positions" value={metrics.virtualPositions} />
        <Metric label="Virtual value" value={plainMoney(metrics.virtualValue)} />
        <Metric label="Wersee support" value={formatMinor(metrics.paidSupport)} />
        <Metric label="Contributions" value={metrics.contributions} />
        <Metric label="Interest registrations" value={metrics.registrations} />
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Virtual portfolio">
            <p className="text-sm text-gray-400">This portfolio is a simulation. No real assets are purchased, held, or sold.</p>
            <Rows rows={(portfolio?.positions || []).slice(0, 5).map((position: any) => [position.asset?.display_symbol || 'Asset', position.quantity, position.currency?.toUpperCase?.() || ''])} empty="No virtual positions yet." />
          </Card>
          <Card title="Wersee support">
            <p className="text-sm text-gray-400">Support, rewards, and preorders are shown separately from any regulated investments.</p>
            <Rows rows={contributions.slice(0, 5).map((item) => [item.listing?.title || 'Listing', item.status, formatMinor(item.amount_minor, item.currency)])} empty="No support payments yet." />
          </Card>
        </div>
      )}

      {activeTab === 'Watchlist' && (
        <Card title="Watchlist">
          <Rows rows={(portfolio?.watchlists?.[0]?.items || []).map((item: any) => [item.asset?.display_symbol || 'Asset', item.asset?.name || '', item.asset?.asset_type || ''])} empty="No watchlist items yet." />
        </Card>
      )}

      {activeTab === 'Virtual Portfolio' && (
        <Card title="Virtual Portfolio">
          <p className="mb-4 text-sm text-gray-400">Weighted-average cost method is used for simulated P&L. Manually entered prices remain labelled on their transactions.</p>
          <Rows rows={(portfolio?.transactions || []).map((item: any) => [item.transaction_type, item.asset?.display_symbol || 'Cash', `${item.quantity || ''} @ ${item.price_per_unit || ''}`, item.manually_entered_price ? 'Manual price' : 'Latest/manual'])} empty="No virtual transactions yet." />
        </Card>
      )}

      {activeTab === 'Wersee Support' && (
        <Card title="Wersee Support">
          <Rows rows={contributions.map((item) => [item.listing?.business?.name || 'Company', item.listing?.title || '', item.status, formatMinor(item.amount_minor, item.currency)])} empty="No Wersee support, reward, or preorder contributions yet." />
        </Card>
      )}

      {activeTab === 'Interest Registrations' && (
        <Card title="Interest Registrations">
          <Rows rows={registrations.map((item) => [item.listing?.business?.name || 'Company', item.listing?.title || '', item.communication_preference, new Date(item.created_at).toLocaleDateString()])} empty="No regulated investment interest registrations yet." />
        </Card>
      )}

      {activeTab === 'Transactions' && (
        <Card title="Transactions">
          <Rows rows={[...contributions.map((item) => ['Wersee support', item.status, formatMinor(item.amount_minor, item.currency), new Date(item.created_at).toLocaleString()]), ...(portfolio?.transactions || []).map((item: any) => ['Virtual', item.transaction_type, item.asset?.display_symbol || 'Cash', new Date(item.created_at).toLocaleString()])]} empty="No transactions yet." />
        </Card>
      )}

      {activeTab === 'Documents' && (
        <Card title="Documents">
          <p className="text-sm text-gray-400">Receipts, reward/preorder terms, updates, refund records, and approved listing documents appear here when available. Private review documents remain hidden.</p>
        </Card>
      )}
    </div>
  );
}

function StateBox({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-4 p-8 text-center text-white">
      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-yellow-100">{text}</div>
      <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/5">
        <RefreshCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="text-xs uppercase tracking-widest text-gray-500">{label}</div><div className="mt-2 text-xl font-black">{value}</div></div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="mb-4 text-xl font-black">{title}</h2>{children}</section>;
}

function Rows({ rows, empty }: { rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <div className="rounded-xl border border-white/10 p-6 text-center text-sm text-gray-500">{empty}</div>;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 border-b border-white/5 p-3 text-sm md:grid-cols-4">
          {row.map((cell, cellIndex) => <div key={cellIndex} className={cellIndex === 0 ? 'font-bold' : 'text-gray-400'}>{cell}</div>)}
        </div>
      ))}
    </div>
  );
}

function formatMinor(value: unknown, currency = 'usd') {
  if (value === null || value === undefined || value === '') return 'Not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(Number(value) / 100);
}

function plainMoney(value: unknown, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(Number(value || 0));
}
