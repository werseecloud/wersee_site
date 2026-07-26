import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Eye,
  ExternalLink,
  Inbox,
  Link2,
  Loader2,
  MessageSquareText,
  Palette,
  Plus,
  RotateCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRoundCheck,
  WandSparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  createDefaultPublicDmSettings,
  type PublicDmAccessMode,
  type PublicDmQuestion,
  type PublicDmSettings,
} from '../../types/publicDm';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { appToast } from '../../lib/feedback';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
};

type Section = 'access' | 'requirements' | 'inbox' | 'safety' | 'privacy' | 'personalization';

const sections: Array<{ id: Section; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'access', label: 'Access & link', icon: Link2 },
  { id: 'requirements', label: 'Message requirements', icon: SlidersHorizontal },
  { id: 'inbox', label: 'Inbox management', icon: Inbox },
  { id: 'safety', label: 'Safety', icon: ShieldCheck },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'personalization', label: 'Personalization', icon: Palette },
];

const accessOptions: Array<{ value: PublicDmAccessMode; label: string; description: string }> = [
  { value: 'everyone', label: 'Everyone', description: 'Including visitors without a Wersee account.' },
  { value: 'authenticated', label: 'Signed-in Wersee users only', description: 'A Wersee session is required.' },
  { value: 'verified', label: 'Verified users only', description: 'A verified Wersee account is required.' },
  { value: 'secret_link', label: 'People with a secret link only', description: 'Your regular /pd link remains closed.' },
  { value: 'nobody', label: 'Nobody', description: 'Pause new public messages.' },
];

const fieldClass = 'w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none transition focus:border-indigo-400/60';
const cardClass = 'rounded-2xl border border-white/10 bg-white/[0.025] p-4';

const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-white">{label}</span>
      {description && <span className="mt-0.5 block text-xs leading-5 text-gray-500">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-indigo-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </label>
);

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-xs leading-5 text-gray-600">{hint}</span>}
  </label>
);

export const PublicDmSettingsModal = ({ isOpen, onClose, userId }: Props) => {
  const [settings, setSettings] = useState<PublicDmSettings | null>(null);
  const [username, setUsername] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('access');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState('');

  const publicLink = useMemo(() => {
    if (!username) return '';
    return `${window.location.origin}/pd/${encodeURIComponent(username)}`;
  }, [username]);
  const secretLink = settings?.secret_token && publicLink
    ? `${publicLink}?key=${encodeURIComponent(settings.secret_token)}`
    : '';

  const patch = <K extends keyof PublicDmSettings>(key: K, value: PublicDmSettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };

  const loadSettings = async () => {
    if (!userId) return;
    setLoading(true);
    const [profileResult, settingsResult] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
      supabase.from('public_dm_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    setLoading(false);
    if (profileResult.error || !profileResult.data?.username) {
      appToast('Choose a Wersee username before creating your public DM link.');
      setUsername('');
    } else {
      setUsername(profileResult.data.username);
    }
    if (settingsResult.error && !['42P01', 'PGRST204'].includes(settingsResult.error.code || '')) {
      console.error('Public DM settings could not be loaded:', settingsResult.error);
      appToast('Public DM settings could not be loaded.');
      return;
    }
    const next = settingsResult.data as PublicDmSettings | null;
    setSettings(next || createDefaultPublicDmSettings(userId));
    if (!next?.wizard_completed) setWizardStep(0);
  };

  useEffect(() => {
    if (isOpen) void loadSettings();
  }, [isOpen, userId]);

  const saveSettings = async (overrides: Partial<PublicDmSettings> = {}) => {
    if (!settings || !userId) return false;
    setSaving(true);
    const payload = { ...settings, ...overrides, user_id: userId };
    const { data, error } = await supabase
      .from('public_dm_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();
    setSaving(false);
    if (error) {
      console.error('Public DM settings could not be saved:', error);
      appToast(error.message || 'The settings could not be saved.');
      return false;
    }
    setSettings(data as PublicDmSettings);
    appToast('Public DM settings saved.');
    return true;
  };

  const copyLink = async (link: string) => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    appToast('Link copied.');
  };

  const rotateSecret = async () => {
    if (!settings) return;
    const secret = crypto.randomUUID();
    patch('secret_token', secret);
    const saved = await saveSettings({ secret_token: secret });
    if (saved) appToast('Secret link regenerated. The previous link no longer works.');
  };

  const addQuestion = () => {
    const label = newQuestion.trim();
    if (!settings || !label || settings.custom_questions.length >= 10) return;
    const question: PublicDmQuestion = { id: crypto.randomUUID(), label, required: false };
    patch('custom_questions', [...settings.custom_questions, question]);
    setNewQuestion('');
  };

  const finishWizard = async () => {
    const saved = await saveSettings({ enabled: true, wizard_completed: true });
    if (saved) setWizardStep(null);
  };

  const renderAccess = () => (
    <div className="space-y-5">
      <div className={cardClass}>
        <Toggle
          checked={settings!.enabled}
          onChange={(value) => patch('enabled', value)}
          label="Public DM link active"
          description="Enable your /pd link or pause it temporarily."
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-bold text-white">Who can send messages?</p>
        {accessOptions.map((option) => (
          <label key={option.value} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${settings!.access_mode === option.value ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/10 hover:bg-white/[0.03]'}`}>
            <input
              type="radio"
              name="public-dm-access"
              checked={settings!.access_mode === option.value}
              onChange={() => patch('access_mode', option.value)}
              className="mt-1 accent-indigo-500"
            />
            <span>
              <span className="block text-sm font-semibold text-white">{option.label}</span>
              <span className="mt-1 block text-xs text-gray-500">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
      <div className={cardClass}>
        <Field label="Public bio link">
          <div className="flex gap-2">
            <input readOnly value={publicLink || 'Username missing'} className={fieldClass} />
            <button type="button" onClick={() => void copyLink(publicLink)} disabled={!publicLink} className="rounded-xl bg-white/10 px-3 text-white hover:bg-white/15 disabled:opacity-40" aria-label="Copy public link">
              <Clipboard className="h-4 w-4" />
            </button>
            {publicLink && (
              <a href={publicLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl bg-white/10 px-3 text-white hover:bg-white/15" aria-label="Open public link">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Field>
        {settings!.access_mode === 'secret_link' && (
          <div className="mt-4">
            <Field label="Secret link" hint="Anyone with this URL can open the form. Regenerating it revokes the old link immediately.">
              <div className="flex gap-2">
                <input readOnly value={secretLink || 'Save the settings first'} className={fieldClass} />
                <button type="button" onClick={() => void copyLink(secretLink)} disabled={!secretLink} className="rounded-xl bg-white/10 px-3 text-white hover:bg-white/15 disabled:opacity-40">
                  <Clipboard className="h-4 w-4" />
                </button>
                {secretLink && (
                  <a href={secretLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl bg-white/10 px-3 text-white hover:bg-white/15" aria-label="Open secret link">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button type="button" onClick={() => void rotateSecret()} className="rounded-xl bg-white/10 px-3 text-white hover:bg-white/15" title="Regenerate secret link">
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </Field>
          </div>
        )}
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div className="space-y-5">
      <div className={cardClass}>
        <Toggle checked={settings!.require_name} onChange={(value) => patch('require_name', value)} label="Require name" />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-400">
          Email address is optional. Visitors can leave it empty and continue the conversation through their secure Wersee link.
        </div>
        <Toggle checked={settings!.require_subject} onChange={(value) => patch('require_subject', value)} label="Require subject" />
        <Toggle checked={settings!.allow_website} onChange={(value) => patch('allow_website', value)} label="Allow a website or social media link" />
        <Toggle checked={settings!.allow_attachments} onChange={(value) => patch('allow_attachments', value)} label="Allow attachments" description="Up to 3 files of 5 MB each; executable files are rejected." />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Company name">
          <select value={settings!.company_requirement} onChange={(event) => patch('company_requirement', event.target.value as PublicDmSettings['company_requirement'])} className={fieldClass}>
            <option value="hidden">Hide</option>
            <option value="optional">Optional</option>
            <option value="required">Required</option>
          </select>
        </Field>
        <Field label="Maximum length">
          <input type="number" min={250} max={10000} value={settings!.maximum_length} onChange={(event) => patch('maximum_length', Math.max(250, Math.min(10000, Number(event.target.value))))} className={fieldClass} />
        </Field>
      </div>
      <div className={cardClass}>
        <p className="mb-3 text-sm font-bold text-white">Custom questions</p>
        <div className="flex gap-2">
          <input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addQuestion())} placeholder="For example: What is your budget?" className={fieldClass} />
          <button type="button" onClick={addQuestion} className="rounded-xl bg-indigo-500 px-3 text-white hover:bg-indigo-400"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 space-y-2">
          {settings!.custom_questions.map((question) => (
            <div key={question.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
              <span className="min-w-0 flex-1 truncate text-sm text-white">{question.label}</span>
              <label className="flex items-center gap-1.5 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(event) => patch('custom_questions', settings!.custom_questions.map((item) => item.id === question.id ? { ...item, required: event.target.checked } : item))}
                  className="accent-indigo-500"
                />
                Required
              </label>
              <button type="button" onClick={() => patch('custom_questions', settings!.custom_questions.filter((item) => item.id !== question.id))} className="text-gray-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInbox = () => (
    <div className="space-y-5">
      <div className={cardClass}>
        <Toggle checked={settings!.auto_label} onChange={(value) => patch('auto_label', value)} label="Automatically label messages" description="Collaboration, support, question, or spam." />
        <Toggle checked={settings!.email_notifications} onChange={(value) => patch('email_notifications', value)} label="Email notifications" />
        <Toggle checked={settings!.push_notifications} onChange={(value) => patch('push_notifications', value)} label="Push notifications" />
        <Toggle checked={settings!.quiet_hours_enabled} onChange={(value) => patch('quiet_hours_enabled', value)} label="Quiet hours" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Automatically archive">
          <select value={settings!.auto_archive_days ?? ''} onChange={(event) => patch('auto_archive_days', event.target.value ? Number(event.target.value) : null)} className={fieldClass}>
            <option value="">Never</option><option value="7">After 7 days</option><option value="30">After 30 days</option><option value="90">After 90 days</option>
          </select>
        </Field>
        <Field label="Quiet from">
          <input type="time" value={settings!.quiet_hours_start} onChange={(event) => patch('quiet_hours_start', event.target.value)} className={fieldClass} />
        </Field>
        <Field label="Quiet until">
          <input type="time" value={settings!.quiet_hours_end} onChange={(event) => patch('quiet_hours_end', event.target.value)} className={fieldClass} />
        </Field>
      </div>
      <div className={cardClass}>
        <Toggle checked={settings!.auto_reply_enabled} onChange={(value) => patch('auto_reply_enabled', value)} label="Automatic reply" />
        {settings!.auto_reply_enabled && <textarea value={settings!.auto_reply_message} onChange={(event) => patch('auto_reply_message', event.target.value.slice(0, 1000))} placeholder="Thank you, I will get back to you as soon as possible." className={`${fieldClass} mt-2 min-h-24 resize-y`} />}
        <Toggle checked={settings!.away_message_enabled} onChange={(value) => patch('away_message_enabled', value)} label="Away message" />
        {settings!.away_message_enabled && <textarea value={settings!.away_message} onChange={(event) => patch('away_message', event.target.value.slice(0, 1000))} placeholder="I am currently away..." className={`${fieldClass} mt-2 min-h-24 resize-y`} />}
      </div>
    </div>
  );

  const renderSafety = () => (
    <div className="space-y-5">
      <div className={cardClass}>
        <Toggle checked={settings!.captcha_enabled} onChange={(value) => patch('captcha_enabled', value)} label="CAPTCHA" description="Fails closed if the Turnstile keys have not been configured on the server." />
        <Toggle checked={settings!.filter_forbidden_words} onChange={(value) => patch('filter_forbidden_words', value)} label="Filter forbidden words" />
        <Toggle checked={settings!.filter_links} onChange={(value) => patch('filter_links', value)} label="Filter suspicious links" />
        <Toggle checked={settings!.scan_attachments} onChange={(value) => patch('scan_attachments', value)} label="Check attachments" description="MIME type, file size, and dangerous extensions are checked on the server." />
        <Toggle checked={settings!.suspicious_to_spam} onChange={(value) => patch('suspicious_to_spam', value)} label="Automatically move suspicious messages to spam" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Hourly limit per IP and email address">
          <input type="number" min={1} max={100} value={settings!.rate_limit_per_hour} onChange={(event) => patch('rate_limit_per_hour', Math.max(1, Math.min(100, Number(event.target.value))))} className={fieldClass} />
        </Field>
        <Field label="Blocked countries" hint="Comma-separated ISO country codes. For example: RU, KP">
          <input value={settings!.blocked_countries.join(', ')} onChange={(event) => patch('blocked_countries', event.target.value.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean).slice(0, 50))} className={fieldClass} />
        </Field>
      </div>
      <Field label="Forbidden words" hint="Comma-separated; matching messages are moved to spam or rejected.">
        <textarea value={settings!.forbidden_words.join(', ')} onChange={(event) => patch('forbidden_words', event.target.value.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 100))} className={`${fieldClass} min-h-24 resize-y`} />
      </Field>
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-5 text-emerald-100/75">
        IP addresses are never shown to you or stored unencrypted. Only a one-way hash is used for rate limiting.
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-5">
      <div className={cardClass}>
        <Toggle checked={settings!.show_avatar} onChange={(value) => patch('show_avatar', value)} label="Show profile picture" />
        <Toggle checked={settings!.show_full_name} onChange={(value) => patch('show_full_name', value)} label="Show full name" />
        <Toggle checked={settings!.hide_online_status} onChange={(value) => patch('hide_online_status', value)} label="Hide online status" />
        <Toggle checked={settings!.read_receipts} onChange={(value) => patch('read_receipts', value)} label="Read receipts" description="The sender only receives an unguessable receipt token when this is enabled." />
      </div>
      <Field label="Guest message retention">
        <select value={settings!.guest_retention_days} onChange={(event) => patch('guest_retention_days', Number(event.target.value))} className={fieldClass}>
          <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>180 days</option><option value={365}>1 year</option>
        </select>
      </Field>
      <Field label="Consent notice">
        <textarea value={settings!.consent_message} onChange={(event) => patch('consent_message', event.target.value.slice(0, 1000))} className={`${fieldClass} min-h-24 resize-y`} />
      </Field>
    </div>
  );

  const renderPersonalization = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input value={settings!.title} onChange={(event) => patch('title', event.target.value.slice(0, 120))} className={fieldClass} />
        </Field>
        <Field label="Accent color">
          <div className="flex gap-2">
            <input type="color" value={settings!.accent_color} onChange={(event) => patch('accent_color', event.target.value.toUpperCase())} className="h-12 w-14 rounded-xl border border-white/10 bg-black/25 p-1" />
            <input value={settings!.accent_color} onChange={(event) => /^#[0-9A-Fa-f]{0,6}$/.test(event.target.value) && patch('accent_color', event.target.value)} className={fieldClass} />
          </div>
        </Field>
      </div>
      <Field label="Short description">
        <textarea value={settings!.description} onChange={(event) => patch('description', event.target.value.slice(0, 500))} className={`${fieldClass} min-h-24 resize-y`} />
      </Field>
      <Field label="Profile picture or company logo URL">
        <input type="url" value={settings!.logo_url || ''} onChange={(event) => patch('logo_url', event.target.value || null)} placeholder="https://…" className={fieldClass} />
      </Field>
      <Field label="Preset conversation topics" hint="Comma-separated, up to 10.">
        <input value={settings!.preset_topics.join(', ')} onChange={(event) => patch('preset_topics', event.target.value.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 10))} className={fieldClass} />
      </Field>
      <Field label="Thank-you message after submission">
        <textarea value={settings!.thank_you_message} onChange={(event) => patch('thank_you_message', event.target.value.slice(0, 500))} className={`${fieldClass} min-h-24 resize-y`} />
      </Field>
      <div className="rounded-2xl border border-white/10 p-5" style={{ background: `linear-gradient(145deg, ${settings!.accent_color}22, rgba(255,255,255,.02))` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Preview</p>
        <h3 className="mt-3 text-xl font-bold text-white">{settings!.title || 'Send me a message'}</h3>
        <p className="mt-2 text-sm text-gray-400">{settings!.description}</p>
      </div>
    </div>
  );

  const renderSection = (section = activeSection) => {
    if (section === 'access') return renderAccess();
    if (section === 'requirements') return renderRequirements();
    if (section === 'inbox') return renderInbox();
    if (section === 'safety') return renderSafety();
    if (section === 'privacy') return renderPrivacy();
    return renderPersonalization();
  };

  const wizardSections: Section[] = ['access', 'requirements', 'safety', 'personalization'];
  const wizardTitles = ['Create your public DM link', 'Choose who gets access', 'Build your message form', 'Secure your inbox', 'Make it yours'];

  return (
    <BottomSheetModal isOpen={isOpen} onClose={onClose} title="Public DM settings" maxWidth="max-w-6xl">
      {loading || !settings ? (
        <div className="flex min-h-[420px] items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading settings...
        </div>
      ) : wizardStep !== null ? (
        <div className="flex min-h-[560px] flex-col">
          <div className="border-b border-white/10 px-5 py-4 md:px-8">
            <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
              <span>Step {wizardStep + 1} of {wizardTitles.length}</span>
              <button type="button" onClick={() => setWizardStep(null)} className="text-gray-400 hover:text-white">Set up later</button>
            </div>
            <div className="flex gap-2">
              {wizardTitles.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= wizardStep ? 'bg-indigo-500' : 'bg-white/10'}`} />)}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 md:p-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-7">
                <WandSparkles className="mb-4 h-7 w-7 text-indigo-300" />
                <h2 className="text-2xl font-bold text-white">{wizardTitles[wizardStep]}</h2>
                <p className="mt-2 text-sm text-gray-500">Everything is saved to your real Wersee inbox and can be changed later in each settings section.</p>
              </div>
              {wizardStep === 0 ? (
                <div className="space-y-5">
                  <div className={cardClass}>
                    <p className="text-sm text-gray-400">Your bio link</p>
                    {publicLink ? (
                      <a href={publicLink} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 break-all text-lg font-bold text-white hover:text-indigo-300">
                        {publicLink}
                        <ExternalLink className="h-4 w-4 shrink-0" />
                      </a>
                    ) : (
                      <p className="mt-2 text-lg font-bold text-white">Choose a username first</p>
                    )}
                  </div>
                  <Toggle checked={settings.enabled} onChange={(value) => patch('enabled', value)} label="Activate the link when setup is complete" />
                </div>
              ) : renderSection(wizardSections[wizardStep - 1])}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 p-4 md:px-8">
            <button type="button" disabled={wizardStep === 0} onClick={() => setWizardStep((step) => Math.max(0, (step || 0) - 1))} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-400 hover:bg-white/5 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />Back
            </button>
            {wizardStep < wizardTitles.length - 1 ? (
              <button type="button" onClick={() => setWizardStep((step) => Math.min(wizardTitles.length - 1, (step || 0) + 1))} className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-gray-200">
                Next<ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={() => void finishWizard()} disabled={saving || !username} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-400 disabled:opacity-40">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Create link
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[620px] flex-col md:flex-row">
          <aside className="border-b border-white/10 p-3 md:w-60 md:shrink-0 md:border-b-0 md:border-r md:p-4">
            <button type="button" onClick={() => setWizardStep(0)} className="mb-3 flex w-full items-center gap-2 rounded-xl bg-indigo-500/10 px-3 py-2.5 text-left text-sm font-semibold text-indigo-200 hover:bg-indigo-500/15">
              <WandSparkles className="h-4 w-4" />Run setup wizard again
            </button>
            <nav className="flex gap-1 overflow-x-auto md:block md:space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    type="button"
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition md:w-full ${activeSection === section.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                  >
                    <Icon className="h-4 w-4" />{section.label}
                  </button>
                );
              })}
            </nav>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto p-5 md:p-7">
              <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">{sections.find((section) => section.id === activeSection)?.label}</h2>
                    <p className="mt-1 text-sm text-gray-500">Changes take effect after you save them.</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${settings.enabled ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/5 text-gray-500'}`}>
                    {settings.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
                {renderSection()}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 p-4 md:px-7">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-white/5">Close</button>
              <button type="button" onClick={() => void saveSettings()} disabled={saving || !username} className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-gray-200 disabled:opacity-40">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
              </button>
            </div>
          </div>
        </div>
      )}
    </BottomSheetModal>
  );
};
