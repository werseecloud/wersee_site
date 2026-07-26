import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { supabase, supabasePublishableKey, supabaseUrl } from '../lib/supabase';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type PublicConfig = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  companyName: string | null;
  title: string;
  description: string;
  logoUrl: string | null;
  accentColor: string;
  presetTopics: string[];
  thankYouMessage: string;
  requirements: {
    name: boolean;
    email: boolean;
    subject: boolean;
    company: 'hidden' | 'optional' | 'required';
    website: boolean;
    attachments: boolean;
    maximumLength: number;
    customQuestions: Array<{ id: string; label: string; required: boolean }>;
  };
  consentMessage: string;
  captcha: { enabled: boolean; siteKey: string; available: boolean };
};

type ConversationMessage = {
  id: string;
  senderType: 'guest' | 'owner';
  content: string;
  createdAt: string;
};

type PublicConversation = {
  submissionId: string;
  subject: string | null;
  guestName: string | null;
  initialMessage: string;
  createdAt: string;
  status: string;
  messages: ConversationMessage[];
};

const inputClass = 'w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#171717] outline-none transition placeholder:text-gray-400 focus:border-black/35 focus:ring-4 focus:ring-black/[0.035]';

export const PublicDmPage = () => {
  const { username = '' } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requiresAuthentication, setRequiresAuthentication] = useState(false);
  const [conversation, setConversation] = useState<PublicConversation | null>(null);
  const [threadReply, setThreadReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [receiptStatus, setReceiptStatus] = useState<{ status: string; readAt: string | null; createdAt: string } | null>(null);
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [captchaToken, setCaptchaToken] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const captchaContainerRef = useRef<HTMLDivElement>(null);

  const secretKey = searchParams.get('key') || '';
  const receiptId = searchParams.get('receipt') || '';
  const receiptToken = searchParams.get('token') || '';
  const conversationId = searchParams.get('conversation') || '';
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/public-dm?username=${encodeURIComponent(username)}${secretKey ? `&key=${encodeURIComponent(secretKey)}` : ''}${receiptId ? `&receipt=${encodeURIComponent(receiptId)}` : ''}${conversationId ? `&conversation=${encodeURIComponent(conversationId)}` : ''}${receiptToken ? `&token=${encodeURIComponent(receiptToken)}` : ''}`;

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${session?.access_token || supabasePublishableKey}`,
    };
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const response = await fetch(endpoint, { headers: await authHeaders() });
      const result = await response.json().catch(() => ({}));
      if (!active) return;
      setLoading(false);
      if (!response.ok) {
        setRequiresAuthentication(Boolean(result.requiresAuthentication));
        setError(result.error || 'This public inbox is not available.');
        return;
      }
      if (result.receipt) {
        setReceiptStatus(result.receipt);
        return;
      }
      setConfig(result.config);
      setConversation(result.conversation || null);
      setTopic(result.config?.presetTopics?.[0] || '');
    };
    void load();
    return () => { active = false; };
  }, [username, secretKey, receiptId, receiptToken, conversationId]);

  useEffect(() => {
    if (!conversationId || !receiptToken) return;
    let active = true;
    const refresh = async () => {
      const response = await fetch(endpoint, { headers: await authHeaders(), cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (active && response.ok && result.conversation) setConversation(result.conversation);
    };
    const interval = window.setInterval(() => void refresh(), 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [conversationId, receiptToken, endpoint]);

  useEffect(() => {
    if (!config?.captcha.enabled || !config.captcha.available || !config.captcha.siteKey) return;
    let widgetId = '';
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.turnstile || !captchaContainerRef.current || widgetId) return;
      widgetId = window.turnstile.render(captchaContainerRef.current, {
        sitekey: config.captcha.siteKey,
        theme: 'light',
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      });
    };
    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-wersee-turnstile]');
      if (existing) {
        existing.addEventListener('load', render, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.werseeTurnstile = 'true';
        script.addEventListener('load', render, { once: true });
        document.head.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [config?.captcha.enabled, config?.captcha.siteKey]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles(Array.from(incoming).slice(0, 3));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!config || submitting) return;
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('message', message);
    form.set('topic', topic);
    form.set('consent', String(form.get('consent') === 'on'));
    form.set('captchaToken', captchaToken);
    form.set('customAnswers', JSON.stringify(customAnswers));
    form.delete('attachments');
    files.forEach((file) => form.append('attachments', file));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: await authHeaders(),
      body: form,
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      setError(result.error || 'Your message could not be sent.');
      return;
    }
    const conversationToken = result.conversationToken as string | undefined;
    if (!conversationToken) {
      setError('The conversation was saved, but a secure reply link could not be created.');
      return;
    }
    const subject = String(form.get('subject') || '').trim() || null;
    const name = String(form.get('name') || '').trim() || null;
    setConversation({
      submissionId: result.submissionId,
      subject,
      guestName: name,
      initialMessage: message,
      createdAt: new Date().toISOString(),
      status: 'new',
      messages: result.automaticReply ? [{
        id: `automatic-${result.submissionId}`,
        senderType: 'owner',
        content: result.automaticReply,
        createdAt: new Date().toISOString(),
      }] : [],
    });
    navigate(
      `/pd/${encodeURIComponent(username)}?conversation=${encodeURIComponent(result.submissionId)}&token=${encodeURIComponent(conversationToken)}`,
      { replace: true },
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThreadReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = threadReply.trim();
    if (!content || sendingReply || !conversation) return;
    setSendingReply(true);
    setError('');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...await authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: content }),
    });
    const result = await response.json().catch(() => ({}));
    setSendingReply(false);
    if (!response.ok) {
      setError(result.error || 'Your reply could not be sent.');
      return;
    }
    setThreadReply('');
    setConversation((current) => current ? {
      ...current,
      messages: [...current.messages, result.message as ConversationMessage],
    } : current);
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f5f2] text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading public inbox...
      </div>
    );
  }

  if (receiptStatus) {
    const wasRead = receiptStatus.status === 'read' || Boolean(receiptStatus.readAt);
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f5f2] p-5">
        <SEO title="Public DM delivery status" description="View the status of your public DM." url={`/pd/${username}`} noIndex />
        <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-xl shadow-black/5">
          <CheckCircle2 className={`mx-auto h-10 w-10 ${wasRead ? 'text-emerald-500' : 'text-indigo-500'}`} />
          <h1 className="mt-5 text-2xl font-bold">{wasRead ? 'Message read' : 'Message delivered'}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            {wasRead && receiptStatus.readAt
              ? `Read on ${new Date(receiptStatus.readAt).toLocaleString('en-US')}.`
              : `Securely delivered on ${new Date(receiptStatus.createdAt).toLocaleString('en-US')}.`}
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f5f2] p-5">
        <SEO title="Public DM" description="Send a secure message through Wersee." url={`/pd/${username}`} noIndex />
        <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-xl shadow-black/5">
          {requiresAuthentication ? <LockKeyhole className="mx-auto h-9 w-9 text-gray-700" /> : <AlertCircle className="mx-auto h-9 w-9 text-red-500" />}
          <h1 className="mt-5 text-2xl font-bold text-[#171717]">{requiresAuthentication ? 'Sign in to send a message' : 'Inbox unavailable'}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">{error}</p>
          {requiresAuthentication && (
            <button type="button" onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">
              Sign in to Wersee <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const brandImage = config.logoUrl || config.avatarUrl;

  return (
    <div className="min-h-[100dvh] bg-[#f5f5f2] text-[#171717]">
      <SEO title={`${config.title} - ${config.displayName}`} description={config.description} url={`/pd/${username}`} noIndex />
      <div className="grid min-h-[100dvh] w-full md:grid-cols-[0.82fr_1.18fr]">
        <motion.aside
          initial={{ opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden px-6 pb-8 pt-10 text-white md:min-h-[100dvh] md:px-12 md:py-14 lg:px-16"
          style={{ backgroundColor: config.accentColor }}
        >
          <motion.div
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            animate={{ x: [0, -22, 0], y: [0, 28, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-black/10 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -18, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3 text-sm font-semibold text-white/75">
              <MessageCircle className="h-5 w-5" /> Wersee Public DMs
            </div>
            <div className="my-auto py-12">
              {brandImage ? (
                <img src={brandImage} alt="" className="mb-7 h-20 w-20 rounded-3xl border border-white/25 object-cover shadow-xl" />
              ) : (
                <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/25 bg-white/10 text-2xl font-bold">
                  {(config.displayName || 'W').slice(0, 1).toUpperCase()}
                </div>
              )}
              <p className="text-sm font-semibold text-white/70">{config.displayName}</p>
              <h1 className="mt-3 max-w-md text-4xl font-bold leading-[1.08] tracking-[-0.04em] md:text-5xl">{config.title}</h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/75">{config.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4" /> IP addresses are not visible to the recipient.
            </div>
          </div>
        </motion.aside>

        <motion.main
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={`min-h-[100dvh] px-5 py-8 md:px-12 md:py-14 lg:px-16 ${conversation ? 'flex items-stretch' : ''}`}
        >
          <div className={`mx-auto w-full max-w-3xl ${conversation ? 'flex min-h-[calc(100dvh-7rem)] flex-col' : ''}`}>
            {conversation ? (
              <motion.section
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-2xl shadow-black/[0.06]"
              >
                <header className="flex items-center gap-4 border-b border-black/[0.07] px-5 py-4 md:px-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: config.accentColor }}>
                    {brandImage ? <img src={brandImage} alt="" className="h-full w-full rounded-2xl object-cover" /> : <MessageCircle className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold">{conversation.subject || config.title}</h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Secure Wersee conversation
                    </p>
                  </div>
                  <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                  </div>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f7f4] px-4 py-6 md:px-7">
                  <div className="mx-auto flex max-w-sm items-center gap-2 rounded-full bg-white px-3 py-1.5 text-center text-[11px] font-medium text-gray-500 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: config.accentColor }} />
                    {config.thankYouMessage}
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[86%] rounded-[22px] rounded-br-md px-4 py-3 text-sm leading-6 text-white shadow-sm" style={{ backgroundColor: config.accentColor }}>
                      <p className="whitespace-pre-wrap">{conversation.initialMessage}</p>
                      <span className="mt-1.5 block text-right text-[10px] text-white/65">
                        {new Date(conversation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {conversation.messages.map((item) => {
                      const fromGuest = item.senderType === 'guest';
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${fromGuest ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[86%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${
                              fromGuest ? 'rounded-br-md text-white' : 'rounded-bl-md border border-black/[0.06] bg-white text-gray-700'
                            }`}
                            style={fromGuest ? { backgroundColor: config.accentColor } : undefined}
                          >
                            <p className="whitespace-pre-wrap">{item.content}</p>
                            <span className={`mt-1.5 block text-right text-[10px] ${fromGuest ? 'text-white/65' : 'text-gray-400'}`}>
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleThreadReply} className="border-t border-black/[0.07] bg-white p-3 md:p-4">
                  {error && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700" role="alert">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}
                    </div>
                  )}
                  <div className="flex items-end gap-2 rounded-[20px] border border-black/10 bg-[#f7f7f4] p-2 pl-4 focus-within:border-black/25">
                    <textarea
                      value={threadReply}
                      onChange={(event) => setThreadReply(event.target.value.slice(0, 3000))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={1}
                      placeholder={`Reply to ${config.displayName}...`}
                      className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={!threadReply.trim() || sendingReply}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white transition hover:scale-105 disabled:opacity-40"
                      style={{ backgroundColor: config.accentColor }}
                      aria-label="Send reply"
                    >
                      {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-gray-400">Keep this private link to return to the conversation.</p>
                </form>
              </motion.section>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">New message</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Tell us what you would like to discuss</h2>
                </div>

                {config.presetTopics?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {config.presetTopics.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setTopic(item)}
                        className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${topic === item ? 'border-transparent text-white' : 'border-black/10 bg-white text-gray-600 hover:border-black/25'}`}
                        style={topic === item ? { backgroundColor: config.accentColor } : undefined}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Name {config.requirements.name && '*'}</span>
                    <input name="name" required={config.requirements.name} autoComplete="name" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Email address <span className="font-normal text-gray-400">(optional)</span></span>
                    <input name="email" type="email" autoComplete="email" className={inputClass} />
                  </label>
                  {config.requirements.company !== 'hidden' && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">Company name {config.requirements.company === 'required' && '*'}</span>
                      <input name="companyName" required={config.requirements.company === 'required'} autoComplete="organization" className={inputClass} />
                    </label>
                  )}
                  {config.requirements.website && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">Website or social media link</span>
                      <input name="websiteUrl" type="url" placeholder="https://..." className={inputClass} />
                    </label>
                  )}
                </div>

                {config.requirements.subject && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Subject *</span>
                    <input name="subject" required className={inputClass} />
                  </label>
                )}

                {config.requirements.customQuestions.map((question) => (
                  <label key={question.id} className="block">
                    <span className="mb-2 block text-sm font-semibold">{question.label} {question.required && '*'}</span>
                    <input
                      required={question.required}
                      value={customAnswers[question.id] || ''}
                      onChange={(event) => setCustomAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                      className={inputClass}
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-sm font-semibold">
                    Message *
                    <span className="text-xs font-normal text-gray-400">{message.length}/{config.requirements.maximumLength}</span>
                  </span>
                  <textarea
                    required
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, config.requirements.maximumLength))}
                    className={`${inputClass} min-h-44 resize-y`}
                    placeholder="Write your message..."
                  />
                </label>

                {config.requirements.attachments && (
                  <div>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm font-semibold text-gray-600 hover:border-black/30">
                      <FileUp className="h-5 w-5" />Choose attachments (max. 3 x 5 MB)
                      <input type="file" multiple className="sr-only" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx" onChange={(event) => addFiles(event.target.files)} />
                    </label>
                    {files.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {files.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                            <span className="min-w-0 flex-1 truncate">{file.name}</span>
                            <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {config.captcha.enabled && (
                  <div>
                    {!config.captcha.available ? (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">The recipient enabled CAPTCHA, but it has not been configured on the server yet.</div>
                    ) : (
                      <div ref={captchaContainerRef} />
                    )}
                  </div>
                )}

                <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm leading-6 text-gray-600">
                  <input name="consent" type="checkbox" required className="mt-1 accent-black" />
                  <span>{config.consentMessage}</span>
                </label>

                {error && (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || config.captcha.enabled && (!config.captcha.available || !captchaToken)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: config.accentColor }}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                  Send message securely
                </button>
              </form>
            )}
          </div>
        </motion.main>
      </div>
    </div>
  );
};
