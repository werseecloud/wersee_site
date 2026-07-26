import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Globe,
  Package,
  Plus,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

export interface MobileWorkspaceStats {
  revenue: number;
  orders: number;
  businesses: number;
  customers: number;
  currency: string;
}

interface WorkspaceWelcomeCardProps {
  userName: string;
  platformCustomerCount: number;
  onCreate: () => void;
  onViewStorefront: () => void;
}

const compactNumber = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: Math.abs(value) >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);

const currencyValue = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      notation: Math.abs(value) >= 10_000 ? 'compact' : 'standard',
      maximumFractionDigits: Math.abs(value) >= 10_000 ? 1 : 2,
    }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${compactNumber(value)}`;
  }
};

export const WorkspaceWelcomeCard: React.FC<WorkspaceWelcomeCardProps> = ({
  userName,
  platformCustomerCount,
  onCreate,
  onViewStorefront,
}) => (
  <section
    id="welcome-hero"
    aria-labelledby="mobile-workspace-welcome"
    className="relative flex min-h-[248px] flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.09] via-white/[0.045] to-indigo-500/[0.08] p-5"
  >
    <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
    <div className="relative">
      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 text-[11px] font-semibold text-indigo-200">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Your workspace
      </span>
      <h1 id="mobile-workspace-welcome" className="mt-5 text-[26px] font-semibold leading-[1.08] tracking-[-0.035em] text-white">
        Welcome back, {userName || 'Creator'}
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-6 text-white/65">
        {platformCustomerCount > 0
          ? `Build, sell and grow in front of ${compactNumber(platformCustomerCount)} customers on Wersee.`
          : 'Start building your audience on Wersee.'}
      </p>
    </div>

    <div className="relative mt-6 flex items-center gap-3">
      <button
        type="button"
        onClick={onCreate}
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-transform duration-200 active:scale-[0.98]"
      >
        <Plus className="h-4.5 w-4.5" aria-hidden="true" />
        Create new
      </button>
      <button
        type="button"
        onClick={onViewStorefront}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Store className="h-4 w-4" aria-hidden="true" />
        Storefront
      </button>
    </div>
  </section>
);

interface WorkspaceMetricsProps {
  stats: MobileWorkspaceStats;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export const WorkspaceMetrics: React.FC<WorkspaceMetricsProps> = ({
  stats,
  loading,
  error,
  onRetry,
}) => {
  const metrics = [
    { label: 'Revenue', value: currencyValue(stats.revenue, stats.currency), icon: TrendingUp, tone: 'text-emerald-300' },
    { label: 'Orders', value: compactNumber(stats.orders), icon: CreditCard, tone: 'text-blue-300' },
    { label: 'Customers', value: compactNumber(stats.customers), icon: Users, tone: 'text-violet-300' },
    { label: 'Businesses', value: compactNumber(stats.businesses), icon: Store, tone: 'text-amber-300' },
  ];

  return (
    <section aria-labelledby="workspace-metrics-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="workspace-metrics-title" className="text-[17px] font-semibold tracking-tight text-white">Workspace metrics</h2>
        {!loading && !error && <span className="text-xs text-white/45">Live data</span>}
      </div>

      {error ? (
        <div className="rounded-[18px] border border-red-400/15 bg-red-400/[0.06] p-4">
          <p className="text-sm leading-5 text-red-200">{error}</p>
          <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="min-h-[108px] rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-4">
              {loading ? (
                <div className="space-y-3" aria-label={`Loading ${metric.label}`}>
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-7 w-24 rounded-lg" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs font-medium text-white/55">
                    <metric.icon className={`h-4 w-4 ${metric.tone}`} aria-hidden="true" />
                    {metric.label}
                  </div>
                  <p className="mt-4 truncate text-xl font-semibold tracking-[-0.025em] text-white">{metric.value}</p>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

interface WorkspaceQuickActionsProps {
  hasBusiness: boolean;
  onCreateProduct: () => void;
  onNavigate: (view: string) => void;
  onOpenAi: () => void;
}

export const WorkspaceQuickActions: React.FC<WorkspaceQuickActionsProps> = ({
  hasBusiness,
  onCreateProduct,
  onNavigate,
  onOpenAi,
}) => {
  const actions = [
    { label: 'New product', icon: Package, action: onCreateProduct, tone: 'text-emerald-300' },
    { label: 'Payment link', icon: CreditCard, action: () => onNavigate('money-links'), tone: 'text-amber-300' },
    { label: 'Create site', icon: Globe, action: () => onNavigate('management-sites'), tone: 'text-blue-300' },
    ...(hasBusiness
      ? [{ label: 'Invite member', icon: UserPlus, action: () => onNavigate('management-team'), tone: 'text-violet-300' }]
      : []),
    { label: 'Wersee AI', icon: Sparkles, action: onOpenAi, tone: 'text-indigo-300' },
  ];

  return (
    <section aria-labelledby="workspace-quick-actions-title">
      <h2 id="workspace-quick-actions-title" className="mb-3 text-[17px] font-semibold tracking-tight text-white">Quick actions</h2>
      <div className="no-scrollbar -mr-4 flex snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain pb-1 pr-4">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.action}
            className="flex min-h-[92px] min-w-[122px] snap-start flex-col items-start justify-between rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-4 text-left transition-colors hover:bg-white/[0.07] active:scale-[0.98]"
          >
            <action.icon className={`h-5 w-5 ${action.tone}`} aria-hidden="true" />
            <span className="text-sm font-medium text-white/85">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

interface GettingStartedCardProps {
  businessCount: number;
  productCount: number;
  orderCount: number;
  onNavigate: (view: string) => void;
  onCreateProduct: () => void;
  onRestartTutorial: () => void;
}

export const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  businessCount,
  productCount,
  orderCount,
  onNavigate,
  onCreateProduct,
  onRestartTutorial,
}) => {
  const [expanded, setExpanded] = useState(false);
  const steps = useMemo(
    () => [
      {
        id: 'business',
        title: 'Create your business',
        description: 'Set up the profile customers will see.',
        completed: businessCount > 0,
        action: () => onNavigate('create-business'),
      },
      {
        id: 'product',
        title: 'Publish your first product',
        description: 'Add a product, service or digital download.',
        completed: productCount > 0,
        action: onCreateProduct,
      },
      {
        id: 'sale',
        title: 'Make your first sale',
        description: 'Share a payment link or publish your storefront.',
        completed: orderCount > 0,
        action: () => onNavigate('money-links'),
      },
    ],
    [businessCount, onCreateProduct, onNavigate, orderCount, productCount],
  );

  const completedCount = steps.filter((step) => step.completed).length;
  const recommended = steps.find((step) => !step.completed) || steps[steps.length - 1];
  const remaining = steps.filter((step) => step.id !== recommended.id);

  const renderStep = (step: (typeof steps)[number], primary = false) => (
    <button
      key={step.id}
      id={`step-${step.id}`}
      type="button"
      onClick={step.action}
      className={`flex w-full items-center gap-3 rounded-[18px] border p-4 text-left transition-colors active:scale-[0.99] ${
        primary
          ? 'border-indigo-400/20 bg-indigo-400/[0.08]'
          : 'border-white/[0.06] bg-white/[0.025]'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        step.completed ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.06] text-white/60'
      }`}>
        {step.completed ? <Check className="h-5 w-5" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{step.title}</span>
        <span className="mt-1 block text-xs leading-5 text-white/50">{step.description}</span>
      </span>
    </button>
  );

  return (
    <section id="mobile-getting-started" aria-labelledby="workspace-getting-started-title" className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="workspace-getting-started-title" className="text-[17px] font-semibold tracking-tight text-white">Getting started</h2>
          <p className="mt-1 text-xs text-white/50">{completedCount} of {steps.length} completed</p>
        </div>
        <button
          type="button"
          onClick={onRestartTutorial}
          className="min-h-11 rounded-xl px-2 text-xs font-medium text-white/55 transition-colors hover:text-white"
        >
          Restart tutorial
        </button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-[width] duration-200"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="mt-4">{renderStep(recommended, true)}</div>

      {expanded && <div className="mt-3 space-y-3">{remaining.map((step) => renderStep(step))}</div>}

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white"
      >
        {expanded ? 'Show less' : 'Show all steps'}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
    </section>
  );
};
