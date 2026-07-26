import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BarChart3, Check, ChevronRight, Copy, Crown, DollarSign,
  ExternalLink, Gift, Layers3, Link2, Loader2,
  Medal, MousePointerClick, Package, Share2, ShoppingBag, Sparkles,
  Target, Trophy, Users, WandSparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { AffiliateProgramBuilder } from './AffiliateProgramBuilder';

type AffiliateAccount = {
  id: string;
  user_id: string;
  external_display_name: string | null;
  external_referral_key: string | null;
  bio: string | null;
  primary_platform: string | null;
  onboarding_completed_at: string | null;
  status: string;
};

type AffiliateLink = {
  id: string;
  slug: string;
  destination_path: string;
  source_platform: string | null;
  is_primary: boolean;
  status: string;
};

type LeaderboardRow = {
  rank: number;
  affiliate_account_id: string;
  display_name: string;
  unique_clicks: number;
  conversions: number;
  sales_amount_minor: number;
  earnings_amount_minor: number;
  currency: string;
  is_current_user: boolean;
};

type Analytics = {
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  salesMinor: number;
  earningsMinor: number;
  currency: string;
  platforms: Array<{ name: string; clicks: number; conversions: number }>;
};

type DashboardTab = 'overview' | 'analytics' | 'materials' | 'leaderboard' | 'programs';

const emptyAnalytics: Analytics = {
  clicks: 0,
  uniqueClicks: 0,
  conversions: 0,
  salesMinor: 0,
  earningsMinor: 0,
  currency: 'EUR',
  platforms: []
};

const platformOptions = ['instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'facebook', 'website', 'other'];

const money = (minor: number, currency = 'EUR') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format((minor || 0) / 100);

const safeReferralKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);

export const AffiliatesView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<AffiliateAccount | null>(null);
  const [primaryLink, setPrimaryLink] = useState<AffiliateLink | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>(emptyAnalytics);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [referralKey, setReferralKey] = useState('');
  const [bio, setBio] = useState('');
  const [primaryPlatform, setPrimaryPlatform] = useState('instagram');

  const loadData = useCallback(async (keepWizard = false) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accountData, error: accountError } = await supabase
        .from('affiliate_accounts')
        .select('id,user_id,external_display_name,external_referral_key,bio,primary_platform,onboarding_completed_at,status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (accountError) throw accountError;

      const completedAccount = accountData as AffiliateAccount | null;
      setAccount(completedAccount);
      if (!completedAccount?.onboarding_completed_at) {
        if (!keepWizard) setShowWizard(true);
        const { data: profile } = await supabase.from('profiles').select('name,full_name,username').eq('id', user.id).maybeSingle();
        const suggestedName = profile?.name || profile?.full_name || user.email?.split('@')[0] || '';
        const suggestedKey = safeReferralKey(profile?.username || user.email?.split('@')[0] || '');
        setDisplayName(current => current || suggestedName);
        setReferralKey(current => current || (suggestedKey.length >= 3 ? suggestedKey : `partner-${user.id.slice(0, 6)}`));
      } else {
        if (!keepWizard) setShowWizard(false);
        setDisplayName(completedAccount.external_display_name || '');
        setReferralKey(completedAccount.external_referral_key || '');
        setBio(completedAccount.bio || '');
        setPrimaryPlatform(completedAccount.primary_platform || 'instagram');
      }

      const monthStart = new Date();
      monthStart.setUTCDate(1);
      const monthIso = monthStart.toISOString().slice(0, 10);
      const leaderboardPromise = supabase.rpc('platform_affiliate_leaderboard', { p_month: monthIso });
      const productsPromise = supabase
        .from('listings')
        .select('id,title,image_url,price,status,affiliate_program:affiliate_programs(id,is_active,commission_percentage)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (completedAccount) {
        const [linkResult, clicksResult, conversionsResult, commissionsResult, leaderboardResult, productsResult] = await Promise.all([
          supabase.from('affiliate_links').select('id,slug,destination_path,source_platform,is_primary,status').eq('affiliate_account_id', completedAccount.id).eq('is_primary', true).maybeSingle(),
          supabase.from('affiliate_clicks').select('is_unique,utm_source,occurred_at').eq('affiliate_account_id', completedAccount.id).gte('occurred_at', monthStart.toISOString()),
          supabase.from('affiliate_conversions').select('amount_minor,currency,metadata,occurred_at').eq('affiliate_account_id', completedAccount.id).in('conversion_type', ['purchase', 'subscription_renewal']).gte('occurred_at', monthStart.toISOString()),
          supabase.from('affiliate_commissions').select('commission_amount_minor,currency,status,created_at').eq('affiliate_account_id', completedAccount.id).gte('created_at', monthStart.toISOString()),
          leaderboardPromise,
          productsPromise
        ]);
        if (linkResult.error) throw linkResult.error;
        setPrimaryLink(linkResult.data as AffiliateLink | null);
        setLeaderboard((leaderboardResult.data || []) as LeaderboardRow[]);
        setProducts((productsResult.data || []).map((product: any) => ({
          ...product,
          affiliate_program: Array.isArray(product.affiliate_program) ? product.affiliate_program[0] : product.affiliate_program
        })));

        const clicks = clicksResult.data || [];
        const conversions = conversionsResult.data || [];
        const commissions = (commissionsResult.data || []).filter(row => !['reversed', 'cancelled'].includes(row.status));
        const platformMap = new Map<string, { clicks: number; conversions: number }>();
        clicks.forEach(click => {
          const source = String(click.utm_source || completedAccount.primary_platform || 'direct').toLowerCase();
          const current = platformMap.get(source) || { clicks: 0, conversions: 0 };
          current.clicks += 1;
          platformMap.set(source, current);
        });
        conversions.forEach(conversion => {
          const metadata = conversion.metadata && typeof conversion.metadata === 'object' ? conversion.metadata as Record<string, unknown> : {};
          const source = String(metadata.utm_source || metadata.source_platform || completedAccount.primary_platform || 'direct').toLowerCase();
          const current = platformMap.get(source) || { clicks: 0, conversions: 0 };
          current.conversions += 1;
          platformMap.set(source, current);
        });
        setAnalytics({
          clicks: clicks.length,
          uniqueClicks: clicks.filter(click => click.is_unique).length,
          conversions: conversions.length,
          salesMinor: conversions.reduce((total, row) => total + Number(row.amount_minor || 0), 0),
          earningsMinor: commissions.reduce((total, row) => total + Number(row.commission_amount_minor || 0), 0),
          currency: conversions[0]?.currency || commissions[0]?.currency || 'EUR',
          platforms: [...platformMap.entries()]
            .map(([name, values]) => ({ name, ...values }))
            .sort((a, b) => b.clicks - a.clicks)
        });
      } else {
        const [leaderboardResult, productsResult] = await Promise.all([leaderboardPromise, productsPromise]);
        setLeaderboard((leaderboardResult.data || []) as LeaderboardRow[]);
        setProducts(productsResult.data || []);
      }
    } catch (error: any) {
      console.error('Error loading affiliate dashboard:', error);
      toast.error(error?.message || 'Affiliate data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const referralUrl = useMemo(() => {
    const key = primaryLink?.slug || account?.external_referral_key || referralKey;
    return key ? `${window.location.origin}/r/${encodeURIComponent(key)}` : '';
  }, [account?.external_referral_key, primaryLink?.slug, referralKey]);

  const materials = useMemo(() => {
    const name = account?.external_display_name || displayName || 'Wersee partner';
    const about = account?.bio || bio;
    return [
      {
        title: 'Short social caption',
        value: `I use Wersee to discover, create and grow in one place. Explore the platform through my link: ${referralUrl}`
      },
      {
        title: 'Profile bio',
        value: about || `${name} shares practical tools, products and opportunities found on Wersee.`
      },
      {
        title: 'Long description',
        value: `${name} is a Wersee platform affiliate. Discover the marketplace, creator tools, communities and business features through this link. Purchases made after an eligible referral support this partner at no extra cost to you: ${referralUrl}`
      },
      {
        title: 'Call to action',
        value: `Discover Wersee with ${name} → ${referralUrl}`
      }
    ];
  }, [account?.bio, account?.external_display_name, bio, displayName, referralUrl]);

  const copy = async (value: string, label = 'Copied') => {
    await navigator.clipboard.writeText(value);
    toast.success(label);
  };

  const completeOnboarding = async () => {
    if (!displayName.trim() || referralKey.length < 3) {
      toast.error('Add your name and a valid link name first.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('complete_platform_affiliate_onboarding', {
        p_display_name: displayName.trim(),
        p_referral_key: safeReferralKey(referralKey),
        p_bio: bio.trim() || null,
        p_primary_platform: primaryPlatform
      });
      if (error) throw error;
      const result = data as { account: AffiliateAccount; link: AffiliateLink };
      setAccount(result.account);
      setPrimaryLink(result.link);
      setWizardStep(2);
      await loadData(true);
    } catch (error: any) {
      console.error('Affiliate onboarding failed:', error);
      toast.error(error?.message || 'Your affiliate profile could not be created.');
    } finally {
      setSaving(false);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Discover Wersee', text: 'Explore Wersee through my affiliate link.', url: referralUrl }).catch(() => undefined);
    } else {
      await copy(referralUrl, 'Link copied');
    }
  };

  if (selectedProductId) {
    return <AffiliateProgramBuilder productId={selectedProductId} onClose={() => {
      setSelectedProductId(null);
      loadData();
    }} />;
  }

  if (loading) {
    return <div className="grid h-full min-h-[520px] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;
  }

  if (showWizard) {
    return (
      <div className="relative min-h-full overflow-hidden bg-[#070707] p-4 text-white sm:p-8">
        <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-indigo-600/20 blur-[110px]" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-[130px]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.22em] text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" /> Wersee Affiliate
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Turn your reach into momentum.</h1>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {[0, 1, 2, 3].map(step => <span key={step} className={`h-1.5 rounded-full transition-all ${wizardStep === step ? 'w-10 bg-indigo-400' : wizardStep > step ? 'w-5 bg-emerald-400' : 'w-5 bg-white/10'}`} />)}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {wizardStep === 0 && (
              <motion.section key="intro" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[.07] to-white/[.02] p-6 shadow-2xl sm:p-10">
                <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
                  <div>
                    <WandSparkles className="h-12 w-12 text-indigo-300" />
                    <h2 className="mt-8 text-4xl font-black leading-tight">One link. Every corner of Wersee.</h2>
                    <p className="mt-4 max-w-xl text-base leading-7 text-white/55">Share Wersee itself—not a single product. We track real clicks, eligible purchases and their source for 30 days.</p>
                    <button onClick={() => setWizardStep(1)} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-black transition-transform hover:scale-[1.02]">
                      Build my link <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: DollarSign, title: '5% commission', text: 'On eligible Wersee marketplace purchases.' },
                      { icon: Crown, title: 'Monthly bonus', text: 'The #1 affiliate qualifies for the monthly performance bonus.' },
                      { icon: BarChart3, title: 'Real analytics', text: 'Clicks, conversions, value and platform source.' },
                      { icon: Gift, title: 'Share kit', text: 'Bios, captions, descriptions and calls to action.' }
                    ].map(item => <div key={item.title} className="rounded-3xl border border-white/8 bg-black/25 p-5"><item.icon className="h-5 w-5 text-indigo-300" /><h3 className="mt-4 font-black">{item.title}</h3><p className="mt-2 text-xs leading-5 text-white/40">{item.text}</p></div>)}
                  </div>
                </div>
              </motion.section>
            )}

            {wizardStep === 1 && (
              <motion.section key="profile" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 sm:p-10">
                <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
                  <div>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300"><Users className="h-7 w-7" /></div>
                    <h2 className="mt-6 text-3xl font-black">Make it yours</h2>
                    <p className="mt-3 text-sm leading-6 text-white/45">These details power your link and ready-to-copy promotional material. You can manage them later.</p>
                  </div>
                  <div className="space-y-5">
                    <label className="block text-xs font-black uppercase tracking-wider text-white/40">Display name<input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={80} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-base font-bold normal-case tracking-normal text-white outline-none focus:border-indigo-400/50" placeholder="Your name or brand" /></label>
                    <label className="block text-xs font-black uppercase tracking-wider text-white/40">Your link<div className="mt-2 flex overflow-hidden rounded-2xl border border-white/10 bg-black/30 focus-within:border-indigo-400/50"><span className="flex items-center border-r border-white/10 px-4 text-sm text-white/35">wersee.com/r/</span><input value={referralKey} onChange={event => setReferralKey(safeReferralKey(event.target.value))} maxLength={30} className="min-w-0 flex-1 bg-transparent px-3 py-3.5 font-mono text-sm text-indigo-200 outline-none" placeholder="your-name" /></div></label>
                    <label className="block text-xs font-black uppercase tracking-wider text-white/40">Primary platform<select value={primaryPlatform} onChange={event => setPrimaryPlatform(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3.5 text-white outline-none focus:border-indigo-400/50">{platformOptions.map(option => <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>)}</select></label>
                    <label className="block text-xs font-black uppercase tracking-wider text-white/40">Bio<textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={500} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-indigo-400/50" placeholder="What do you share with your audience?" /></label>
                    <div className="flex gap-3 pt-2"><button onClick={() => setWizardStep(0)} className="rounded-2xl bg-white/5 px-5 py-3 font-bold text-white hover:bg-white/10">Back</button><button onClick={completeOnboarding} disabled={saving || !displayName.trim() || referralKey.length < 3} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 font-black text-white hover:bg-indigo-400 disabled:opacity-40">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create affiliate profile <ChevronRight className="h-5 w-5" /></>}</button></div>
                  </div>
                </div>
              </motion.section>
            )}

            {wizardStep === 2 && (
              <motion.section key="leaderboard" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 sm:p-10">
                <div className="mb-8 flex items-end justify-between gap-5"><div><Trophy className="h-10 w-10 text-amber-300" /><h2 className="mt-5 text-3xl font-black">The monthly race</h2><p className="mt-2 text-sm text-white/45">Ranked by real purchase value, then conversions and unique clicks.</p></div><div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-right"><p className="text-[10px] font-black uppercase tracking-widest text-amber-200/60">Top reward</p><p className="mt-1 font-black text-amber-100">Monthly bonus</p></div></div>
                <Leaderboard rows={leaderboard} compact />
                <button onClick={() => setWizardStep(3)} className="mt-8 ml-auto flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-black text-black">See my link <ArrowRight className="h-5 w-5" /></button>
              </motion.section>
            )}

            {wizardStep === 3 && (
              <motion.section key="finish" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative overflow-hidden rounded-[2rem] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-white/[.04] to-fuchsia-500/10 p-7 text-center sm:p-12">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-300"><Check className="h-9 w-9" /></div>
                <h2 className="mt-7 text-4xl font-black">Your link is live.</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/50">Share it anywhere. Every eligible click and purchase will appear in your dashboard.</p>
                <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-black/35 p-3 text-left"><Link2 className="ml-2 h-5 w-5 shrink-0 text-indigo-300" /><code className="min-w-0 flex-1 truncate text-sm text-indigo-100">{referralUrl}</code><button onClick={() => copy(referralUrl, 'Affiliate link copied')} className="rounded-xl bg-white p-3 text-black"><Copy className="h-4 w-4" /></button></div>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={shareLink} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/8 px-6 py-3.5 font-bold text-white hover:bg-white/12"><Share2 className="h-5 w-5" /> Share now</button><button onClick={() => setShowWizard(false)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-8 py-3.5 font-black text-white hover:bg-indigo-400">Continue to dashboard <ArrowRight className="h-5 w-5" /></button></div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const currentRank = leaderboard.find(row => row.is_current_user)?.rank;
  return (
    <div className="mx-auto max-w-7xl space-y-7 p-4 pb-20 text-white sm:p-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 via-white/[.04] to-transparent p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-indigo-500/15 blur-[90px]" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Affiliate active</div><h1 className="mt-4 text-3xl font-black sm:text-4xl">Your Wersee growth link</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Earn 5% on eligible marketplace purchases and compete for the monthly top-affiliate bonus.</p></div>
          <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-3"><Link2 className="ml-2 h-5 w-5 shrink-0 text-indigo-300" /><code className="min-w-0 flex-1 truncate text-xs text-indigo-100 sm:text-sm">{referralUrl}</code><button onClick={() => copy(referralUrl, 'Link copied')} className="rounded-xl bg-white/10 p-3 hover:bg-white/15"><Copy className="h-4 w-4" /></button><button onClick={shareLink} className="rounded-xl bg-indigo-500 p-3 hover:bg-indigo-400"><Share2 className="h-4 w-4" /></button></div>
        </div>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-white/8 bg-white/[.025] p-1.5">
        {([
          ['overview', 'Overview', Sparkles], ['analytics', 'Analytics', BarChart3], ['materials', 'Materials', Layers3],
          ['leaderboard', 'Leaderboard', Trophy], ['programs', 'Product programs', Package]
        ] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === id ? 'bg-white text-black' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>

      {activeTab === 'overview' && <div className="space-y-6"><MetricGrid analytics={analytics} /><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-3xl border border-white/8 bg-white/[.03] p-6"><h2 className="text-xl font-black">Start sharing</h2><p className="mt-2 text-sm text-white/40">Use the channel buttons to append a real source tag to your link.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{['instagram', 'tiktok', 'youtube', 'linkedin'].map(platform => { const link = `${referralUrl}?utm_source=${platform}&utm_medium=affiliate`; return <button key={platform} onClick={() => copy(link, `${platform} link copied`)} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 p-4 text-left hover:border-indigo-400/30"><span className="capitalize font-bold">{platform}</span><Copy className="h-4 w-4 text-white/35" /></button>; })}</div></section><section className="rounded-3xl border border-amber-300/12 bg-amber-300/[.06] p-6"><Crown className="h-8 w-8 text-amber-300" /><h2 className="mt-5 text-xl font-black">Monthly bonus</h2><p className="mt-2 text-sm leading-6 text-amber-100/50">The top affiliate by verified purchase value qualifies. Bonus value and approval are published in the dashboard—no invented payout is shown.</p>{currentRank ? <p className="mt-5 text-3xl font-black text-amber-100">Current rank #{currentRank}</p> : <p className="mt-5 text-sm font-bold text-amber-200/60">Share your link to enter the ranking.</p>}</section></div></div>}
      {activeTab === 'analytics' && <AnalyticsPanel analytics={analytics} />}
      {activeTab === 'materials' && <section className="grid gap-4 lg:grid-cols-2">{materials.map(material => <article key={material.title} className="flex flex-col rounded-3xl border border-white/8 bg-white/[.03] p-6"><div className="flex items-center justify-between gap-4"><h2 className="font-black">{material.title}</h2><button onClick={() => copy(material.value)} className="rounded-xl bg-white/8 p-2.5 text-white/50 hover:text-white"><Copy className="h-4 w-4" /></button></div><p className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-6 text-white/50">{material.value}</p></article>)}</section>}
      {activeTab === 'leaderboard' && <section className="rounded-3xl border border-white/8 bg-white/[.03] p-5 sm:p-7"><div className="mb-6"><h2 className="text-2xl font-black">Monthly leaderboard</h2><p className="mt-2 text-sm text-white/40">Verified performance for the current calendar month.</p></div><Leaderboard rows={leaderboard} /></section>}
      {activeTab === 'programs' && <section className="rounded-3xl border border-white/8 bg-white/[.03] p-5 sm:p-7"><div className="mb-6"><h2 className="text-2xl font-black">Affiliate programs for your products</h2><p className="mt-2 text-sm text-white/40">Manage seller-funded product programs without changing your platform-wide 5% link.</p></div>{products.length ? <div className="grid gap-4 md:grid-cols-2">{products.map(product => <button key={product.id} onClick={() => setSelectedProductId(product.id)} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-black/20 p-4 text-left hover:border-indigo-400/30">{product.image_url ? <img src={product.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/5"><ShoppingBag className="h-5 w-5 text-white/25" /></div>}<div className="min-w-0 flex-1"><h3 className="truncate font-black">{product.title}</h3><p className="mt-1 text-xs text-white/35">{product.affiliate_program ? `${product.affiliate_program.commission_percentage}% product commission` : 'Set up a product program'}</p></div><ExternalLink className="h-4 w-4 text-white/30" /></button>)}</div> : <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-white/35">Create a product listing first to manage a product-specific program.</div>}</section>}
    </div>
  );
};

const MetricGrid = ({ analytics }: { analytics: Analytics }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {[
      { label: 'Unique clicks', value: analytics.uniqueClicks.toLocaleString(), icon: MousePointerClick, tone: 'text-sky-300' },
      { label: 'Purchases', value: analytics.conversions.toLocaleString(), icon: ShoppingBag, tone: 'text-emerald-300' },
      { label: 'Sales generated', value: money(analytics.salesMinor, analytics.currency), icon: Target, tone: 'text-fuchsia-300' },
      { label: 'Commission', value: money(analytics.earningsMinor, analytics.currency), icon: DollarSign, tone: 'text-amber-300' }
    ].map(metric => <div key={metric.label} className="rounded-3xl border border-white/8 bg-white/[.03] p-5"><metric.icon className={`h-5 w-5 ${metric.tone}`} /><p className="mt-6 text-2xl font-black">{metric.value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/30">{metric.label}</p></div>)}
  </div>
);

const AnalyticsPanel = ({ analytics }: { analytics: Analytics }) => {
  const conversionRate = analytics.uniqueClicks ? (analytics.conversions / analytics.uniqueClicks) * 100 : 0;
  return <div className="space-y-6"><MetricGrid analytics={analytics} /><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-white/8 bg-white/[.03] p-6"><h2 className="text-xl font-black">Conversion funnel</h2><div className="mt-6 space-y-3">{[{ label: 'All clicks', value: analytics.clicks }, { label: 'Unique visitors', value: analytics.uniqueClicks }, { label: 'Purchases', value: analytics.conversions }].map((row, index) => <div key={row.label} className="flex items-center justify-between rounded-2xl bg-black/20 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-500/10 text-xs font-black text-indigo-300">{index + 1}</span><span className="text-sm font-bold">{row.label}</span></div><span className="text-xl font-black">{row.value}</span></div>)}</div><p className="mt-5 text-sm text-white/40">Click-to-purchase conversion: <span className="font-black text-white">{conversionRate.toFixed(1)}%</span></p></section><section className="rounded-3xl border border-white/8 bg-white/[.03] p-6"><h2 className="text-xl font-black">Where clicks come from</h2><div className="mt-6 space-y-4">{analytics.platforms.length ? analytics.platforms.map(platform => { const width = analytics.clicks ? Math.max(4, (platform.clicks / analytics.clicks) * 100) : 0; return <div key={platform.name}><div className="mb-2 flex justify-between text-xs"><span className="font-bold capitalize text-white/65">{platform.name}</span><span className="text-white/35">{platform.clicks} clicks · {platform.conversions} purchases</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-400" style={{ width: `${width}%` }} /></div></div>; }) : <p className="py-14 text-center text-sm text-white/30">Source analytics appear after the first tracked click.</p>}</div></section></div></div>;
};

const Leaderboard = ({ rows, compact = false }: { rows: LeaderboardRow[]; compact?: boolean }) => (
  <div className="overflow-hidden rounded-2xl border border-white/8">
    {rows.length ? rows.slice(0, compact ? 5 : 50).map((row, index) => (
      <div key={row.affiliate_account_id} className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 border-b border-white/5 px-4 py-4 last:border-b-0 ${row.is_current_user ? 'bg-indigo-500/10' : 'bg-black/15'}`}>
        <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${index === 0 ? 'bg-amber-300 text-black' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-orange-400 text-black' : 'bg-white/5 text-white/45'}`}>{row.rank}</div>
        <div className="min-w-0"><p className="truncate text-sm font-black">{row.display_name}{row.is_current_user ? ' · You' : ''}</p><p className="mt-1 text-[11px] text-white/30">{Number(row.unique_clicks).toLocaleString()} unique clicks · {Number(row.conversions).toLocaleString()} purchases</p></div>
        <div className="text-right"><p className="text-sm font-black">{money(Number(row.sales_amount_minor), row.currency)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">sales</p></div>
      </div>
    )) : <div className="py-14 text-center"><Medal className="mx-auto h-8 w-8 text-white/15" /><p className="mt-4 text-sm font-bold text-white/35">The leaderboard opens with the first completed affiliate profile.</p></div>}
  </div>
);
