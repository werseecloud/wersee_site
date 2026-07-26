export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'disabled' | 'error' | 'archived';
export type WorkflowTriggerType = 'manual' | 'purchase' | 'payment_failed' | 'message' | 'schedule' | 'webhook' | 'form_submission' | 'file_uploaded' | 'member_joined';
export type WorkflowNodeType = 'trigger' | 'email' | 'notification' | 'ai' | 'http' | 'mcp' | 'condition' | 'delay' | 'approval' | 'loop' | 'transform' | 'note';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  description?: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export interface WorkflowDefinition {
  schemaVersion: 1;
  name?: string;
  summary: string;
  trigger: { type: WorkflowTriggerType; label: string; config: Record<string, unknown> };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  requiredConnections: string[];
  dataAccess: string[];
  estimatedUsage: { emailsPerRun: number; aiActionsPerRun: number };
}

export interface WorkflowRecord {
  id: string;
  business_id: string | null;
  owner_id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, unknown>;
  draft_definition: WorkflowDefinition;
  settings: Record<string, unknown>;
  current_version_id: string | null;
  published_version_id: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  run_count: number;
  success_count: number;
  failure_count: number;
  ai_actions_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  setup_minutes: number;
  required_connections: string[];
  apps: string[];
  definition: WorkflowDefinition;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  version_id: string | null;
  initiated_by: string | null;
  status: 'queued' | 'running' | 'waiting' | 'waiting_approval' | 'succeeded' | 'failed' | 'cancelled';
  trigger_type: string;
  test_mode: boolean;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  public_error: string | null;
  current_node_id: string | null;
  ai_actions_used: number;
  queued_at: string;
  started_at: string | null;
  resume_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface WorkflowRunStep {
  id: string;
  run_id: string;
  workflow_id: string;
  node_id: string;
  node_type: WorkflowNodeType;
  node_title: string;
  status: 'queued' | 'running' | 'waiting' | 'succeeded' | 'failed' | 'skipped';
  input_preview: Record<string, unknown>;
  output_preview: Record<string, unknown>;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
}

export interface WorkflowConnection {
  id: string;
  business_id: string | null;
  user_id: string;
  provider: 'mcp' | 'resend' | 'http';
  name: string;
  status: 'not_connected' | 'connecting' | 'connected' | 'needs_attention' | 'expired';
  transport: string;
  base_url: string | null;
  discovered_tools: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>;
  scopes: string[];
  metadata: Record<string, unknown>;
  last_checked_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowApproval {
  id: string;
  workflow_id: string;
  run_id: string;
  step_id: string;
  assigned_to: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  title: string;
  description: string;
  preview: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
}

export interface WorkflowProposal {
  definition: WorkflowDefinition;
  explanation: string;
  risks: string[];
  permissions: string[];
  missingInformation: string[];
  provider: string;
  model: string;
}

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version_number: number;
  definition: WorkflowDefinition;
  change_summary: string;
  created_by: string;
  created_at: string;
  published_at: string | null;
}
