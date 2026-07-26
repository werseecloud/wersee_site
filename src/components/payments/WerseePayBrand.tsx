import React from 'react';
import { ShieldCheck } from 'lucide-react';

type WerseePayBrandProps = {
  compact?: boolean;
  dark?: boolean;
  className?: string;
};

export const WerseePayBrand = ({
  compact = false,
  dark = false,
  className = '',
}: WerseePayBrandProps) => (
  <a
    href="https://www.wersee.com"
    aria-label="Wersee Pay"
    className={`inline-flex items-center gap-2.5 rounded-full border px-2.5 py-2 backdrop-blur-xl transition hover:scale-[1.02] ${
      dark
        ? 'border-white/10 bg-white/[0.07] text-white'
        : 'border-black/[0.06] bg-white/85 text-black shadow-sm'
    } ${className}`}
  >
    <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#111] text-[13px] font-black tracking-[-0.12em] text-white shadow-lg">
      W
      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#f6c945]" />
    </span>
    {!compact && (
      <span className="pr-2 leading-none">
        <span className="flex items-center gap-1.5 text-xs font-black tracking-tight">
          Wersee Pay <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        </span>
        <span className={`mt-1 block text-[9px] font-bold tracking-wide ${dark ? 'text-white/40' : 'text-black/40'}`}>
          pay.wersee.com
        </span>
      </span>
    )}
  </a>
);
