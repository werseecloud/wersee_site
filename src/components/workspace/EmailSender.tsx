import React, { useState, useEffect } from 'react';
import { 
  Send, Loader2, CheckCircle2, AlertCircle, Mail, Users, 
  LayoutTemplate, Settings, Plus, Search, 
  Filter, MoreVertical, Trash2, Globe, Key, Webhook,
  RefreshCw, FileEdit, Copy, Play, Info, Inbox, AtSign,
  ArrowRight, ShieldCheck, Sparkles, X, Reply, Paperclip, Clock,
  Check, CircleDashed
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { invokeApiRunner, supabase } from '../../lib/supabase';

import { appToast, destructiveAction } from '@/lib/feedback';
type Tab = 'inbox' | 'broadcasts' | 'emails' | 'audience' | 'templates' | 'settings';

type WorkspaceEmailAccount = {
  id: string;
  local_part: string;
  workspace_slug: string;
  requested_alias: string;
  sending_address: string;
  identity_id: string;
  status: string;
};

type WorkspaceEmailDomain = {
  id: string;
  domain_name: string;
  kind: 'wersee_subdomain' | 'custom_domain';
  status: string;
  dns_records: Array<{
    record?: string;
    name: string;
    type: string;
    value: string;
    priority?: number;
    status?: string;
  }>;
  dns_automation_status: 'manual' | 'pending' | 'configured' | 'failed';
  is_primary: boolean;
  last_error?: string | null;
};

interface EmailSenderProps {
  businessId?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const emailAddressFromSender = (sender: string) => {
  const value = String(sender || '').trim();
  return value.match(/<([^<>\s]+@[^<>\s]+)>/)?.[1]
    || value.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0]
    || '';
};

const readableEmailBody = (message: any) => {
  const plainText = String(message?.text_body || '').trim();
  if (plainText) return plainText;
  const html = String(message?.html_body || '').trim();
  if (!html) return 'This message has no readable text content.';
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const document = new DOMParser().parseFromString(html, 'text/html');
  return String(document.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
    || 'This message has no readable text content.';
};

const verifiedDomainStatuses = new Set(['verified']);
const pendingDomainStatuses = new Set(['creating', 'not_started', 'pending', 'partially_verified']);

const domainStatusLabel = (status?: string) => {
  if (verifiedDomainStatuses.has(String(status))) return 'Verified';
  if (pendingDomainStatuses.has(String(status))) return 'Setting up';
  if (status === 'failed' || status === 'partially_failed' || status === 'temporary_failure') return 'Needs attention';
  return String(status || 'Unknown').replaceAll('_', ' ');
};

const domainStatusClasses = (status?: string) => {
  if (verifiedDomainStatuses.has(String(status))) return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  if (pendingDomainStatuses.has(String(status))) return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-red-400/20 bg-red-400/10 text-red-300';
};

export const EmailSender: React.FC<EmailSenderProps> = ({ businessId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);
  const [emailAccount, setEmailAccount] = useState<WorkspaceEmailAccount | null>(null);
  const [setupStep, setSetupStep] = useState(0);
  const [setupLocalPart, setSetupLocalPart] = useState('');
  const [setupWorkspace, setSetupWorkspace] = useState('');
  const [setupDisplayName, setSetupDisplayName] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);
  
  // Data states
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [domains, setDomains] = useState<WorkspaceEmailDomain[]>([]);
  const [domainActionId, setDomainActionId] = useState<string | null>(null);
  const [managedDomainLoading, setManagedDomainLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [selectedInboxMessage, setSelectedInboxMessage] = useState<any | null>(null);
  const [openingMessageId, setOpeningMessageId] = useState<string | null>(null);

  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resolveBusinessId = async () => {
    if (!businessId) throw new Error('Select a business before managing contacts.');
    if (UUID_PATTERN.test(businessId)) return businessId;

    const { data, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', businessId)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!data?.id) throw new Error('The selected business could not be found.');
    return data.id as string;
  };

  const mapCrmContact = (contact: any) => {
    const customFields = contact.custom_fields && typeof contact.custom_fields === 'object'
      ? contact.custom_fields
      : {};
    return {
      ...contact,
      audience_id: customFields.audience_id || '',
      first_name: customFields.first_name || contact.name || '',
      last_name: customFields.last_name || '',
      unsubscribed: Boolean(customFields.unsubscribed),
    };
  };

  const saveContact = async (payload: any) => {
    const resolvedBusinessId = await resolveBusinessId();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sign in to manage contacts.');

    const firstName = String(payload.first_name || '').trim();
    const lastName = String(payload.last_name || '').trim();
    const email = String(payload.email || '').trim();
    const contactPayload = {
      business_id: resolvedBusinessId,
      user_id: user.id,
      name: [firstName, lastName].filter(Boolean).join(' ') || email,
      email,
      custom_fields: {
        ...(payload.custom_fields && typeof payload.custom_fields === 'object' ? payload.custom_fields : {}),
        audience_id: String(payload.audience_id || '').trim(),
        first_name: firstName,
        last_name: lastName,
        unsubscribed: Boolean(payload.unsubscribed),
      },
    };

    const query = editingId
      ? supabase
          .from('crm_contacts')
          .update(contactPayload)
          .eq('id', editingId)
          .eq('business_id', resolvedBusinessId)
      : supabase.from('crm_contacts').insert(contactPayload);
    const { error: contactError } = await query;
    if (contactError) throw contactError;
  };

  const callEmailDomainService = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error: functionError } = await supabase.functions.invoke('workspace-email-domains', {
      body: { action, ...payload },
    });
    if (functionError) {
      const context = (functionError as any)?.context;
      const responseBody = context && typeof context.json === 'function'
        ? await context.json().catch(() => null)
        : null;
      throw new Error(responseBody?.error || functionError.message || 'Email domain service is unavailable.');
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const provisionWorkspaceDomain = async (account: WorkspaceEmailAccount) => {
    setManagedDomainLoading(true);
    try {
      const result = await callEmailDomainService('provision-workspace');
      if (result?.domain) {
        setDomains((current) => {
          const rest = current.filter((domain) => domain.id !== result.domain.id);
          return [result.domain as WorkspaceEmailDomain, ...rest];
        });
      }
      if (result?.mailbox?.id === account.id) {
        setEmailAccount(result.mailbox as WorkspaceEmailAccount);
      }
    } catch (provisionError) {
      console.error('Could not finish the workspace email subdomain:', provisionError);
    } finally {
      setManagedDomainLoading(false);
    }
  };

  const loadEmailAccount = async () => {
    setAccountLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: accountError } = await supabase
        .from('workspace_email_accounts')
        .select('id,local_part,workspace_slug,requested_alias,sending_address,identity_id,status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (accountError) throw accountError;
      setEmailAccount(data as WorkspaceEmailAccount | null);
      if (data) void provisionWorkspaceDomain(data as WorkspaceEmailAccount);
      if (!data) {
        const { data: profile } = await supabase.from('profiles').select('name,full_name,username').eq('id', user.id).maybeSingle();
        const suggested = String(profile?.username || user.email?.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);
        setSetupLocalPart(suggested.length >= 2 ? suggested : 'hello');
        setSetupWorkspace('workspace');
        setSetupDisplayName(profile?.name || profile?.full_name || user.email?.split('@')[0] || '');
      }
    } catch (accountError) {
      console.error('Error loading workspace email account:', accountError);
    } finally {
      setAccountLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inbox') {
        const { data, error: inboxError } = await supabase
          .from('resend_inbound_emails')
          .select('id,sender,recipients,cc,reply_to,subject,text_body,html_body,received_at,read_at,category,priority,has_attachments,thread_key')
          .eq('mailbox_account_id', emailAccount!.id)
          .order('received_at', { ascending: false })
          .limit(100);
        if (inboxError) throw inboxError;
        setInboxMessages(data || []);
      } else if (activeTab === 'broadcasts') {
        const data = await invokeApiRunner('email-campaign-list');
        const items = data.data?.data || data.data || [];
        setBroadcasts(Array.isArray(items) ? items : []);
      } else if (activeTab === 'emails') {
        const { data, error: sentError } = await supabase
          .from('mail_bridge_outbound_messages')
          .select('id,to_addresses,subject,status,provider_message_id,scheduled_at,sent_at,created_at,last_error')
          .order('created_at', { ascending: false })
          .limit(100);
        if (sentError) throw sentError;
        setEmails(data || []);
      } else if (activeTab === 'audience') {
        const resolvedBusinessId = await resolveBusinessId();
        const { data, error: contactsError } = await supabase
          .from('crm_contacts')
          .select('id,name,email,phone,tags,custom_fields,created_at,updated_at')
          .eq('business_id', resolvedBusinessId)
          .order('created_at', { ascending: false });
        if (contactsError) throw contactsError;
        setContacts((data || []).map(mapCrmContact));
      } else if (activeTab === 'templates') {
        const data = await invokeApiRunner('email-template-list');
        const items = data.data?.data || data.data || [];
        setTemplates(Array.isArray(items) ? items : []);
      } else if (activeTab === 'settings') {
        const [domData, keyData, hookData] = await Promise.all([
          callEmailDomainService('list'),
          invokeApiRunner('api-key-list'),
          invokeApiRunner('webhook-list')
        ]);
        
        const domItems = domData.domains || [];
        setDomains(Array.isArray(domItems) ? domItems : []);
        if (domData.mailbox?.id) setEmailAccount(domData.mailbox as WorkspaceEmailAccount);
        
        const keyItems = keyData.data?.data || keyData.data || [];
        setApiKeys(Array.isArray(keyItems) ? keyItems : []);
        
        const hookItems = hookData.data?.data || hookData.data || [];
        setWebhooks(Array.isArray(hookItems) ? hookItems : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailAccount();
  }, []);

  useEffect(() => {
    if (!accountLoading && emailAccount) fetchData();
  }, [activeTab, accountLoading, emailAccount?.id]);

  const completeEmailSetup = async () => {
    setSetupSaving(true);
    setError(null);
    try {
      const { data, error: setupError } = await supabase.rpc('complete_workspace_email_onboarding', {
        p_local_part: setupLocalPart,
        p_workspace_slug: setupWorkspace,
        p_display_name: setupDisplayName || null
      });
      if (setupError) throw setupError;
      const account = Array.isArray(data) ? data[0] : data?.account || data;
      if (!account?.id) throw new Error('The email account could not be created.');
      setEmailAccount(account as WorkspaceEmailAccount);
      setSetupStep(2);
      await provisionWorkspaceDomain(account as WorkspaceEmailAccount);
      appToast('Your mailbox is active. We are finishing your subdomain.', 'success');
    } catch (setupError: any) {
      setError(setupError?.message || 'The email account could not be created.');
    } finally {
      setSetupSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let action = '';
      const payload = { ...formData };

      if (createType === 'contact') {
        await saveContact(payload);
        setSuccess(editingId ? 'Successfully updated!' : 'Successfully created!');
        setTimeout(() => {
          setIsCreating(false);
          setFormData({});
          setEditingId(null);
          setSuccess(null);
          fetchData();
        }, 900);
        return;
      }

      if (createType === 'domain') {
        const result = await callEmailDomainService('create', { domain: payload.domain });
        if (result?.domain) {
          setDomains((current) => [...current.filter((domain) => domain.id !== result.domain.id), result.domain]);
        }
        setSuccess('Domain added. Add the DNS records below to verify it.');
        setTimeout(() => {
          setIsCreating(false);
          setFormData({});
          setSuccess(null);
          setActiveTab('settings');
          fetchData();
        }, 1200);
        return;
      }

      switch (createType) {
        case 'broadcast':
          action = editingId ? 'email-campaign-update' : 'email-campaign-create';
          if (editingId) payload.id = editingId;
          break;
        case 'email':
          if (typeof payload.to === 'string') {
            payload.to = payload.to.split(',').map((e: string) => e.trim());
          }
          if (!emailAccount) throw new Error('Set up your Wersee email account first.');
          {
            const recipients = Array.isArray(payload.to)
              ? payload.to.filter(Boolean)
              : [];
            if (!recipients.length) throw new Error('Add at least one valid recipient.');
            const { error: queueError } = await supabase.rpc('mail_bridge_queue_outbound', {
              p_identity_email: emailAccount.sending_address,
              p_to: recipients,
              p_subject: payload.subject,
              p_text: payload.text || payload.html?.replace(/<[^>]+>/g, ' ') || '',
              p_html: payload.html || null,
              p_cc: [],
              p_bcc: [],
              p_reply_to: [emailAccount.sending_address],
              p_headers: { 'X-Wersee-Workspace-Mail': '1' },
              p_in_reply_to_inbound_id: payload.in_reply_to_inbound_id || null,
              p_thread_key: payload.thread_key || null,
              p_scheduled_at: null,
              p_idempotency_key: crypto.randomUUID(),
              p_as_draft: false
            });
            if (queueError) throw queueError;
          }
          setSuccess('Email queued securely for delivery.');
          setTimeout(() => {
            setIsCreating(false);
            setFormData({});
            setSuccess(null);
            fetchData();
          }, 900);
          return;
        case 'template':
          action = editingId ? 'email-template-update' : 'email-template-create';
          if (editingId) payload.id = editingId;
          break;
        case 'apikey':
          action = 'api-key-create';
          break;
        case 'webhook':
          action = editingId ? 'webhook-update' : 'webhook-create';
          if (editingId) payload.id = editingId;
          if (typeof payload.events === 'string') {
            payload.events = payload.events.split(',').map((e: string) => e.trim());
          }
          break;
      }

      if (!action) throw new Error('Unknown action type');

      const data = await invokeApiRunner(action, payload);

      setSuccess(editingId ? 'Successfully updated!' : 'Successfully created!');
      setTimeout(() => {
        setIsCreating(false);
        setFormData({});
        setEditingId(null);
        setSuccess(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this? This cannot be undone.' }))) return;
    
    try {
      if (type === 'contacts') {
        const resolvedBusinessId = await resolveBusinessId();
        const { error: contactError } = await supabase
          .from('crm_contacts')
          .delete()
          .eq('id', id)
          .eq('business_id', resolvedBusinessId);
        if (contactError) throw contactError;
        await fetchData();
        return;
      }

      if (type === 'domains') {
        setDomainActionId(id);
        await callEmailDomainService('delete', { domainId: id });
        setDomains((current) => current.filter((domain) => domain.id !== id));
        setDomainActionId(null);
        return;
      }

      let action = '';
      switch (type) {
        case 'broadcasts': action = 'email-campaign-delete'; break;
        case 'templates': action = 'email-template-delete'; break;
        case 'api-keys': action = 'api-key-delete'; break;
        case 'webhooks': action = 'webhook-delete'; break;
      }

      if (!action) throw new Error('Unknown delete type');

      await invokeApiRunner(action, { id });
      fetchData();
    } catch (err) {
      console.error(err);
      appToast('Failed to delete this item.');
    } finally {
      setDomainActionId(null);
    }
  };

  const refreshDomain = async (domain: WorkspaceEmailDomain, activate = false) => {
    setDomainActionId(domain.id);
    try {
      const result = await callEmailDomainService(activate ? 'activate' : 'sync', { domainId: domain.id });
      if (result?.domain) {
        setDomains((current) => current.map((item) => (
          item.id === domain.id ? result.domain as WorkspaceEmailDomain : item
        )));
      }
      if (result?.mailbox?.id) setEmailAccount(result.mailbox as WorkspaceEmailAccount);
      appToast(
        result?.domain?.status === 'verified'
          ? (activate ? 'Verified sender activated.' : 'Domain is verified.')
          : 'Verification is still in progress.',
        result?.domain?.status === 'verified' ? 'success' : 'info',
      );
    } catch (domainError: any) {
      appToast(domainError?.message || 'Could not refresh the domain.');
    } finally {
      setDomainActionId(null);
    }
  };

  const handleSendBroadcast = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to send this newsletter now?' }))) return;
    try {
      await invokeApiRunner('email-campaign-send', { id });
      fetchData();
    } catch (err) {
      console.error(err);
      appToast('Failed to send the newsletter.');
    }
  };

  const openCreateModal = (type: string) => {
    setCreateType(type);
    setEditingId(null);
    setFormData((type === 'email' || type === 'broadcast') && emailAccount ? { from: emailAccount.sending_address } : {});
    setError(null);
    setSuccess(null);
    setIsCreating(true);
  };

  const openEditModal = (type: string, item: any) => {
    setCreateType(type);
    setEditingId(item.id);
    
    // Format data for the form if needed
    const formattedData = { ...item };
    if (type === 'webhook' && Array.isArray(item.events)) {
      formattedData.events = item.events.join(', ');
    }
    
    setFormData(formattedData);
    setError(null);
    setSuccess(null);
    setIsCreating(true);
  };

  const openInboxMessage = async (message: any) => {
    setSelectedInboxMessage(message);
    if (message.read_at) return;

    setOpeningMessageId(message.id);
    const { data, error: readError } = await supabase.rpc('mail_bridge_mark_inbound_read', {
      p_inbound_id: message.id,
    });
    setOpeningMessageId(null);

    if (readError) {
      console.error('Could not mark inbound mail as read:', readError);
      appToast('The message opened, but its read status could not be saved.');
      return;
    }

    const readAt = typeof data === 'string' ? data : new Date().toISOString();
    setInboxMessages((current) => current.map((item) => (
      item.id === message.id ? { ...item, read_at: readAt } : item
    )));
    setSelectedInboxMessage((current: any) => (
      current?.id === message.id ? { ...current, read_at: readAt } : current
    ));
  };

  const replyToInboxMessage = (message: any) => {
    const recipient = emailAddressFromSender(message.sender);
    if (!recipient) {
      appToast('No valid reply address was found for this message.');
      return;
    }
    const subject = String(message.subject || '').trim();
    setSelectedInboxMessage(null);
    setCreateType('email');
    setEditingId(null);
    setFormData({
      to: recipient,
      from: emailAccount?.sending_address || '',
      subject: /^re:/i.test(subject) ? subject : `Re: ${subject || '(No subject)'}`,
      html: '',
      in_reply_to_inbound_id: message.id,
      thread_key: message.thread_key || null,
    });
    setError(null);
    setSuccess(null);
    setIsCreating(true);
  };

  const renderTabNavigation = () => (
    <div className="mb-7 flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[.07] bg-black/20 p-1.5 shadow-inner shadow-black/20">
      {[
        { id: 'inbox', label: 'Inbox', icon: Inbox },
        { id: 'broadcasts', label: 'Newsletters', icon: Mail },
        { id: 'emails', label: 'Single Emails', icon: Send },
        { id: 'audience', label: 'Contacts', icon: Users },
        { id: 'templates', label: 'Templates', icon: LayoutTemplate },
        { id: 'settings', label: 'Settings', icon: Settings },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as Tab)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === tab.id
              ? 'bg-white text-black shadow-lg shadow-black/20'
              : 'text-white/40 hover:bg-white/[.04] hover:text-white/75'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderInbox = () => (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Inbox</h3>
          <p className="text-sm text-gray-400">Only mail sent to <span className="font-semibold text-indigo-300">{emailAccount?.sending_address}</span> appears here.</p>
        </div>
        <button onClick={() => openCreateModal('email')} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-600">
          <Send className="h-4 w-4" /> Compose
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#141414]">
        {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div> : inboxMessages.length ? inboxMessages.map(message => (
          <button type="button" onClick={() => openInboxMessage(message)} key={message.id} className="grid w-full gap-3 border-b border-white/5 px-5 py-4 text-left last:border-b-0 hover:bg-white/[.035] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 sm:grid-cols-[minmax(0,.8fr)_minmax(0,1.4fr)_auto] sm:items-center">
            <div className="min-w-0"><p className={`truncate text-sm ${message.read_at ? 'font-medium text-white/55' : 'font-black text-white'}`}>{message.sender}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/25">{message.category || 'general'}{message.has_attachments ? ' · attachment' : ''}</p></div>
            <div className="min-w-0"><p className={`truncate text-sm ${message.read_at ? 'text-white/55' : 'font-bold text-white'}`}>{message.subject || '(No subject)'}</p><p className="mt-1 truncate text-xs text-white/30">{message.text_body || 'Open the message in email operations to view its content.'}</p></div>
            <span className="flex items-center justify-end gap-2 text-xs text-white/25">{openingMessageId === message.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}<time>{new Date(message.received_at).toLocaleString()}</time></span>
          </button>
        )) : <div className="py-16 text-center"><Inbox className="mx-auto h-8 w-8 text-white/15" /><p className="mt-4 text-sm text-white/35">No mail has arrived for {emailAccount?.sending_address} yet.</p></div>}
      </div>
    </div>
  );

  const renderBroadcasts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Newsletters</h3>
          <p className="text-sm text-gray-400">Send an email to a whole group of people at once.</p>
        </div>
        <button onClick={() => openCreateModal('broadcast')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Plus className="w-4 h-4" /> New Newsletter
        </button>
      </div>
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-gray-400">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
            ) : broadcasts.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No newsletters yet. Click "New Newsletter" to start.</td></tr>
            ) : (
              broadcasts.map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white font-medium">{b.name}</td>
                  <td className="px-6 py-4 text-gray-400">{b.subject}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white/5 text-gray-300 border-white/10 capitalize">{b.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {b.status === 'draft' && (
                      <button onClick={() => handleSendBroadcast(b.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Send">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'draft' && (
                      <button onClick={() => openEditModal('broadcast', b)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                        <FileEdit className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete('broadcasts', b.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmails = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Sent Emails</h3>
          <p className="text-sm text-gray-400">View emails that have already been sent, or send a new email to one person.</p>
        </div>
        <button onClick={() => openCreateModal('email')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Send className="w-4 h-4" /> Send Single Email
        </button>
      </div>
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-gray-400">
              <th className="px-6 py-4 font-medium">To</th>
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Sent At</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
            ) : emails.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No emails sent yet.</td></tr>
            ) : (
              emails.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white">{e.to_addresses?.join(', ')}</td>
                  <td className="px-6 py-4 text-gray-400">{e.subject}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white/5 text-gray-300 border-white/10 capitalize">{e.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Contacts</h3>
          <p className="text-sm text-gray-400">Manage the list of people who receive your emails.</p>
        </div>
        <button onClick={() => openCreateModal('contact')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-gray-400">
              <th className="px-6 py-4 font-medium">Email Address</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Unsubscribed</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No contacts added yet.</td></tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white">{c.email}</td>
                  <td className="px-6 py-4 text-gray-400">{c.first_name} {c.last_name}</td>
                  <td className="px-6 py-4 text-gray-400">{c.unsubscribed ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEditModal('contact', c)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                      <FileEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('contacts', c.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Templates</h3>
          <p className="text-sm text-gray-400">Create standard designs that you can use more often.</p>
        </div>
        <button onClick={() => openCreateModal('template')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-500">No templates created yet.</div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal('template', t)} className="text-gray-500 hover:text-indigo-400 transition-colors" title="Edit">
                    <FileEdit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete('templates', t.id)} className="text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h4 className="text-white font-medium mb-1">{t.name}</h4>
              <p className="text-sm text-gray-500">ID: {t.id}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      {/* Domains */}
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[.055] to-white/[.025] shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-white/[.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-indigo-400/15 bg-indigo-400/10 text-indigo-300"><Globe className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-black text-white">Email domains</h3>
                <p className="mt-0.5 text-sm text-white/40">Your Wersee subdomain and domains you own.</p>
              </div>
            </div>
          </div>
          <button onClick={() => openCreateModal('domain')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm font-black text-black transition hover:bg-indigo-100">
            <Plus className="h-4 w-4" /> Add your domain
          </button>
        </div>
        <div className="space-y-4 p-5 sm:p-7">
          {domains.length === 0 ? (
            <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
              <div><CircleDashed className="mx-auto h-7 w-7 animate-spin text-indigo-300" /><p className="mt-3 text-sm font-bold text-white/65">Preparing your Wersee email domain…</p></div>
            </div>
          ) : domains.map(domain => {
            const verified = verifiedDomainStatuses.has(domain.status);
            const busy = domainActionId === domain.id;
            return (
              <article key={domain.id} className="overflow-hidden rounded-2xl border border-white/[.08] bg-black/20">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all font-black text-white">{domain.domain_name}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${domainStatusClasses(domain.status)}`}>
                        {domainStatusLabel(domain.status)}
                      </span>
                      {domain.is_primary && <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-200">Active sender</span>}
                    </div>
                    <p className="mt-2 text-xs text-white/35">
                      {domain.kind === 'wersee_subdomain'
                        ? domain.dns_automation_status === 'configured' ? 'DNS is managed automatically by Wersee.' : 'Wersee is configuring DNS automatically.'
                        : 'Add the DNS records below at your domain provider.'}
                    </p>
                    {domain.last_error && <p className="mt-2 text-xs text-red-300">{domain.last_error}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button disabled={busy} onClick={() => refreshDomain(domain)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-bold text-white/65 transition hover:bg-white/5 hover:text-white disabled:opacity-40">
                      <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    {verified && !domain.is_primary && (
                      <button disabled={busy} onClick={() => refreshDomain(domain, true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-black text-white hover:bg-indigo-400 disabled:opacity-40">
                        <Check className="h-3.5 w-3.5" /> Use for sending
                      </button>
                    )}
                    {domain.kind === 'custom_domain' && !domain.is_primary && (
                      <button disabled={busy} onClick={() => handleDelete('domains', domain.id)} className="rounded-xl border border-red-400/10 p-2 text-white/30 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40" aria-label={`Delete ${domain.domain_name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {domain.kind === 'custom_domain' && !verified && domain.dns_records?.length > 0 && (
                  <div className="border-t border-white/[.07] bg-black/20 p-4 sm:p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[.2em] text-white/30">DNS records</p>
                    <div className="space-y-2">
                      {domain.dns_records.map((record, index) => (
                        <div key={`${record.name}-${record.type}-${index}`} className="grid gap-2 rounded-xl border border-white/[.06] bg-white/[.025] p-3 text-xs sm:grid-cols-[70px_minmax(0,.8fr)_minmax(0,1.3fr)_auto] sm:items-center">
                          <span className="w-fit rounded-md bg-indigo-400/10 px-2 py-1 font-black text-indigo-200">{record.type}</span>
                          <code className="break-all text-white/55">{record.name}</code>
                          <code className="break-all text-white/75">{record.value}</code>
                          <button onClick={() => navigator.clipboard.writeText(record.value).then(() => appToast('DNS value copied.', 'success'))} className="inline-flex items-center gap-1.5 text-white/35 hover:text-white">
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Key className="w-5 h-5" /> Connections (API Keys)</h3>
            <p className="text-sm text-gray-400 mt-1">Manage the keys to connect other programs.</p>
          </div>
          <button onClick={() => openCreateModal('apikey')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">New Key</button>
        </div>
        <div className="space-y-3">
          {apiKeys.length === 0 ? <p className="text-sm text-gray-500">No keys found.</p> : apiKeys.map(k => (
            <div key={k.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-white font-medium">{k.name}</p>
                <p className="text-xs text-gray-500">Created on: {new Date(k.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete('api-keys', k.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Webhook className="w-5 h-5" /> Automatic Notifications (Webhooks)</h3>
            <p className="text-sm text-gray-400 mt-1">Get an automatic signal when an email has arrived or been opened.</p>
          </div>
          <button onClick={() => openCreateModal('webhook')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Add Notification</button>
        </div>
        <div className="space-y-3">
          {webhooks.length === 0 ? <p className="text-sm text-gray-500">No notifications found.</p> : webhooks.map(w => (
            <div key={w.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-white font-medium">{w.endpoint_url}</p>
                <p className="text-xs text-gray-500">When: {w.events?.join(', ')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => openEditModal('webhook', w)} className="text-gray-500 hover:text-indigo-400"><FileEdit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete('webhooks', w.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreateModal = () => {
    if (!isCreating) return null;

    const getModalTitle = () => {
      const typeNames: Record<string, string> = {
        'broadcast': 'Newsletter',
        'email': 'Single Email',
        'contact': 'Contact',
        'template': 'Template',
        'domain': 'Domain',
        'apikey': 'API Key',
        'webhook': 'Notification (Webhook)'
      };
      const name = typeNames[createType] || createType;
      return editingId ? `Edit ${name}` : `New ${name}`;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#141414] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button 
            onClick={() => setIsCreating(false)}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-6">
            {getModalTitle()}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {createType === 'broadcast' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Newsletter Name</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: Spring Update 2026" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> A name for yourself, so you know which one this is.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Group ID (Audience ID)</label>
                  <input required value={formData.audience_id || ''} onChange={e => setFormData({...formData, audience_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: aud_123456789" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The ID of the group of people you want to send this to. You can find this in the Contacts tab.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Sender Email Address</label>
                  <input readOnly required value={formData.from || emailAccount?.sending_address || ''} className="w-full cursor-not-allowed bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/70" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> This verified sender is managed by Wersee.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Subject</label>
                  <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Check out our new features!" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> This is what people see in their inbox.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Content (Text / HTML)</label>
                  <textarea required value={formData.html || ''} onChange={e => setFormData({...formData, html: e.target.value})} rows={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 font-mono text-sm" placeholder="<h1>Hello everyone!</h1><p>This is a test.</p>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The content of your email. You can use HTML tags like &lt;b&gt;bold&lt;/b&gt; or &lt;h1&gt;heading&lt;/h1&gt;.</p>
                </div>
              </>
            )}

            {createType === 'email' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Recipient(s)</label>
                  <input required value={formData.to || ''} onChange={e => setFormData({...formData, to: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="john@example.com, sarah@example.com" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> Who are you sending this to? You can type multiple emails separated by a comma.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Sender Email Address</label>
                  <input readOnly required value={formData.from || emailAccount?.sending_address || ''} className="w-full cursor-not-allowed bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/70" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> This verified sender is managed by Wersee.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Subject</label>
                  <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Your purchase was successful!" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> This is what people see in their inbox.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Content (Text / HTML)</label>
                  <textarea required value={formData.html || ''} onChange={e => setFormData({...formData, html: e.target.value})} rows={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 font-mono text-sm" placeholder="<p>Thank you for your order!</p>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The content of your email. You can use HTML tags like &lt;b&gt;bold&lt;/b&gt; or &lt;h1&gt;heading&lt;/h1&gt;.</p>
                </div>
              </>
            )}

            {createType === 'contact' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Group ID (Audience ID)</label>
                  <input required value={formData.audience_id || ''} onChange={e => setFormData({...formData, audience_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: aud_123456789" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The ID of the group this person should be added to.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Address</label>
                  <input type="email" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="customer@example.com" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The email address of the person you want to add.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">First Name (Optional)</label>
                    <input value={formData.first_name || ''} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Last Name (Optional)</label>
                    <input value={formData.last_name || ''} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Doe" />
                  </div>
                </div>
                {editingId && (
                  <div className="flex items-center gap-3 pt-2">
                    <input type="checkbox" id="unsubscribed" checked={formData.unsubscribed || false} onChange={e => setFormData({...formData, unsubscribed: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500/50" />
                    <label htmlFor="unsubscribed" className="text-sm font-medium text-gray-300">Unsubscribed</label>
                  </div>
                )}
              </>
            )}

            {createType === 'template' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Template Name</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: Welcome Email" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> A name for yourself, so you know which template this is.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Content (Text / HTML)</label>
                  <textarea required value={formData.html || ''} onChange={e => setFormData({...formData, html: e.target.value})} rows={8} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 font-mono text-sm" placeholder="<h1>Welcome {{first_name}}!</h1>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> Create your design. You can use codes like {'{{first_name}}'} to automatically insert the person's first name.</p>
                </div>
              </>
            )}

            {createType === 'domain' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/[.06] p-4">
                  <div className="flex gap-3">
                    <Globe className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
                    <div>
                      <p className="text-sm font-bold text-white">Use a domain you own</p>
                      <p className="mt-1 text-xs leading-5 text-white/45">A subdomain works too, for example <span className="font-semibold text-white/70">mail.yourcompany.com</span>. After creating it, Wersee shows the exact DNS records needed by Resend.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Domain or subdomain</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input required value={formData.domain || ''} onChange={e => setFormData({...formData, domain: e.target.value.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/[^a-z0-9.-]/g, '')})} className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-white outline-none transition focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10" placeholder="mail.yourcompany.com" />
                  </div>
                  <p className="flex items-center gap-1 text-xs text-gray-500"><Info className="h-3 w-3"/> Do not enter a website URL or page path.</p>
                </div>
              </div>
            )}

            {createType === 'apikey' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Key Name</label>
                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: Key for webshop" />
                <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> A handy name so you know what this key is used for.</p>
              </div>
            )}

            {createType === 'webhook' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Website Link (URL)</label>
                  <input required type="url" value={formData.endpoint_url || ''} onChange={e => setFormData({...formData, endpoint_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="https://yourwebsite.com/notifications" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The link where the automatic notifications should be sent to.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Which Notifications?</label>
                  <input value={formData.events || ''} onChange={e => setFormData({...formData, events: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="email.sent, email.delivered" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> For example: type "email.sent" to get a notification when an email is sent, or "email.delivered" when it arrives.</p>
                </div>
              </>
            )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors">Cancel</button>
              <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                {editingId ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  if (accountLoading) {
    return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;
  }

  if (!emailAccount) {
    return (
      <div className="relative min-h-[78vh] overflow-hidden rounded-[2rem] border border-white/10 bg-[#09090b] p-5 sm:p-10">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-[90px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
        <div className="relative mx-auto flex min-h-[65vh] max-w-4xl items-center">
          <AnimatePresence mode="wait">
            {setupStep === 0 ? (
              <motion.div key="intro" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-indigo-200">
                  <Sparkles className="h-4 w-4" /> Wersee Mail
                </div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">Your own mailbox, woven into your workspace.</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">Send from a verified Wersee address, receive replies in one inbox and let the queue handle delivery without blocking your workspace.</p>
                <div className="mt-9 grid gap-3 sm:grid-cols-3">
                  {[
                    [Inbox, 'Send & receive', 'One inbox for incoming mail and queued delivery.'],
                    [ShieldCheck, 'Verified sender', 'No API key or secret is exposed in your browser.'],
                    [AtSign, 'Your identity', 'Choose a memorable name for your workspace mail.']
                  ].map(([Icon, title, copy]: any) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                      <Icon className="h-5 w-5 text-indigo-300" />
                      <p className="mt-4 font-black text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/40">{copy}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSetupStep(1)} className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-black text-black transition hover:bg-indigo-100">
                  Create my mailbox <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="details" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="w-full max-w-3xl">
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.22em] text-indigo-300">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-400/10 text-[11px]">2</span>
                  Final step
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">Create an address that feels like yours.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">Choose a mailbox name and a unique Wersee subdomain. Wersee configures its mail DNS automatically.</p>
                <div className="mt-8 space-y-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[.06] to-white/[.025] p-5 shadow-2xl shadow-black/30 sm:p-8">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[.16em] text-white/40">Sender name</label>
                    <input value={setupDisplayName} onChange={event => setSetupDisplayName(event.target.value)} maxLength={80} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10" placeholder="Your name or brand" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[.16em] text-white/40">Mailbox</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                        <input value={setupLocalPart} onChange={event => setSetupLocalPart(event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))} minLength={2} maxLength={30} className="w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-white/20 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10" placeholder="hello" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[.16em] text-white/40">Email subdomain</label>
                      <div className="flex min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition focus-within:border-indigo-400/60 focus-within:ring-4 focus-within:ring-indigo-500/10">
                        <input value={setupWorkspace} onChange={event => setSetupWorkspace(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} minLength={2} maxLength={30} className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-white outline-none placeholder:text-white/20" placeholder="studio" />
                        <span className="flex items-center border-l border-white/[.07] bg-white/[.025] px-3 text-xs font-bold text-white/25">.wersee.com</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-indigo-400/[.075] p-5">
                    <div className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-fuchsia-400/15 blur-3xl" />
                    <div className="relative flex items-start gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><AtSign className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[.18em] text-indigo-100/45">Your new address</p>
                        <p className="mt-1 break-all text-lg font-black tracking-tight text-white sm:text-xl">{setupLocalPart || 'hello'}@{setupWorkspace || 'studio'}.wersee.com</p>
                        <p className="mt-2 flex items-center gap-2 text-xs leading-5 text-white/40"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> DNS, sending and incoming replies are configured securely after activation.</p>
                      </div>
                    </div>
                  </div>
                  {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</div>}
                  <button onClick={completeEmailSetup} disabled={setupSaving || setupLocalPart.length < 2 || setupWorkspace.length < 2} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 font-black text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">
                    {setupSaving || managedDomainLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <AtSign className="h-5 w-5" />} Create secure mailbox
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-4 pb-28 sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[.08] bg-gradient-to-br from-indigo-500/[.12] via-white/[.035] to-fuchsia-500/[.08] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-[80px]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" /> Wersee Mail
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Your email workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Send, receive, build audiences and manage trusted sender domains in one place.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">Active sender</p>
            <p className="mt-1 break-all text-sm font-black text-indigo-200">{emailAccount.sending_address}</p>
          </div>
        </div>
      </div>

      {renderTabNavigation()}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'inbox' && renderInbox()}
          {activeTab === 'broadcasts' && renderBroadcasts()}
          {activeTab === 'emails' && renderEmails()}
          {activeTab === 'audience' && renderAudience()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'settings' && renderSettings()}
        </motion.div>
      </AnimatePresence>

      {renderCreateModal()}

      <AnimatePresence>
        {selectedInboxMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={selectedInboxMessage.subject || 'Email message'}
            onClick={() => setSelectedInboxMessage(null)}
          >
            <motion.article
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] shadow-2xl"
            >
              <header className="flex items-start justify-between gap-5 border-b border-white/10 px-6 py-5 sm:px-8">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-indigo-300">{selectedInboxMessage.sender}</p>
                  <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{selectedInboxMessage.subject || '(No subject)'}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/35">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(selectedInboxMessage.received_at).toLocaleString()}</span>
                    {selectedInboxMessage.has_attachments && <span className="inline-flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />Attachment included</span>}
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedInboxMessage(null)} className="rounded-full bg-white/5 p-2.5 text-white/45 hover:bg-white/10 hover:text-white" aria-label="Close message">
                  <X className="h-5 w-5" />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-7 sm:px-8">
                <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-white/75">{readableEmailBody(selectedInboxMessage)}</p>
              </div>
              <footer className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-4 sm:px-8">
                <p className="truncate text-xs text-white/30">To {selectedInboxMessage.recipients?.join(', ')}</p>
                <button type="button" onClick={() => replyToInboxMessage(selectedInboxMessage)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-600">
                  <Reply className="h-4 w-4" /> Reply
                </button>
              </footer>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
