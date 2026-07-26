import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { appToast, destructiveAction } from '@/lib/feedback';
import { WorkflowConnections } from './WorkflowConnections';
import { WorkflowCreator } from './WorkflowCreator';
import { WorkflowDashboard } from './WorkflowDashboard';
import { WorkflowEditor } from './WorkflowEditor';
import { safeTestPayload } from './catalog';
import { workflowService } from './service';
import type { WorkflowApproval, WorkflowConnection, WorkflowRecord, WorkflowRun, WorkflowTemplate } from './types';
import './workflows.css';

interface Props { businessId?: string }
type Page = 'dashboard' | 'create' | 'templates' | 'connections' | 'editor';

export const WorkflowsView: React.FC<Props> = ({ businessId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = (searchParams.get('workflowPage') as Page) || 'dashboard';
  const [page, setPage] = useState<Page>(initialPage);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('workflowId'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigatePage = useCallback((nextPage: Page, workflowId?: string | null) => {
    setPage(nextPage); setSelectedId(workflowId || null);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage === 'dashboard') next.delete('workflowPage'); else next.set('workflowPage', nextPage);
      if (workflowId) next.set('workflowId', workflowId); else next.delete('workflowId');
      return next;
    }, { replace: false });
  }, [setSearchParams]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [workflowRows, templateRows, connectionRows, runRows, approvalRows] = await Promise.all([
        workflowService.listWorkflows(businessId),
        workflowService.listTemplates(),
        workflowService.listConnections(businessId),
        workflowService.listRuns(undefined, 500),
        workflowService.listApprovals(),
      ]);
      setWorkflows(workflowRows); setTemplates(templateRows); setConnections(connectionRows); setRuns(runRows); setApprovals(approvalRows);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Wersee could not load Workflows.');
    } finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const queryPage = (searchParams.get('workflowPage') as Page) || 'dashboard';
    const queryId = searchParams.get('workflowId');
    if (queryPage !== page) setPage(queryPage);
    if (queryId !== selectedId) setSelectedId(queryId);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    return workflowService.subscribe(selectedId, () => { void load(true); });
  }, [selectedId, load]);

  const selected = useMemo(() => workflows.find((workflow) => workflow.id === selectedId) || null, [workflows, selectedId]);

  useEffect(() => {
    if (page !== 'editor' || !selectedId || selected) return;
    workflowService.getWorkflow(selectedId).then((workflow) => setWorkflows((current) => [workflow, ...current.filter((item) => item.id !== workflow.id)]))
      .catch(() => navigatePage('dashboard'));
  }, [page, selectedId, selected, navigatePage]);

  const updateWorkflow = (updated: WorkflowRecord) => setWorkflows((current) => current.map((workflow) => workflow.id === updated.id ? updated : workflow));

  const run = async (workflow: WorkflowRecord) => {
    try {
      const result = await workflowService.run(workflow.id, true, safeTestPayload(workflow.draft_definition));
      await load(true);
      if (result.run.status === 'failed') appToast(result.run.error?.message || 'The test found a step that needs attention.', 'error');
      else appToast('Workflow test completed safely.', 'success');
    } catch (requestError) { appToast(requestError instanceof Error ? requestError.message : 'The test failed.', 'error'); }
  };

  const changeStatus = async (workflow: WorkflowRecord, status: 'active' | 'paused' | 'archived') => {
    try {
      if (status === 'active' && !workflow.published_version_id) {
        const result = await workflowService.publish(workflow.id, workflow.draft_definition);
        updateWorkflow(result.workflow);
      } else {
        const result = await workflowService.setStatus(workflow.id, status);
        updateWorkflow(result.workflow);
      }
      appToast(status === 'active' ? 'Workflow activated.' : status === 'paused' ? 'Workflow paused.' : 'Workflow archived.', 'success');
    } catch (requestError) {
      appToast(requestError instanceof Error ? requestError.message : 'Wersee could not update this workflow.', 'error');
      if (status === 'active') navigatePage('editor', workflow.id);
    }
  };

  const duplicate = async (workflow: WorkflowRecord) => {
    try { const result = await workflowService.duplicate(workflow.id); setWorkflows((current) => [result.workflow, ...current]); appToast('Workflow duplicated.', 'success'); }
    catch (requestError) { appToast(requestError instanceof Error ? requestError.message : 'Could not duplicate workflow.', 'error'); }
  };

  const exportWorkflow = (workflow: WorkflowRecord) => {
    const payload = JSON.stringify({ format: 'wersee-workflow', exportedAt: new Date().toISOString(), name: workflow.name, definition: workflow.draft_definition }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workflow'}.wersee.json`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    appToast('Workflow exported.', 'success');
  };

  const remove = async (workflow: WorkflowRecord) => {
    if (!await destructiveAction({ title: 'Delete workflow?', description: `“${workflow.name}” and its execution history will be permanently deleted. Export it first if you may need it later.`, confirmText: 'Delete workflow' })) return;
    try { await workflowService.remove(workflow.id); setWorkflows((current) => current.filter((item) => item.id !== workflow.id)); appToast('Workflow deleted.', 'success'); }
    catch (requestError) { appToast(requestError instanceof Error ? requestError.message : 'Could not delete workflow.', 'error'); }
  };

  const frame = (content: React.ReactNode) => <div className="wersee-workflows">{content}</div>;

  if (page === 'create' || page === 'templates') return frame(<WorkflowCreator businessId={businessId} templates={templates} initialMode={page === 'templates' ? 'templates' : 'home'} onCancel={() => navigatePage('dashboard')} onCreated={(workflow) => { setWorkflows((current) => [workflow, ...current.filter((item) => item.id !== workflow.id)]); navigatePage('editor', workflow.id); }} />);
  if (page === 'connections') return frame(<WorkflowConnections businessId={businessId} connections={connections} onBack={() => navigatePage(selectedId ? 'editor' : 'dashboard', selectedId)} onChanged={() => load(true)} />);
  if (page === 'editor' && selected) return frame(<WorkflowEditor workflow={selected} connections={connections} runs={runs.filter((run) => run.workflow_id === selected.id)} approvals={approvals.filter((approval) => approval.workflow_id === selected.id)} onBack={() => navigatePage('dashboard')} onConnections={() => navigatePage('connections', selected.id)} onRefresh={() => load(true)} onUpdated={updateWorkflow} />);

  if (error && !workflows.length) return frame(<div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300"><AlertCircle className="h-6 w-6" /></span><h2 className="mt-5 text-xl font-black text-white">Workflows could not load</h2><p className="mt-2 text-sm leading-6 text-white/40">{error}</p><button onClick={() => void load()} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black"><RefreshCw className="h-4 w-4" /> Try again</button></div>);

  if (loading && !workflows.length && !templates.length) return frame(<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-white/40" /></div>);

  return frame(<WorkflowDashboard workflows={workflows} runs={runs} loading={loading} onCreate={() => navigatePage('create')} onOpen={(workflow) => navigatePage('editor', workflow.id)} onTemplates={() => navigatePage('templates')} onConnections={() => navigatePage('connections')} onRun={(workflow) => void run(workflow)} onStatus={(workflow, status) => void changeStatus(workflow, status)} onDuplicate={(workflow) => void duplicate(workflow)} onExport={exportWorkflow} onDelete={(workflow) => void remove(workflow)} />);
};
