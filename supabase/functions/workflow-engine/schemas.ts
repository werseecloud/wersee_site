import { z } from "zod";

export const workflowNodeTypeSchema = z.enum([
  "trigger",
  "email",
  "notification",
  "ai",
  "http",
  "mcp",
  "condition",
  "delay",
  "approval",
  "loop",
  "transform",
  "note",
]);

export const workflowNodeSchema = z.object({
  id: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
  type: workflowNodeTypeSchema,
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional(),
  config: z.record(z.string(), z.unknown()).default({}),
  position: z.object({
    x: z.number().finite().min(-100000).max(100000),
    y: z.number().finite().min(-100000).max(100000),
  }).default({ x: 0, y: 0 }),
}).strict();

export const workflowEdgeSchema = z.object({
  id: z.string().trim().min(1).max(120),
  source: z.string().trim().min(1).max(100),
  target: z.string().trim().min(1).max(100),
  sourceHandle: z.string().trim().max(60).optional(),
  label: z.string().trim().max(120).optional(),
}).strict();

export const workflowDefinitionSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  name: z.string().trim().min(2).max(160).optional(),
  summary: z.string().trim().max(2000).default(""),
  trigger: z.object({
    type: z.enum([
      "manual",
      "purchase",
      "payment_failed",
      "message",
      "schedule",
      "webhook",
      "form_submission",
      "file_uploaded",
      "member_joined",
    ]),
    label: z.string().trim().min(1).max(180),
    config: z.record(z.string(), z.unknown()).default({}),
  }).strict(),
  nodes: z.array(workflowNodeSchema).min(2).max(100),
  edges: z.array(workflowEdgeSchema).max(200).default([]),
  requiredConnections: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  dataAccess: z.array(z.string().trim().min(1).max(180)).max(30).default([]),
  estimatedUsage: z.object({
    emailsPerRun: z.number().int().min(0).max(100).default(0),
    aiActionsPerRun: z.number().int().min(0).max(100).default(0),
  }).default({ emailsPerRun: 0, aiActionsPerRun: 0 }),
}).strict().superRefine((definition, context) => {
  const ids = new Set<string>();
  for (const node of definition.nodes) {
    if (ids.has(node.id)) {
      context.addIssue({ code: "custom", message: `Node id ${node.id} is duplicated.` });
    }
    ids.add(node.id);
  }

  const triggerNodes = definition.nodes.filter((node) => node.type === "trigger");
  if (triggerNodes.length !== 1) {
    context.addIssue({ code: "custom", message: "A workflow needs exactly one trigger." });
  }

  const edgeIds = new Set<string>();
  for (const edge of definition.edges) {
    if (edgeIds.has(edge.id)) {
      context.addIssue({ code: "custom", message: `Edge id ${edge.id} is duplicated.` });
    }
    edgeIds.add(edge.id);
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      context.addIssue({ code: "custom", message: `Edge ${edge.id} points to a missing step.` });
    }
    if (edge.source === edge.target) {
      context.addIssue({ code: "custom", message: `Edge ${edge.id} cannot point to itself.` });
    }
  }
});

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;

export const proposalInputSchema = z.object({
  prompt: z.string().trim().min(8).max(8000),
  businessId: z.string().uuid().nullable().optional(),
  currentDefinition: workflowDefinitionSchema.optional(),
}).strict();

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).default(""),
  businessId: z.string().uuid().nullable().optional(),
  definition: workflowDefinitionSchema,
}).strict();

export const saveWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).default(""),
  definition: workflowDefinitionSchema,
  snapshot: z.boolean().default(false),
  changeSummary: z.string().trim().max(500).default("Saved workflow version"),
}).strict();

export const connectionInputSchema = z.object({
  businessId: z.string().uuid().nullable().optional(),
  provider: z.enum(["mcp", "resend", "http"]),
  name: z.string().trim().min(2).max(160),
  baseUrl: z.string().trim().url().max(2000).optional(),
  transport: z.enum(["https", "streamable_http", "sse", "oauth"]).default("https"),
  accessKey: z.string().max(12000).optional(),
  headers: z.record(z.string(), z.string().max(12000)).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).strict();

export const workflowStatusSchema = z.enum(["active", "paused", "disabled", "archived"]);
