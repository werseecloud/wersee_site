import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type Digest = 'instant' | 'daily' | 'weekly' | 'off';

type EmailPreferences = {
  user_id: string;
  security_email: boolean;
  purchases_email: boolean;
  sales_email: boolean;
  payments_email: boolean;
  subscriptions_email: boolean;
  payouts_email: boolean;
  invoices_email: boolean;
  investment_email: boolean;
  team_email: boolean;
  community_email: boolean;
  messages_email: boolean;
  jobs_email: boolean;
  affiliate_email: boolean;
  support_email: boolean;
  product_updates_email: boolean;
  platform_updates_email: boolean;
  marketing_email: boolean;
  community_digest: Digest;
  message_digest: Digest;
  locale: string;
  timezone: string;
  updated_at?: string;
};

const requiredKeys = new Set<keyof EmailPreferences>([
  'security_email',
  'purchases_email',
  'payments_email',
  'invoices_email',
]);

const sections: Array<{
  title: string;
  description: string;
  items: Array<{ key: keyof EmailPreferences; label: string; description: string }>;
}> = [
  {
    title: 'Essential',
    description: 'Required for account security and transactions.',
    items: [
      { key: 'security_email', label: 'Security alerts', description: 'New devices, account recovery, credential and session changes.' },
      { key: 'purchases_email', label: 'Purchases and receipts', description: 'Order confirmations, refunds, access, and receipts.' },
      { key: 'payments_email', label: 'Payments and refunds', description: 'Payment failures, refunds, disputes, and required payment updates.' },
      { key: 'invoices_email', label: 'Invoices and tax documents', description: 'Issued, paid, failed, and downloadable invoice notices.' },
    ],
  },
  {
    title: 'Business',
    description: 'Operational updates for selling and managing workspaces.',
    items: [
      { key: 'sales_email', label: 'New sales', description: 'Seller order notifications and fulfillment prompts.' },
      { key: 'subscriptions_email', label: 'Subscription billing', description: 'Renewals, payment failures, cancellations, and trial reminders.' },
      { key: 'payouts_email', label: 'Payouts', description: 'Payout paid, payout failed, and action-required notices.' },
      { key: 'team_email', label: 'Team activity', description: 'Invites, role changes, approvals, and workspace activity.' },
      { key: 'affiliate_email', label: 'Affiliate activity', description: 'Affiliate approvals, commissions, links, and payouts.' },
      { key: 'jobs_email', label: 'Job applications', description: 'New applications, status changes, and interview prompts.' },
      { key: 'support_email', label: 'Support and disputes', description: 'Ticket replies, disputes, and escalation updates.' },
      { key: 'investment_email', label: 'Investment activity', description: 'Campaign, order, settlement, and disclosure notifications.' },
    ],
  },
  {
    title: 'Community',
    description: 'Messages, mentions, announcements, memberships, and events.',
    items: [
      { key: 'community_email', label: 'Community updates', description: 'Announcements, events, membership changes, and community digests.' },
      { key: 'messages_email', label: 'Messages and mentions', description: 'Direct messages, mentions, and selected message digests. Turn this off to stop Resend emails for new chat messages.' },
    ],
  },
  {
    title: 'Product Updates',
    description: 'Optional product communication, separate from transactional email.',
    items: [
      { key: 'platform_updates_email', label: 'Wersee feature updates', description: 'Platform changes, product launches, and operational updates.' },
      { key: 'product_updates_email', label: 'Recommendations and education', description: 'Product recommendations, educational tips, and seller guidance.' },
      { key: 'marketing_email', label: 'Marketing and promotions', description: 'Promotions and partner offers. Consent is off by default.' },
    ],
  },
];

function defaultPreferences(userId: string): EmailPreferences {
  return {
    user_id: userId,
    security_email: true,
    purchases_email: true,
    sales_email: true,
    payments_email: true,
    subscriptions_email: true,
    payouts_email: true,
    invoices_email: true,
    investment_email: true,
    team_email: true,
    community_email: true,
    messages_email: true,
    jobs_email: true,
    affiliate_email: true,
    support_email: true,
    product_updates_email: true,
    platform_updates_email: true,
    marketing_email: false,
    community_digest: 'daily',
    message_digest: 'instant',
    locale: 'en',
    timezone: 'Europe/Amsterdam',
  };
}

export function EmailNotificationSettings() {
  const [prefs, setPrefs] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const updatedLabel = useMemo(() => {
    const value = savedAt ?? prefs?.updated_at;
    return value ? new Date(value).toLocaleString() : 'Not saved yet';
  }, [prefs?.updated_at, savedAt]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('platform_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        console.error('Failed to load email preferences', error);
        setPrefs(defaultPreferences(userId));
      } else {
        setPrefs((data as EmailPreferences | null) ?? defaultPreferences(userId));
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function save(next: EmailPreferences, key: string) {
    setSavingKey(key);
    const payload = {
      ...next,
      security_email: true,
      purchases_email: true,
      payments_email: true,
      invoices_email: true,
    };
    const { data, error } = await supabase
      .from('platform_email_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();
    setSavingKey(null);
    if (error) {
      console.error('Failed to save email preferences', error);
      return;
    }
    setPrefs(data as EmailPreferences);
    setSavedAt(new Date().toISOString());
  }

  function toggle(key: keyof EmailPreferences) {
    if (!prefs || requiredKeys.has(key)) return;
    const next = { ...prefs, [key]: !prefs[key] } as EmailPreferences;
    setPrefs(next);
    save(next, String(key));
  }

  function updateDigest(key: 'community_digest' | 'message_digest', value: Digest) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    save(next, key);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading email preferences...
      </div>
    );
  }

  if (!prefs) {
    return <p className="text-sm text-gray-400">Sign in to manage email preferences.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Email Notifications</h3>
          <p className="text-sm text-gray-400 mt-1">Manage transactional, community, product, and marketing email separately.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          Last updated: {updatedLabel}
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="border-t border-white/10 pt-5">
          <div className="mb-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">{section.title}</h4>
            <p className="text-sm text-gray-400 mt-1">{section.description}</p>
          </div>
          <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden">
            {section.items.map((item) => {
              const required = requiredKeys.has(item.key);
              const checked = Boolean(prefs[item.key]);
              return (
                <div key={String(item.key)} className="flex items-center justify-between gap-4 p-4 bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{required ? 'Required for account security and transactions. ' : ''}{item.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={required || savingKey === item.key}
                    onClick={() => toggle(item.key)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-indigo-500' : 'bg-white/10'} ${required ? 'opacity-60 cursor-not-allowed' : ''}`}
                    aria-pressed={checked}
                    aria-label={item.label}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="border-t border-white/10 pt-5">
        <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Digests</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['community_digest', 'Community digest'],
            ['message_digest', 'Message digest'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-sm text-gray-300">{label}</span>
              <select
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={prefs[key as 'community_digest' | 'message_digest']}
                onChange={(event) => updateDigest(key as 'community_digest' | 'message_digest', event.target.value as Digest)}
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily summary</option>
                <option value="weekly">Weekly summary</option>
                <option value="off">Off</option>
              </select>
              {key === 'message_digest' && (
                <p className="mt-2 text-xs text-gray-500">Use Off to disable message email delivery while keeping in-app notifications.</p>
              )}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
