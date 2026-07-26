import React from 'react';
import { ArrowUpRight, CheckCircle2, FileSignature, LockKeyhole, ShieldCheck } from 'lucide-react';

interface ContractPaymentPreviewProps {
  contractId: string;
  title?: string;
  reference: string;
  customerName?: string;
  createdAt?: string;
  amount: number;
  currency: string;
}

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatAmount = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
};

export const ContractPaymentPreview: React.FC<ContractPaymentPreviewProps> = ({
  contractId,
  title,
  reference,
  customerName,
  createdAt,
  amount,
  currency,
}) => (
  <div className="relative min-h-[800px] overflow-hidden bg-[#07130f] p-8 text-white sm:p-12">
    <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
    <div className="absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
    <div
      className="absolute inset-0 opacity-[0.035]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />

    <div className="relative flex min-h-[704px] flex-col rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 shadow-2xl backdrop-blur-xl sm:p-10">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
            <FileSignature className="h-7 w-7 text-emerald-300" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">Signed agreement</p>
            <p className="mt-1 text-sm font-semibold text-white/45">{reference}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Signed
        </div>
      </div>

      <div className="my-auto py-16">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-white/35">Contract payment</p>
        <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl">
          {title || 'Signed contract'}
        </h1>
        <p className="mt-6 max-w-lg text-sm font-medium leading-7 text-white/50">
          This payment belongs to the signed agreement. You can review the original contract before continuing to secure payment.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Client</p>
            <p className="mt-2 truncate text-sm font-bold text-white/85">{customerName || 'Not available'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Created</p>
            <p className="mt-2 text-sm font-bold text-white/85">{formatDate(createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-7">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Amount due</p>
            <p className="mt-2 text-3xl font-black tracking-tight">{formatAmount(amount, currency)}</p>
          </div>
          <a
            href={`/contract/${encodeURIComponent(contractId)}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white px-5 text-sm font-black text-[#07130f] transition hover:bg-emerald-100"
          >
            View contract
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            Verified agreement
          </span>
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-300" />
            Secure payment
          </span>
        </div>
      </div>
    </div>
  </div>
);
