import { z } from "zod";
import type { WerseeAiTool } from "../types.ts";

export const dateRangeInput = z.object({
  days: z.number().int().min(1).max(365).default(30),
}).strict();

const paidStatuses = new Set(["completed", "paid", "succeeded", "success", "fulfilled"]);

export const analyticsSummaryTool: WerseeAiTool<z.infer<typeof dateRangeInput>> = {
  name: "analytics.sales_summary",
  description: "Calculate authenticated seller sales, revenue, orders, refunds, customers, and a daily chart from real orders.",
  category: "analytics",
  riskLevel: "read",
  requiredScopes: ["read_analytics"],
  inputSchema: dateRangeInput,
  inputHint: "{days?: 1..365}",
  async execute(context, input) {
    const to = new Date();
    const from = new Date(to.getTime() - input.days * 86400000);
    const { data, error } = await context.userClient.from("orders")
      .select("id,amount,currency,status,created_at,buyer_id,listing_id,refund_status,listing:listings(title)")
      .eq("seller_id", context.user.id)
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .limit(5000);
    if (error) throw error;

    const orders = data || [];
    const paid = orders.filter((order: any) => paidStatuses.has(String(order.status || "").toLowerCase()));
    const revenueByCurrency = paid.reduce((totals: Record<string, number>, order: any) => {
      const currency = String(order.currency || "EUR").toUpperCase();
      totals[currency] = (totals[currency] || 0) + Number(order.amount || 0);
      return totals;
    }, {});
    const refundCount = orders.filter((order: any) => order.refund_status && !["none", "not_refunded"].includes(String(order.refund_status))).length;
    const customers = new Set(orders.map((order: any) => order.buyer_id).filter(Boolean)).size;
    const daily = new Map<string, number>();
    paid.forEach((order: any) => {
      const day = String(order.created_at).slice(0, 10);
      daily.set(day, (daily.get(day) || 0) + Number(order.amount || 0));
    });
    const primaryCurrency = Object.keys(revenueByCurrency)[0] || "EUR";
    const chartData = [...daily.entries()].map(([date, revenue]) => ({ date, revenue }));

    return {
      summary: `From ${from.toISOString().slice(0, 10)} through ${to.toISOString().slice(0, 10)}, ${paid.length} paid order${paid.length === 1 ? "" : "s"} generated ${Object.entries(revenueByCurrency).map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`).join(", ") || "no revenue"}.`,
      data: { paidOrders: paid.length, allOrders: orders.length, customers, refundCount, revenueByCurrency },
      chart: { type: "bar", title: `Revenue — last ${input.days} days`, xKey: "date", yKey: "revenue", data: chartData },
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      dataSource: ["public.orders.amount", "public.orders.status", "public.orders.created_at"],
    };
  },
};

export const productPerformanceInput = dateRangeInput.extend({ limit: z.number().int().min(1).max(25).default(10) }).strict();
export const productPerformanceTool: WerseeAiTool<z.infer<typeof productPerformanceInput>> = {
  name: "analytics.product_performance",
  description: "Rank owned listings using real paid orders and tracked conversion events for a bounded date range.",
  category: "analytics",
  riskLevel: "read",
  requiredScopes: ["read_analytics", "read_products"],
  inputSchema: productPerformanceInput,
  inputHint: "{days?: 1..365, limit?: 1..25}",
  async execute(context, input) {
    const to = new Date();
    const from = new Date(to.getTime() - input.days * 86400000);
    const { data: listings, error: listingsError } = await context.userClient.from("listings")
      .select("id,title,status,price").eq("seller_id", context.user.id).is("deleted_at", null).limit(500);
    if (listingsError) throw listingsError;
    const listingIds = (listings || []).map((listing: any) => listing.id);
    if (!listingIds.length) return { summary: "No owned listings were found.", data: { products: [] }, dataSource: ["public.listings"] };
    const [{ data: orders, error: ordersError }, { data: events, error: eventsError }] = await Promise.all([
      context.userClient.from("orders").select("listing_id,amount,status,currency").eq("seller_id", context.user.id).in("listing_id", listingIds).gte("created_at", from.toISOString()).limit(5000),
      context.userClient.from("product_conversion_events").select("listing_id,event_type").in("listing_id", listingIds).gte("created_at", from.toISOString()).limit(10000),
    ]);
    if (ordersError) throw ordersError;
    if (eventsError && !["42P01", "PGRST205"].includes(eventsError.code || "")) throw eventsError;

    const owned = new Map((listings || []).map((listing: any) => [listing.id, listing]));
    const rows = [...owned.values()].map((listing: any) => {
      const productOrders = (orders || []).filter((order: any) => order.listing_id === listing.id && paidStatuses.has(String(order.status || "").toLowerCase()));
      const productEvents = (events || []).filter((event: any) => event.listing_id === listing.id);
      const views = productEvents.filter((event: any) => ["view", "product_view", "product_card_view"].includes(event.event_type)).length;
      const purchases = productEvents.filter((event: any) => ["purchase", "checkout_completed"].includes(event.event_type)).length || productOrders.length;
      return {
        id: listing.id,
        title: listing.title,
        orders: productOrders.length,
        revenue: productOrders.reduce((sum: number, order: any) => sum + Number(order.amount || 0), 0),
        trackedViews: views,
        conversionRate: views > 0 ? Number(((purchases / views) * 100).toFixed(2)) : null,
      };
    }).sort((a, b) => (b.conversionRate ?? -1) - (a.conversionRate ?? -1) || b.revenue - a.revenue).slice(0, input.limit);

    return {
      summary: rows[0] ? `${rows[0].title} leads the selected product ranking${rows[0].conversionRate === null ? " by revenue because no tracked view denominator is available" : ` at ${rows[0].conversionRate}% tracked conversion`}.` : "No owned listings were found.",
      data: { products: rows },
      chart: { type: "bar", title: "Product revenue", xKey: "title", yKey: "revenue", data: rows.map((row) => ({ title: row.title, revenue: row.revenue })) },
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      dataSource: ["public.listings", "public.orders", "public.product_conversion_events"],
    };
  },
};

export const salesComparisonTool: WerseeAiTool<z.infer<typeof dateRangeInput>> = {
  name: "analytics.sales_comparison",
  description: "Compare real paid orders and revenue for two adjacent equal date windows without mixing currencies.",
  category: "analytics",
  riskLevel: "read",
  requiredScopes: ["read_analytics"],
  inputSchema: dateRangeInput,
  inputHint: "{days?: 1..365}",
  async execute(context, input) {
    const to = new Date();
    const currentFrom = new Date(to.getTime() - input.days * 86400000);
    const previousFrom = new Date(currentFrom.getTime() - input.days * 86400000);
    const { data, error } = await context.userClient.from("orders").select("amount,currency,status,created_at")
      .eq("seller_id", context.user.id).gte("created_at", previousFrom.toISOString()).lte("created_at", to.toISOString()).limit(10000);
    if (error) throw error;
    const paid = (data || []).filter((order: any) => paidStatuses.has(String(order.status || "").toLowerCase()));
    const summarize = (rows: any[]) => rows.reduce((summary: { orders: number; revenueByCurrency: Record<string, number> }, order) => { const currency = String(order.currency || "EUR").toUpperCase(); summary.orders += 1; summary.revenueByCurrency[currency] = (summary.revenueByCurrency[currency] || 0) + Number(order.amount || 0); return summary; }, { orders: 0, revenueByCurrency: {} });
    const current = summarize(paid.filter((order: any) => new Date(order.created_at) >= currentFrom));
    const previous = summarize(paid.filter((order: any) => new Date(order.created_at) < currentFrom));
    const currencies = [...new Set([...Object.keys(current.revenueByCurrency), ...Object.keys(previous.revenueByCurrency)])];
    const changes = Object.fromEntries(currencies.map((currency) => { const now = current.revenueByCurrency[currency] || 0; const before = previous.revenueByCurrency[currency] || 0; return [currency, before > 0 ? Number((((now - before) / before) * 100).toFixed(2)) : null]; }));
    return { summary: `The current ${input.days}-day window has ${current.orders} paid order${current.orders === 1 ? "" : "s"}, compared with ${previous.orders} in the preceding window.`, data: { current, previous, revenueChangePercentByCurrency: changes }, chart: { type: "bar", title: `${input.days}-day sales comparison`, xKey: "period", yKey: "orders", data: [{ period: "Previous", orders: previous.orders }, { period: "Current", orders: current.orders }] }, dateRange: { from: previousFrom.toISOString(), to: to.toISOString(), comparisonBoundary: currentFrom.toISOString() }, dataSource: ["public.orders.amount", "public.orders.currency", "public.orders.status", "public.orders.created_at"] };
  },
};

export const customerTrendsTool: WerseeAiTool<z.infer<typeof dateRangeInput>> = {
  name: "analytics.customer_trends",
  description: "Calculate real unique, repeat, and new-to-period buyer trends from owned orders.",
  category: "analytics",
  riskLevel: "read",
  requiredScopes: ["read_analytics"],
  inputSchema: dateRangeInput,
  inputHint: "{days?: 1..365}",
  async execute(context, input) {
    const to = new Date();
    const from = new Date(to.getTime() - input.days * 86400000);
    const { data, error } = await context.userClient.from("orders").select("buyer_id,buyer_email,customer_email,status,created_at")
      .eq("seller_id", context.user.id).lte("created_at", to.toISOString()).limit(10000);
    if (error) throw error;
    const identity = (order: any) => order.buyer_id || order.buyer_email || order.customer_email || null;
    const paid = (data || []).filter((order: any) => paidStatuses.has(String(order.status || "").toLowerCase()) && identity(order));
    const period = paid.filter((order: any) => new Date(order.created_at) >= from);
    const periodCounts = period.reduce((map: Map<string, number>, order: any) => { const id = identity(order); map.set(id, (map.get(id) || 0) + 1); return map; }, new Map());
    const historicalBuyers = new Set(paid.filter((order: any) => new Date(order.created_at) < from).map(identity));
    const repeatBuyers = [...periodCounts.values()].filter((count) => count > 1).length;
    const returningBuyers = [...periodCounts.keys()].filter((id) => historicalBuyers.has(id)).length;
    const uniqueBuyers = periodCounts.size;
    return { summary: `${uniqueBuyers} unique buyer${uniqueBuyers === 1 ? "" : "s"} purchased in the selected period; ${repeatBuyers} bought more than once in-period and ${returningBuyers} had purchased before.`, data: { uniqueBuyers, repeatBuyers, returningBuyers, newToPeriodBuyers: Math.max(0, uniqueBuyers - returningBuyers), paidOrders: period.length }, chart: { type: "bar", title: `Customer mix — last ${input.days} days`, xKey: "segment", yKey: "customers", data: [{ segment: "Unique", customers: uniqueBuyers }, { segment: "Repeat in period", customers: repeatBuyers }, { segment: "Returning", customers: returningBuyers }] }, dateRange: { from: from.toISOString(), to: to.toISOString() }, dataSource: ["public.orders.buyer_id", "public.orders.buyer_email", "public.orders.status", "public.orders.created_at"] };
  },
};

export const operationalInsightsTool: WerseeAiTool<z.infer<typeof dateRangeInput>> = {
  name: "analytics.operational_insights",
  description: "Build factual insight cards for refunds, overdue invoices, inactive subscriptions, failed automations, and payout setup.",
  category: "analytics",
  riskLevel: "read",
  requiredScopes: ["read_analytics", "read_invoices", "read_automations", "read_payments"],
  inputSchema: dateRangeInput,
  inputHint: "{days?: 1..365}",
  async execute(context, input) {
    const to = new Date();
    const from = new Date(to.getTime() - input.days * 86400000);
    const [{ data: orders, error: ordersError }, { data: invoices, error: invoicesError }, { data: subscriptions, error: subscriptionsError }, { data: automations, error: automationsError }, { data: profile, error: profileError }] = await Promise.all([
      context.userClient.from("orders").select("id,refund_status,dispute_status,created_at").eq("seller_id", context.user.id).gte("created_at", from.toISOString()).limit(5000),
      context.userClient.from("invoices").select("id,invoice_number,status,amount,currency,metadata,created_at").eq("user_id", context.user.id).limit(5000),
      context.userClient.from("subscriptions").select("id,status,active,cancelled_at,updated_at").or(`seller_id.eq.${context.user.id},user_id.eq.${context.user.id}`).limit(5000),
      context.userClient.from("automations").select("id,name,is_active").eq("user_id", context.user.id).limit(500),
      context.userClient.from("profiles").select("kyc_status,payout_schedule_configured,stripe_onboarding_complete,managed_payments_enabled").eq("id", context.user.id).maybeSingle(),
    ]);
    if (ordersError) throw ordersError;
    if (invoicesError) throw invoicesError;
    if (subscriptionsError) throw subscriptionsError;
    if (automationsError) throw automationsError;
    if (profileError) throw profileError;
    const automationIds = (automations || []).map((automation: any) => automation.id);
    let failedRuns: any[] = [];
    if (automationIds.length) {
      const { data, error } = await context.userClient.from("automation_logs").select("id,automation_id,status,created_at").in("automation_id", automationIds).gte("created_at", from.toISOString()).limit(5000);
      if (error) throw error;
      failedRuns = (data || []).filter((log: any) => ["failed", "error"].includes(String(log.status).toLowerCase()));
    }
    const refundActivity = (orders || []).filter((order: any) => order.refund_status && !["none", "not_refunded"].includes(order.refund_status));
    const disputes = (orders || []).filter((order: any) => order.dispute_status && !["none", "resolved", "closed"].includes(order.dispute_status));
    const overdueInvoices = (invoices || []).filter((invoice: any) => { const due = invoice.metadata?.due_date; return !["paid", "void", "uncollectible"].includes(String(invoice.status).toLowerCase()) && due && new Date(due) < to; });
    const inactiveSubscriptions = (subscriptions || []).filter((subscription: any) => subscription.active === false || ["cancelled", "canceled", "past_due", "unpaid", "inactive"].includes(String(subscription.status).toLowerCase()));
    const cards = [
      { kind: "refund_activity", severity: refundActivity.length ? "warning" : "ok", count: refundActivity.length, message: `${refundActivity.length} order${refundActivity.length === 1 ? " has" : "s have"} refund activity in this period.` },
      { kind: "open_disputes", severity: disputes.length ? "critical" : "ok", count: disputes.length, message: `${disputes.length} unresolved dispute${disputes.length === 1 ? "" : "s"}.` },
      { kind: "overdue_invoices", severity: overdueInvoices.length ? "warning" : "ok", count: overdueInvoices.length, message: `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? " is" : "s are"} past the stored due date.` },
      { kind: "inactive_subscriptions", severity: inactiveSubscriptions.length ? "info" : "ok", count: inactiveSubscriptions.length, message: `${inactiveSubscriptions.length} inactive or payment-problem subscription${inactiveSubscriptions.length === 1 ? "" : "s"}.` },
      { kind: "failed_automations", severity: failedRuns.length ? "warning" : "ok", count: failedRuns.length, message: `${failedRuns.length} failed automation run${failedRuns.length === 1 ? "" : "s"} in this period.` },
      { kind: "payout_setup", severity: profile?.stripe_onboarding_complete && profile?.payout_schedule_configured ? "ok" : "warning", count: profile?.stripe_onboarding_complete && profile?.payout_schedule_configured ? 0 : 1, message: profile?.stripe_onboarding_complete && profile?.payout_schedule_configured ? "Payout onboarding and schedule are configured." : "Payout onboarding or the payout schedule is incomplete." },
    ];
    return { summary: `${cards.filter((card) => card.severity !== "ok").length} operational insight card${cards.filter((card) => card.severity !== "ok").length === 1 ? " needs" : "s need"} attention.`, data: { cards }, dateRange: { from: from.toISOString(), to: to.toISOString() }, dataSource: ["public.orders", "public.invoices.metadata.due_date", "public.subscriptions", "public.automations", "public.automation_logs", "public.profiles"] };
  },
};

export const analyticsTools = [analyticsSummaryTool, productPerformanceTool, salesComparisonTool, customerTrendsTool, operationalInsightsTool] satisfies WerseeAiTool[];
