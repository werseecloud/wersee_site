import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle, ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronRight,
  History, Plus, ShieldCheck, Sparkles, Store, Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LoadingState } from '../ui/LoadingState';
import { appToast } from '@/lib/feedback';

type WalletBalance = {
  wallet_id: string;
  name: string;
  card_label: string;
  is_default: boolean;
  balance_points: number | string;
};

type PointsEntry = {
  id: string;
  amount_points: number;
  description?: string | null;
  occurred_at: string;
};

export const MoneyPointsView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [entries, setEntries] = useState<PointsEntry[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [settlementMode, setSettlementMode] = useState<'points' | 'direct_payout'>('points');
  const [walletName, setWalletName] = useState('My Wersee Wallet');
  const [cardLabel, setCardLabel] = useState('Wersee Points');
  const [saving, setSaving] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashingOut, setCashingOut] = useState(false);
  const [newCardOpen, setNewCardOpen] = useState(false);
  const [newCard, setNewCard] = useState({ name: '', label: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Reconciliation also credits newly approved sales when Points is the chosen settlement mode.
      await supabase.functions.invoke('finance-api', { body: { action: 'overview' } });
      const [
        { data: profileData, error: profileError },
        { data: preference },
        { data: walletData, error: walletError },
        { data: ledgerData, error: ledgerError },
      ] = await Promise.all([
        supabase.from('profiles').select('id,stripe_account_id,wersee_points').eq('id', user.id).single(),
        supabase.from('finance_preferences').select('settlement_mode,wizard_completed_at').eq('user_id', user.id).maybeSingle(),
        supabase.rpc('points_wallet_balances'),
        supabase.from('points_ledger').select('id,amount_points,description,occurred_at').eq('user_id', user.id).eq('status', 'approved').order('occurred_at', { ascending: false }).limit(20),
      ]);
      if (profileError) throw profileError;
      if (walletError) throw walletError;
      if (ledgerError) throw ledgerError;
      setProfile(profileData);
      setWallets((walletData || []) as WalletBalance[]);
      setEntries((ledgerData || []) as PointsEntry[]);
      if (preference?.settlement_mode) setSettlementMode(preference.settlement_mode);
      setWizardOpen(!preference?.wizard_completed_at);
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'Wersee Points could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const balance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + Number(wallet.balance_points || 0), 0),
    [wallets],
  );

  const completeWizard = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('complete_finance_onboarding', {
        p_settlement_mode: settlementMode,
        p_wallet_name: walletName,
        p_card_label: cardLabel,
      });
      if (error) throw error;
      setWizardOpen(false);
      await fetchData();
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'Your finance choice could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const addCard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newCard.name.trim() || !newCard.label.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('points_wallets').insert({
        user_id: user.id,
        name: newCard.name.trim(),
        card_label: newCard.label.trim(),
        is_default: wallets.length === 0,
      });
      if (error) throw error;
      setNewCard({ name: '', label: '' });
      setNewCardOpen(false);
      await fetchData();
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'Points card could not be created');
    } finally {
      setSaving(false);
    }
  };

  const cashOut = async () => {
    const amountPoints = Math.trunc(Number(cashoutAmount));
    if (amountPoints > balance) return appToast('Insufficient Wersee Points.');
    setCashingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('finance-api', {
        body: { action: 'cashout-points', amountPoints },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.code === 'STRIPE_ONBOARDING_REQUIRED') {
          appToast(data.error);
          navigate('/dashboard?tab=overview&view=money-setup');
          return;
        }
        throw new Error(data.error);
      }
      setCashoutAmount('');
      appToast('Your Points payout was sent to Stripe.');
      await fetchData();
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'Points cashout failed');
    } finally {
      setCashingOut(false);
    }
  };

  if (loading) return <LoadingState message="Loading your Wersee Points..." />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 p-7 text-black shadow-2xl shadow-orange-500/10 md:p-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] opacity-60"><Sparkles className="h-4 w-4" /> Approved balance</div>
            <p className="mt-7 text-5xl font-black tracking-tighter md:text-7xl">{balance.toLocaleString()}</p>
            <p className="mt-1 text-lg font-bold opacity-65">≈ €{(balance / 100).toFixed(2)} EUR</p>
            <div className="mt-10 flex flex-wrap gap-2">
              <span className="rounded-full bg-black/10 px-4 py-2 text-xs font-black">100 Points = €1.00</span>
              <span className="rounded-full bg-black/10 px-4 py-2 text-xs font-black">Spend instantly in Wersee</span>
            </div>
          </div>
        </motion.section>

        <section className="rounded-[2.5rem] border border-white/5 bg-[#151515] p-6 md:p-8">
          <h2 className="text-xl font-black text-white">Payout readiness</h2>
          <p className="mt-3 text-sm leading-6 text-white/45">You can receive Points without Stripe. A connected Stripe account already includes the verification required to cash out—no duplicate Wersee KYC.</p>
          <div className={`mt-6 flex items-center gap-3 rounded-2xl p-4 text-sm font-bold ${profile?.stripe_account_id ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-300/10 text-amber-200'}`}>
            {profile?.stripe_account_id ? <ShieldCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {profile?.stripe_account_id ? 'Stripe connected' : 'Stripe only needed when cashing out'}
          </div>
          {!profile?.stripe_account_id && <button onClick={() => navigate('/dashboard?tab=overview&view=money-setup')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-black text-black">Connect Stripe <ChevronRight className="h-4 w-4" /></button>}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[2.5rem] border border-white/5 bg-[#151515] p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-black text-white">Your Points cards</h2><p className="mt-1 text-sm text-white/35">Create separate cards for projects or stores.</p></div>
            <button onClick={() => setNewCardOpen(true)} className="rounded-xl bg-white/5 p-2.5 text-white hover:bg-white/10" aria-label="Create points card"><Plus className="h-5 w-5" /></button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {wallets.map((wallet) => <div key={wallet.wallet_id} className="rounded-3xl bg-gradient-to-br from-[#29272a] to-[#151515] p-5 ring-1 ring-white/10"><p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Wersee Points</p><p className="mt-8 font-black text-white">{wallet.card_label}</p><p className="text-xs text-white/35">{wallet.name}</p><p className="mt-4 text-lg font-black text-white">{Number(wallet.balance_points).toLocaleString()} PTS</p></div>)}
            {!wallets.length && <p className="text-sm text-white/35">Finish the first-time wizard to create your card.</p>}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/5 bg-[#151515] p-6 md:p-8">
          <h2 className="text-xl font-black text-white">Cash out</h2>
          <p className="mt-2 text-sm leading-6 text-white/40">Payout goes to your Stripe-connected bank account. If you are already connected, no additional KYC is requested.</p>
          <input type="number" min="100" step="1" value={cashoutAmount} onChange={(event) => setCashoutAmount(event.target.value)} placeholder="Points amount" className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xl font-black text-white outline-none focus:border-white/25" />
          <p className="mt-2 text-xs text-white/30">{cashoutAmount ? `You receive approximately €${(Number(cashoutAmount) / 100).toFixed(2)}` : 'Minimum 100 Points'}</p>
          <button onClick={cashOut} disabled={cashingOut || Number(cashoutAmount) < 100 || Number(cashoutAmount) > balance} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-black disabled:opacity-35"><Wallet className="h-5 w-5" /> {cashingOut ? 'Sending…' : 'Cash out through Stripe'}</button>
          <button onClick={() => navigate('/marketplace')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-4 font-bold text-white hover:bg-white/10"><Store className="h-5 w-5 text-violet-300" /> Spend in Wersee</button>
        </section>
      </div>

      <section className="rounded-[2.5rem] border border-white/5 bg-[#151515] p-6 md:p-8">
        <div className="flex items-center gap-3"><History className="h-5 w-5 text-violet-300" /><h2 className="text-xl font-black text-white">Approved activity</h2></div>
        <div className="mt-5 divide-y divide-white/5">
          {entries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3">{entry.amount_points > 0 ? <ArrowDownLeft className="h-5 w-5 text-emerald-300" /> : <ArrowUpRight className="h-5 w-5 text-red-300" />}<div className="min-w-0"><p className="truncate text-sm font-bold text-white">{entry.description || 'Wersee Points activity'}</p><p className="text-xs text-white/30">{new Date(entry.occurred_at).toLocaleDateString()}</p></div></div><p className={`font-mono font-black ${entry.amount_points > 0 ? 'text-emerald-300' : 'text-red-300'}`}>{entry.amount_points > 0 ? '+' : ''}{entry.amount_points.toLocaleString()}</p></div>)}
          {!entries.length && <p className="py-10 text-center text-sm text-white/35">No approved Points activity yet.</p>}
        </div>
      </section>

      <AnimatePresence>
        {wizardOpen && <PointsWizard step={wizardStep} setStep={setWizardStep} settlementMode={settlementMode} setSettlementMode={setSettlementMode} walletName={walletName} setWalletName={setWalletName} cardLabel={cardLabel} setCardLabel={setCardLabel} saving={saving} onComplete={completeWizard} />}
        {newCardOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl" onMouseDown={(event) => event.target === event.currentTarget && setNewCardOpen(false)}><motion.div initial={{ y: 20, scale: .97 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111] p-6"><h2 className="text-2xl font-black text-white">New Points card</h2><div className="mt-6 space-y-4"><Input label="Wallet name" value={newCard.name} onChange={(name) => setNewCard({ ...newCard, name })} /><Input label="Name on card" value={newCard.label} onChange={(label) => setNewCard({ ...newCard, label })} /><div className="flex gap-3"><button onClick={() => setNewCardOpen(false)} className="flex-1 rounded-2xl bg-white/5 py-4 font-bold text-white">Cancel</button><button onClick={addCard} disabled={saving || !newCard.name.trim() || !newCard.label.trim()} className="flex-[2] rounded-2xl bg-white py-4 font-black text-black disabled:opacity-40">Create card</button></div></div></motion.div></motion.div>}
      </AnimatePresence>
    </div>
  );
};

const PointsWizard = ({ step, setStep, settlementMode, setSettlementMode, walletName, setWalletName, cardLabel, setCardLabel, saving, onComplete }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/90 p-4 backdrop-blur-2xl">
    <motion.div initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0d0d0f] p-6 shadow-2xl md:p-10">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" /><div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="relative"><div className="mb-8 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-[.25em] text-white/40"><Sparkles className="h-4 w-4 text-amber-300" /> Your money, your rhythm</span><span className="text-xs text-white/30">Step {step} of 2</span></div>
        {step === 1 ? <><h2 className="max-w-xl text-3xl font-black tracking-tight text-white md:text-5xl">How should new sales land?</h2><p className="mt-4 text-sm leading-6 text-white/50 md:text-base">Points arrive without Stripe, can be spent immediately across Wersee and can always be cashed out later.</p><div className="mt-8 grid gap-4 md:grid-cols-2"><Choice active={settlementMode === 'points'} onClick={() => setSettlementMode('points')} title="Receive Wersee Points" text="No Stripe connection needed to receive earnings." /><Choice active={settlementMode === 'direct_payout'} onClick={() => setSettlementMode('direct_payout')} title="Direct Stripe payout" text="Keep sale funds in Stripe and receive no Points for those sales." /></div><button onClick={() => setStep(2)} className="mt-8 w-full rounded-2xl bg-white py-4 font-black text-black">Continue</button></>
          : <><h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">Name your first Points card.</h2><p className="mt-4 text-white/50">You can add more cards whenever you want.</p><div className="mt-8 grid gap-4 md:grid-cols-2"><Input label="Wallet name" value={walletName} onChange={setWalletName} /><Input label="Name on card" value={cardLabel} onChange={setCardLabel} /></div><div className="mt-6 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-500 p-6 text-black"><p className="text-xs font-black uppercase tracking-widest opacity-60">Wersee Points</p><p className="mt-8 text-2xl font-black">{cardLabel || 'Your card'}</p><p className="text-sm font-bold opacity-60">{walletName || 'Your wallet'}</p></div><div className="mt-8 flex gap-3"><button onClick={() => setStep(1)} className="flex-1 rounded-2xl bg-white/5 py-4 font-bold text-white">Back</button><button onClick={onComplete} disabled={saving || !walletName.trim() || !cardLabel.trim()} className="flex-[2] rounded-2xl bg-white py-4 font-black text-black disabled:opacity-40">{saving ? 'Saving…' : 'Create my wallet'}</button></div></>}
      </div>
    </motion.div>
  </motion.div>
);

const Choice = ({ active, onClick, title, text }: any) => <button onClick={onClick} className={`relative rounded-3xl border p-6 text-left ${active ? 'border-amber-300/50 bg-amber-300/10' : 'border-white/10 bg-white/[.03]'}`}>{active && <CheckCircle2 className="absolute right-5 top-5 h-5 w-5 text-amber-300" />}<p className="pr-8 text-lg font-black text-white">{title}</p><p className="mt-3 text-sm leading-6 text-white/45">{text}</p></button>;
const Input = ({ label, value, onChange }: any) => <label className="block text-sm font-bold text-white/55">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-amber-300/40" /></label>;
