import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronRight, Clock3, Loader2, PauseCircle, PlayCircle,
  RotateCw, TestTube2, XCircle,
} from 'lucide-react';
import { workflowService } from './service';
import type { WorkflowApproval, WorkflowRun, WorkflowRunStep } from './types';
import { formatDuration, formatRelativeTime } from './catalog';

interface Props {
  workflowId: string;
  runs: WorkflowRun[];
  approvals: WorkflowApproval[];
  onRefresh: () => Promise<void> | void;
}

const runState: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  queued: { label: 'Queued', icon: Clock3, className: 'text-white/50 bg-white/5' },
  running: { label: 'Running', icon: Loader2, className: 'text-sky-300 bg-sky-400/10' },
  waiting: { label: 'Waiting', icon: PauseCircle, className: 'text-amber-300 bg-amber-400/10' },
  waiting_approval: { label: 'Needs approval', icon: AlertCircle, className: 'text-amber-300 bg-amber-400/10' },
  succeeded: { label: 'Succeeded', icon: CheckCircle2, className: 'text-emerald-300 bg-emerald-400/10' },
  failed: { label: 'Failed', icon: XCircle, className: 'text-red-300 bg-red-400/10' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'text-white/40 bg-white/5' },
};

export const WorkflowRunsPanel: React.FC<Props> = ({ workflowId, runs, approvals, onRefresh }) => {
  const [selectedId, setSelectedId] = useState<string | null>(runs[0]?.id || null);
  const [steps, setSteps] = useState<WorkflowRunStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState<string | null>(null);
  const selected = useMemo(() => runs.find((run) => run.id === selectedId) || runs[0] || null, [runs, selectedId]);

  useEffect(() => { if (!selectedId && runs[0]) setSelectedId(runs[0].id); }, [runs, selectedId]);
  useEffect(() => {
    if (!selected) { setSteps([]); return; }
    let active = true;
    setLoading(true);
    workflowService.listRunSteps(selected.id).then((items) => { if (active) setSteps(items); }).catch(() => { if (active) setSteps([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected?.id, selected?.status]);

  const decide = async (approval: WorkflowApproval, decision: 'approved' | 'rejected') => {
    setDecisionBusy(approval.id);
    try { await workflowService.decideApproval(approval.id, decision); await onRefresh(); }
    finally { setDecisionBusy(null); }
  };

  if (runs.length === 0) return <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.015] p-10 text-center"><PlayCircle className="mx-auto h-8 w-8 text-white/20" /><h3 className="mt-4 font-bold text-white">No runs yet</h3><p className="mt-2 text-sm text-white/35">Use “Test workflow” to see every step execute safely.</p></div>;

  return (
    <div className="grid min-h-[520px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111] lg:grid-cols-[340px_1fr]">
      <div className="max-h-[640px] overflow-y-auto border-b border-white/[0.08] lg:border-b-0 lg:border-r">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#111]/95 p-4 backdrop-blur"><div><h3 className="font-bold text-white">Recent runs</h3><p className="mt-0.5 text-xs text-white/30">{runs.length} recorded</p></div><button onClick={() => void onRefresh()} aria-label="Refresh runs" className="rounded-xl p-2 text-white/35 hover:bg-white/10 hover:text-white"><RotateCw className="h-4 w-4" /></button></div>
        <div className="p-2">{runs.map((run) => { const state = runState[run.status] || runState.queued; const Icon = state.icon; return <button key={run.id} onClick={() => setSelectedId(run.id)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selected?.id === run.id ? 'bg-white/10' : 'hover:bg-white/5'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${state.className}`}><Icon className={`h-4 w-4 ${run.status === 'running' ? 'animate-spin' : ''}`} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{state.label}</span>{run.test_mode && <span className="inline-flex items-center gap-1 rounded-full bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-300"><TestTube2 className="h-2.5 w-2.5" /> Test</span>}</span><span className="mt-1 block text-[11px] text-white/30">{formatRelativeTime(run.created_at)} · {formatDuration(run.duration_ms)}</span></span><ChevronRight className="h-4 w-4 text-white/20" /></button>; })}</div>
      </div>

      <div className="min-w-0 p-5 sm:p-7">
        {selected && <><div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-bold text-white">Run details</h3><span className="font-mono text-[10px] text-white/25">{selected.id.slice(0, 8)}</span></div><p className="mt-1 text-xs text-white/35">Started {selected.started_at ? new Date(selected.started_at).toLocaleString() : formatRelativeTime(selected.queued_at)}</p></div><div className="flex gap-4 text-xs text-white/35"><span>{selected.ai_actions_used} AI actions</span><span>{formatDuration(selected.duration_ms)}</span></div></div>

          {selected.public_error && <div className="mt-5 flex gap-3 rounded-2xl border border-red-400/10 bg-red-400/[0.07] p-4 text-sm leading-6 text-red-100/80"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" /> {selected.public_error}</div>}

          {approvals.filter((approval) => approval.run_id === selected.id && approval.status === 'pending').map((approval) => <div key={approval.id} className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><AlertCircle className="h-5 w-5" /></span><div><h4 className="font-bold text-white">{approval.title}</h4><p className="mt-1 text-sm leading-6 text-white/45">{approval.description}</p></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><button onClick={() => void decide(approval, 'approved')} disabled={decisionBusy === approval.id} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black disabled:opacity-40">{decisionBusy === approval.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve and continue</button><button onClick={() => void decide(approval, 'rejected')} disabled={decisionBusy === approval.id} className="min-h-11 flex-1 rounded-xl border border-white/10 text-sm font-semibold text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-40">Reject</button></div></div>)}

          <div className="mt-6"><h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/30">Step-by-step log</h4>{loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div> : <div className="space-y-2">{steps.map((step, index) => { const state = runState[step.status === 'succeeded' ? 'succeeded' : step.status === 'failed' ? 'failed' : step.status === 'waiting' ? 'waiting' : 'running']; const Icon = state.icon; return <div key={step.id} className="relative flex gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">{index < steps.length - 1 && <span className="absolute left-[33px] top-14 h-[calc(100%-38px)] w-px bg-white/10" />}<span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${state.className}`}><Icon className={`h-4 w-4 ${step.status === 'running' ? 'animate-spin' : ''}`} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h5 className="text-sm font-semibold text-white">{step.node_title}</h5><span className="text-[10px] text-white/25">{formatDuration(step.duration_ms)}</span></div>{step.error_message ? <p className="mt-2 text-xs leading-5 text-red-300">{step.error_message}</p> : <p className="mt-1 text-xs text-white/35">{step.status === 'succeeded' ? 'Completed successfully' : step.status === 'waiting' ? 'Waiting before continuing' : 'Executing now'}</p>}</div></div>; })}{steps.length === 0 && <p className="p-8 text-center text-sm text-white/30">This run has not started a step yet.</p>}</div>}</div>
        </>}
      </div>
    </div>
  );
};
