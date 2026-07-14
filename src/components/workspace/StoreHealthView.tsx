import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Loader2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { isMissingSupabaseSchemaError, supabase } from '../../lib/supabase';

type Business = {
  id: string;
  name: string;
  slug: string | null;
  logo_url?: string | null;
};

type StoreHealthOpportunity = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  impact?: string;
  score?: number;
  savingsMs?: number;
  savingsBytes?: number;
};

type StoreHealthScan = {
  id: string;
  business_id: string;
  store_url: string;
  strategy: 'mobile' | 'desktop';
  total_score: number;
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  best_practices_score: number;
  opportunities: StoreHealthOpportunity[];
  diagnostics: Record<string, { title: string; value: string; score: number }>;
  scanned_at: string;
};

const statusForScore = (score: number) => {
  if (score >= 90) return { label: 'Goed', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-400' };
  if (score >= 50) return { label: 'Aandacht', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'bg-amber-400' };
  return { label: 'Kritiek', text: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: 'bg-red-400' };
};

const priorityStyles = (priority: StoreHealthOpportunity['priority']) => {
  if (priority === 'high') return 'border-red-500/20 bg-red-500/10 text-red-200';
  if (priority === 'medium') return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
  return 'border-blue-500/20 bg-blue-500/10 text-blue-200';
};

const formatDate = (value?: string) => {
  if (!value) return 'Nog niet gescand';
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const ScoreCard = ({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon: LucideIcon;
}) => {
  const status = statusForScore(score);
  return (
    <div className={`rounded-lg border ${status.border} ${status.bg} p-4`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${status.text}`} />
          <p className="text-sm font-bold text-white">{label}</p>
        </div>
        <span className={`rounded-md border ${status.border} px-2 py-1 text-xs font-black uppercase tracking-wide ${status.text}`}>
          {status.label}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <span className="text-4xl font-black tracking-tight text-white">{score}</span>
        <span className="pb-1 text-xs font-bold text-gray-500">/100</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

const EmptyState = ({ error }: { error?: string }) => (
  <div className="rounded-lg border border-white/10 bg-[#111] p-8 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
      {error ? <AlertCircle className="h-6 w-6 text-red-300" /> : <SearchCheck className="h-6 w-6 text-blue-300" />}
    </div>
    <h3 className="text-lg font-black text-white">{error ? 'Store Health is niet beschikbaar' : 'Geen scanresultaten'}</h3>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
      {error || 'Start een PageSpeed scan om performance, accessibility, SEO en best practices voor deze Wersee Store te meten.'}
    </p>
  </div>
);

export const StoreHealthView = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [scans, setScans] = useState<StoreHealthScan[]>([]);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId) || null;
  const latestScan = scans[0] || null;

  const scoreTrend = useMemo(() => scans.slice(0, 8).reverse(), [scans]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Log opnieuw in om Store Health te openen.');

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, slug, logo_url')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (businessError) throw businessError;

      const nextBusinesses = businessData || [];
      setBusinesses(nextBusinesses);

      const firstBusinessId = selectedBusinessId || nextBusinesses[0]?.id || '';
      setSelectedBusinessId(firstBusinessId);

      if (firstBusinessId) {
        await loadScans(firstBusinessId);
      } else {
        setScans([]);
      }
    } catch (err: any) {
      if (isMissingSupabaseSchemaError(err)) {
        setError('De store_health_scans tabel is nog niet gemigreerd. Run de nieuwe Supabase migration en laad opnieuw.');
      } else {
        setError(err?.message || 'Store Health kon niet worden geladen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadScans = async (businessId: string) => {
    const { data, error: scanError } = await supabase
      .from('store_health_scans')
      .select('*')
      .eq('business_id', businessId)
      .order('scanned_at', { ascending: false })
      .limit(20);

    if (scanError) throw scanError;
    setScans((data || []) as StoreHealthScan[]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBusinessChange = async (businessId: string) => {
    setSelectedBusinessId(businessId);
    setNotice('');
    setError('');
    setLoading(true);
    try {
      await loadScans(businessId);
    } catch (err: any) {
      if (isMissingSupabaseSchemaError(err)) {
        setError('De store_health_scans tabel is nog niet gemigreerd. Run de nieuwe Supabase migration en laad opnieuw.');
      } else {
        setError(err?.message || 'Scanresultaten konden niet worden geladen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    if (!selectedBusinessId) return;
    setScanning(true);
    setError('');
    setNotice('');
    try {
      const { data, error: functionError } = await supabase.functions.invoke('store-health-scan', {
        body: { businessId: selectedBusinessId, strategy },
      });

      if (functionError) throw functionError;
      if (!data?.success) throw new Error(data?.error || 'PageSpeed scan is mislukt.');

      await loadScans(selectedBusinessId);
      setNotice('Nieuwe Store Health scan opgeslagen.');
    } catch (err: any) {
      setError(err?.message || 'PageSpeed kon deze store niet scannen.');
    } finally {
      setScanning(false);
    }
  };

  if (loading && businesses.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-300" />
        Store Health laden...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16 text-white">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-300">
            <Gauge className="h-4 w-4" />
            Store Health Score
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Wersee Store Health</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400 md:text-base">
            Scan je publieke Wersee Store met Google PageSpeed Insights en volg performance, accessibility, SEO en best practices per scan.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedBusinessId}
            onChange={(event) => handleBusinessChange(event.target.value)}
            disabled={scanning || businesses.length === 0}
            className="rounded-lg border border-white/10 bg-[#111] px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-400"
          >
            {businesses.length === 0 ? (
              <option value="">Geen stores</option>
            ) : (
              businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))
            )}
          </select>

          <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-[#111] p-1">
            {(['mobile', 'desktop'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setStrategy(item)}
                disabled={scanning}
                className={`rounded-md px-4 py-2 text-sm font-black capitalize transition ${strategy === item ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            onClick={runScan}
            disabled={!selectedBusinessId || scanning}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {scanning ? 'Scannen...' : 'Opnieuw scannen'}
          </button>
        </div>
      </div>

      {(error || notice) && (
        <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'}`}>
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      {businesses.length === 0 ? (
        <EmptyState error="Maak eerst een Wersee Store aan voordat Store Health kan scannen." />
      ) : latestScan ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className={`rounded-lg border p-6 ${statusForScore(latestScan.total_score).border} ${statusForScore(latestScan.total_score).bg}`}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-400">{selectedBusiness?.name || 'Store'}</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Totale health score</h2>
                  <p className="mt-2 text-sm text-gray-400">Laatste scan: {formatDate(latestScan.scanned_at)}</p>
                </div>
                <Activity className={`h-6 w-6 ${statusForScore(latestScan.total_score).text}`} />
              </div>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-7xl font-black tracking-tighter text-white">{latestScan.total_score}</span>
                    <span className="pb-3 text-lg font-bold text-gray-500">/100</span>
                  </div>
                  <span className={`mt-3 inline-flex rounded-md border px-3 py-1 text-xs font-black uppercase tracking-wide ${statusForScore(latestScan.total_score).border} ${statusForScore(latestScan.total_score).text}`}>
                    {statusForScore(latestScan.total_score).label}
                  </span>
                </div>
                <a
                  href={latestScan.store_url}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Open store
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ScoreCard label="Performance" score={latestScan.performance_score} icon={Zap} />
              <ScoreCard label="Accessibility" score={latestScan.accessibility_score} icon={ShieldCheck} />
              <ScoreCard label="SEO" score={latestScan.seo_score} icon={SearchCheck} />
              <ScoreCard label="Best practices" score={latestScan.best_practices_score} icon={Sparkles} />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
            <div className="rounded-lg border border-white/10 bg-[#111]">
              <div className="border-b border-white/10 p-5">
                <h2 className="text-xl font-black">Verbeterpunten met prioriteit</h2>
                <p className="mt-1 text-sm text-gray-400">Gebaseerd op Lighthouse audits uit de laatste PageSpeed scan.</p>
              </div>
              <div className="divide-y divide-white/5">
                {latestScan.opportunities.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">Geen concrete verbeterpunten gevonden in deze scan.</div>
                ) : (
                  latestScan.opportunities.map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${priorityStyles(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{item.category}</span>
                          </div>
                          <h3 className="font-black text-white">{item.title}</h3>
                          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{item.description}</p>
                        </div>
                        {item.impact && (
                          <div className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-blue-200">
                            {item.impact}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-white/10 bg-[#111] p-5">
                <h2 className="text-xl font-black">Core diagnostics</h2>
                <div className="mt-5 space-y-3">
                  {Object.entries(latestScan.diagnostics || {}).map(([id, metric]) => (
                    <div key={id} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div>
                        <p className="text-sm font-bold text-white">{metric.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{id}</p>
                      </div>
                      <span className="text-sm font-black text-blue-200">{metric.value || `${metric.score}/100`}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#111] p-5">
                <h2 className="text-xl font-black">Eerdere scores</h2>
                <div className="mt-5 flex h-40 items-end gap-2">
                  {scoreTrend.length === 0 ? (
                    <p className="text-sm text-gray-500">Nog geen historie.</p>
                  ) : (
                    scoreTrend.map((scan) => {
                      const status = statusForScore(scan.total_score);
                      return (
                        <div key={scan.id} className="flex flex-1 flex-col items-center gap-2">
                          <div className="flex h-28 w-full items-end rounded-md bg-white/5">
                            <div
                              className={`w-full rounded-md ${status.bar}`}
                              style={{ height: `${Math.max(scan.total_score, 4)}%` }}
                              title={`${scan.total_score}/100`}
                            />
                          </div>
                          <span className="text-[10px] font-black text-gray-500">{scan.total_score}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="space-y-4">
          <EmptyState />
          <button
            onClick={runScan}
            disabled={!selectedBusinessId || scanning}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Eerste scan starten
          </button>
        </div>
      )}
    </div>
  );
};
