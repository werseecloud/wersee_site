import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ZodType } from "zod";

export type AiRiskLevel = "read" | "low" | "medium" | "high" | "restricted";
export type AiMode = "assistant" | "agent";

export interface BusinessAccess {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
}

export interface ToolContext {
  user: User;
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
  business: BusinessAccess | null;
  requestId: string;
  signal: AbortSignal;
}

export interface ActionPreview {
  title: string;
  summary: string;
  business?: { id: string; name: string } | null;
  affectedResources: Array<{ type: string; id?: string; label: string }>;
  changes?: Array<{ field: string; before: unknown; after: unknown }>;
  financial?: { amount: number; currency: string } | null;
  recipients?: string[];
  publicVisibility?: boolean;
  estimatedCount: number;
  reversible: boolean;
  confirmationText?: string;
}

export interface SafeActionResult {
  summary: string;
  resource?: { type: string; id: string; label: string; route?: string };
  data?: Record<string, unknown>;
  chart?: {
    type: "bar" | "line" | "pie";
    title: string;
    xKey: string;
    yKey: string;
    data: Array<Record<string, string | number>>;
  };
  dateRange?: { from: string; to: string };
  dataSource?: string[];
}

export interface UndoOperation {
  toolName: string;
  input: Record<string, unknown>;
  expiresAt?: string;
}

export interface WerseeAiTool<TInput = any, TOutput extends SafeActionResult = SafeActionResult> {
  name: string;
  description: string;
  category: string;
  riskLevel: AiRiskLevel;
  requiredScopes: string[];
  inputSchema: ZodType<TInput>;
  inputHint: string;
  alwaysConfirm?: boolean;
  preview?: (context: ToolContext, input: TInput) => Promise<ActionPreview>;
  execute: (context: ToolContext, input: TInput, idempotencyKey: string) => Promise<TOutput>;
  undo?: (context: ToolContext, payload: Record<string, unknown>) => Promise<SafeActionResult>;
  createUndoOperation?: (result: TOutput) => UndoOperation | null;
}

export interface AiCompletionInput {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export interface AiToolPlanningInput {
  request: string;
  mode: AiMode;
  trustedContext: Record<string, unknown>;
  untrustedContext: Array<{ source: string; content: string }>;
  tools: Array<{
    name: string;
    description: string;
    riskLevel: AiRiskLevel;
    requiredScopes: string[];
    inputHint: string;
  }>;
  signal?: AbortSignal;
}

export interface AiToolPlan {
  summary: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
  assistantMessage?: string;
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  streamCompletion(input: AiCompletionInput): AsyncIterable<{ type: "delta"; text: string }>;
  createToolPlan(input: AiToolPlanningInput): Promise<AiToolPlan>;
}

export type AiStreamEvent =
  | { type: "message.delta"; text: string }
  | { type: "run.started"; runId: string; conversationId: string }
  | { type: "step.started"; stepId: string; label: string }
  | { type: "step.completed"; stepId: string }
  | { type: "action.proposed"; action: Record<string, unknown> }
  | { type: "action.waiting_for_approval"; actionId: string }
  | { type: "action.started"; actionId: string }
  | { type: "action.completed"; actionId: string; result: SafeActionResult }
  | { type: "action.failed"; actionId: string; error: PublicAiError }
  | { type: "run.completed"; runId: string }
  | { type: "run.failed"; runId: string; error: PublicAiError };

export interface PublicAiError {
  code: string;
  message: string;
  retryable: boolean;
}
