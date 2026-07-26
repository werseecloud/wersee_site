import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import type {
  WorkflowApproval,
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowProposal,
  WorkflowRecord,
  WorkflowRun,
  WorkflowRunStep,
  WorkflowTemplate,
  WorkflowVersion,
} from './types';

export class WorkflowServiceError extends Error {
  constructor(
    message: string,
    public readonly code = 'WORKFLOW_REQUEST_FAILED',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'WorkflowServiceError';
  }
}

const definitionSchema: z.ZodType<WorkflowDefinition> = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(2).max(160).optional(),
  summary: z.string().max(2000),
  trigger: z.object({
    type: z.enum(['manual', 'purchase', 'payment_failed', 'message', 'schedule', 'webhook', 'form_submission', 'file_uploaded', 'member_joined']),
    label: z.string().min(1).max(180),
    config: z.record(z.string(), z.unknown()),
  }),
  nodes: z.array(z.object({
    id: z.string().min(1).max(100),
    type: z.enum(['trigger', 'email', 'notification', 'ai', 'http', 'mcp', 'condition', 'delay', 'approval', 'loop', 'transform', 'note']),
    title: z.string().min(1).max(180),
    description: z.string().max(1000).optional(),
    config: z.record(z.string(), z.unknown()),
    position: z.object({ x: z.number(), y: z.number() }),
  })).min(2).max(100),
  edges: z.array(z.object({
    id: z.string().min(1).max(120),
    source: z.string().min(1).max(100),
    target: z.string().min(1).max(100),
    sourceHandle: z.string().max(60).optional(),
    label: z.string().max(120).optional(),
  })).max(200),
  requiredConnections: z.array(z.string()).max(20),
  dataAccess: z.array(z.string()).max(30),
  estimatedUsage: z.object({ emailsPerRun: z.number().int().min(0), aiActionsPerRun: z.number().int().min(0) }),
}).superRefine((definition, context) => {
  const ids = new Set(definition.nodes.map((node) => node.id));
  if (ids.size !== definition.nodes.length) context.addIssue({ code: 'custom', message: 'Every step needs a unique id.' });
  if (definition.nodes.filter((node) => node.type === 'trigger').length !== 1) {
    context.addIssue({ code: 'custom', message: 'A workflow needs exactly one trigger.' });
  }
  definition.edges.forEach((edge) => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) context.addIssue({ code: 'custom', message: 'A workflow connection points to a missing step.' });
  });
});

const parseFunctionError = async (error: any) => {
  let payload: any = null;
  try {
    if (error?.context instanceof Response) payload = await error.context.json();
  } catch { /* The generic message below remains useful. */ }
  const detail = payload?.error;
  return new WorkflowServiceError(
    typeof detail?.message === 'string' ? detail.message : error?.message || 'Wersee could not complete this workflow request.',
    typeof detail?.code === 'string' ? detail.code : 'WORKFLOW_REQUEST_FAILED',
    detail,
  );
};

const invoke = async <T>(action: string, body: Record<string, unknown> = {}) => {
  const { data, error } = await supabase.functions.invoke('workflow-engine', { body: { action, ...body } });
  if (error) throw await parseFunctionError(error);
  if (data?.error) throw new WorkflowServiceError(data.error.message, data.error.code, data.error);
  return data as T;
};

const throwIfError = (error: any) => {
  if (error) throw new WorkflowServiceError(error.message || 'Could not load Workflows.', error.code || 'DATABASE_ERROR', error);
};

export const parseWorkflowImport = (value: string) => {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new WorkflowServiceError('Paste a valid Wersee workflow JSON file.', 'INVALID_WORKFLOW_JSON'); }
  const candidate = parsed && typeof parsed === 'object' && 'definition' in parsed ? (parsed as any).definition : parsed;
  const result = definitionSchema.safeParse(candidate);
  if (!result.success) {
    throw new WorkflowServiceError(result.error.issues[0]?.message || 'This workflow definition is not valid.', 'INVALID_WORKFLOW_DEFINITION', result.error.issues);
  }
  return result.data;
};

export const workflowService = {
  async listWorkflows(businessId?: string) {
    let query = supabase.from('workflows').select('*').neq('status', 'archived').order('updated_at', { ascending: false });
    if (businessId) query = query.eq('business_id', businessId);
    const { data, error } = await query;
    throwIfError(error);
    return (data || []) as WorkflowRecord[];
  },

  async getWorkflow(id: string) {
    const { data, error } = await supabase.from('workflows').select('*').eq('id', id).single();
    throwIfError(error);
    return data as WorkflowRecord;
  },

  async listTemplates() {
    const { data, error } = await supabase.from('workflow_templates').select('*').eq('is_public', true).order('name');
    throwIfError(error);
    return (data || []) as WorkflowTemplate[];
  },

  async listConnections(businessId?: string) {
    let query = supabase.from('workflow_connections').select('*').order('updated_at', { ascending: false });
    if (businessId) query = query.eq('business_id', businessId);
    const { data, error } = await query;
    throwIfError(error);
    return (data || []) as WorkflowConnection[];
  },

  async listRuns(workflowId?: string, limit = 100) {
    let query = supabase.from('workflow_runs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (workflowId) query = query.eq('workflow_id', workflowId);
    const { data, error } = await query;
    throwIfError(error);
    return (data || []) as WorkflowRun[];
  },

  async listRunSteps(runId: string) {
    const { data, error } = await supabase.from('workflow_run_steps').select('*').eq('run_id', runId).order('created_at');
    throwIfError(error);
    return (data || []) as WorkflowRunStep[];
  },

  async listApprovals(workflowId?: string) {
    let query = supabase.from('workflow_approvals').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (workflowId) query = query.eq('workflow_id', workflowId);
    const { data, error } = await query;
    throwIfError(error);
    return (data || []) as WorkflowApproval[];
  },

  async listVersions(workflowId: string) {
    const { data, error } = await supabase.from('workflow_versions').select('*').eq('workflow_id', workflowId).order('version_number', { ascending: false });
    throwIfError(error);
    return (data || []) as WorkflowVersion[];
  },

  propose(prompt: string, businessId?: string, currentDefinition?: WorkflowDefinition) {
    return invoke<{ proposal: WorkflowProposal; mutationPerformed: false }>('propose', { prompt, businessId, currentDefinition });
  },

  create(input: { name?: string; description?: string; businessId?: string; definition: WorkflowDefinition }) {
    return invoke<{ workflow: WorkflowRecord; version: WorkflowVersion }>('create', input as unknown as Record<string, unknown>);
  },

  save(input: { workflowId: string; name: string; description?: string; definition: WorkflowDefinition; snapshot?: boolean; changeSummary?: string }) {
    return invoke<{ workflow: WorkflowRecord; version: WorkflowVersion | null; savedAt: string }>('save', input as unknown as Record<string, unknown>);
  },

  publish(workflowId: string, definition: WorkflowDefinition) {
    return invoke<{ workflow: WorkflowRecord; version: WorkflowVersion; webhookToken: string | null; webhookUrl: string | null }>('publish', { workflowId, definition });
  },

  setStatus(workflowId: string, status: 'active' | 'paused' | 'disabled' | 'archived') {
    return invoke<{ workflow: WorkflowRecord }>('set-status', { workflowId, status });
  },

  duplicate(workflowId: string) {
    return invoke<{ workflow: WorkflowRecord; version: WorkflowVersion }>('duplicate', { workflowId });
  },

  async remove(workflowId: string) {
    const { error } = await supabase.from('workflows').delete().eq('id', workflowId);
    throwIfError(error);
  },

  run(workflowId: string, testMode = true, payload: Record<string, unknown> = {}) {
    return invoke<{ run: { status: WorkflowRun['status']; runId: string; output?: Record<string, unknown>; error?: { message: string } } }>('run', { workflowId, testMode, payload });
  },

  decideApproval(approvalId: string, decision: 'approved' | 'rejected', note = '') {
    return invoke('approval-decision', { approvalId, decision, note });
  },

  connect(input: { businessId?: string; provider: 'mcp' | 'resend' | 'http'; name: string; baseUrl?: string; transport?: string; accessKey?: string; headers?: Record<string, string> }) {
    return invoke<{ connection: WorkflowConnection; test: { ok: boolean; message?: string; error?: { message: string } } }>('connect', input as unknown as Record<string, unknown>);
  },

  testConnection(connectionId: string) {
    return invoke<{ connection: WorkflowConnection; test: { ok: boolean; message?: string; error?: { message: string } } }>('test-connection', { connectionId });
  },

  deleteConnection(connectionId: string) {
    return invoke<{ deleted: true }>('delete-connection', { connectionId });
  },

  rotateWebhook(workflowId: string) {
    return invoke<{ webhookToken: string; webhookUrl: string }>('rotate-webhook', { workflowId });
  },

  subscribe(workflowId: string, onChange: () => void) {
    const channel = supabase.channel(`workflow:${workflowId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_runs', filter: `workflow_id=eq.${workflowId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_run_steps', filter: `workflow_id=eq.${workflowId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_approvals', filter: `workflow_id=eq.${workflowId}` }, onChange)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  },
};
