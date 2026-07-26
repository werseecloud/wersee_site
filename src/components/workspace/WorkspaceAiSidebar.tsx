import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  ChevronLeft,
  Clock3,
  History,
  Loader2,
  MessageSquarePlus,
  PanelRightClose,
  Redo2,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  Square,
  Trash2,
  Undo2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { asWerseeAiError, werseeAi, WerseeAiError } from '../../ai/client';
import { useWerseeAiContext } from '../../ai/context';
import type {
  AiAction,
  AiActionResult,
  AiConversation,
  AiMessage,
  AiPageContext,
  AiPermissions,
} from '../../ai/types';

interface WorkspaceAiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  context?: AiPageContext;
  isAgentMode: boolean;
  setIsAgentMode: (value: boolean) => void;
  onNavigate?: (view: string) => void;
}

interface UiMessage extends Partial<AiMessage> {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const DEFAULT_SCOPES = [
  'read_business',
  'read_products',
  'read_analytics',
  'read_communities',
  'read_automations',
  'read_storage',
  'read_team',
  'read_payments',
  'read_invoices',
  'create_product_drafts',
  'navigate_workspace',
  'read_proposals',
  'read_contracts',
  'read_crm',
  'read_calls',
  'read_forms',
  'read_email',
  'read_websites',
  'read_wiki',
  'read_jobs',
  'read_orders',
  'read_ads',
  'read_affiliates',
];

const scopeLabels: Record<string, string> = {
  read_business: 'Read business profile',
  read_products: 'Read your products',
  read_analytics: 'Read sales analytics',
  read_communities: 'Read communities',
  read_automations: 'Read automations',
  read_storage: 'Read storage metadata',
  read_team: 'Read team roster',
  read_payments: 'Read payment links',
  read_invoices: 'Read invoices',
  create_product_drafts: 'Create product drafts',
  edit_products: 'Edit products',
  publish_products: 'Publish products',
  archive_products: 'Archive products (always confirm)',
  delete_data: 'Delete products (always confirm)',
  create_automations: 'Create automation drafts',
  create_payment_links: 'Create payment links',
  navigate_workspace: 'Open workspace screens',
  read_proposals: 'Read proposals',
  create_proposal_drafts: 'Create proposal drafts',
  read_contracts: 'Read contracts',
  create_contract_drafts: 'Create contract drafts',
  read_crm: 'Read CRM leads',
  read_calls: 'Read call bookings',
  read_forms: 'Read forms',
  create_form_drafts: 'Create form drafts',
  read_email: 'Read email campaigns',
  create_email_drafts: 'Create email drafts',
  read_websites: 'Read websites',
  read_wiki: 'Read team wiki',
  read_jobs: 'Read job applications',
  create_call_drafts: 'Create call setup drafts',
  create_website_drafts: 'Create website drafts',
  edit_wiki: 'Create team wiki articles',
  edit_job_flows: 'Edit job application flows',
  create_business_drafts: 'Create business drafts',
  edit_business: 'Edit public business copy',
  create_community_drafts: 'Create community drafts',
  edit_communities: 'Edit owned communities',
  read_orders: 'Read seller orders',
  update_orders: 'Update shipping status',
  read_ads: 'Read ad campaigns',
  create_ad_drafts: 'Create inactive ad drafts',
  read_affiliates: 'Read affiliate performance',
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'Empty';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const ResultChart: React.FC<{ result: AiActionResult }> = ({ result }) => {
  const chart = result.chart;
  if (!chart?.data?.length) return null;
  const colors = ['#8b5cf6', '#22d3ee', '#34d399', '#fbbf24', '#fb7185'];
  return (
    <div className="mt-3 h-52 rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-xs font-semibold text-white">{chart.title}</p>
      <ResponsiveContainer width="100%" height="88%">
        {chart.type === 'pie' ? (
          <PieChart>
            <Pie data={chart.data} dataKey={chart.yKey} nameKey={chart.xKey} innerRadius={35} outerRadius={65}>
              {chart.data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : chart.type === 'bar' ? (
          <BarChart data={chart.data}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={chart.xKey} stroke="#71717a" fontSize={10} />
            <YAxis stroke="#71717a" fontSize={10} />
            <Tooltip contentStyle={{ background: '#09090b', borderColor: '#27272a', borderRadius: 12 }} />
            <Bar dataKey={chart.yKey} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={chart.data}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={chart.xKey} stroke="#71717a" fontSize={10} />
            <YAxis stroke="#71717a" fontSize={10} />
            <Tooltip contentStyle={{ background: '#09090b', borderColor: '#27272a', borderRadius: 12 }} />
            <Line type="monotone" dataKey={chart.yKey} stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const ActionCard: React.FC<{
  action: AiAction;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  onOpen: (route: string) => void;
}> = ({ action, busy, onApprove, onReject, onUndo, onOpen }) => {
  const preview = action.preview;
  const waiting = action.status === 'waiting_for_approval' || action.status === 'proposed';
  const completed = action.status === 'completed';
  const failed = action.status === 'failed' || action.status === 'rejected';
  return (
    <div className={`mt-3 overflow-hidden rounded-2xl border ${waiting ? 'border-amber-400/35 bg-amber-400/[0.06]' : completed ? 'border-emerald-400/25 bg-emerald-400/[0.05]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="flex items-start gap-3 p-3.5">
        <div className={`mt-0.5 rounded-xl p-2 ${waiting ? 'bg-amber-400/15 text-amber-300' : completed ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-zinc-300'}`}>
          {waiting ? <ShieldAlert className="h-4 w-4" /> : completed ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white">{action.title || preview?.title || action.toolName}</p>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">{action.riskLevel}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{preview?.summary || action.result?.summary || (failed ? 'This action was not applied.' : 'Review the proposed action.')}</p>
        </div>
      </div>

      {preview?.changes?.length ? (
        <div className="border-t border-white/8 px-3.5 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Proposed changes</p>
          <div className="space-y-2">
            {preview.changes.slice(0, 8).map((change, index) => (
              <div key={`${change.field}-${index}`} className="grid grid-cols-[90px_1fr] gap-2 text-xs">
                <span className="text-zinc-500">{change.field}</span>
                <div className="min-w-0 text-zinc-300">
                  <span className="line-through opacity-50">{formatValue(change.before)}</span>
                  <span className="mx-1.5 text-zinc-600">→</span>
                  <span>{formatValue(change.after)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {preview?.financial ? (
        <div className="border-t border-white/8 px-3.5 py-2.5 text-xs text-zinc-300">
          Financial value: <strong className="text-white">{new Intl.NumberFormat(undefined, { style: 'currency', currency: preview.financial.currency }).format(preview.financial.amount)}</strong>
        </div>
      ) : null}

      {action.result ? <div className="border-t border-white/8 px-3.5 pb-3"><ResultChart result={action.result} /></div> : null}

      <div className="flex items-center gap-2 border-t border-white/8 p-3">
        {waiting ? (
          <>
            <button disabled={busy} onClick={onApprove} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
            </button>
            <button disabled={busy} onClick={onReject} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-50">Reject</button>
          </>
        ) : completed ? (
          <>
            {action.reversible !== false && <button disabled={busy} onClick={onUndo} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-50"><Undo2 className="h-3.5 w-3.5" /> Undo</button>}
            {action.result?.resource?.route && <button onClick={() => onOpen(action.result!.resource!.route!)} className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-400/10">Open <ArrowRight className="h-3.5 w-3.5" /></button>}
          </>
        ) : <span className="text-xs text-zinc-500">No changes were applied.</span>}
      </div>
    </div>
  );
};

export const WorkspaceAiSidebar: React.FC<WorkspaceAiSidebarProps> = ({
  isOpen,
  onClose,
  context: propContext = {},
  isAgentMode,
  setIsAgentMode,
  onNavigate,
}) => {
  const { context: registeredContext } = useWerseeAiContext();
  const mergedContext = useMemo(() => ({ ...registeredContext, ...propContext }), [registeredContext, propContext]);
  const [excludedContextKeys, setExcludedContextKeys] = useState<string[]>([]);
  const context = useMemo(() => Object.fromEntries(Object.entries(mergedContext).filter(([key]) => !excludedContextKeys.includes(key))) as AiPageContext, [excludedContextKeys, mergedContext]);
  const businessId = typeof context.businessId === 'string' ? context.businessId : undefined;
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [actions, setActions] = useState<Record<string, AiAction>>({});
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState<string>();
  const [stepLabel, setStepLabel] = useState('');
  const [error, setError] = useState<WerseeAiError | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissions, setPermissions] = useState<AiPermissions>({ agent_enabled: false, memory_enabled: true, scopes: [] });
  const [allowedScopes, setAllowedScopes] = useState<string[]>(DEFAULT_SCOPES);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [instructionDraft, setInstructionDraft] = useState({ label: '', instruction: '' });
  const [actionBusy, setActionBusy] = useState<string>();
  const abortRef = useRef<AbortController | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshConversations = useCallback(async () => {
    const data = await werseeAi.listConversations(businessId);
    setConversations(data.conversations as AiConversation[]);
  }, [businessId]);

  const refreshPermissions = useCallback(async () => {
    const data = await werseeAi.getPermissions(businessId);
    setPermissions(data.permissions as AiPermissions);
    setAllowedScopes(data.allowedScopes);
    if (!data.permissions.agent_enabled) setIsAgentMode(false);
  }, [businessId, setIsAgentMode]);

  const openActivity = async () => {
    setShowActivity(true);
    try {
      const data = await werseeAi.getActivity(businessId);
      setActivity(data.activity || []);
    } catch (reason) {
      setError(reason as WerseeAiError);
    }
  };

  const openPermissions = async () => {
    setShowPermissions(true);
    try {
      const data = await werseeAi.listInstructions(businessId);
      setInstructions(data.instructions || []);
    } catch (reason) {
      setError(reason as WerseeAiError);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([refreshConversations(), refreshPermissions()]).catch((reason) => setError(reason as WerseeAiError));
    window.setTimeout(() => textareaRef.current?.focus(), 180);
  }, [isOpen, refreshConversations, refreshPermissions]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, actions, isRunning]);

  const loadConversation = async (id: string) => {
    setError(null);
    try {
      const data = await werseeAi.getConversation(id);
      setConversationId(id);
      setMessages((data.messages || []).map((message: AiMessage) => ({
        ...message,
        id: message.id,
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content || '',
        created_at: message.created_at,
      })));
      setActions(Object.fromEntries((data.actions || []).map((item: any) => [item.id, {
        id: item.id,
        toolName: item.tool_name,
        category: item.category,
        riskLevel: item.risk_level,
        status: item.status,
        preview: item.preview,
        result: item.sanitized_result,
        reversible: item.reversible,
      }])));
      setShowHistory(false);
    } catch (reason) {
      setError(asWerseeAiError(reason, 'The conversation could not be loaded.'));
    }
  };

  const newConversation = () => {
    setConversationId(undefined);
    setMessages([]);
    setActions({});
    setError(null);
    setExcludedContextKeys([]);
    setShowHistory(false);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const deleteConversation = async (id: string) => {
    if (!window.confirm('Delete this Wersee AI conversation and its stored messages?')) return;
    try {
      await werseeAi.archiveConversation(id);
      if (conversationId === id) newConversation();
      setConversations((current) => current.filter((conversation) => conversation.id !== id));
    } catch (reason) {
      setError(asWerseeAiError(reason, 'The conversation could not be deleted.'));
    }
  };

  const sendPrompt = async (override?: string) => {
    const value = (override ?? prompt).trim();
    if (!value || isRunning) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPrompt('');
    setLastPrompt(value);
    setError(null);
    setIsRunning(true);
    setStepLabel('Understanding your request');
    const optimisticId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    setMessages((current) => [...current, { id: optimisticId, role: 'user', content: value, created_at: new Date().toISOString() }, { id: assistantId, role: 'assistant', content: '', created_at: new Date().toISOString() }]);
    try {
      for await (const event of werseeAi.chat({
        conversationId,
        message: value,
        mode: isAgentMode ? 'agent' : 'assistant',
        context,
        signal: controller.signal,
      })) {
        if (event.type === 'run.started') {
          setRunId(event.runId);
          setConversationId(event.conversationId);
        } else if (event.type === 'step.started') {
          setStepLabel(event.label);
        } else if (event.type === 'message.delta') {
          setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: item.content + event.text } : item));
        } else if (event.type === 'action.proposed') {
          setActions((current) => ({ ...current, [event.action.id]: event.action }));
        } else if (event.type === 'action.started') {
          setActions((current) => current[event.actionId] ? ({ ...current, [event.actionId]: { ...current[event.actionId], status: 'running' } }) : current);
        } else if (event.type === 'action.completed') {
          setActions((current) => ({ ...current, [event.actionId]: { ...(current[event.actionId] || { id: event.actionId, toolName: 'Wersee action', riskLevel: 'low' }), status: 'completed', result: event.result, reversible: true } }));
        } else if (event.type === 'action.failed') {
          setActions((current) => current[event.actionId] ? ({ ...current, [event.actionId]: { ...current[event.actionId], status: 'failed' } }) : current);
        } else if (event.type === 'run.failed') {
          throw new WerseeAiError(event.error.message, event.error.code, event.error.retryable);
        }
      }
      setMessages((current) => current.filter((item) => item.id !== assistantId || item.content.trim()));
      await refreshConversations();
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof WerseeAiError ? reason : new WerseeAiError('Wersee AI could not complete the request.', 'AI_REQUEST_FAILED', true));
      setMessages((current) => current.filter((item) => item.id !== assistantId || item.content.trim()));
    } finally {
      setIsRunning(false);
      setStepLabel('');
      abortRef.current = undefined;
    }
  };

  const stopRun = async () => {
    abortRef.current?.abort();
    if (runId) await werseeAi.cancelRun(runId).catch(() => null);
    setIsRunning(false);
    setStepLabel('');
  };

  const mutateAction = async (id: string, operation: 'approve' | 'reject' | 'undo') => {
    setActionBusy(id);
    setError(null);
    try {
      if (operation === 'reject') {
        await werseeAi.rejectAction(id);
        setActions((current) => ({ ...current, [id]: { ...current[id], status: 'rejected' } }));
      } else {
        const response = operation === 'approve' ? await werseeAi.approveAction(id) : await werseeAi.undoAction(id);
        setActions((current) => ({ ...current, [id]: { ...current[id], status: operation === 'undo' ? 'undone' : 'completed', result: response.result } }));
      }
    } catch (reason) {
      setError(reason instanceof WerseeAiError ? reason : new WerseeAiError('The action could not be completed.'));
    } finally {
      setActionBusy(undefined);
    }
  };

  const updatePermissionScope = (scope: string) => {
    setPermissions((current) => ({ ...current, scopes: current.scopes.includes(scope) ? current.scopes.filter((item) => item !== scope) : [...current.scopes, scope] }));
  };

  const savePermissions = async () => {
    setError(null);
    try {
      const response = await werseeAi.updatePermissions({ businessId, agentEnabled: permissions.agent_enabled, memoryEnabled: permissions.memory_enabled, scopes: permissions.scopes });
      setPermissions(response.permissions as AiPermissions);
      setShowPermissions(false);
      if (!response.permissions.agent_enabled) setIsAgentMode(false);
    } catch (reason) {
      setError(asWerseeAiError(reason, 'AI permissions could not be saved.'));
    }
  };

  const selectAgentMode = () => {
    if (!permissions.agent_enabled) {
      void openPermissions();
      return;
    }
    setIsAgentMode(true);
  };

  const addInstruction = async () => {
    if (!instructionDraft.label.trim() || !instructionDraft.instruction.trim()) return;
    setError(null);
    try {
      const response = await werseeAi.saveInstruction({ businessId, label: instructionDraft.label, instruction: instructionDraft.instruction, isActive: true });
      setInstructions((current) => [response.instruction, ...current]);
      setInstructionDraft({ label: '', instruction: '' });
    } catch (reason) {
      setError(asWerseeAiError(reason, 'The instruction could not be saved.'));
    }
  };

  const removeInstruction = async (id: string) => {
    setError(null);
    try {
      await werseeAi.deleteInstruction(id);
      setInstructions((current) => current.filter((instruction) => instruction.id !== id));
    } catch (reason) {
      setError(asWerseeAiError(reason, 'The instruction could not be deleted.'));
    }
  };

  const chips = [
    { key: 'page', label: context.page || context.activeView, remove: ['page', 'activeView'] },
    { key: 'businessName', label: context.businessName, remove: ['businessName', 'businessId'] },
    { key: 'entityType', label: context.entityType, remove: ['entityType', 'entityId', 'selection'] },
  ].filter((chip): chip is { key: string; label: string; remove: string[] } => typeof chip.label === 'string' && Boolean(chip.label));
  const orderedActions = Object.values(actions);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button aria-label="Close Wersee AI" className="fixed inset-0 z-[119] cursor-default bg-black/50 backdrop-blur-sm md:bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            aria-label="Wersee AI"
            className="fixed inset-x-0 bottom-0 z-[120] flex h-[min(92dvh,900px)] flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#09090b]/98 text-white shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[460px] md:rounded-none md:border-y-0 md:border-r-0"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <header className="shrink-0 border-b border-white/8 px-4 pb-3 pt-3 md:px-5 md:pt-4">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 md:hidden" />
              <div className="flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20"><Sparkles className="h-5 w-5" /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#09090b] bg-emerald-400" /></div>
                <div className="min-w-0 flex-1"><h2 className="font-semibold tracking-tight">Wersee AI</h2><p className="truncate text-xs text-zinc-500">{businessId ? context.businessName || 'Business workspace' : 'Your Wersee workspace'}</p></div>
                <button onClick={() => setShowHistory((value) => !value)} className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Conversation history"><History className="h-4.5 w-4.5" /></button>
                <button onClick={openActivity} className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="AI activity"><Activity className="h-4.5 w-4.5" /></button>
                <button onClick={openPermissions} className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="AI permissions"><Settings2 className="h-4.5 w-4.5" /></button>
                <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Close Wersee AI"><PanelRightClose className="h-4.5 w-4.5" /></button>
              </div>
              <div className="mt-3 flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
                <button onClick={() => setIsAgentMode(false)} className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${!isAgentMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>Assistant</button>
                <button onClick={selectAgentMode} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${isAgentMode ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white'}`}><Bot className="h-3.5 w-3.5" /> Agent</button>
              </div>
              {chips.length > 0 && <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">{chips.map((chip) => <span key={chip.key} className="flex items-center gap-1 whitespace-nowrap rounded-full border border-violet-400/15 bg-violet-400/[0.07] py-1 pl-2.5 pr-1 text-[10px] text-violet-200">{chip.label}<button type="button" onClick={() => setExcludedContextKeys((current) => [...new Set([...current, ...chip.remove])])} className="rounded-full p-0.5 text-violet-300/60 hover:bg-violet-300/10 hover:text-violet-100" aria-label={`Remove ${chip.label} context`}><X className="h-3 w-3" /></button></span>)}</div>}
              {excludedContextKeys.length > 0 && <button type="button" onClick={() => setExcludedContextKeys([])} className="mt-2 text-[10px] font-medium text-zinc-500 hover:text-violet-300">Restore removed context</button>}
            </header>

            <div className="relative min-h-0 flex-1">
              <div className="h-full overflow-y-auto px-4 py-5 md:px-5">
                {!messages.length && !orderedActions.length ? (
                  <div className="flex min-h-full flex-col justify-center pb-10">
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><Sparkles className="h-6 w-6" /></div>
                    <h3 className="text-xl font-semibold tracking-tight">What should we work on?</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Ask about your products, sales, invoices, communities, automations, storage, team, or workspace. Changes always show a clear preview when confirmation is required.</p>
                    <div className="mt-6 grid gap-2">
                      {['Show my recent sales', 'Check my product listings for missing details', 'Create a draft product from an idea'].map((suggestion) => <button key={suggestion} onClick={() => sendPrompt(suggestion)} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-violet-400/25 hover:bg-violet-400/[0.06] hover:text-white">{suggestion}<ArrowRight className="h-4 w-4 text-zinc-600" /></button>)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'assistant' && <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Sparkles className="h-3.5 w-3.5" /></div>}
                        <div className={message.role === 'user' ? 'max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-2.5 text-sm text-black' : 'min-w-0 max-w-[calc(100%-40px)] flex-1 text-sm leading-6 text-zinc-300'}>
                          {message.role === 'assistant' ? <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-pre:overflow-x-auto"><ReactMarkdown>{message.content}</ReactMarkdown></div> : message.content}
                        </div>
                        {message.role === 'user' && <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/10 text-zinc-300"><User className="h-3.5 w-3.5" /></div>}
                      </div>
                    ))}
                    {orderedActions.map((action) => <ActionCard key={action.id} action={action} busy={actionBusy === action.id} onApprove={() => mutateAction(action.id, 'approve')} onReject={() => mutateAction(action.id, 'reject')} onUndo={() => mutateAction(action.id, 'undo')} onOpen={(route) => onNavigate?.(route)} />)}
                    {isRunning && <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-xs text-zinc-400"><Loader2 className="h-4 w-4 animate-spin text-violet-400" /><span className="flex-1">{stepLabel || 'Working in your workspace'}</span><button onClick={stopRun} className="flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-300 hover:bg-white/5"><Square className="h-3 w-3 fill-current" /> Stop</button></div>}
                    {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3"><div className="flex gap-2 text-sm text-rose-200"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error.message}</span></div>{error.retryable && lastPrompt && <button onClick={() => sendPrompt(lastPrompt)} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-200 hover:text-white"><Redo2 className="h-3.5 w-3.5" /> Try again</button>}</div>}
                    <div ref={endRef} />
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showHistory && <motion.div className="absolute inset-0 z-10 bg-[#09090b] p-4 md:p-5" initial={{ x: '-20%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-20%', opacity: 0 }}><div className="mb-4 flex items-center"><button onClick={() => setShowHistory(false)} className="mr-2 rounded-xl p-2 text-zinc-400 hover:bg-white/5"><ChevronLeft className="h-4 w-4" /></button><div className="flex-1"><h3 className="font-semibold">Conversations</h3><p className="text-xs text-zinc-500">Private to your account</p></div><button onClick={newConversation} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"><MessageSquarePlus className="h-3.5 w-3.5" /> New</button></div><div className="space-y-1 overflow-y-auto">{conversations.map((conversation) => <div key={conversation.id} className={`group flex items-center rounded-2xl transition ${conversation.id === conversationId ? 'bg-violet-500/12 text-white' : 'text-zinc-300 hover:bg-white/5'}`}><button onClick={() => loadConversation(conversation.id)} className="min-w-0 flex-1 p-3 text-left"><p className="truncate text-sm font-medium">{conversation.title}</p><p className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500"><Clock3 className="h-3 w-3" /> {new Date(conversation.updated_at).toLocaleString()}</p></button><button onClick={() => deleteConversation(conversation.id)} className="mr-2 rounded-xl p-2 text-zinc-600 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100" aria-label={`Delete ${conversation.title}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}{!conversations.length && <p className="py-12 text-center text-sm text-zinc-500">No conversations yet.</p>}</div></motion.div>}
              </AnimatePresence>
              <AnimatePresence>
                {showActivity && <motion.div className="absolute inset-0 z-20 overflow-y-auto bg-[#09090b] p-4 md:p-5" initial={{ x: '-20%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-20%', opacity: 0 }}><div className="mb-4 flex items-center"><button onClick={() => setShowActivity(false)} className="mr-2 rounded-xl p-2 text-zinc-400 hover:bg-white/5"><ChevronLeft className="h-4 w-4" /></button><div><h3 className="font-semibold">Activity log</h3><p className="text-xs text-zinc-500">A private audit trail of AI actions</p></div></div><div className="space-y-2">{activity.map((entry) => <div key={entry.id} className="rounded-2xl border border-white/8 bg-white/[0.025] p-3"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium text-zinc-200">{entry.tool_name || entry.event_type}</p><span className={`rounded-full px-2 py-0.5 text-[9px] uppercase ${entry.status === 'completed' ? 'bg-emerald-400/10 text-emerald-300' : entry.status === 'failed' ? 'bg-rose-400/10 text-rose-300' : 'bg-white/5 text-zinc-400'}`}>{entry.status}</span></div><p className="mt-1 text-[10px] text-zinc-500">{entry.event_type} · {new Date(entry.created_at).toLocaleString()}</p></div>)}{!activity.length && <p className="py-12 text-center text-sm text-zinc-500">No AI activity yet.</p>}</div></motion.div>}
              </AnimatePresence>
            </div>

            <footer className="shrink-0 border-t border-white/8 bg-[#09090b] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 md:px-4 md:pb-4">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-2 focus-within:border-violet-400/35 focus-within:ring-2 focus-within:ring-violet-500/10">
                <textarea ref={textareaRef} value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendPrompt(); } }} rows={2} placeholder={isAgentMode ? 'Ask the agent to work in Wersee…' : 'Ask Wersee AI…'} className="max-h-36 min-h-[48px] w-full resize-none bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600" />
                <div className="flex items-center justify-between px-1"><span className="flex items-center gap-1 text-[10px] text-zinc-600"><Activity className="h-3 w-3" /> Context-aware · actions are logged</span><button disabled={!prompt.trim() || isRunning} onClick={() => sendPrompt()} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:bg-white/10 disabled:text-zinc-600"><Send className="h-4 w-4" /></button></div>
              </div>
            </footer>

            <AnimatePresence>
              {showPermissions && <motion.div className="absolute inset-0 z-30 flex flex-col bg-[#09090b]" initial={{ opacity: 0, x: '10%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '10%' }}><div className="flex items-center gap-3 border-b border-white/8 p-4"><button onClick={() => setShowPermissions(false)} className="rounded-xl p-2 text-zinc-400 hover:bg-white/5"><ChevronLeft className="h-4 w-4" /></button><div><h3 className="font-semibold">AI permissions</h3><p className="text-xs text-zinc-500">Granular control for agent mode</p></div></div><div className="flex-1 overflow-y-auto p-4"><label className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 p-4"><div><p className="text-sm font-medium">Enable agent mode</p><p className="mt-1 text-xs leading-5 text-zinc-500">Allows low- and medium-risk actions only within selected scopes. Sensitive or public actions still require confirmation.</p></div><input type="checkbox" checked={permissions.agent_enabled} onChange={(event) => setPermissions((current) => ({ ...current, agent_enabled: event.target.checked }))} className="mt-1 h-4 w-4 accent-violet-500" /></label><label className="mt-3 flex items-start justify-between gap-4 rounded-2xl border border-white/8 p-4"><div><p className="text-sm font-medium">Conversation memory</p><p className="mt-1 text-xs leading-5 text-zinc-500">Use recent conversation history and your saved instructions. You can turn this off at any time.</p></div><input type="checkbox" checked={permissions.memory_enabled} onChange={(event) => setPermissions((current) => ({ ...current, memory_enabled: event.target.checked }))} className="mt-1 h-4 w-4 accent-violet-500" /></label><p className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Saved instructions</p><div className="space-y-2">{instructions.map((instruction) => <div key={instruction.id} className="flex items-start gap-2 rounded-xl border border-white/8 p-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-zinc-200">{instruction.label}</p><p className="mt-1 line-clamp-2 text-xs text-zinc-500">{instruction.instruction}</p></div><button onClick={() => removeInstruction(instruction.id)} className="rounded-lg p-1.5 text-zinc-600 hover:bg-rose-400/10 hover:text-rose-300" aria-label={`Delete ${instruction.label}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}<input value={instructionDraft.label} onChange={(event) => setInstructionDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Instruction name" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-violet-400/40" /><textarea value={instructionDraft.instruction} onChange={(event) => setInstructionDraft((current) => ({ ...current, instruction: event.target.value }))} placeholder="E.g. Prefer concise product copy in English." rows={2} className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-violet-400/40" /><button onClick={addInstruction} disabled={!instructionDraft.label.trim() || !instructionDraft.instruction.trim()} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5 disabled:opacity-40">Add instruction</button></div><p className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Allowed scopes</p><div className="space-y-1">{allowedScopes.map((scope) => <label key={scope} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.035]"><input type="checkbox" checked={permissions.scopes.includes(scope)} onChange={() => updatePermissionScope(scope)} className="h-4 w-4 accent-violet-500" /><span className="text-sm text-zinc-300">{scopeLabels[scope] || scope}</span></label>)}</div><div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100/70"><ShieldAlert className="mr-2 inline h-4 w-4" />Payments, publishing, outbound messages, team changes, secrets, legal changes, deletion, and external side effects always require explicit approval or remain restricted.</div></div><div className="border-t border-white/8 p-4"><button onClick={savePermissions} className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-zinc-200">Save permissions</button></div></motion.div>}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
