export type AiMode = 'assistant' | 'agent';
export type AiRiskLevel = 'read' | 'low' | 'medium' | 'high' | 'restricted';

export interface AiPublicError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface AiActionPreview {
  title?: string;
  summary?: string;
  affectedResources?: Array<{ type: string; id?: string; label: string }>;
  changes?: Array<{ field: string; before: unknown; after: unknown }>;
  financial?: { amount: number; currency: string } | null;
  recipients?: string[];
  publicVisibility?: boolean;
  estimatedCount?: number;
  reversible?: boolean;
  confirmationText?: string;
}

export interface AiAction {
  id: string;
  toolName: string;
  title?: string;
  category?: string;
  riskLevel: AiRiskLevel;
  requiredScopes?: string[];
  preview?: AiActionPreview | null;
  arguments?: Record<string, unknown>;
  status?: string;
  result?: AiActionResult;
  reversible?: boolean;
}

export interface AiActionResult {
  summary: string;
  resource?: { type: string; id: string; label: string; route?: string };
  data?: Record<string, unknown>;
  chart?: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    xKey: string;
    yKey: string;
    data: Array<Record<string, string | number>>;
  };
  dateRange?: { from: string; to: string };
  dataSource?: string[];
}

export type AiStreamEvent =
  | { type: 'message.delta'; text: string }
  | { type: 'run.started'; runId: string; conversationId: string }
  | { type: 'step.started'; stepId: string; label: string }
  | { type: 'step.completed'; stepId: string }
  | { type: 'action.proposed'; action: AiAction }
  | { type: 'action.waiting_for_approval'; actionId: string }
  | { type: 'action.started'; actionId: string }
  | { type: 'action.completed'; actionId: string; result: AiActionResult }
  | { type: 'action.failed'; actionId: string; error: AiPublicError }
  | { type: 'run.completed'; runId: string }
  | { type: 'run.failed'; runId: string; error: AiPublicError };

export interface AiConversation {
  id: string;
  title: string;
  mode: AiMode;
  status: string;
  business_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'model' | 'tool' | 'system';
  content: string;
  content_blocks?: unknown[];
  components?: unknown[];
  run_id?: string | null;
  created_at: string;
}

export interface AiPermissions {
  id?: string;
  agent_enabled: boolean;
  memory_enabled: boolean;
  scopes: string[];
  updated_at?: string;
}

export interface AiPageContext {
  page?: string;
  businessId?: string;
  businessName?: string;
  entityType?: string;
  entityId?: string;
  selection?: Record<string, unknown>;
  capabilities?: string[];
  [key: string]: unknown;
}
