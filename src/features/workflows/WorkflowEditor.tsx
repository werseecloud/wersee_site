import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, Bot, Braces, Check, CheckCircle2, ChevronDown, ChevronRight,
  Clock3, Code2, Copy, GitBranch, Globe2, History, Loader2, Mail, MessageSquare,
  Pause, Play, Plus, Save, Settings2, ShieldCheck, Sparkles, TestTube2, Trash2,
  WandSparkles, Workflow as WorkflowIcon, Wrench, X, Zap,
} from 'lucide-react';
import { appToast, destructiveAction } from '@/lib/feedback';
import { WorkflowAdvancedCanvas } from './WorkflowAdvancedCanvas';
import { WorkflowRunsPanel } from './WorkflowRunsPanel';
import { actionOptions, readableNodeType, safeTestPayload, triggerOptions } from './catalog';
import { workflowService, WorkflowServiceError } from './service';
import type {
  WorkflowApproval, WorkflowConnection, WorkflowDefinition, WorkflowNode, WorkflowNodeType,
  WorkflowProposal, WorkflowRecord, WorkflowRun, WorkflowVersion,
} from './types';

interface Props {
  workflow: WorkflowRecord;
  connections: WorkflowConnection[];
  runs: WorkflowRun[];
  approvals: WorkflowApproval[];
  onBack: () => void;
  onConnections: () => void;
  onRefresh: () => Promise<void> | void;
  onUpdated: (workflow: WorkflowRecord) => void;
}

const iconByType: Record<string, React.ComponentType<{ className?: string }>> = {
  trigger: Zap, email: Mail, notification: MessageSquare, ai: Bot, http: Globe2, mcp: Wrench,
  condition: GitBranch, delay: Clock3, approval: ShieldCheck, loop: Braces, transform: Code2, note: MessageSquare,
};

const inputClass = 'min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-violet-400/50';
const textareaClass = 'min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-violet-400/50';

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => <label className="block"><span className="mb-2 block text-xs font-semibold text-white/55">{label}</span>{children}{hint && <span className="mt-2 block text-[11px] leading-5 text-white/30">{hint}</span>}</label>;

const flowOrder = (definition: WorkflowDefinition) => {
  const trigger = definition.nodes.find((node) => node.type === 'trigger');
  if (!trigger) return definition.nodes;
  const ordered: WorkflowNode[] = [];
  const visited = new Set<string>();
  const visit = (node: WorkflowNode) => {
    if (visited.has(node.id)) return;
    visited.add(node.id); ordered.push(node);
    definition.edges.filter((edge) => edge.source === node.id).forEach((edge) => {
      const target = definition.nodes.find((candidate) => candidate.id === edge.target);
      if (target) visit(target);
    });
  };
  visit(trigger);
  definition.nodes.forEach(visit);
  return ordered;
};

const NodeEditor = ({ node, definition, connections, onChange, onDelete, onClose }: {
  node: WorkflowNode;
  definition: WorkflowDefinition;
  connections: WorkflowConnection[];
  onChange: (node: WorkflowNode) => void;
  onDelete: () => void;
  onClose: () => void;
}) => {
  const update = (key: string, value: unknown) => onChange({ ...node, config: { ...node.config, [key]: value } });
  const mcpConnection = connections.find((connection) => connection.id === node.config.connectionId);
  return <div className="fixed inset-0 z-[90] flex items-end bg-black/65 backdrop-blur-sm lg:static lg:inset-auto lg:z-auto lg:block lg:bg-transparent lg:backdrop-blur-0" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#151515] p-5 shadow-2xl lg:max-h-none lg:rounded-3xl lg:p-6"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">{readableNodeType[node.type]}</div><h3 className="mt-1 text-lg font-black text-white">Edit this step</h3></div><button onClick={onClose} aria-label="Close step settings" className="rounded-xl p-2 text-white/35 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-5"><Field label="Readable step name"><input value={node.title} onChange={(event) => onChange({ ...node, title: event.target.value })} className={inputClass} /></Field>
    {node.type === 'trigger' && <><Field label="What starts this workflow?"><select value={definition.trigger.type} onChange={(event) => { const option = triggerOptions.find((item) => item.type === event.target.value)!; onChange({ ...node, title: option.label, config: { event: option.type } }); }} className={inputClass}>{triggerOptions.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}</select></Field>{definition.trigger.type === 'schedule' && <><Field label="Schedule"><select value={String(node.config.cron || '0 9 * * *')} onChange={(event) => update('cron', event.target.value)} className={inputClass}><option value="0 9 * * *">Every day at 09:00</option><option value="0 9 * * 1">Every Monday at 09:00</option><option value="0 9 * * 5">Every Friday at 09:00</option><option value="0 9 1 * *">The first day of every month</option></select></Field><Field label="Time zone"><input value={String(node.config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)} onChange={(event) => update('timezone', event.target.value)} className={inputClass} /></Field></>}</>}
    {node.type === 'email' && <><Field label="Send to" hint="Wersee automatically fills the customer's email from the trigger."><input value={String(node.config.to || '')} onChange={(event) => update('to', event.target.value)} placeholder="Customer email" className={inputClass} /></Field><Field label="Subject"><input value={String(node.config.subject || '')} onChange={(event) => update('subject', event.target.value)} className={inputClass} /></Field><Field label="Message"><textarea value={String(node.config.body || '')} onChange={(event) => update('body', event.target.value)} className={textareaClass} /></Field><Field label="Email connection"><select value={String(node.config.connectionId || '')} onChange={(event) => update('connectionId', event.target.value)} className={inputClass}><option value="">Use workspace default</option>{connections.filter((connection) => connection.provider === 'resend').map((connection) => <option key={connection.id} value={connection.id}>{connection.name} · {connection.status}</option>)}</select></Field></>}
    {node.type === 'notification' && <><Field label="Notification title"><input value={String(node.config.title || '')} onChange={(event) => update('title', event.target.value)} className={inputClass} /></Field><Field label="Message"><textarea value={String(node.config.message || '')} onChange={(event) => update('message', event.target.value)} className={textareaClass} /></Field></>}
    {node.type === 'ai' && <><Field label="What should Wersee AI do?"><textarea value={String(node.config.prompt || '')} onChange={(event) => update('prompt', event.target.value)} placeholder="Summarize the order and write a personal follow-up." className={textareaClass} /></Field><div className="rounded-2xl bg-violet-400/[0.07] p-4 text-xs leading-5 text-violet-100/55">Wersee selects a suitable model and safe response length automatically.</div></>}
    {node.type === 'delay' && <div className="grid grid-cols-2 gap-3"><Field label="Wait"><input type="number" min={0} max={365} value={Number(node.config.amount || 1)} onChange={(event) => update('amount', Number(event.target.value))} className={inputClass} /></Field><Field label="Unit"><select value={String(node.config.unit || 'days')} onChange={(event) => update('unit', event.target.value)} className={inputClass}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></Field></div>}
    {node.type === 'condition' && <><Field label="Check this value"><input value={String(node.config.field || 'trigger.purchase_amount')} onChange={(event) => update('field', event.target.value)} placeholder="Purchase amount" className={inputClass} /></Field><Field label="Rule"><select value={String(node.config.operator || 'greater_than')} onChange={(event) => update('operator', event.target.value)} className={inputClass}><option value="equals">Is equal to</option><option value="not_equals">Is not equal to</option><option value="greater_than">Is greater than</option><option value="less_than">Is less than</option><option value="contains">Contains</option><option value="exists">Is available</option></select></Field><Field label="Value"><input value={String(node.config.value ?? '')} onChange={(event) => update('value', event.target.value)} className={inputClass} /></Field></>}
    {node.type === 'approval' && <Field label="What should the reviewer check?"><textarea value={String(node.config.description || '')} onChange={(event) => update('description', event.target.value)} className={textareaClass} /></Field>}
    {node.type === 'http' && <><Field label="Request method"><select value={String(node.config.method || 'POST')} onChange={(event) => update('method', event.target.value)} className={inputClass}><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></Field><Field label="Secure URL"><input value={String(node.config.url || '')} onChange={(event) => update('url', event.target.value)} placeholder="https://api.example.com/events" className={inputClass} /></Field><Field label="Request body (JSON)"><textarea value={JSON.stringify(node.config.body || {}, null, 2)} onChange={(event) => { try { update('body', JSON.parse(event.target.value)); } catch { /* Keep the last valid value. */ } }} className={`${textareaClass} font-mono text-xs`} /></Field></>}
    {node.type === 'mcp' && <><Field label="Connected tool"><select value={String(node.config.connectionId || '')} onChange={(event) => { update('connectionId', event.target.value); }} className={inputClass}><option value="">Choose a tool connection</option>{connections.filter((connection) => connection.provider === 'mcp').map((connection) => <option key={connection.id} value={connection.id}>{connection.name} · {connection.status}</option>)}</select></Field><Field label="Action"><select value={String(node.config.toolName || '')} onChange={(event) => update('toolName', event.target.value)} className={inputClass}><option value="">Choose an action</option>{mcpConnection?.discovered_tools?.map((tool) => <option key={tool.name} value={tool.name}>{tool.name.replaceAll('_', ' ')}</option>)}</select></Field><Field label="Action input (Advanced)"><textarea value={JSON.stringify(node.config.arguments || {}, null, 2)} onChange={(event) => { try { update('arguments', JSON.parse(event.target.value)); } catch { /* Keep last valid JSON. */ } }} className={`${textareaClass} font-mono text-xs`} /></Field></>}
    {node.type === 'loop' && <><Field label="Items to repeat over"><input value={String(node.config.itemsPath || 'trigger.items')} onChange={(event) => update('itemsPath', event.target.value)} className={inputClass} /></Field><Field label="Maximum items"><input type="number" min={1} max={100} value={Number(node.config.maxItems || 25)} onChange={(event) => update('maxItems', Number(event.target.value))} className={inputClass} /></Field></>}
    {node.type === 'transform' && <Field label="Prepared fields (JSON)"><textarea value={JSON.stringify(node.config.fields || {}, null, 2)} onChange={(event) => { try { update('fields', JSON.parse(event.target.value)); } catch { /* Keep last valid JSON. */ } }} className={`${textareaClass} font-mono text-xs`} /></Field>}
  </div>{node.type !== 'trigger' && <button onClick={onDelete} className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /> Remove this step</button>}</aside></div>;
};

export const WorkflowEditor: React.FC<Props> = ({ workflow, connections, runs, approvals, onBack, onConnections, onRefresh, onUpdated }) => {
  const [definition, setDefinition] = useState<WorkflowDefinition>(workflow.draft_definition);
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || workflow.draft_definition.summary);
  const [editorMode, setEditorMode] = useState<'simple' | 'advanced'>('simple');
  const [tab, setTab] = useState<'build' | 'runs' | 'settings'>('build');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addingStep, setAddingStep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(workflow.updated_at);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantProposal, setAssistantProposal] = useState<WorkflowProposal | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [webhookReveal, setWebhookReveal] = useState<{ token: string; url: string } | null>(null);
  const undoStack = useRef<WorkflowDefinition[]>([]);
  const redoStack = useRef<WorkflowDefinition[]>([]);
  const [, setHistoryVersion] = useState(0);
  const lastSaved = useRef(JSON.stringify({ name: workflow.name, description: workflow.description, definition: workflow.draft_definition }));
  const skipAutosave = useRef(true);

  useEffect(() => {
    setDefinition(workflow.draft_definition); setName(workflow.name); setDescription(workflow.description || workflow.draft_definition.summary);
    lastSaved.current = JSON.stringify({ name: workflow.name, description: workflow.description, definition: workflow.draft_definition });
    skipAutosave.current = true; undoStack.current = []; redoStack.current = []; setHistoryVersion((value) => value + 1);
  }, [workflow.id]);

  const changeDefinition = (next: WorkflowDefinition, recordHistory = true) => {
    if (JSON.stringify(next) === JSON.stringify(definition)) return;
    if (recordHistory) { undoStack.current = [...undoStack.current.slice(-49), definition]; redoStack.current = []; }
    setDefinition(next); setHistoryVersion((value) => value + 1); setError(null);
  };

  const undo = () => { const previous = undoStack.current.pop(); if (!previous) return; redoStack.current.push(definition); setDefinition(previous); setHistoryVersion((value) => value + 1); };
  const redo = () => { const next = redoStack.current.pop(); if (!next) return; undoStack.current.push(definition); setDefinition(next); setHistoryVersion((value) => value + 1); };

  const save = async (snapshot = false) => {
    const serialized = JSON.stringify({ name, description, definition });
    if (!snapshot && serialized === lastSaved.current) return workflow;
    setSaving(true);
    try {
      const result = await workflowService.save({ workflowId: workflow.id, name, description, definition, snapshot, changeSummary: snapshot ? 'Manual version snapshot' : 'Autosaved draft' });
      lastSaved.current = serialized; setSavedAt(result.savedAt); onUpdated(result.workflow); return result.workflow;
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Wersee could not save this workflow.'); throw requestError; }
    finally { setSaving(false); }
  };

  useEffect(() => {
    if (skipAutosave.current) { skipAutosave.current = false; return; }
    const serialized = JSON.stringify({ name, description, definition });
    if (serialized === lastSaved.current) return;
    const timer = window.setTimeout(() => { void save(false).catch(() => undefined); }, 1100);
    return () => window.clearTimeout(timer);
  }, [name, description, definition]);

  useEffect(() => {
    if (tab !== 'settings') return;
    workflowService.listVersions(workflow.id).then(setVersions).catch(() => setVersions([]));
  }, [tab, workflow.id, savedAt]);

  const selectedNode = definition.nodes.find((node) => node.id === selectedNodeId) || null;
  const orderedNodes = useMemo(() => flowOrder(definition), [definition]);

  const updateNode = (nextNode: WorkflowNode) => {
    let nextDefinition = { ...definition, nodes: definition.nodes.map((node) => node.id === nextNode.id ? nextNode : node) };
    if (nextNode.type === 'trigger') {
      const triggerType = String(nextNode.config.event || definition.trigger.type) as WorkflowDefinition['trigger']['type'];
      nextDefinition = { ...nextDefinition, trigger: { type: triggerType, label: nextNode.title, config: { ...nextNode.config, event: undefined } } };
    }
    changeDefinition(nextDefinition);
  };

  const removeNode = async (nodeId: string) => {
    const node = definition.nodes.find((item) => item.id === nodeId);
    if (!node || node.type === 'trigger') return;
    if (!await destructiveAction({ title: 'Remove this step?', description: `“${node.title}” will be removed from the draft.`, confirmText: 'Remove step' })) return;
    changeDefinition({ ...definition, nodes: definition.nodes.filter((item) => item.id !== nodeId), edges: definition.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId) });
    setSelectedNodeId(null);
  };

  const addNode = (type: WorkflowNodeType) => {
    const option = actionOptions.find((item) => item.type === type);
    const id = `${type}_${crypto.randomUUID().slice(0, 8)}`;
    const previous = orderedNodes[orderedNodes.length - 1];
    const config: Record<string, unknown> = type === 'email' ? { to: '{{trigger.customer_email}}', subject: 'A message from Wersee', body: 'Hi {{trigger.customer_name}},' }
      : type === 'notification' ? { title: 'Workflow update', message: 'A workflow completed this step.' }
      : type === 'ai' ? { prompt: 'Create a helpful summary from this workflow data: {{trigger}}' }
      : type === 'delay' ? { amount: 1, unit: 'days' }
      : type === 'condition' ? { field: 'trigger.purchase_amount', operator: 'greater_than', value: 50 }
      : type === 'approval' ? { description: 'Review the details before continuing.' }
      : type === 'http' ? { method: 'POST', url: 'https://', body: {} }
      : type === 'mcp' ? { connectionId: '', toolName: '', arguments: {} }
      : type === 'loop' ? { itemsPath: 'trigger.items', maxItems: 25 } : { fields: {} };
    const node: WorkflowNode = { id, type, title: option?.label || readableNodeType[type], config, position: { x: (previous?.position.x || 80) + 320, y: previous?.position.y || 160 } };
    const edge = previous ? { id: `edge_${crypto.randomUUID()}`, source: previous.id, target: id } : null;
    changeDefinition({ ...definition, nodes: [...definition.nodes, node], edges: edge ? [...definition.edges, edge] : definition.edges, estimatedUsage: { emailsPerRun: definition.estimatedUsage.emailsPerRun + (type === 'email' ? 1 : 0), aiActionsPerRun: definition.estimatedUsage.aiActionsPerRun + (type === 'ai' ? 1 : 0) } });
    setAddingStep(false); setSelectedNodeId(id);
  };

  const testWorkflow = async () => {
    setBusy('test'); setError(null);
    try {
      await save(false);
      const result = await workflowService.run(workflow.id, true, safeTestPayload(definition));
      await onRefresh(); setTab('runs');
      if (result.run.status === 'failed') appToast(result.run.error?.message || 'The test found a step that needs attention.', 'error');
      else appToast('Workflow test completed safely.', 'success');
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'The workflow test failed.'); }
    finally { setBusy(null); }
  };

  const publish = async () => {
    setBusy('publish'); setError(null);
    try {
      await save(true);
      const result = await workflowService.publish(workflow.id, definition);
      onUpdated(result.workflow);
      if (result.webhookToken && result.webhookUrl) setWebhookReveal({ token: result.webhookToken, url: result.webhookUrl });
      appToast('Workflow activated.', 'success');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Wersee could not activate this workflow.');
      if (requestError instanceof WorkflowServiceError && requestError.code === 'WORKFLOW_CONNECTIONS_MISSING') appToast('Connect the required account before activating.', 'warning');
    } finally { setBusy(null); }
  };

  const pause = async () => {
    setBusy('pause');
    try { const result = await workflowService.setStatus(workflow.id, 'paused'); onUpdated(result.workflow); appToast('Workflow paused.', 'success'); }
    finally { setBusy(null); }
  };

  const askAssistant = async () => {
    if (assistantPrompt.trim().length < 5) return;
    setBusy('assistant'); setError(null);
    try { const result = await workflowService.propose(assistantPrompt, workflow.business_id || undefined, definition); setAssistantProposal(result.proposal); }
    catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Wersee AI could not prepare that change.';
      setError(message);
      appToast(message, 'error');
    }
    finally { setBusy(null); }
  };

  const restoreVersion = (version: WorkflowVersion) => {
    changeDefinition(version.definition);
    setName(version.definition.name || name);
    setTab('build');
    appToast(`Version ${version.version_number} restored as an editable draft.`, 'success');
  };

  const nodeCard = (node: WorkflowNode, index: number) => { const Icon = iconByType[node.type] || Zap; return <React.Fragment key={node.id}>{index > 0 && <div className="ml-[27px] flex h-8 items-center"><span className="h-full w-px bg-gradient-to-b from-violet-400/60 to-violet-400/10" /><ChevronDown className="-ml-2.5 h-5 w-5 translate-y-2 text-violet-400/50" /></div>}<button onClick={() => setSelectedNodeId(node.id)} className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${selectedNodeId === node.id ? 'border-violet-400/60 bg-violet-400/[0.08]' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]'}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${node.type === 'trigger' ? 'bg-violet-400 text-black' : 'bg-white/5 text-white/55 group-hover:text-white'}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{readableNodeType[node.type]}</span><span className="mt-1 block truncate text-sm font-bold text-white sm:text-base">{node.title}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-white/20 group-hover:text-white/50" /></button></React.Fragment>; };

  return <div className="mx-auto max-w-[1500px] pb-28 md:pb-12">
    <header className="sticky -top-4 z-40 -mx-4 mb-6 border-b border-white/[0.07] bg-[#0A0A0A]/95 px-4 pb-4 pt-1 backdrop-blur-xl md:-top-8 md:-mx-8 md:px-8 md:pt-2"><div className="flex items-center gap-3"><button onClick={onBack} aria-label="Back to workflows" className="rounded-xl p-2.5 text-white/40 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0 flex-1"><input value={name} onChange={(event) => setName(event.target.value)} aria-label="Workflow name" className="w-full truncate bg-transparent text-lg font-black text-white outline-none placeholder:text-white/25 sm:text-xl" /><div className="mt-1 flex items-center gap-2 text-[11px] text-white/30">{saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</> : <><Check className="h-3 w-3 text-emerald-300" /> Saved {savedAt ? new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</>}<span>·</span><span className="capitalize">{workflow.status}</span></div></div><div className="hidden items-center gap-2 sm:flex"><button onClick={() => void testWorkflow()} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-40">{busy === 'test' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />} Test workflow</button>{workflow.status === 'active' ? <button onClick={() => void pause()} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-bold text-black disabled:opacity-40"><Pause className="h-4 w-4" /> Pause</button> : <button onClick={() => void publish()} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black disabled:opacity-40">{busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Activate</button>}</div></div><nav className="mt-4 flex gap-1 overflow-x-auto" aria-label="Workflow sections">{([{ id: 'build', label: 'Build', icon: WorkflowIcon }, { id: 'runs', label: `Runs ${runs.length ? `(${runs.length})` : ''}`, icon: Play }, { id: 'settings', label: 'Settings & versions', icon: Settings2 }] as const).map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${tab === item.id ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white'}`}><item.icon className="h-3.5 w-3.5" /> {item.label}</button>)}</nav></header>

    {error && <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-400/10 bg-red-400/[0.07] p-4 text-sm leading-6 text-red-100/75" role="alert"><span className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" /> {error}</span><button onClick={() => setError(null)} aria-label="Dismiss error" className="text-red-200/40 hover:text-red-200"><X className="h-4 w-4" /></button></div>}

    {tab === 'build' && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><main><div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex rounded-xl bg-black/25 p-1"><button onClick={() => setEditorMode('simple')} className={`min-h-9 rounded-lg px-3 text-xs font-bold ${editorMode === 'simple' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Simple Mode</button><button onClick={() => setEditorMode('advanced')} className={`hidden min-h-9 rounded-lg px-3 text-xs font-bold sm:block ${editorMode === 'advanced' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>Advanced Mode</button></div><div className="flex items-center gap-2"><button onClick={undo} disabled={!undoStack.current.length} className="min-h-9 rounded-lg px-3 text-xs text-white/35 hover:bg-white/5 hover:text-white disabled:opacity-25">Undo</button><button onClick={redo} disabled={!redoStack.current.length} className="min-h-9 rounded-lg px-3 text-xs text-white/35 hover:bg-white/5 hover:text-white disabled:opacity-25">Redo</button><button onClick={() => void save(true)} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white/50 hover:bg-white/5 hover:text-white"><Save className="h-3.5 w-3.5" /> Save version</button></div></div>
      {editorMode === 'simple' ? <div><div className="mx-auto max-w-3xl">{orderedNodes.map(nodeCard)}<button onClick={() => setAddingStep(true)} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm font-semibold text-white/40 hover:border-violet-400/40 hover:bg-violet-400/[0.05] hover:text-violet-200"><Plus className="h-4 w-4" /> Then do this...</button></div></div> : <WorkflowAdvancedCanvas definition={definition} onChange={(next) => changeDefinition(next)} onSelectNode={setSelectedNodeId} onAddNode={() => setAddingStep(true)} onUndo={undo} onRedo={redo} canUndo={undoStack.current.length > 0} canRedo={redoStack.current.length > 0} />}
      <section className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span><div><h2 className="font-bold text-white">What this workflow does</h2><p className="mt-0.5 text-xs text-white/35">A human-readable review before activation</p></div></div><p className="mt-5 text-sm leading-7 text-white/55">This workflow starts when {definition.trigger.label.toLowerCase()}.</p><ol className="mt-3 space-y-2 text-sm text-white/45">{orderedNodes.filter((node) => node.type !== 'trigger' && node.type !== 'note').map((node, index) => <li key={node.id} className="flex gap-3"><span className="text-violet-300">{index + 1}.</span><span>{node.title}</span></li>)}</ol><div className="mt-6 grid gap-5 border-t border-white/[0.07] pt-5 sm:grid-cols-2"><div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Can access</div><div className="mt-2 flex flex-wrap gap-2">{definition.dataAccess.map((item) => <span key={item} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/40">{item}</span>)}</div></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Estimated usage per run</div><p className="mt-2 text-sm text-white/45">{definition.estimatedUsage.emailsPerRun} email(s) · {definition.estimatedUsage.aiActionsPerRun} AI action(s)</p></div></div></section></main>
      <aside className="space-y-4">{selectedNode ? <NodeEditor node={selectedNode} definition={definition} connections={connections} onChange={updateNode} onDelete={() => void removeNode(selectedNode.id)} onClose={() => setSelectedNodeId(null)} /> : <div className="rounded-3xl border border-violet-400/15 bg-[#151515] p-6" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(139,92,246,.12), transparent 48%)' }}><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300"><Sparkles className="h-5 w-5" /></span><div><h2 className="font-bold text-white">Wersee AI assistant</h2><p className="text-xs text-white/35">Changes drafts only</p></div></div><p className="mt-5 text-sm leading-6 text-white/45">Ask for a change in normal language. You will preview it before it is applied.</p><button onClick={() => setAssistantOpen(true)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black"><WandSparkles className="h-4 w-4" /> Ask Wersee AI</button><div className="mt-5 border-t border-white/[0.07] pt-5"><button onClick={onConnections} className="flex w-full items-center justify-between rounded-xl py-2 text-left text-sm text-white/45 hover:text-white"><span className="flex items-center gap-2"><Wrench className="h-4 w-4" /> Connections</span><span>{connections.filter((connection) => connection.status === 'connected').length} ready</span></button></div></div>}</aside></div>}

    {tab === 'runs' && <WorkflowRunsPanel workflowId={workflow.id} runs={runs} approvals={approvals} onRefresh={onRefresh} />}

    {tab === 'settings' && <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6"><h2 className="font-bold text-white">Workflow details</h2><div className="mt-5 space-y-5"><Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></Field><Field label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={textareaClass} /></Field><Field label="Status"><div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"><span className="text-sm capitalize text-white">{workflow.status}</span>{workflow.status === 'active' ? <button onClick={() => void pause()} className="text-xs font-semibold text-amber-300">Pause</button> : <button onClick={() => void publish()} className="text-xs font-semibold text-emerald-300">Activate</button>}</div></Field>{definition.trigger.type === 'webhook' && <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-sm font-semibold text-white">Secure webhook</div><p className="mt-1 text-xs leading-5 text-white/35">Rotate the token if it may have been shared. The old token stops working immediately.</p><button onClick={async () => { const result = await workflowService.rotateWebhook(workflow.id); setWebhookReveal({ token: result.webhookToken, url: result.webhookUrl }); }} className="mt-3 text-xs font-bold text-violet-300">Rotate webhook token</button></div>}</div></section><section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6"><div className="flex items-center gap-3"><History className="h-5 w-5 text-violet-300" /><div><h2 className="font-bold text-white">Version history</h2><p className="text-xs text-white/35">Restore any version as a new draft</p></div></div><div className="mt-5 max-h-[500px] space-y-2 overflow-y-auto">{versions.map((version) => <div key={version.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-xs font-black text-white/55">v{version.version_number}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white">{version.change_summary}</div><div className="mt-1 text-[10px] text-white/30">{new Date(version.created_at).toLocaleString()} {version.published_at ? '· Published' : '· Draft'}</div></div><button onClick={() => restoreVersion(version)} className="rounded-lg px-2 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-400/10">Restore</button></div>)}{!versions.length && <p className="p-8 text-center text-sm text-white/30">No saved versions yet.</p>}</div></section></div>}

    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-white/10 bg-[#101010]/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden"><button onClick={() => void testWorkflow()} disabled={busy !== null} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-bold text-white"><TestTube2 className="h-4 w-4" /> Test</button>{workflow.status === 'active' ? <button onClick={() => void pause()} disabled={busy !== null} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-300 text-sm font-bold text-black"><Pause className="h-4 w-4" /> Pause</button> : <button onClick={() => void publish()} disabled={busy !== null} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black"><Play className="h-4 w-4" /> Activate</button>}</div>

    {addingStep && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#151515] p-5 sm:rounded-[28px] sm:p-7"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-white">Then do this...</h2><p className="mt-1 text-sm text-white/40">Choose one clear next step.</p></div><button onClick={() => setAddingStep(false)} className="rounded-xl p-2 text-white/35 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{[...actionOptions, { type: 'delay' as const, label: 'Wait', description: 'Continue after minutes, hours or days.' }, { type: 'condition' as const, label: 'Only continue if...', description: 'Add a simple rule or branch.' }, { type: 'loop' as const, label: 'Repeat for each item', description: 'Process a safe, limited list.' }, { type: 'transform' as const, label: 'Prepare data', description: 'Create readable values for later steps.' }].map((option) => { const Icon = iconByType[option.type] || Plus; return <button key={option.type} onClick={() => addNode(option.type)} className="flex min-h-24 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left hover:border-violet-400/30 hover:bg-violet-400/[0.05]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50"><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-bold text-white">{option.label}</span><span className="mt-1 block text-xs leading-5 text-white/35">{option.description}</span></span></button>; })}</div></div></div>}

    {assistantOpen && <div className="fixed inset-0 z-[110] flex items-end justify-end bg-black/70 backdrop-blur-sm"><div className="flex h-[88dvh] w-full max-w-lg flex-col rounded-t-[30px] border border-white/10 bg-[#151515] shadow-2xl sm:h-full sm:rounded-none sm:rounded-l-[30px]"><div className="flex items-center justify-between border-b border-white/[0.08] p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300"><Sparkles className="h-5 w-5" /></span><div><h2 className="font-black text-white">Wersee AI assistant</h2><p className="text-xs text-white/35">Preview every draft change</p></div></div><button onClick={() => { setAssistantOpen(false); setAssistantProposal(null); }} className="rounded-xl p-2 text-white/35 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div><div className="flex-1 overflow-y-auto p-5">{assistantProposal ? <div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300"><Check className="h-3.5 w-3.5" /> Proposed change</span><h3 className="mt-5 text-xl font-black text-white">Review before applying</h3><p className="mt-3 text-sm leading-6 text-white/45">{assistantProposal.explanation}</p><div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-xs text-white/35">Current: {definition.nodes.length} steps</div><div className="mt-1 text-sm font-bold text-white">Proposed: {assistantProposal.definition.nodes.length} steps</div><div className="mt-4 space-y-2">{assistantProposal.definition.nodes.map((node) => <div key={node.id} className="flex items-center gap-2 text-xs text-white/50"><ChevronRight className="h-3 w-3 text-violet-300" /> {node.title}</div>)}</div></div>{assistantProposal.risks.length > 0 && <div className="mt-4 rounded-2xl bg-amber-400/[0.07] p-4"><div className="text-xs font-bold text-amber-200">Things to review</div><ul className="mt-2 space-y-1 text-xs leading-5 text-amber-100/55">{assistantProposal.risks.map((risk) => <li key={risk}>• {risk}</li>)}</ul></div>}<div className="mt-6 flex gap-2"><button onClick={() => { changeDefinition(assistantProposal.definition); setAssistantProposal(null); setAssistantOpen(false); appToast('AI change applied to the draft.', 'success'); }} className="min-h-12 flex-1 rounded-xl bg-white text-sm font-bold text-black">Apply to draft</button><button onClick={() => setAssistantProposal(null)} className="min-h-12 rounded-xl px-4 text-sm font-semibold text-white/45 hover:bg-white/5">Discard</button></div></div> : <div><div className="rounded-2xl bg-violet-400/[0.06] p-4 text-sm leading-6 text-violet-100/60">Try “Only run this for orders above €50”, “Add an approval before the email”, or “Make this workflow simpler”.</div><div className="mt-6 space-y-2">{['Add another email after three days.', 'Only run this for orders above €50.', 'Explain and simplify this workflow.', 'Add an approval before the final step.'].map((suggestion) => <button key={suggestion} onClick={() => setAssistantPrompt(suggestion)} className="w-full rounded-xl border border-white/[0.07] p-3 text-left text-xs text-white/45 hover:bg-white/5 hover:text-white">{suggestion}</button>)}</div></div>}</div>{!assistantProposal && <div className="border-t border-white/[0.08] p-4"><textarea value={assistantPrompt} onChange={(event) => setAssistantPrompt(event.target.value)} placeholder="What should change?" className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/50" /><button onClick={() => void askAssistant()} disabled={busy === 'assistant' || assistantPrompt.trim().length < 5} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black disabled:opacity-40">{busy === 'assistant' ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />} Preview change</button></div>}</div></div>}

    {webhookReveal && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#151515] p-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span><div><h2 className="text-xl font-black text-white">Webhook activated</h2><p className="mt-1 text-sm leading-6 text-white/40">Copy this token now. For security, Wersee only shows it once.</p></div></div><div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">POST URL</div><code className="mt-2 block break-all text-xs text-violet-200">{webhookReveal.url}</code><div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-white/30">Request body</div><pre className="mt-2 overflow-x-auto text-xs leading-6 text-white/55">{JSON.stringify({ action: 'webhook', workflowId: workflow.id, token: webhookReveal.token, eventId: 'unique-event-id', payload: {} }, null, 2)}</pre></div><button onClick={async () => { await navigator.clipboard.writeText(JSON.stringify({ url: webhookReveal.url, workflowId: workflow.id, token: webhookReveal.token })); appToast('Webhook details copied.', 'success'); }} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black"><Copy className="h-4 w-4" /> Copy webhook details</button><button onClick={() => setWebhookReveal(null)} className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-white/40 hover:bg-white/5 hover:text-white">I saved it securely</button></div></div>}
  </div>;
};
