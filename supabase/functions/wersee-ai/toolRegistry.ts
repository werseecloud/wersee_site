import { analyticsTools } from "./tools/analytics.ts";
import { listingTools } from "./tools/listings.ts";
import { workspaceTools } from "./tools/workspace.ts";
import { moduleTools } from "./tools/modules.ts";
import { operationsTools } from "./tools/operations.ts";
import type { AiToolPlan, WerseeAiTool } from "./types.ts";

const tools = [...listingTools, ...analyticsTools, ...workspaceTools, ...moduleTools, ...operationsTools];
const registry = new Map<string, WerseeAiTool>(tools.map((tool) => [tool.name, tool]));

export const listRegisteredTools = () => tools;

export const getRegisteredTool = (name: string) => registry.get(name) || null;

export const getToolDescriptors = () => tools.map((tool) => ({
  name: tool.name,
  description: tool.description,
  riskLevel: tool.riskLevel,
  requiredScopes: tool.requiredScopes,
  inputHint: tool.inputHint,
}));

export const createDeterministicFallbackPlan = (
  request: string,
  context: Record<string, unknown>,
): AiToolPlan | null => {
  const normalized = request.toLowerCase();
  const entityId = typeof context.entityId === "string" ? context.entityId : undefined;
  const daysMatch = normalized.match(/(?:past|last)\s+(\d{1,3})\s+days?/);
  const days = daysMatch ? Math.min(365, Math.max(1, Number(daysMatch[1]))) : 30;

  if (/(revenue|sales|orders).*(summary|total|past|last)|summari[sz]e.*revenue/.test(normalized)) {
    return { summary: "Read sales data for the requested period.", toolCalls: [{ name: "analytics.sales_summary", input: { days } }] };
  }
  if (/(highest|best|weak).*(conversion|perform)|product performance/.test(normalized)) {
    return { summary: "Compare real product performance.", toolCalls: [{ name: "analytics.product_performance", input: { days, limit: 10 } }] };
  }
  if (/(find|search|show|list).*(product|listing)/.test(normalized)) {
    const query = request.replace(/^(find|search|show|list)\s+/i, "").slice(0, 160);
    return { summary: "Search your listings.", toolCalls: [{ name: "listings.search", input: { query, limit: 20 } }] };
  }
  if (entityId && /(complete|missing|review).*(listing|product)|listing.*(complete|missing)/.test(normalized)) {
    return { summary: "Review the current listing for missing information.", toolCalls: [{ name: "listings.check_completeness", input: { listingId: entityId } }] };
  }
  if (/(show|list|find).*(payment link)/.test(normalized)) {
    return { summary: "Read your payment links.", toolCalls: [{ name: "money.payment_links.list", input: { limit: 30 } }] };
  }
  if (/(show|list|find).*(invoice)/.test(normalized)) {
    return { summary: "Read your invoices.", toolCalls: [{ name: "money.invoices.list", input: { limit: 30 } }] };
  }
  if (/(show|list).*(automation|workflow)/.test(normalized)) {
    return { summary: "Read your automations.", toolCalls: [{ name: "automations.list", input: { limit: 30 } }] };
  }
  return null;
};
