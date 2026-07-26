import type { AiMode, WerseeAiTool } from "./types.ts";

const ALWAYS_CONFIRM_SCOPES = new Set([
  "publish_products",
  "send_marketing",
  "launch_ads",
  "charge_customers",
  "issue_refunds",
  "initiate_payouts",
  "manage_team_roles",
  "remove_team_members",
  "manage_developer_secrets",
  "manage_webhooks",
  "manage_security",
  "delete_data",
  "financial_commitments",
  "crypto_transfers",
]);

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}

export const decideToolPolicy = ({
  tool,
  mode,
  grantedScopes,
  agentEnabled,
  isOwner,
}: {
  tool: WerseeAiTool;
  mode: AiMode;
  grantedScopes: string[];
  agentEnabled: boolean;
  isOwner: boolean;
}): PolicyDecision => {
  if (tool.riskLevel === "restricted") {
    return { allowed: false, requiresApproval: false, reason: "This security-sensitive operation is not available to Wersee AI." };
  }

  if (!isOwner && tool.requiredScopes.some((scope) => ["manage_team", "manage_developer_settings", "manage_payments"].includes(scope))) {
    return { allowed: false, requiresApproval: false, reason: "Only the business owner can perform this operation." };
  }

  if (tool.riskLevel === "read") return { allowed: true, requiresApproval: false };
  if (tool.alwaysConfirm || tool.requiredScopes.some((scope) => ALWAYS_CONFIRM_SCOPES.has(scope))) {
    return { allowed: true, requiresApproval: true };
  }

  if (mode === "assistant" || !agentEnabled) return { allowed: true, requiresApproval: true };
  const hasEveryScope = tool.requiredScopes.every((scope) => grantedScopes.includes(scope));
  if (!hasEveryScope) return { allowed: true, requiresApproval: true };
  return { allowed: true, requiresApproval: tool.riskLevel === "high" };
};
