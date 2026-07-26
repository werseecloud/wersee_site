import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  Bell,
  Bitcoin,
  Bot,
  Brain,
  Building2,
  ChevronDown,
  Compass,
  Gauge,
  Home,
  LineChart,
  Lock,
  LogIn,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { invokeApiRunner, supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { parseAccountHandle, parseUsername, routes } from '../../routing/routes';

type InvestTab = 'overview' | 'internal' | 'market' | 'crypto' | 'my';

const tabs: Array<{ id: InvestTab; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'internal', label: 'Wersee internal', icon: Building2 },
  { id: 'market', label: 'Market', icon: LineChart },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin },
  { id: 'my', label: 'My investments', icon: WalletCards },
];

const chartData = [
  { time: '09:00', value: 16412 },
  { time: '10:00', value: 16524 },
  { time: '11:00', value: 16476 },
  { time: '12:00', value: 16618 },
  { time: '13:00', value: 16582 },
  { time: '14:00', value: 16731 },
  { time: '15:00', value: 16804 },
  { time: '16:00', value: 16720 },
  { time: '17:00', value: 16942 },
];

const internalDeals = [
  {
    title: 'Creator launch pool',
    type: 'Wersee internal',
    signal: 'Strong fit',
    returnRange: '8-14%',
    risk: 38,
    traction: 'Revenue-backed creator products',
  },
  {
    title: 'Local commerce fund',
    type: 'Wersee internal',
    signal: 'Steady',
    returnRange: '5-9%',
    risk: 24,
    traction: 'Verified stores with repeat orders',
  },
  {
    title: 'AI app builders',
    type: 'Wersee internal',
    signal: 'Growth',
    returnRange: '12-22%',
    risk: 61,
    traction: 'Fast-moving software listings',
  },
];

const marketIdeas = [
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'ETF', score: 84, change: '+0.82%', price: '$631.20' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', score: 78, change: '+1.14%', price: '$228.40' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'Stock', score: 73, change: '-0.36%', price: '$174.10' },
];

const cryptoIdeas = [
  { symbol: 'BTC/USD', name: 'Bitcoin', type: 'Crypto', score: 76, change: '+2.08%', price: '$118,420' },
  { symbol: 'ETH/USD', name: 'Ethereum', type: 'Crypto', score: 70, change: '+1.61%', price: '$3,980' },
  { symbol: 'SOL/USD', name: 'Solana', type: 'Crypto', score: 64, change: '-0.42%', price: '$181.30' },
];

const publicAssetDisclaimer =
  'Market data is informational only. Wersee does not execute trades or provide personalized financial advice. Prices may be delayed, incomplete, or exchange-specific.';

export default function InvestMarketplace() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountHandle, sessionId } = useParams();
  const [activeTab, setActiveTab] = useState<InvestTab>('overview');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [introLoading, setIntroLoading] = useState(true);
  const [providerState, setProviderState] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sidebarMenu, setSidebarMenu] = useState<{ x: number; y: number } | null>(null);
  const [chartMenu, setChartMenu] = useState<{ x: number; y: number; context: string } | null>(null);
  const [preference, setPreference] = useState({ risk: 45, growth: 70, horizon: 60 });
  const [results, setResults] = useState<any>({
    werseeCompanies: [],
    stocks: [],
    etfs: [],
    crypto: [],
  });

  const currentSearchTypes = useMemo(() => {
    if (activeTab === 'internal') return 'wersee';
    if (activeTab === 'market') return 'stocks,etfs';
    if (activeTab === 'crypto') return 'crypto';
    return 'wersee,stocks,etfs,crypto';
  }, [activeTab]);

  const investBasePath = useMemo(() => {
    const parsedAccountHandle = parseAccountHandle(accountHandle);
    if (parsedAccountHandle && sessionId) {
      return routes.accountInvest({ accountHandle: parsedAccountHandle, sessionId });
    }
    return '/invest';
  }, [accountHandle, sessionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroLoading(false), 1050);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user || location.pathname !== '/invest') return;

    let cancelled = false;
    const routeToUserInvest = async () => {
      const username = await resolveUsername(user);
      if (cancelled || !username) return;
      navigate(routes.userInvest({ username, sessionId: getInvestSessionId() }), { replace: true });
    };

    routeToUserInvest();
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const closeMenus = () => {
      setSidebarMenu(null);
      setChartMenu(null);
    };
    window.addEventListener('click', closeMenus);
    window.addEventListener('scroll', closeMenus, true);
    return () => {
      window.removeEventListener('click', closeMenus);
      window.removeEventListener('scroll', closeMenus, true);
    };
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults({ werseeCompanies: [], stocks: [], etfs: [], crypto: [] });
      setProviderState([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const response = await invokeApiRunner('invest/search', { q: debouncedQuery, types: currentSearchTypes }, 1, 300);
        if (cancelled) return;
        setResults(response.results || { werseeCompanies: [], stocks: [], etfs: [], crypto: [] });
        setProviderState(response.results?.providerState || []);
      } catch (error: any) {
        if (!cancelled) setProviderState([{ provider: 'wersee', code: 'SEARCH_FAILED', message: error.message }]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, currentSearchTypes]);

  useEffect(() => {
    if (!user) {
      setPortfolio(null);
      return;
    }

    invokeApiRunner('invest/virtual-portfolio/get', {}, 1, 300)
      .then(setPortfolio)
      .catch(() => setPortfolio(null));
  }, [user]);

  const bestMatch = useMemo(() => {
    const all = [
      ...internalDeals.map((item) => ({ ...item, source: 'Wersee', volatility: item.risk, growth: Number(item.returnRange.split('-')[1].replace('%', '')) * 4 })),
      ...marketIdeas.map((item) => ({ title: item.name, source: item.symbol, type: item.type, signal: 'Liquid', returnRange: item.change, volatility: 36, growth: item.score })),
      ...cryptoIdeas.map((item) => ({ title: item.name, source: item.symbol, type: item.type, signal: 'Momentum', returnRange: item.change, volatility: 78, growth: item.score })),
    ];

    return all
      .map((item) => {
        const riskFit = 100 - Math.abs(preference.risk - item.volatility);
        const growthFit = 100 - Math.abs(preference.growth - item.growth);
        const horizonFit = item.type === 'Crypto' ? 100 - preference.horizon / 2 : preference.horizon;
        return { ...item, fit: Math.max(0, Math.round(riskFit * 0.45 + growthFit * 0.35 + horizonFit * 0.2)) };
      })
      .sort((a, b) => b.fit - a.fit)[0];
  }, [preference]);

  const visibleGroups = useMemo(() => {
    if (activeTab === 'market') return ['stocks', 'etfs'];
    if (activeTab === 'crypto') return ['crypto'];
    if (activeTab === 'internal') return ['werseeCompanies'];
    return ['werseeCompanies', 'stocks', 'etfs', 'crypto'];
  }, [activeTab]);

  const openPortfolio = () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    navigate('/workspace/finance/investments');
  };

  const openAi = (context = 'Invest dashboard') => {
    if (!user) {
      setNotice('AI sidebar is alleen beschikbaar als je ingelogd bent.');
      return;
    }
    setAiOpen(true);
    setNotice(null);
    window.dispatchEvent(new CustomEvent('open-ai-sidebar', { detail: { context } }));
  };

  const openSidebarMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setSidebarMenu({ x: event.clientX, y: event.clientY });
  };

  const openChartMenu = (event: React.MouseEvent, context: string) => {
    event.preventDefault();
    setChartMenu({ x: event.clientX, y: event.clientY, context });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <AnimatePresence>
        {introLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          >
            <div className="w-[min(420px,82vw)]">
              <div className="mb-5 flex items-center justify-between text-xs font-black uppercase tracking-[0.35em] text-white/70">
                <span>wersee invest</span>
                <span>loading</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.95, ease: 'easeInOut' }}
                  className="h-full rounded-full bg-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InvestSidebar activeTab={activeTab} setActiveTab={setActiveTab} onContextMenu={openSidebarMenu} />

      <section className="relative z-10 min-h-screen lg:pl-[92px]">
        <TopPills
          user={user}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          signOut={signOut}
          onOpenAi={() => openAi('Wersee Invest')}
          onOpenPortfolio={openPortfolio}
        />

        <div className="mx-auto max-w-[1480px] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_356px]">
            <div className="min-w-0 space-y-6">
              <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-100">
                        <Activity className="h-4 w-4" />
                        Live investing shell
                      </div>
                      <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white md:text-6xl">
                        Wersee Invest
                      </h1>
                      <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
                        Discover public markets, crypto, Wersee-native opportunities, and a virtual portfolio from one custom trading-style interface.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:w-[330px]">
                      <MiniMetric label="Balance" value="$78.8K" accent="text-white" />
                      <MiniMetric label="Signal" value="82" accent="text-emerald-300" />
                      <MiniMetric label="Risk" value="Med" accent="text-blue-200" />
                    </div>
                  </div>

                  <SearchPill activeTab={activeTab} setActiveTab={setActiveTab} query={query} setQuery={setQuery} onContextMenu={openSidebarMenu} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 }}
                  className="rounded-[28px] border border-white/10 bg-[#0b0f17]/90 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-gray-500">Algorithm match</div>
                      <h2 className="mt-2 text-2xl font-black">{bestMatch?.title}</h2>
                      <p className="mt-2 text-sm text-gray-400">{bestMatch?.source} - {bestMatch?.signal} - {bestMatch?.returnRange}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-300 px-3 py-2 text-xl font-black text-black">{bestMatch?.fit}%</div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <PreferenceSlider label="Risk" value={preference.risk} onChange={(risk) => setPreference((prev) => ({ ...prev, risk }))} />
                    <PreferenceSlider label="Growth" value={preference.growth} onChange={(growth) => setPreference((prev) => ({ ...prev, growth }))} />
                    <PreferenceSlider label="Horizon" value={preference.horizon} onChange={(horizon) => setPreference((prev) => ({ ...prev, horizon }))} />
                  </div>
                  <button
                    onClick={() => setActiveTab(bestMatch?.type === 'Crypto' ? 'crypto' : bestMatch?.source === 'Wersee' ? 'internal' : 'market')}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black"
                  >
                    <Compass className="h-4 w-4" />
                    Explore best match
                  </button>
                </motion.div>
              </section>

              {notice && (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">
                  {notice}
                </div>
              )}

              {providerState.length > 0 && (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                  Some provider capabilities are unavailable: {providerState.map((state) => `${state.provider} ${state.code}`).join(', ')}.
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${debouncedQuery ? 'search' : 'home'}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {debouncedQuery ? (
                    loading ? (
                      <LoadingPanel />
                    ) : (
                      visibleGroups.map((group) => <SearchGroup key={group} group={group} items={results[group] || []} basePath={investBasePath} />)
                    )
                  ) : activeTab === 'overview' ? (
                    <OverviewTab onChartContext={openChartMenu} onOpenAi={openAi} />
                  ) : activeTab === 'internal' ? (
                    <InternalTab onOpenAi={openAi} />
                  ) : activeTab === 'market' ? (
                    <IdeasTab title="Market watch" items={marketIdeas} onChartContext={openChartMenu} />
                  ) : activeTab === 'crypto' ? (
                    <IdeasTab title="Crypto desk" items={cryptoIdeas} onChartContext={openChartMenu} />
                  ) : (
                    <MyInvestmentsTab user={user} portfolio={portfolio} onOpenPortfolio={openPortfolio} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <SidePanel title="AI tips" icon={<Brain className="h-5 w-5" />}>
                <Tip text="Right-click a chart to ask AI about the current move." />
                <Tip text="Use the sliders to let the matching engine favor risk, growth, or patience." />
                <Tip text="Logged-out visitors can browse. Watchlists, AI, and portfolio actions require login." />
              </SidePanel>

              <SidePanel title="Virtual portfolio" icon={<WalletCards className="h-5 w-5" />}>
                <p className="text-sm leading-relaxed text-gray-400">Virtual portfolio only. No real assets are owned, bought, or sold from this screen.</p>
                <button onClick={openPortfolio} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">
                  {user ? <WalletCards className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {user ? 'Open portfolio' : 'Sign in to save'}
                </button>
              </SidePanel>

              <SidePanel title="Risk information" icon={<ShieldCheck className="h-5 w-5" />}>
                <p className="text-sm leading-relaxed text-gray-400">{publicAssetDisclaimer}</p>
              </SidePanel>
            </aside>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {sidebarMenu && (
          <ContextMenu x={sidebarMenu.x} y={sidebarMenu.y}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-200 hover:bg-white/10"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </ContextMenu>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chartMenu && (
          <ContextMenu x={chartMenu.x} y={chartMenu.y}>
            <button onClick={() => openAi(chartMenu.context)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-200 hover:bg-white/10">
              <Bot className="h-4 w-4" />
              Ask AI
            </button>
            <button onClick={() => setNotice('Added to local watch context. Sign in to persist it.')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-200 hover:bg-white/10">
              <Star className="h-4 w-4" />
              Add to watch
            </button>
            <button onClick={() => setActiveTab('my')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-200 hover:bg-white/10">
              <WalletCards className="h-4 w-4" />
              Open portfolio
            </button>
          </ContextMenu>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiOpen && user && (
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed bottom-4 right-4 top-4 z-50 w-[min(390px,calc(100vw-2rem))] rounded-[28px] border border-white/10 bg-[#080b10]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black">
                <Bot className="h-5 w-5 text-blue-200" />
                Invest AI
              </div>
              <button onClick={() => setAiOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-white/10 hover:text-white" aria-label="Close AI sidebar">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-3 text-sm text-gray-300">
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">Ask about a chart, compare risk, or generate a virtual portfolio plan. This does not replace financial advice.</p>
              <button className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">Start analysis</button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </main>
  );
}

function InvestSidebar({ activeTab, setActiveTab, onContextMenu }: { activeTab: InvestTab; setActiveTab: (tab: InvestTab) => void; onContextMenu: (event: React.MouseEvent) => void }) {
  return (
    <motion.aside
      initial={{ x: -92, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
      className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-between rounded-[24px] border border-white/10 bg-black/70 p-2 backdrop-blur-2xl lg:bottom-6 lg:left-5 lg:right-auto lg:top-6 lg:w-[68px] lg:flex-col"
    >
      <button onContextMenu={onContextMenu} onClick={() => setActiveTab('overview')} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
        <Sparkles className="h-5 w-5" />
      </button>
      <div className="flex gap-1 lg:flex-col">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={onContextMenu}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                activeTab === tab.id ? 'bg-white/15 text-white' : 'text-gray-500 hover:bg-white/10 hover:text-white'
              }`}
              title={tab.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
      <button onContextMenu={onContextMenu} className="flex h-11 w-11 items-center justify-center rounded-2xl text-gray-500 hover:bg-white/10 hover:text-white">
        <Gauge className="h-5 w-5" />
      </button>
    </motion.aside>
  );
}

function SearchPill({
  activeTab,
  setActiveTab,
  query,
  setQuery,
  onContextMenu,
}: {
  activeTab: InvestTab;
  setActiveTab: (tab: InvestTab) => void;
  query: string;
  setQuery: (query: string) => void;
  onContextMenu: (event: React.MouseEvent) => void;
}) {
  const searchTabs = tabs.filter((tab) => ['internal', 'market', 'crypto'].includes(tab.id));

  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-full border border-white/10 bg-black p-2 shadow-2xl shadow-black/50">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex shrink-0 gap-1 overflow-x-auto">
          {searchTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onContextMenu={onContextMenu}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-black uppercase tracking-widest transition ${
                  activeTab === tab.id ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.id === 'internal' ? 'Wersee bedrijven' : tab.id === 'market' ? 'Aandelen' : 'Crypto'}
              </button>
            );
          })}
        </div>
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              activeTab === 'crypto'
                ? 'Search crypto, e.g. BTC or ETH'
                : activeTab === 'internal'
                  ? 'Search Wersee bedrijven'
                  : 'Search aandelen or ETFs, e.g. AAPL or SPY'
            }
            className="h-12 w-full rounded-full border border-white/10 bg-[#050505] pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-blue-300/60"
            aria-label="Search investments"
          />
        </label>
      </div>
    </div>
  );
}

function TopPills({ user, profileOpen, setProfileOpen, signOut, onOpenAi, onOpenPortfolio }: any) {
  return (
    <div className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between gap-3 lg:left-[112px]">
      <Link to="/" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 text-sm font-black text-white backdrop-blur-2xl hover:bg-white/10">
        <ArrowLeft className="h-4 w-4" />
        Back to Wersee
      </Link>
      <div className="flex items-center gap-2">
        <button className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/65 text-gray-300 backdrop-blur-2xl hover:bg-white/10 sm:inline-flex" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <button onClick={onOpenAi} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/65 text-gray-300 backdrop-blur-2xl hover:bg-white/10" aria-label="AI sidebar">
          {user ? <Bot className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </button>
        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-black/65 px-3 text-sm font-black text-white backdrop-blur-2xl hover:bg-white/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
              {user ? (user.email?.[0] || 'U').toUpperCase() : <User className="h-4 w-4" />}
            </span>
            <span className="hidden max-w-[160px] truncate sm:inline">{user ? user.email : 'Guest'}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute right-0 mt-2 w-64 rounded-3xl border border-white/10 bg-black/90 p-2 shadow-2xl backdrop-blur-2xl"
              >
                {user ? (
                  <>
                    <button onClick={onOpenPortfolio} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-gray-200 hover:bg-white/10">
                      <WalletCards className="h-4 w-4" />
                      My investments
                    </button>
                    <button onClick={signOut} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-gray-200 hover:bg-white/10">
                      <LogIn className="h-4 w-4 rotate-180" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link to="/auth" className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-200 hover:bg-white/10">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ onChartContext, onOpenAi }: { onChartContext: (event: React.MouseEvent, context: string) => void; onOpenAi: (context?: string) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">BTC/USD</h2>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black">$16,430.00</span>
              <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-xs font-black text-emerald-200">+1.02%</span>
            </div>
          </div>
          <button onClick={() => onOpenAi('BTC/USD chart')} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-gray-300 hover:bg-white/10">
            <Bot className="h-4 w-4" />
            Ask AI
          </button>
        </div>
        <div onContextMenu={(event) => onChartContext(event, 'BTC/USD overview chart')} className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="investLine" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.42} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.07)" strokeDasharray="4 8" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#7c8494', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7c8494', fontSize: 12 }} axisLine={false} tickLine={false} domain={['dataMin - 120', 'dataMax + 120']} />
              <Tooltip contentStyle={{ background: '#070a10', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14 }} />
              <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} fill="url(#investLine)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-xl font-black">Investment home</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">Browse as a guest. Sign in when you want AI, watchlists, virtual positions, or private documents.</p>
          <div className="mt-5 grid gap-3">
            <StatRow label="Internal pools" value="3 active" />
            <StatRow label="Market ideas" value="Live search" />
            <StatRow label="Crypto pairs" value="Exchange-specific" />
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-xl font-black">Fast actions</h2>
          <div className="mt-4 grid gap-2">
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">Create watch scan</button>
            <button className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-gray-300 hover:bg-white/10">Compare assets</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InternalTab({ onOpenAi }: { onOpenAi: (context?: string) => void }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Wersee internal</h2>
          <p className="mt-2 text-sm text-gray-400">Wersee-native opportunities stay separated from public market assets.</p>
        </div>
        <button onClick={() => onOpenAi('Wersee internal opportunities')} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-gray-300 hover:bg-white/10">
          <Bot className="h-4 w-4" />
          Ask AI
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {internalDeals.map((deal) => (
          <div key={deal.title} className="rounded-[22px] border border-white/10 bg-black/35 p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Building2 className="h-5 w-5 text-blue-200" />
            </div>
            <h3 className="text-lg font-black">{deal.title}</h3>
            <p className="mt-2 text-sm text-gray-400">{deal.traction}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <MiniMetric label="Return" value={deal.returnRange} accent="text-emerald-200" />
              <MiniMetric label="Risk" value={`${deal.risk}/100`} accent="text-blue-200" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IdeasTab({ title, items, onChartContext }: { title: string; items: any[]; onChartContext: (event: React.MouseEvent, context: string) => void }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.symbol} onContextMenu={(event) => onChartContext(event, `${item.symbol} mini chart`)} className="rounded-[22px] border border-white/10 bg-black/35 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black">{item.symbol}</div>
                <div className="mt-1 text-sm text-gray-500">{item.name}</div>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-gray-300">{item.type}</span>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500">Price</div>
                <div className="mt-1 text-xl font-black">{item.price}</div>
              </div>
              <div className={item.change.startsWith('+') ? 'text-emerald-300' : 'text-red-300'}>{item.change}</div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blue-300" style={{ width: `${item.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MyInvestmentsTab({ user, portfolio, onOpenPortfolio }: { user: any; portfolio: any; onOpenPortfolio: () => void }) {
  if (!user) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-gray-500" />
        <h2 className="mt-4 text-2xl font-black">Login required</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">The invest page is public, but your watchlist, virtual portfolio, and AI actions are private.</p>
        <Link to="/auth" className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-black">Sign in</Link>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">My investments</h2>
          <p className="mt-2 text-sm text-gray-400">Virtual positions and Wersee support activity.</p>
        </div>
        <button onClick={onOpenPortfolio} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">Open full workspace</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MiniMetric label="Virtual positions" value={portfolio?.positions?.length || 0} accent="text-white" />
        <MiniMetric label="Watchlist items" value={portfolio?.watchlists?.[0]?.items?.length || 0} accent="text-blue-200" />
        <MiniMetric label="Transactions" value={portfolio?.transactions?.length || 0} accent="text-emerald-200" />
      </div>
    </section>
  );
}

function SearchGroup({ group, items, basePath }: { group: string; items: any[]; basePath: string }) {
  const title = group === 'werseeCompanies' ? 'Wersee Companies' : group === 'etfs' ? 'ETFs' : group[0].toUpperCase() + group.slice(1);
  if (items.length === 0) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-3 text-sm text-gray-500">No results from verified sources.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-4">
      <h2 className="px-2 pb-3 text-xl font-black">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) =>
          group === 'werseeCompanies' ? <WerseeCard key={item.id} item={item} basePath={basePath} /> : <AssetCard key={item.id} asset={item} basePath={basePath} />,
        )}
      </div>
    </section>
  );
}

function AssetCard({ asset, basePath }: { asset: any; basePath: string }) {
  return (
    <Link to={assetHref(asset, basePath)} className="rounded-[22px] border border-white/10 bg-black/40 p-4 transition hover:border-blue-300/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-black">{asset.displaySymbol}</div>
          <div className="mt-1 line-clamp-1 text-sm text-gray-400">{asset.name}</div>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-black uppercase text-gray-300">{asset.type}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <span>{asset.exchangeCode || asset.providerExchange || 'Exchange specific'}</span>
        <span>{asset.currency || 'Currency unavailable'}</span>
      </div>
    </Link>
  );
}

function WerseeCard({ item, basePath }: { item: any; basePath: string }) {
  const modeLabel = item.funding_mode === 'regulated_investment' ? 'Interest only' : item.funding_mode;
  return (
    <Link to={`${basePath}/wersee/${item.slug}`} className="rounded-[22px] border border-white/10 bg-black/40 p-4 transition hover:border-white/30">
      <div className="flex gap-3">
        {item.business?.logo_url ? (
          <img src={item.business.logo_url} alt="" className="h-11 w-11 rounded-xl object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="truncate">{item.business?.name || item.title}</span>
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-300" />
          </div>
          <div className="mt-1 line-clamp-2 font-black">{item.title}</div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-gray-400">{item.short_description}</p>
      <div className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">{modeLabel}</div>
    </Link>
  );
}

function ContextMenu({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      className="fixed z-[120] w-56 rounded-2xl border border-white/10 bg-[#080b10]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl"
      style={{ left: Math.min(x, window.innerWidth - 240), top: Math.min(y, window.innerHeight - 260) }}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

function SidePanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2 font-black">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function PreferenceSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-blue-300" />
    </label>
  );
}

function MiniMetric({ label, value, accent }: { label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-black ${accent}`}>{value}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-relaxed text-gray-400">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
      {text}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
      <p className="mt-4 text-sm font-bold text-gray-500">Searching verified sources...</p>
    </div>
  );
}

function assetHref(asset: any, basePath = '/invest') {
  const segment = asset?.type === 'etf' ? 'etfs' : asset?.type === 'crypto' ? 'crypto' : 'stocks';
  return `${basePath}/${segment}/${asset?.canonicalSlug}`;
}

function getInvestSessionId() {
  const key = 'wersee:invest-session-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

async function resolveUsername(user: any) {
  const authUsername = parseUsername(user?.email?.split('@')[0]);
  try {
    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
    return parseUsername(data?.username) || authUsername;
  } catch {
    return authUsername;
  }
}
