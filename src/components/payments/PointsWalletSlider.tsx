import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WerseePointsMark } from './WerseePointsMark';

export type PointsWalletBalance = {
  wallet_id: string;
  name: string;
  card_label: string;
  is_default: boolean;
  balance_points: number | string;
};

export const usePointsWallets = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<PointsWalletBalance[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadWallets = async () => {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setUserId(null);
        setWallets([]);
        setSelectedWalletId(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      const { data, error: walletError } = await supabase.rpc('points_wallet_balances');
      if (cancelled) return;

      if (walletError) {
        setError(walletError.message);
        setWallets([]);
        setLoading(false);
        return;
      }

      const nextWallets = (data || []) as PointsWalletBalance[];
      setWallets(nextWallets);
      setSelectedWalletId(current => {
        if (current && nextWallets.some(wallet => wallet.wallet_id === current)) return current;
        return nextWallets.find(wallet => wallet.is_default)?.wallet_id || nextWallets[0]?.wallet_id || null;
      });
      setLoading(false);
    };

    loadWallets();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedWallet = useMemo(
    () => wallets.find(wallet => wallet.wallet_id === selectedWalletId) || null,
    [selectedWalletId, wallets],
  );

  return {
    userId,
    wallets,
    selectedWallet,
    selectedWalletId,
    selectWallet: setSelectedWalletId,
    loading,
    error,
  };
};

type PointsWalletSliderProps = {
  wallets: PointsWalletBalance[];
  selectedWalletId: string | null;
  onSelect: (walletId: string) => void;
  loading?: boolean;
  error?: string | null;
  light?: boolean;
};

export const PointsWalletSlider = ({
  wallets,
  selectedWalletId,
  onSelect,
  loading = false,
  error = null,
  light = false,
}: PointsWalletSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef<number | null>(null);
  const selectedIndex = Math.max(0, wallets.findIndex(wallet => wallet.wallet_id === selectedWalletId));
  const hasSlider = wallets.length > 1;

  useEffect(() => () => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
  }, []);

  const goTo = (index: number) => {
    const nextIndex = Math.max(0, Math.min(wallets.length - 1, index));
    const wallet = wallets[nextIndex];
    if (!wallet) return;
    onSelect(wallet.wallet_id);
    trackRef.current?.scrollTo({
      left: nextIndex * (trackRef.current.clientWidth + 12),
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!hasSlider || !trackRef.current) return;
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = requestAnimationFrame(() => {
      if (!trackRef.current) return;
      const index = Math.round(trackRef.current.scrollLeft / (trackRef.current.clientWidth + 12));
      const wallet = wallets[Math.max(0, Math.min(wallets.length - 1, index))];
      if (wallet && wallet.wallet_id !== selectedWalletId) onSelect(wallet.wallet_id);
    });
  };

  if (loading) {
    return (
      <div className={`flex min-h-40 items-center justify-center rounded-2xl border ${light ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-white/10 bg-white/5 text-white/40'}`}>
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm font-medium">Loading your Points cards…</span>
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">Your Points cards could not be loaded.</p>;
  }

  if (!wallets.length) {
    return (
      <div className={`rounded-2xl border p-5 text-center ${light ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-white/10 bg-white/5 text-white/45'}`}>
        <WerseePointsMark className="mx-auto mb-2 h-7 w-9 text-yellow-500" />
        <p className="text-sm font-bold">No Wersee Points cards yet</p>
        <p className="mt-1 text-xs opacity-70">Create a card in Workspace → Money → Wersee Points.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Choose a Wersee Points card">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${light ? 'text-gray-400' : 'text-white/40'}`}>
          {hasSlider ? `${wallets.length} Points cards` : 'Points card'}
        </p>
        {hasSlider && (
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous Points card"
              onClick={() => goTo(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              className={`rounded-full border p-1.5 transition disabled:opacity-25 ${light ? 'border-gray-200 hover:bg-gray-100' : 'border-white/10 hover:bg-white/10'}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next Points card"
              onClick={() => goTo(selectedIndex + 1)}
              disabled={selectedIndex === wallets.length - 1}
              className={`rounded-full border p-1.5 transition disabled:opacity-25 ${light ? 'border-gray-200 hover:bg-gray-100' : 'border-white/10 hover:bg-white/10'}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className={`flex gap-3 ${hasSlider ? 'snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'overflow-hidden'}`}
      >
        {wallets.map(wallet => {
          const selected = wallet.wallet_id === selectedWalletId;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              key={wallet.wallet_id}
              onClick={() => goTo(wallets.indexOf(wallet))}
              className={`relative w-full shrink-0 snap-center overflow-hidden rounded-2xl border p-5 text-left text-white shadow-xl transition focus:outline-none focus:ring-2 focus:ring-yellow-400/70 ${
                selected ? 'border-yellow-400/80' : 'border-white/15'
              }`}
              style={{
                background: 'radial-gradient(circle at 90% 5%, rgba(250,204,21,.32), transparent 34%), linear-gradient(135deg, #29220d 0%, #171717 48%, #090909 100%)',
              }}
            >
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full border border-yellow-300/10" />
              <div className="relative flex min-h-32 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">
                    <WerseePointsMark className="h-4 w-5" /> Wersee Points
                  </span>
                  {selected && <Check className="h-4 w-4 text-yellow-300" />}
                </div>
                <div className="mt-auto">
                  <p className="truncate text-lg font-black">{wallet.card_label}</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="truncate text-xs text-white/45">{wallet.name}</p>
                    <p className="shrink-0 font-mono text-base font-black text-yellow-300">
                      {Number(wallet.balance_points || 0).toLocaleString()} PTS
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {hasSlider && (
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {wallets.map((wallet, index) => (
            <span
              key={wallet.wallet_id}
              className={`h-1.5 rounded-full transition-all ${index === selectedIndex ? 'w-5 bg-yellow-400' : light ? 'w-1.5 bg-gray-300' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
