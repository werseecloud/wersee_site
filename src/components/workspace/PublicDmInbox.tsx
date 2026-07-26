import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Building2,
  Download,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  ShieldBan,
  Tag,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PublicDmSubmission } from '../../types/publicDm';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { appToast, destructiveAction } from '../../lib/feedback';

type Props = {
  userId?: string;
  visible: boolean;
  searchQuery: string;
  onUnreadChange?: (count: number) => void;
};

const labelStyles: Record<PublicDmSubmission['label'], string> = {
  collaboration: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  support: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  question: 'bg-amber-500/15 text-amber-200 border-amber-500/20',
  spam: 'bg-red-500/15 text-red-300 border-red-500/20',
};

const labelNames: Record<PublicDmSubmission['label'], string> = {
  collaboration: 'Collaboration',
  support: 'Support',
  question: 'Question',
  spam: 'Spam',
};

export const PublicDmInbox = ({ userId, visible, searchQuery, onUnreadChange }: Props) => {
  const [submissions, setSubmissions] = useState<PublicDmSubmission[]>([]);
  const [selected, setSelected] = useState<PublicDmSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadMessages, setThreadMessages] = useState<Array<{
    id: string;
    sender_type: 'guest' | 'owner';
    content: string;
    created_at: string;
  }>>([]);
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('public_dm_submissions')
      .select('*')
      .eq('owner_id', userId)
      .in('status', ['new', 'read'])
      .order('created_at', { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      if (!['42P01', 'PGRST204'].includes(error.code || '')) {
        console.error('Public DM inbox could not be loaded:', error);
      }
      return;
    }
    setSubmissions((data || []) as PublicDmSubmission[]);
  };

  useEffect(() => {
    if (!userId) return;
    void load();
    const channel = supabase
      .channel(`public-dm-inbox:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'public_dm_submissions',
        filter: `owner_id=eq.${userId}`,
      }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!selected?.id || !userId) {
      setThreadMessages([]);
      return;
    }
    let active = true;
    const loadThread = async () => {
      const { data, error } = await supabase
        .from('public_dm_messages')
        .select('id, sender_type, content, created_at')
        .eq('submission_id', selected.id)
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });
      if (!active || error) return;
      setThreadMessages((data || []) as typeof threadMessages);
    };
    void loadThread();
    const channel = supabase
      .channel(`public-dm-thread:${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'public_dm_messages',
        filter: `submission_id=eq.${selected.id}`,
      }, (payload) => {
        const message = payload.new as (typeof threadMessages)[number];
        setThreadMessages((current) => current.some((item) => item.id === message.id)
          ? current
          : [...current, message]);
      })
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [selected?.id, userId]);

  const unread = submissions.filter((submission) => submission.status === 'new').length;
  useEffect(() => onUnreadChange?.(unread), [unread, onUnreadChange]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return submissions;
    return submissions.filter((submission) =>
      [
        submission.guest_name,
        submission.guest_email,
        submission.subject,
        submission.company_name,
        submission.topic,
        submission.message,
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [searchQuery, submissions]);

  const openSubmission = async (submission: PublicDmSubmission) => {
    setSelected(submission);
    if (submission.status !== 'new') return;
    const readAt = new Date().toISOString();
    setSubmissions((current) => current.map((item) =>
      item.id === submission.id ? { ...item, status: 'read', read_at: readAt } : item,
    ));
    setSelected({ ...submission, status: 'read', read_at: readAt });
    await supabase
      .from('public_dm_submissions')
      .update({ status: 'read', read_at: readAt })
      .eq('id', submission.id)
      .eq('owner_id', userId);
  };

  const updateStatus = async (status: PublicDmSubmission['status']) => {
    if (!selected || !userId) return;
    const { error } = await supabase
      .from('public_dm_submissions')
      .update({
        status,
        archived_at: status === 'archived' ? new Date().toISOString() : null,
      })
      .eq('id', selected.id)
      .eq('owner_id', userId);
    if (error) {
      appToast('This message could not be updated.');
      return;
    }
    setSubmissions((current) => current.filter((item) => item.id !== selected.id));
    setSelected(null);
    appToast(status === 'spam' ? 'Message moved to spam.' : 'Message archived.');
  };

  const blockSender = async () => {
    if (!selected || !userId) return;
    if (!await destructiveAction({ description: 'Block this sender from sending future public DMs?' })) return;
    const row: Record<string, string> = selected.sender_user_id
      ? { owner_id: userId, blocked_user_id: selected.sender_user_id, reason: 'Blocked from public DM inbox' }
      : { owner_id: userId, blocked_email_hash: selected.guest_email_hash || '', reason: 'Blocked from public DM inbox' };
    if (!row.blocked_user_id && !row.blocked_email_hash) {
      appToast('This guest does not have an account or email address that can be blocked.');
      return;
    }
    const { error } = await supabase.from('public_dm_blocks').upsert(row);
    if (error) {
      appToast('The sender could not be blocked.');
      return;
    }
    await updateStatus('spam');
  };

  const downloadAttachment = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('public-dm-attachments')
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      appToast('The attachment could not be opened securely.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = reply.trim();
    if (!content || !selected || !userId || sendingReply) return;
    setSendingReply(true);
    const { data, error } = await supabase
      .from('public_dm_messages')
      .insert({
        submission_id: selected.id,
        owner_id: userId,
        sender_type: 'owner',
        sender_user_id: userId,
        content,
      })
      .select('id, sender_type, content, created_at')
      .single();
    setSendingReply(false);
    if (error || !data) {
      appToast(error?.message || 'Your reply could not be sent.');
      return;
    }
    setReply('');
    setThreadMessages((current) => current.some((item) => item.id === data.id)
      ? current
      : [...current, data as (typeof threadMessages)[number]]);
  };

  if (!visible) return null;

  return (
    <>
      {loading && submissions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading public DMs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-2 my-3 rounded-2xl border border-dashed border-white/10 px-4 py-7 text-center">
          <Inbox className="mx-auto mb-2 h-5 w-5 text-gray-500" />
          <p className="text-sm font-medium text-gray-400">No public DMs yet</p>
          <p className="mt-1 text-xs text-gray-600">Messages sent through your /pd link appear here in real time.</p>
        </div>
      ) : (
        filtered.map((submission) => (
          <button
            type="button"
            key={submission.id}
            onClick={() => void openSubmission(submission)}
            className="chat-list-item flex w-full items-center gap-3 rounded-[18px] p-3 text-left transition-all active:scale-[0.985]"
          >
            <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
              <Mail className="h-5 w-5" />
              {submission.status === 'new' && (
                <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-[#141414] bg-blue-500" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-1 flex items-center justify-between gap-2">
                <span className="chat-primary-text truncate text-[15px] font-semibold">
                  {submission.guest_name || submission.guest_email || 'Guest'}
                </span>
                <span className="chat-tertiary-text shrink-0 text-[11px]">
                  {new Date(submission.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                </span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="chat-secondary-text truncate text-[13px]">
                  {submission.subject || submission.message}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${labelStyles[submission.label]}`}>
                  {labelNames[submission.label]}
                </span>
              </span>
            </span>
          </button>
        ))
      )}

      <BottomSheetModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject || 'Public DM'}
        maxWidth="max-w-2xl"
      >
        {selected && (
          <div className="space-y-6 p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full border px-2.5 py-1 font-semibold ${labelStyles[selected.label]}`}>
                <Tag className="mr-1 inline h-3 w-3" /> {labelNames[selected.label]}
              </span>
              {selected.topic && <span className="rounded-full bg-white/5 px-2.5 py-1 text-gray-300">{selected.topic}</span>}
              {selected.country_code && <span className="rounded-full bg-white/5 px-2.5 py-1 text-gray-400">{selected.country_code}</span>}
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm md:grid-cols-2">
              <p><span className="text-gray-500">Name</span><br /><span className="text-white">{selected.guest_name || 'Not provided'}</span></p>
              <p><span className="text-gray-500">Email</span><br /><span className="text-white">{selected.guest_email || 'Not provided'}</span></p>
              {selected.company_name && <p><Building2 className="mr-1 inline h-4 w-4 text-gray-500" />{selected.company_name}</p>}
              {selected.website_url && (
                <a className="text-indigo-300 hover:underline" href={selected.website_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 inline h-4 w-4" />Website or social profile
                </a>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-bold text-white">
                <MessageCircle className="h-4 w-4 text-indigo-300" />
                Conversation
              </div>
              <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-[14px] leading-6 text-gray-100">
                    <p className="whitespace-pre-wrap">{selected.message}</p>
                    <span className="mt-1 block text-[10px] text-gray-500">
                      {new Date(selected.created_at).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
                {threadMessages.map((message) => {
                  const fromOwner = message.sender_type === 'owner';
                  return (
                    <div key={message.id} className={`flex ${fromOwner ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[14px] leading-6 ${
                        fromOwner
                          ? 'rounded-br-sm bg-indigo-500 text-white'
                          : 'rounded-bl-sm bg-white/10 text-gray-100'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <span className={`mt-1 block text-right text-[10px] ${fromOwner ? 'text-white/60' : 'text-gray-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendReply} className="border-t border-white/10 p-3">
                <div className="flex items-end gap-2 rounded-2xl bg-white/[0.06] p-2 pl-3">
                  <textarea
                    rows={1}
                    value={reply}
                    onChange={(event) => setReply(event.target.value.slice(0, 3000))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Reply in this conversation..."
                    className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim() || sendingReply}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40"
                    aria-label="Send reply"
                  >
                    {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            </div>

            {Object.keys(selected.custom_answers || {}).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Custom questions</h4>
                {Object.entries(selected.custom_answers).map(([question, answer]) => (
                  <div key={question} className="rounded-xl border border-white/10 p-3">
                    <p className="text-xs text-gray-500">{question}</p>
                    <p className="mt-1 text-sm text-gray-200">{answer}</p>
                  </div>
                ))}
              </div>
            )}

            {selected.attachments?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Attachments</h4>
                {selected.attachments.map((attachment) => (
                  <button
                    type="button"
                    key={attachment.path}
                    onClick={() => void downloadAttachment(attachment.path)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-3 text-left hover:bg-white/5"
                  >
                    <FileText className="h-5 w-5 text-indigo-300" />
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{attachment.name}</span>
                    <Download className="h-4 w-4 text-gray-500" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-5">
              <button type="button" onClick={() => void updateStatus('archived')} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15">
                <Archive className="mr-2 inline h-4 w-4" />Archive
              </button>
              <button type="button" onClick={() => void updateStatus('spam')} className="rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/15">
                Move to spam
              </button>
              <button type="button" onClick={() => void blockSender()} className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/15">
                <ShieldBan className="mr-2 inline h-4 w-4" />Block sender
              </button>
            </div>
          </div>
        )}
      </BottomSheetModal>
    </>
  );
};
