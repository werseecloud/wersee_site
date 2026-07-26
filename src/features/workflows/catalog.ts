import type { WorkflowDefinition, WorkflowNodeType, WorkflowTriggerType } from './types';

export const triggerOptions: Array<{ type: WorkflowTriggerType; label: string; description: string }> = [
  { type: 'purchase', label: 'A customer purchases a product', description: 'Starts after a paid or free Wersee order.' },
  { type: 'payment_failed', label: 'A payment fails', description: 'Starts when an order needs a new payment method.' },
  { type: 'schedule', label: 'At a scheduled time', description: 'Runs every day, week or month.' },
  { type: 'webhook', label: 'Another app sends an event', description: 'Wersee gives you a secure event URL.' },
  { type: 'form_submission', label: 'A form is submitted', description: 'Starts when a Wersee form receives a response.' },
  { type: 'file_uploaded', label: 'A file is uploaded', description: 'Starts from new workspace files.' },
  { type: 'member_joined', label: 'A team member joins', description: 'Starts when someone accepts a workspace invitation.' },
  { type: 'manual', label: 'I start it myself', description: 'Only runs when you press Run.' },
];

export const actionOptions: Array<{ type: WorkflowNodeType; label: string; description: string }> = [
  { type: 'email', label: 'Send an email', description: 'Automatically uses the customer email when available.' },
  { type: 'notification', label: 'Send me a notification', description: 'Creates a Wersee workspace notification.' },
  { type: 'ai', label: 'Ask Wersee AI', description: 'Generate, classify or summarize information.' },
  { type: 'approval', label: 'Ask for approval', description: 'Pauses until a team member decides.' },
  { type: 'http', label: 'Send data to an app', description: 'Available in Advanced Mode with a secure HTTPS URL.' },
  { type: 'mcp', label: 'Use a connected tool', description: 'Run an action from a connected external tool.' },
];

export const readableNodeType: Record<WorkflowNodeType, string> = {
  trigger: 'When',
  email: 'Send email',
  notification: 'Notify',
  ai: 'Ask AI',
  http: 'Call app',
  mcp: 'Use tool',
  condition: 'Only if',
  delay: 'Wait',
  approval: 'Get approval',
  loop: 'For each',
  transform: 'Prepare data',
  note: 'Note',
};

const actionConfig = (type: WorkflowNodeType) => {
  if (type === 'email') return {
    to: '{{trigger.customer_email}}',
    subject: 'Thanks for your purchase',
    body: 'Hi {{trigger.customer_name}},\n\nThank you for purchasing {{trigger.product_title}}.',
  };
  if (type === 'notification') return { title: 'Workflow update', message: '{{trigger.customer_name}} completed an action.' };
  if (type === 'ai') return { prompt: 'Create a helpful summary from this workflow data: {{trigger}}' };
  if (type === 'approval') return { description: 'Review the details before this workflow continues.' };
  if (type === 'http') return { method: 'POST', url: 'https://', body: { customer_email: '{{trigger.customer_email}}' } };
  if (type === 'mcp') return { connectionId: '', toolName: '', arguments: {} };
  return {};
};

export const createManualDefinition = (triggerType: WorkflowTriggerType, actionType: WorkflowNodeType): WorkflowDefinition => {
  const trigger = triggerOptions.find((option) => option.type === triggerType) || triggerOptions[0];
  const action = actionOptions.find((option) => option.type === actionType) || actionOptions[0];
  const triggerConfig = triggerType === 'schedule'
    ? { cron: '0 9 * * *', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }
    : {};
  return {
    schemaVersion: 1,
    name: `${action.label} · ${trigger.label}`.slice(0, 160),
    summary: `When ${trigger.label.toLowerCase()}, Wersee will ${action.label.toLowerCase()}.`,
    trigger: { type: triggerType, label: trigger.label, config: triggerConfig },
    nodes: [
      { id: 'trigger', type: 'trigger', title: trigger.label, config: { event: triggerType, ...triggerConfig }, position: { x: 80, y: 160 } },
      { id: 'action_1', type: actionType, title: action.label, config: actionConfig(actionType), position: { x: 430, y: 160 } },
    ],
    edges: [{ id: 'trigger-action_1', source: 'trigger', target: 'action_1' }],
    requiredConnections: actionType === 'email' ? ['email'] : actionType === 'mcp' ? ['tool'] : [],
    dataAccess: triggerType === 'purchase' || triggerType === 'payment_failed'
      ? ['Customer name and email', 'Product and order information']
      : ['Workflow event data'],
    estimatedUsage: { emailsPerRun: actionType === 'email' ? 1 : 0, aiActionsPerRun: actionType === 'ai' ? 1 : 0 },
  };
};

export const safeTestPayload = (definition: WorkflowDefinition): Record<string, unknown> => {
  if (definition.trigger.type === 'purchase' || definition.trigger.type === 'payment_failed') {
    return {
      order_id: 'test-order',
      order_number: 'TEST-1042',
      customer_name: 'Alex',
      customer_email: 'alex@example.com',
      product_title: 'Creator Pro',
      purchase_amount: 79,
      currency: 'EUR',
      payment_status: definition.trigger.type === 'payment_failed' ? 'failed' : 'paid',
      test_data: true,
    };
  }
  return { event: definition.trigger.type, message: 'Safe test event', occurred_at: new Date().toISOString(), test_data: true };
};

export const formatDuration = (milliseconds?: number | null) => {
  if (milliseconds === null || milliseconds === undefined) return '—';
  if (milliseconds < 1000) return `${milliseconds} ms`;
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)} s`;
  return `${Math.round(milliseconds / 60000)} min`;
};

export const formatRelativeTime = (value?: string | null) => {
  if (!value) return 'Never';
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(delta / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(value).toLocaleDateString();
};
