import * as Dialog from '@radix-ui/react-dialog';
import type { LucideIcon } from 'lucide-react';
import {
  Blocks,
  ChevronRight,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wallet,
  Workflow,
  X,
} from 'lucide-react';

type SettingsVariant = 'management' | 'finance';

interface SettingsDestination {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface SettingsSection {
  label: string;
  destinations: SettingsDestination[];
}

interface WorkspaceSectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  variant: SettingsVariant;
  hiddenDestinationIds?: string[];
}

const SETTINGS_CONTENT: Record<SettingsVariant, {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  icon: LucideIcon;
  sections: SettingsSection[];
}> = {
  management: {
    eyebrow: 'Management',
    title: 'Management settings',
    description: 'Configure access, store operations and the tools connected to this workspace.',
    accent: 'from-indigo-500/25 via-indigo-500/5 to-transparent',
    icon: SlidersHorizontal,
    sections: [
      {
        label: 'Workspace access',
        destinations: [
          { id: 'management-team', label: 'Team', description: 'Members, roles and workspace access', icon: Users },
          { id: 'management-portal', label: 'Team portals', description: 'External access and portal controls', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Business controls',
        destinations: [
          { id: 'management-plans', label: 'Plans', description: 'Products, pricing and plan access', icon: CreditCard },
          { id: 'management-legal', label: 'Trust center', description: 'Legal, privacy and compliance controls', icon: ShieldCheck },
        ],
      },
      {
        label: 'Tools and integrations',
        destinations: [
          { id: 'management-apps', label: 'Apps & extensions', description: 'Manage connected workspace tools', icon: Blocks },
          { id: 'management-workflows', label: 'Workflows', description: 'Automations, triggers and approvals', icon: Workflow },
        ],
      },
    ],
  },
  finance: {
    eyebrow: 'Finance',
    title: 'Finance settings',
    description: 'Manage how your business accepts money, receives payouts and handles financial compliance.',
    accent: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
    icon: Wallet,
    sections: [
      {
        label: 'Payments and payouts',
        destinations: [
          { id: 'money-methods', label: 'Payment methods', description: 'Control the ways customers can pay', icon: CreditCard },
          { id: 'money-payouts', label: 'Payouts', description: 'Bank transfers and payout preferences', icon: Landmark },
        ],
      },
      {
        label: 'Business verification',
        destinations: [
          { id: 'money-seller', label: 'Seller setup', description: 'Business identity and selling eligibility', icon: ShieldCheck },
          { id: 'money-taxes', label: 'Taxes', description: 'Tax details, records and reporting', icon: FileText },
        ],
      },
      {
        label: 'Sales controls',
        destinations: [
          { id: 'money-subscriptions', label: 'Subscriptions', description: 'Recurring payment preferences', icon: Wallet },
          { id: 'money-coupons', label: 'Coupons & discounts', description: 'Discount rules for your checkout', icon: Settings },
        ],
      },
    ],
  },
};

export function WorkspaceSectionSettingsModal({
  isOpen,
  onClose,
  onNavigate,
  variant,
  hiddenDestinationIds = [],
}: WorkspaceSectionSettingsModalProps) {
  const content = SETTINGS_CONTENT[variant];
  const HeaderIcon = content.icon;

  const openDestination = (view: string) => {
    onClose();
    onNavigate(view);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[190] bg-black/75 backdrop-blur-md data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[200] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#101010] text-white shadow-[0_-30px_100px_rgba(0,0,0,0.7)] outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(640px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]">
          <div className={`relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-br ${content.accent} px-5 pb-5 pt-8 sm:px-7 sm:pb-6 sm:pt-7`}>
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/[0.04] blur-2xl" />
            <div className="mb-5 flex justify-center sm:hidden" aria-hidden="true">
              <span className="h-1 w-11 rounded-full bg-white/20" />
            </div>
            <div className="relative flex items-start gap-4 pr-12">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] shadow-lg">
                <HeaderIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">{content.eyebrow}</p>
                <Dialog.Title className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{content.title}</Dialog.Title>
                <Dialog.Description className="mt-2 max-w-lg text-sm leading-6 text-white/45">
                  {content.description}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute right-4 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:right-6 sm:top-6"
                aria-label={`Close ${content.title.toLowerCase()}`}
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
            {content.sections.map((section) => (
              <section key={section.label} aria-labelledby={`${variant}-${section.label.replaceAll(' ', '-').toLowerCase()}`}>
                <h3 id={`${variant}-${section.label.replaceAll(' ', '-').toLowerCase()}`} className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  {section.label}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {section.destinations
                    .filter((destination) => !hiddenDestinationIds.includes(destination.id))
                    .map((destination) => {
                    const DestinationIcon = destination.icon;
                    return (
                      <button
                        key={destination.id}
                        type="button"
                        onClick={() => openDestination(destination.id)}
                        className="group flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 text-left transition-all hover:border-white/15 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/55 transition-colors group-hover:bg-white/10 group-hover:text-white">
                          <DestinationIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-white/90">{destination.label}</span>
                          <span className="mt-1 block text-xs leading-4 text-white/35">{destination.description}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-black/20 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={() => openDestination('profile')}
              className="text-xs font-bold text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Open account settings
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full bg-white px-5 py-2.5 text-xs font-black text-black transition-transform hover:bg-white/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
