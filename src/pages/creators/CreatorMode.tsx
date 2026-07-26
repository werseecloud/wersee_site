import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Activity, ArrowLeft, ArrowRight, BadgeEuro, BarChart3, BookOpen, Check, ChevronRight, CircleDollarSign,
  Copy, CreditCard, ExternalLink, Eye, Globe2, LayoutDashboard, Link2, Loader2, LogOut,
  Menu, MousePointerClick, Plus, Rocket, Send, Settings, Share2, Sparkles, Target, TrendingUp,
  UserPlus, Users, WalletCards, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  creatorPlatforms, creatorReferralUrl, dateRangeStart, isCreatorUsernameValid, money,
  normalizeCreatorUsername, safeInternalDestination,
} from '../../lib/creatorGrowth';
import CreatorDocsPanel from './CreatorDocsPanel';

type CreatorProfile = any;
type DashboardData = {
  clicks: any[]; conversions: any[]; commissions: any[]; ledger: any[]; payouts: any[]; links: any[]; campaigns: any[];
};

const emptyData: DashboardData = { clicks: [], conversions: [], commissions: [], ledger: [], payouts: [], links: [], campaigns: [] };
const tabs = [
  ['overview', 'Overview', LayoutDashboard], ['profile', 'Creator Profile', Eye], ['analytics', 'Analytics', BarChart3], ['links', 'Affiliate Links', Link2],
  ['campaigns', 'Campaigns', Target], ['audience', 'Audience', Users], ['revenue', 'Revenue', TrendingUp],
  ['earnings', 'Earnings', BadgeEuro], ['payouts', 'Payouts', WalletCards], ['invites', 'Invites', UserPlus],
  ['platforms', 'Platforms', Globe2], ['share-kit', 'Share Kit', Share2], ['docs', 'Creator Docs', BookOpen], ['settings', 'Settings', Settings],
] as const;
const ranges = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days'], ['year', 'This Year'], ['all', 'All Time']];

const copy = async (value: string, label = 'Link copied') => {
  await navigator.clipboard.writeText(value);
  toast.success(label);
};

const CinematicEntry = ({ onContinue }: { onContinue: () => void }) => (
  <div className="relative min-h-[100dvh] overflow-hidden bg-black text-white">
    <SEO title="Wersee Creators" description="Your creator growth, attribution and earnings engine inside Wersee." />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,120,30,.17),transparent_31%)]" />
    <motion.div initial={{ opacity: 0, filter: 'blur(24px)', scale: .96 }} animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }} transition={{ duration: 1.8 }} className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <motion.img initial={{ opacity: 0 }} animate={{ opacity: .92 }} transition={{ delay: .25, duration: 1.3 }} src="/manifest.json" className="hidden" alt="" />
      <motion.div initial={{ opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3, duration: 1 }} className="mb-10 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[.06] shadow-[0_0_80px_rgba(251,146,60,.18)]">
        <Sparkles className="h-7 w-7 text-orange-300" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 24, filter: 'blur(14px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: .65, duration: 1.15 }} className="max-w-5xl text-5xl font-semibold tracking-[-.055em] sm:text-7xl lg:text-[96px]">
        Welcome to Wersee's<br /><span className="text-white/45">creator side.</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-8 max-w-xl text-base leading-7 text-white/45 sm:text-lg">Share anything. Attribute every legitimate customer. Grow Wersee and your own creator business from one account.</motion.p>
      <motion.button initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }} onClick={onContinue} className="absolute bottom-[max(40px,env(safe-area-inset-bottom))] flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:scale-105">
        Continue <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  </div>
);

const CreatorAccountModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return <AnimatePresence>{open && <motion.div
    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 backdrop-blur-xl sm:items-center sm:p-6"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
  >
    <motion.div role="dialog" aria-modal="true" aria-labelledby="creator-account-title" initial={{ opacity: 0, y: 28, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} className="relative w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0b0b0b] p-7 text-white shadow-2xl sm:p-10">
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-5 top-5 rounded-full border border-white/10 p-2 text-white/45 transition hover:text-white"><X className="h-4 w-4" /></button>
      <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-400 text-black"><Rocket /></div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Wersee account required</p>
      <h2 id="creator-account-title" className="mt-3 text-4xl font-semibold tracking-[-.045em]">Creator Mode uses your Wersee login.</h2>
      <p className="mt-4 leading-7 text-white/45">You cannot create a separate creator account. Log in with an existing Wersee account, or create your Wersee account first.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link to="/auth?redirect=%2Fcreators%2Fonboarding" className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-black">Log in <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/auth?mode=signup&redirect=%2Fcreators%2Fonboarding" className="flex items-center justify-center rounded-full border border-white/15 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/5">Create Wersee account</Link>
      </div>
      <p className="mt-6 text-center text-xs leading-5 text-white/30">After authentication, you return here to create your creator profile.</p>
    </motion.div>
  </motion.div>}</AnimatePresence>;
};

const SignInGate = ({ onOpen }: { onOpen: () => void }) => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-black px-6 text-white">
    <div className="w-full max-w-lg rounded-[36px] border border-white/10 bg-white/[.04] p-8 text-center backdrop-blur-2xl sm:p-12">
      <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-400 text-black"><Rocket /></div>
      <h1 className="text-4xl font-semibold tracking-[-.04em]">One Wersee account.</h1>
      <p className="mt-4 leading-7 text-white/45">Use your existing login, passkey and account security. Creator Mode never creates a second identity.</p>
      <button type="button" onClick={onOpen} className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-black">Continue with Wersee <ArrowRight className="h-4 w-4" /></button>
      <Link to="/" className="mt-5 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /> Main Wersee</Link>
    </div>
  </div>
);

const CreatorOnboarding = ({ creator, onComplete }: { creator: CreatorProfile | null; onComplete: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(creator?.onboarding_step || 1);
  const [profile, setProfile] = useState(creator);
  const [usernameInput, setUsernameInput] = useState(creator?.username || '');
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [selected, setSelected] = useState<string[]>([]);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [primary, setPrimary] = useState('');
  const [creatorInfo, setCreatorInfo] = useState({
    display_name: creator?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    bio: creator?.bio || '',
    profile_image_url: creator?.profile_image_url || user?.user_metadata?.avatar_url || '',
  });
  const [saving, setSaving] = useState(false);
  const username = normalizeCreatorUsername(usernameInput);

  useEffect(() => {
    if (step !== 1 || username === profile?.username) return;
    if (!isCreatorUsernameValid(username)) { setAvailability(username ? 'invalid' : 'idle'); return; }
    setAvailability('checking');
    const timer = window.setTimeout(async () => {
      const { count } = await supabase.from('creator_profiles').select('id', { count: 'exact', head: true }).eq('username', username);
      setAvailability(count ? 'taken' : 'available');
    }, 350);
    return () => window.clearTimeout(timer);
  }, [username, step, profile?.username]);

  const saveUsername = async () => {
    if (!user || (!profile && availability !== 'available')) return;
    setSaving(true);
    const payload = { user_id: user.id, username, display_name: creatorInfo.display_name, profile_image_url: creatorInfo.profile_image_url || null, onboarding_step: 2 };
    const result = profile
      ? await supabase.from('creator_profiles').update(payload).eq('id', profile.id).select().single()
      : await supabase.from('creator_profiles').insert(payload).select().single();
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    setProfile(result.data); setStep(2);
  };
  const savePlatforms = async () => {
    if (!profile || selected.length === 0 || !primary) return toast.error('Select a primary platform.');
    setSaving(true);
    const rows = selected.map((platform) => ({ creator_id: profile.id, platform, handle: handles[platform] || null, is_primary: platform === primary }));
    const { error } = await supabase.from('creator_platforms').upsert(rows, { onConflict: 'creator_id,platform' });
    if (!error) await supabase.from('creator_profiles').update({ primary_platform: primary, onboarding_step: 3 }).eq('id', profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setStep(3);
  };
  const saveCreatorProfile = async () => {
    if (!profile || !creatorInfo.display_name.trim()) return toast.error('Add a display name.');
    setSaving(true);
    const { error } = await supabase.from('creator_profiles').update({
      display_name: creatorInfo.display_name.trim(),
      bio: creatorInfo.bio.trim() || null,
      profile_image_url: creatorInfo.profile_image_url.trim() || null,
      onboarding_step: 4,
    }).eq('id', profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setStep(4);
  };
  const finish = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('creator_profiles').update({ onboarding_step: 4, onboarding_completed_at: new Date().toISOString() }).eq('id', profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    onComplete();
  };
  const inviteUrl = `${window.location.origin}/creators/invite/${profile?.username || username}`;

  return <div className="min-h-[100dvh] bg-black px-5 py-10 text-white sm:px-8">
    <div className="mx-auto max-w-4xl">
      <div className="mb-14 flex items-center justify-between"><Link to="/" className="text-sm text-white/45 hover:text-white">Wersee</Link><span className="text-xs font-bold uppercase tracking-[.25em] text-white/30">Creator setup · {step}/4</span></div>
      <AnimatePresence mode="wait">
        {step === 1 && <motion.section key="username" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.28em] text-orange-300">Your identity</p><h1 className="text-5xl font-semibold tracking-[-.055em] sm:text-7xl">What's your creator @?</h1>
          <div className="mt-12 flex items-center border-b border-white/15 pb-4 text-3xl sm:text-5xl"><span className="text-white/25">@</span><input autoFocus value={usernameInput.replace(/^@/, '')} onChange={(e) => setUsernameInput(e.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="username" /></div>
          <p className={`mt-4 text-sm ${availability === 'available' ? 'text-emerald-400' : availability === 'taken' || availability === 'invalid' ? 'text-red-400' : 'text-white/35'}`}>{availability === 'checking' ? 'Checking availability…' : availability === 'available' ? `@${username} is available` : availability === 'taken' ? 'That username is already taken' : availability === 'invalid' ? 'Use 3–30 lowercase letters, numbers, dots, dashes or underscores' : 'This becomes your public Wersee creator identity.'}</p>
          <button onClick={saveUsername} disabled={saving || (!profile && availability !== 'available')} className="mt-12 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-black disabled:opacity-30">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Continue <ArrowRight className="h-4 w-4" /></button>
        </motion.section>}
        {step === 2 && <motion.section key="platforms" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.28em] text-orange-300">Your audience</p><h1 className="text-5xl font-semibold tracking-[-.055em] sm:text-7xl">Where do you create?</h1><p className="mt-5 text-white/40">Select every platform. Choose one as primary.</p>
          <div className="mt-10 flex flex-wrap gap-2">{creatorPlatforms.map((platform) => { const active = selected.includes(platform); return <button key={platform} onClick={() => { setSelected(active ? selected.filter((x) => x !== platform) : [...selected, platform]); if (active && primary === platform) setPrimary(''); }} className={`rounded-full border px-4 py-2.5 text-sm transition ${active ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[.03] text-white/55 hover:border-white/25'}`}>{active && <Check className="mr-1 inline h-3 w-3" />}{platform}</button>; })}</div>
          {selected.length > 0 && <div className="mt-8 grid gap-3 sm:grid-cols-2">{selected.map((platform) => <div key={platform} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-center justify-between"><span className="font-semibold">{platform}</span><button onClick={() => setPrimary(platform)} className={`text-xs font-bold ${primary === platform ? 'text-orange-300' : 'text-white/30'}`}>{primary === platform ? 'PRIMARY' : 'MAKE PRIMARY'}</button></div><input value={handles[platform] || ''} onChange={(e) => setHandles({ ...handles, [platform]: e.target.value })} className="mt-3 w-full bg-transparent text-sm text-white/70 outline-none" placeholder="Optional @handle or profile URL" /></div>)}</div>}
          <button onClick={savePlatforms} disabled={saving || !primary} className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-black disabled:opacity-30">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Continue <ArrowRight className="h-4 w-4" /></button>
        </motion.section>}
        {step === 3 && <motion.section key="profile" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.28em] text-orange-300">Your creator profile</p><h1 className="text-5xl font-semibold tracking-[-.055em] sm:text-7xl">Put your profile on Wersee.</h1><p className="mt-5 text-white/40">This is separate creator presentation data, connected to the same Wersee account.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-[180px_1fr]"><div className="aspect-square overflow-hidden rounded-[38px] border border-white/10 bg-white/[.04]">{creatorInfo.profile_image_url ? <img src={creatorInfo.profile_image_url} className="h-full w-full object-cover" alt="Profile preview" /> : <div className="flex h-full items-center justify-center text-5xl text-white/20">@</div>}</div><div className="space-y-3"><input value={creatorInfo.display_name} onChange={(e) => setCreatorInfo({ ...creatorInfo, display_name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 outline-none" placeholder="Display name" /><input value={creatorInfo.profile_image_url} onChange={(e) => setCreatorInfo({ ...creatorInfo, profile_image_url: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 outline-none" placeholder="Profile image URL (your current Wersee photo is prefilled)" /><textarea value={creatorInfo.bio} onChange={(e) => setCreatorInfo({ ...creatorInfo, bio: e.target.value })} className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 outline-none" placeholder="Tell people what you create" /></div></div>
          <button onClick={saveCreatorProfile} disabled={saving || !creatorInfo.display_name.trim()} className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-black disabled:opacity-30">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Continue <ArrowRight className="h-4 w-4" /></button>
        </motion.section>}
        {step === 4 && <motion.section key="invite" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.28em] text-orange-300">Grow together</p><h1 className="text-5xl font-semibold tracking-[-.055em] sm:text-7xl">Invite fellow creators to Wersee.</h1><p className="mt-5 text-xl text-white/40">Build with us from the beginning.</p>
          <div className="mt-12 rounded-[28px] border border-white/10 bg-white/[.04] p-5 sm:flex sm:items-center sm:justify-between"><span className="break-all text-white/60">{inviteUrl}</span><button onClick={() => copy(inviteUrl)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black sm:mt-0"><Copy className="h-4 w-4" /> Copy</button></div>
          <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => navigator.share?.({ title: 'Join Wersee Creators', url: inviteUrl })} className="rounded-full border border-white/10 px-6 py-3 font-semibold"><Share2 className="mr-2 inline h-4 w-4" /> Share invite</button><button onClick={finish} disabled={saving} className="rounded-full bg-white px-7 py-3 font-bold text-black">Enter Creator Dashboard <ArrowRight className="ml-2 inline h-4 w-4" /></button></div>
        </motion.section>}
      </AnimatePresence>
    </div>
  </div>;
};

const Metric = ({ label, value, hint, icon: Icon }: any) => <div className="rounded-[24px] border border-white/[.07] bg-white/[.035] p-5"><div className="flex items-center justify-between text-white/35"><span className="text-xs font-bold uppercase tracking-[.13em]">{label}</span><Icon className="h-4 w-4" /></div><p className="mt-4 text-3xl font-semibold tracking-[-.04em]">{value}</p>{hint && <p className="mt-2 text-xs text-white/30">{hint}</p>}</div>;

const Overview = ({ data, currency }: { data: DashboardData; currency: string }) => {
  const unique = data.clicks.filter((row) => row.is_unique).length;
  const purchases = data.conversions.filter((row) => ['purchase', 'subscription_renewal'].includes(row.conversion_type));
  const signups = data.conversions.filter((row) => row.conversion_type === 'signup').length;
  const revenue = purchases.reduce((sum, row) => sum + Number(row.amount_minor || 0), 0);
  const earnings = data.commissions.reduce((sum, row) => sum + Number(row.commission_amount_minor || 0), 0);
  const conversion = unique ? purchases.length / unique * 100 : 0;
  const days = Array.from({ length: 14 }, (_, index) => { const date = new Date(Date.now() - (13 - index) * 86400000); const key = date.toISOString().slice(0, 10); return { key, value: data.clicks.filter((row) => row.occurred_at?.startsWith(key)).length }; });
  const max = Math.max(1, ...days.map((day) => day.value));
  return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total clicks" value={data.clicks.length.toLocaleString()} icon={MousePointerClick} /><Metric label="Unique clicks" value={unique.toLocaleString()} icon={Users} /><Metric label="Revenue generated" value={money(revenue, currency)} hint="Gross attributed purchases" icon={TrendingUp} /><Metric label="Creator earnings" value={money(earnings, currency)} hint="Commission, separate from revenue" icon={BadgeEuro} /><Metric label="Signups" value={signups.toLocaleString()} icon={UserPlus} /><Metric label="Purchases" value={purchases.length.toLocaleString()} icon={CircleDollarSign} /><Metric label="Conversion rate" value={`${conversion.toFixed(1)}%`} icon={Activity} /><Metric label="Lifetime customers" value={new Set(purchases.map((row) => row.user_id).filter(Boolean)).size.toLocaleString()} icon={Users} /></div><div className="rounded-[28px] border border-white/[.07] bg-white/[.03] p-6"><div className="mb-8 flex items-center justify-between"><div><h3 className="font-semibold">Attributed traffic</h3><p className="mt-1 text-xs text-white/30">Actual unique and repeat clicks</p></div><BarChart3 className="h-5 w-5 text-white/30" /></div><div className="flex h-48 items-end gap-2">{days.map((day) => <div key={day.key} className="group flex h-full flex-1 items-end"><div title={`${day.key}: ${day.value} clicks`} style={{ height: `${Math.max(3, day.value / max * 100)}%` }} className="w-full rounded-t-md bg-gradient-to-t from-orange-500/45 to-orange-200/90 transition group-hover:brightness-125" /></div>)}</div></div></div>;
};

const LinksPanel = ({ creator, accountId, links, campaigns, reload }: any) => {
  const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', destination_path: '/', campaign_id: '', source_platform: '' });
  const create = async () => { const destination = safeInternalDestination(form.destination_path); if (!destination) return toast.error('Use a safe internal Wersee path, for example / or /p/product.'); const slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, ''); if (!slug) return toast.error('Enter a valid slug.'); setSaving(true); const { error } = await supabase.from('affiliate_links').insert({ ...form, slug, destination_path: destination, affiliate_account_id: accountId, campaign_id: form.campaign_id || null, source_platform: form.source_platform || null }); setSaving(false); if (error) return toast.error(error.message); setOpen(false); setForm({ name: '', slug: '', destination_path: '/', campaign_id: '', source_platform: '' }); reload(); };
  return <div><div className="mb-6 flex items-end justify-between"><div><h2 className="text-3xl font-semibold tracking-[-.04em]">Affiliate links</h2><p className="mt-2 text-sm text-white/35">Only safe internal Wersee destinations are accepted.</p></div><button onClick={() => setOpen(true)} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black"><Plus className="mr-1 inline h-4 w-4" /> New link</button></div>{open && <div className="mb-6 grid gap-3 rounded-[26px] border border-orange-300/20 bg-orange-300/[.05] p-5 sm:grid-cols-2"><input className="rounded-xl bg-black/40 px-4 py-3 outline-none" placeholder="Link name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input className="rounded-xl bg-black/40 px-4 py-3 outline-none" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /><input className="rounded-xl bg-black/40 px-4 py-3 outline-none" placeholder="Destination, e.g. /pricing" value={form.destination_path} onChange={(e) => setForm({ ...form, destination_path: e.target.value })} /><select className="rounded-xl bg-black/80 px-4 py-3" value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}><option value="">No campaign</option>{campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><div className="flex gap-2"><button onClick={create} disabled={saving || !form.name} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black">Create</button><button onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-5 py-2 text-sm">Cancel</button></div></div>}<div className="space-y-3">{links.map((link: any) => { const url = creatorReferralUrl(creator.username, link.slug); return <div key={link.id} className="rounded-[22px] border border-white/[.07] bg-white/[.03] p-5 sm:flex sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-semibold">{link.name}</h3>{link.is_primary && <span className="rounded-full bg-orange-300/10 px-2 py-1 text-[9px] font-bold text-orange-300">PRIMARY</span>}</div><p className="mt-2 break-all text-sm text-white/35">{url}</p><p className="mt-1 text-xs text-white/25">→ {link.destination_path}</p></div><div className="mt-4 flex gap-2 sm:mt-0"><button onClick={() => copy(url)} className="rounded-full border border-white/10 p-2.5"><Copy className="h-4 w-4" /></button><a href={url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 p-2.5"><ExternalLink className="h-4 w-4" /></a></div></div>; })}{links.length === 0 && <p className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-white/30">Your primary link is being prepared.</p>}</div></div>;
};

const CampaignsPanel = ({ accountId, campaigns, reload }: any) => { const [name, setName] = useState(''); const create = async () => { const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); if (!slug) return; const { error } = await supabase.from('affiliate_campaigns').insert({ affiliate_account_id: accountId, name, slug }); if (error) toast.error(error.message); else { setName(''); reload(); } }; return <div><h2 className="text-3xl font-semibold tracking-[-.04em]">Campaigns</h2><div className="my-7 flex max-w-xl gap-2"><input value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[.04] px-5 py-3 outline-none" placeholder="July launch" /><button onClick={create} className="rounded-full bg-white px-5 font-bold text-black">Create</button></div><div className="grid gap-3 md:grid-cols-2">{campaigns.map((campaign: any) => <div key={campaign.id} className="rounded-[24px] border border-white/[.07] bg-white/[.03] p-5"><Target className="mb-6 h-5 w-5 text-orange-300" /><h3 className="font-semibold">{campaign.name}</h3><p className="mt-2 text-xs uppercase tracking-widest text-white/30">{campaign.status} · {campaign.slug}</p></div>)}</div></div>; };

const FinancePanel = ({ creator, accountId, data, payout = false, reload }: any) => {
  const now = Date.now(); const currency = data.ledger[0]?.currency || 'eur';
  const lifetime = data.ledger.filter((x: any) => x.entry_type === 'commission').reduce((s: number, x: any) => s + Number(x.amount_minor), 0);
  const available = data.ledger.filter((x: any) => new Date(x.effective_at).getTime() <= now).reduce((s: number, x: any) => s + Number(x.amount_minor), 0);
  const pending = data.commissions.filter((x: any) => x.status === 'pending').reduce((s: number, x: any) => s + Number(x.commission_amount_minor), 0);
  const paid = data.payouts.filter((x: any) => x.status === 'paid').reduce((s: number, x: any) => s + Number(x.amount_minor), 0);
  const invoke = async (action: string) => { const { data: result, error } = await supabase.functions.invoke('creator-finance', { body: { action, currency, amountMinor: available } }); if (error || result?.error) return toast.error(result?.error || error?.message); if (result.url) window.location.href = result.url; else { toast.success('Payout submitted'); reload(); } };
  return <div><h2 className="text-3xl font-semibold tracking-[-.04em]">{payout ? 'Payouts' : 'Earnings'}</h2><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Available" value={money(Math.max(0, available), currency)} icon={WalletCards} /><Metric label="Pending" value={money(pending, currency)} icon={Activity} /><Metric label="Lifetime" value={money(lifetime, currency)} icon={TrendingUp} /><Metric label="Paid" value={money(paid, currency)} icon={Check} /></div>{payout && <div className="mt-6 rounded-[28px] border border-white/[.07] bg-white/[.03] p-6"><h3 className="text-xl font-semibold">Stripe Connect</h3><p className="mt-2 text-sm text-white/35">Status: {creator.payout_status.replaceAll('_', ' ')}</p><div className="mt-6 flex flex-wrap gap-3">{creator.payout_status !== 'active' && <button onClick={() => invoke('connect')} className="rounded-full bg-white px-6 py-3 font-bold text-black">Set up payouts</button>}<button disabled={available < 100 || creator.payout_status !== 'active'} onClick={() => invoke('request_payout')} className="rounded-full bg-orange-400 px-6 py-3 font-bold text-black disabled:opacity-30">Pay out {money(Math.max(0, available), currency)}</button></div></div>}<div className="mt-6 space-y-2">{(payout ? data.payouts : data.ledger).map((row: any) => <div key={row.id} className="flex items-center justify-between rounded-2xl border border-white/[.06] p-4"><div><p className="text-sm font-semibold">{row.entry_type?.replaceAll('_', ' ') || `Payout ${row.status}`}</p><p className="mt-1 text-xs text-white/30">{new Date(row.created_at).toLocaleDateString()}</p></div><span className="font-mono text-sm">{money(Number(row.amount_minor), row.currency)}</span></div>)}</div></div>;
};

const ShareKit = ({ creator, links, campaigns }: any) => { const [selected, setSelected] = useState(links[0]?.id || ''); const link = links.find((x: any) => x.id === selected) || links[0]; const url = link ? creatorReferralUrl(creator.username, link.slug) : creatorReferralUrl(creator.username); const caption = `Discover Wersee — the creator-powered marketplace and business platform. ${url}`; return <div><h2 className="text-3xl font-semibold tracking-[-.04em]">Creator Share Kit</h2><p className="mt-2 text-white/35">Ready-to-use, accurately tracked promotion tools.</p><div className="mt-8 grid gap-5 lg:grid-cols-2"><div className="rounded-[28px] border border-white/[.07] bg-white/[.03] p-6"><label className="text-xs font-bold uppercase tracking-widest text-white/30">Tracked link</label><select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-3 w-full rounded-xl bg-black p-3">{links.map((x: any) => <option value={x.id} key={x.id}>{x.name}</option>)}</select><div className="mx-auto mt-8 w-fit rounded-[24px] bg-white p-5"><QRCodeSVG value={url} size={190} level="H" /></div><div className="mt-6 grid grid-cols-2 gap-2"><button onClick={() => copy(url)} className="rounded-full border border-white/10 py-3 text-sm font-semibold"><Copy className="mr-2 inline h-4 w-4" /> Copy link</button><button onClick={() => navigator.share?.({ title: 'Wersee', url })} className="rounded-full bg-white py-3 text-sm font-bold text-black"><Share2 className="mr-2 inline h-4 w-4" /> Share</button></div></div><div className="space-y-3"><div className="rounded-[24px] border border-white/[.07] bg-white/[.03] p-5"><p className="text-xs font-bold uppercase tracking-widest text-white/30">Suggested caption</p><p className="mt-4 leading-7 text-white/65">{caption}</p><button onClick={() => copy(caption, 'Caption copied')} className="mt-5 text-sm font-bold text-orange-300">Copy caption</button></div><div className="rounded-[24px] border border-white/[.07] bg-white/[.03] p-5"><p className="text-xs font-bold uppercase tracking-widest text-white/30">Creator bio</p><p className="mt-4 text-white/65">Follow @{creator.username} on Wersee for products, communities and creator recommendations.</p><button onClick={() => copy(`Follow @${creator.username} on Wersee for products, communities and creator recommendations.`)} className="mt-5 text-sm font-bold text-orange-300">Copy bio</button></div></div></div></div>; };

const SettingsPanel = ({ creator, reload, profileOnly = false }: any) => { const [form, setForm] = useState({ display_name: creator.display_name || '', bio: creator.bio || '', profile_image_url: creator.profile_image_url || '', banner_url: creator.banner_url || '', public_profile_enabled: creator.public_profile_enabled, seo_indexable: creator.seo_indexable }); const save = async () => { const { error } = await supabase.from('creator_profiles').update(form).eq('id', creator.id); if (error) toast.error(error.message); else { toast.success('Creator profile saved'); reload(); } }; return <div><div className="flex items-end justify-between"><div><h2 className="text-3xl font-semibold tracking-[-.04em]">{profileOnly ? 'Creator profile' : 'Creator settings'}</h2><p className="mt-2 text-sm text-white/35">Your profile is tied to your existing Wersee user — no second account.</p></div>{creator.public_profile_enabled && <Link to={`/creator/${creator.username}`} target="_blank" className="rounded-full border border-white/10 px-4 py-2 text-sm">Public preview <ExternalLink className="ml-1 inline h-4 w-4" /></Link>}</div><div className="mt-7 grid max-w-4xl gap-6 md:grid-cols-[180px_1fr]"><div className="aspect-square overflow-hidden rounded-[38px] border border-white/10 bg-white/[.04]">{form.profile_image_url ? <img src={form.profile_image_url} className="h-full w-full object-cover" alt="Creator profile" /> : <div className="flex h-full items-center justify-center text-5xl text-white/20">@</div>}</div><div className="space-y-4"><input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 outline-none" placeholder="Display name" /><input value={form.profile_image_url} onChange={(e) => setForm({ ...form, profile_image_url: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 outline-none" placeholder="Profile image URL" /><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/[.04] p-4 outline-none" placeholder="Creator bio" />{!profileOnly && [['public_profile_enabled', 'Public creator profile'], ['seo_indexable', 'Allow search engine indexing']].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 p-4"><span>{label}</span><input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} /></label>)}<button onClick={save} className="rounded-full bg-white px-6 py-3 font-bold text-black">Save profile</button></div></div></div>; };

const CreatorDashboard = ({ creator, account, reloadProfile, screen }: any) => {
  const navigate = useNavigate(); const { signOut } = useAuth();
  const [mobileNav, setMobileNav] = useState(false); const [range, setRange] = useState('30d'); const [loading, setLoading] = useState(true); const [data, setData] = useState<DashboardData>(emptyData);
  const current = screen === 'dashboard' ? 'overview' : screen || 'overview';
  const load = async () => { setLoading(true); const start = dateRangeStart(range); const withStart = (query: any, column: string) => start ? query.gte(column, start) : query; const [clicks, conversions, commissions, ledger, payouts, links, campaigns] = await Promise.all([
    withStart(supabase.from('affiliate_clicks').select('*').eq('affiliate_account_id', account.id), 'occurred_at'),
    withStart(supabase.from('affiliate_conversions').select('*').eq('affiliate_account_id', account.id), 'occurred_at'),
    withStart(supabase.from('affiliate_commissions').select('*').eq('affiliate_account_id', account.id), 'created_at'),
    supabase.from('affiliate_commission_ledger').select('*').eq('affiliate_account_id', account.id).order('created_at', { ascending: false }),
    supabase.from('affiliate_payouts').select('*').eq('affiliate_account_id', account.id).order('created_at', { ascending: false }),
    supabase.from('affiliate_links').select('*').eq('affiliate_account_id', account.id).order('is_primary', { ascending: false }),
    supabase.from('affiliate_campaigns').select('*').eq('affiliate_account_id', account.id).order('created_at', { ascending: false }),
  ]); setData({ clicks: clicks.data || [], conversions: conversions.data || [], commissions: commissions.data || [], ledger: ledger.data || [], payouts: payouts.data || [], links: links.data || [], campaigns: campaigns.data || [] }); setLoading(false); };
  useEffect(() => { void load(); }, [range, account.id]);
  const currency = data.conversions.find((x) => x.currency)?.currency || 'eur';
  const content = () => { if (loading) return <div className="flex h-80 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>; if (current === 'profile') return <SettingsPanel creator={creator} reload={reloadProfile} profileOnly />; if (current === 'links') return <LinksPanel creator={creator} accountId={account.id} links={data.links} campaigns={data.campaigns} reload={load} />; if (current === 'campaigns') return <CampaignsPanel accountId={account.id} campaigns={data.campaigns} reload={load} />; if (current === 'earnings' || current === 'revenue') return <FinancePanel creator={creator} accountId={account.id} data={data} reload={load} />; if (current === 'payouts') return <FinancePanel creator={creator} accountId={account.id} data={data} payout reload={() => { load(); reloadProfile(); }} />; if (current === 'share-kit') return <ShareKit creator={creator} links={data.links} campaigns={data.campaigns} />; if (current === 'docs') return <CreatorDocsPanel creator={creator} links={data.links} />; if (current === 'settings' || current === 'platforms') return <SettingsPanel creator={creator} reload={reloadProfile} />; if (current === 'invites') { const invite = `${window.location.origin}/creators/invite/${creator.username}`; return <div><h2 className="text-3xl font-semibold">Creator invites</h2><p className="mt-2 text-white/35">Separate from customer affiliate attribution.</p><div className="mt-7 flex max-w-2xl items-center gap-3 rounded-[24px] border border-white/10 p-5"><span className="min-w-0 flex-1 truncate text-white/55">{invite}</span><button onClick={() => copy(invite)} className="rounded-full bg-white p-3 text-black"><Copy className="h-4 w-4" /></button></div></div>; } return <Overview data={data} currency={currency} />; };
  return <div className="min-h-[100dvh] bg-[#050505] text-white"><aside className={`fixed inset-y-0 left-0 z-50 w-[282px] border-r border-white/[.06] bg-[#080808]/95 p-5 backdrop-blur-2xl transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}><div className="mb-8 flex items-center justify-between px-2"><Link to="/" className="text-xl font-semibold tracking-[-.04em]">Wersee <span className="text-orange-300">Creators</span></Link><button onClick={() => setMobileNav(false)} className="lg:hidden"><X /></button></div><div className="mb-5 rounded-2xl border border-white/[.06] bg-white/[.03] p-3"><p className="truncate text-sm font-semibold">@{creator.username}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">Creator mode active</p></div><nav className="space-y-1 overflow-y-auto pb-24">{tabs.map(([key, label, Icon]) => <button key={key} onClick={() => { navigate(key === 'overview' ? '/creators/dashboard' : `/creators/${key}`); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${current === key ? 'bg-white text-black' : 'text-white/45 hover:bg-white/[.05] hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav><div className="absolute bottom-5 left-5 right-5 space-y-1 border-t border-white/[.07] pt-4"><Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /> Exit Creator Mode</Link><button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/45 hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button></div></aside><main className="min-h-screen lg:pl-[282px]"><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[.05] bg-[#050505]/75 px-5 backdrop-blur-xl sm:px-8"><button onClick={() => setMobileNav(true)} className="lg:hidden"><Menu /></button><div className="hidden lg:block"><p className="text-[10px] font-bold uppercase tracking-[.23em] text-white/25">Creator Growth Engine</p><p className="mt-1 text-sm text-white/60">Welcome back, @{creator.username}</p></div><select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-full border border-white/10 bg-black px-4 py-2 text-xs font-semibold outline-none">{ranges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></header><div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">{content()}</div></main></div>;
};

export function CreatorRoute({ screen = 'entry' }: { screen?: string }) {
  const { user, loading: authLoading } = useAuth(); const navigate = useNavigate(); const [loading, setLoading] = useState(true); const [creator, setCreator] = useState<CreatorProfile | null>(null); const [account, setAccount] = useState<any>(null); const [loadError, setLoadError] = useState(''); const [authModalOpen, setAuthModalOpen] = useState(false);
  const load = async () => { if (!user) { setCreator(null); setAccount(null); setLoadError(''); setLoading(false); return; } setLoading(true); setLoadError(''); const { data, error } = await supabase.from('creator_profiles').select('*, affiliate_accounts(*)').eq('user_id', user.id).maybeSingle(); if (error) { setLoadError(error.message); setLoading(false); return; } const affiliate = Array.isArray(data?.affiliate_accounts) ? data.affiliate_accounts[0] : data?.affiliate_accounts; setCreator(data); setAccount(affiliate || null); if (data?.onboarding_completed_at && !affiliate) setLoadError('Je creator-account wordt nog gekoppeld. Probeer het over een paar seconden opnieuw.'); setLoading(false); };
  useEffect(() => { void load(); }, [user?.id]);
  if (screen === 'entry') return <><CinematicEntry onContinue={() => { if (!user) setAuthModalOpen(true); else if (!creator?.onboarding_completed_at) navigate('/creators/onboarding'); else navigate('/creators/dashboard'); }} /><CreatorAccountModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} /></>;
  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center bg-black"><Loader2 className="h-7 w-7 animate-spin text-white" /></div>;
  if (!user) return <><SignInGate onOpen={() => setAuthModalOpen(true)} /><CreatorAccountModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} /></>;
  if (loadError) return <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white"><div className="max-w-md"><h1 className="text-3xl font-semibold">Creator-dashboard kon niet laden.</h1><p className="mt-4 text-white/45">{loadError}</p><button type="button" onClick={() => void load()} className="mt-7 rounded-full bg-white px-6 py-3 font-bold text-black">Opnieuw proberen</button></div></div>;
  if (screen === 'onboarding' || !creator?.onboarding_completed_at) return <CreatorOnboarding creator={creator} onComplete={() => { void load(); navigate('/creators/dashboard'); }} />;
  if (!account) return <div className="flex min-h-screen items-center justify-center bg-black text-white"><button onClick={load}>Finish loading Creator Mode</button></div>;
  return <CreatorDashboard creator={creator} account={account} reloadProfile={load} screen={screen} />;
}

export default function CreatorMode() { return <CreatorRoute screen="entry" />; }
