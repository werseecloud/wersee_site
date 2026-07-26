import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bot, Check, ChevronRight, FileJson, LayoutTemplate, Loader2,
  Play, Plus, Sparkles, WandSparkles, Workflow as WorkflowIcon, X,
} from 'lucide-react';
import { appToast } from '@/lib/feedback';
import { actionOptions, createManualDefinition, triggerOptions } from './catalog';
import { parseWorkflowImport, workflowService, WorkflowServiceError } from './service';
import type { WorkflowDefinition, WorkflowNodeType, WorkflowProposal, WorkflowRecord, WorkflowTemplate, WorkflowTriggerType } from './types';

interface Props {
  businessId?: string;
  templates: WorkflowTemplate[];
  initialMode?: 'home' | 'templates';
  onCancel: () => void;
  onCreated: (workflow: WorkflowRecord) => void;
}

const suggestions = [
  'Send customers an email after a purchase.',
  'Notify me when a payment fails.',
  'Create a weekly sales report.',
  'Ask AI to answer common support questions.',
];

const StepPreview = ({ definition }: { definition: WorkflowDefinition }) => (
  <div className="space-y-2">
    {definition.nodes.map((node, index) => <React.Fragment key={node.id}>
      {index > 0 && <div className="ml-6 h-5 w-px bg-gradient-to-b from-violet-400/70 to-violet-400/10" />}
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${node.type === 'trigger' ? 'bg-violet-400/15 text-violet-200' : 'bg-white/10 text-white/70'}`}>{index + 1}</span>
        <div><div className="text-sm font-semibold text-white">{node.title}</div><div className="mt-0.5 text-xs text-white/35">{node.type === 'trigger' ? 'Starts the workflow' : 'Then Wersee does this'}</div></div>
      </div>
    </React.Fragment>)}
  </div>
);

export const WorkflowCreator: React.FC<Props> = ({ businessId, templates, initialMode = 'home', onCancel, onCreated }) => {
  const [mode, setMode] = useState<'home' | 'ai' | 'templates' | 'manual' | 'import' | 'review'>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [proposal, setProposal] = useState<WorkflowProposal | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [manualStep, setManualStep] = useState(0);
  const [manualTrigger, setManualTrigger] = useState<WorkflowTriggerType>('purchase');
  const [manualAction, setManualAction] = useState<WorkflowNodeType>('email');
  const [importText, setImportText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewDefinition = useMemo(() => proposal?.definition || selectedTemplate?.definition || (mode === 'review' ? createManualDefinition(manualTrigger, manualAction) : null), [proposal, selectedTemplate, mode, manualTrigger, manualAction]);

  const buildWithAi = async () => {
    if (prompt.trim().length < 8) { setError('Describe the result you want in one short sentence.'); return; }
    setBusy(true); setError(null);
    try {
      const result = await workflowService.propose(prompt.trim(), businessId);
      setProposal(result.proposal);
      setMode('review');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Wersee AI could not create a workflow proposal.');
    } finally { setBusy(false); }
  };

  const useTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setProposal(null);
    setMode('review');
  };

  const validateImport = () => {
    try {
      const definition = parseWorkflowImport(importText);
      setProposal({ definition, explanation: definition.summary, risks: [], permissions: definition.dataAccess, missingInformation: [], provider: 'import', model: 'Wersee workflow JSON' });
      setSelectedTemplate(null);
      setMode('review');
      setError(null);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'This workflow file is not valid.'); }
  };

  const createDraft = async () => {
    if (!reviewDefinition) return;
    setBusy(true); setError(null);
    try {
      const result = await workflowService.create({
        name: reviewDefinition.name || selectedTemplate?.name,
        description: reviewDefinition.summary,
        businessId,
        definition: reviewDefinition,
      });
      appToast('Workflow draft created.', 'success');
      onCreated(result.workflow);
    } catch (requestError) {
      const message = requestError instanceof WorkflowServiceError ? requestError.message : 'Wersee could not create this workflow.';
      setError(message);
    } finally { setBusy(false); }
  };

  const back = () => {
    setError(null);
    if (mode === 'review') {
      if (selectedTemplate) setMode('templates');
      else if (proposal) setMode(proposal.provider === 'import' ? 'import' : 'ai');
      else setMode('manual');
      return;
    }
    if (mode === 'manual' && manualStep > 0) { setManualStep((step) => step - 1); return; }
    setMode('home');
  };

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={mode === 'home' ? onCancel : back} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/55 hover:bg-white/5 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button onClick={onCancel} aria-label="Close workflow creator" className="rounded-xl p-2.5 text-white/40 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      {mode === 'home' && <div>
        <header className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-200"><Sparkles className="h-3.5 w-3.5" /> New workflow</span><h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">What would you like Wersee to do automatically?</h1><p className="mx-auto mt-4 max-w-2xl text-white/45">Explain it like you would to a team member. You will review everything before anything is activated.</p></header>
        <div className="mx-auto mt-9 max-w-3xl rounded-[28px] border border-violet-400/20 bg-[#121212] p-4 shadow-2xl shadow-violet-950/20 sm:p-6" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(139,92,246,.16), transparent 45%)' }}>
          <label className="sr-only" htmlFor="workflow-ai-prompt">What should Wersee automate?</label>
          <textarea id="workflow-ai-prompt" autoFocus value={prompt} onChange={(event) => { setPrompt(event.target.value); setError(null); }} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void buildWithAi(); }} placeholder="Example: When a customer buys my course, send a welcome email and add them to my onboarding list." className="min-h-36 w-full resize-none bg-transparent p-2 text-base leading-7 text-white outline-none placeholder:text-white/25 sm:text-lg" />
          {error && <p className="px-2 pb-3 text-sm font-medium text-red-300" role="alert">{error}</p>}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-white/30">Wersee AI creates a draft only. It never activates it.</span><button onClick={() => void buildWithAi()} disabled={busy || prompt.trim().length < 8} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />} Create a draft</button></div>
        </div>
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => setPrompt(suggestion)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/45 hover:bg-white/10 hover:text-white">{suggestion}</button>)}</div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[{ id: 'ai', title: 'Describe it to Wersee AI', text: 'Best for getting a complete first draft in seconds.', icon: Bot }, { id: 'templates', title: 'Use a template', text: 'Start from a proven outcome and personalize it.', icon: LayoutTemplate }, { id: 'manual', title: 'Build manually', text: 'Choose what starts it and what happens next.', icon: WorkflowIcon }].map((option) => <button key={option.id} onClick={() => setMode(option.id as any)} className="group rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 text-left transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.045]"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-white/55 group-hover:bg-violet-400/10 group-hover:text-violet-300"><option.icon className="h-5 w-5" /></span><h2 className="mt-5 font-bold text-white">{option.title}</h2><p className="mt-2 text-sm leading-6 text-white/40">{option.text}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-violet-300">Get started <ChevronRight className="h-3.5 w-3.5" /></span></button>)}
        </div>
        <button onClick={() => setMode('import')} className="mx-auto mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/40 hover:bg-white/5 hover:text-white"><FileJson className="h-4 w-4" /> Import a Wersee workflow</button>
      </div>}

      {mode === 'ai' && <div className="mx-auto max-w-3xl"><div className="mb-7"><h1 className="text-3xl font-black text-white">Describe the outcome</h1><p className="mt-2 text-white/45">No APIs, JSON or technical setup needed.</p></div><div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.05] p-5"><textarea autoFocus value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What should Wersee do automatically?" className="min-h-48 w-full resize-none bg-transparent text-lg leading-8 text-white outline-none placeholder:text-white/25" />{error && <p className="mb-4 text-sm text-red-300">{error}</p>}<button onClick={() => void buildWithAi()} disabled={busy || prompt.trim().length < 8} className="ml-auto flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-black disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Build workflow draft</button></div></div>}

      {mode === 'templates' && <div><header><h1 className="text-3xl font-black text-white">Choose an outcome</h1><p className="mt-2 text-white/45">Each template uses smart defaults and takes only a few minutes to set up.</p></header><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <article key={template.id} className="flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6"><div className="flex items-start justify-between"><span className="rounded-full bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">{template.category}</span><span className="text-xs text-white/30">~{template.setup_minutes} min</span></div><h2 className="mt-5 text-lg font-bold text-white">{template.name}</h2><p className="mt-2 flex-1 text-sm leading-6 text-white/40">{template.description}</p><div className="mt-5 flex flex-wrap gap-2">{template.apps.map((app) => <span key={app} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">{app}</span>)}</div><div className="mt-5 border-t border-white/[0.07] pt-4 text-xs text-white/35">{template.required_connections.length ? `Connect: ${template.required_connections.join(', ')}` : 'No external connection required'}</div><button onClick={() => useTemplate(template)} className="mt-5 min-h-11 rounded-xl bg-white text-sm font-bold text-black hover:bg-violet-100">Use template</button></article>)}</div></div>}

      {mode === 'manual' && <div className="mx-auto max-w-4xl"><div className="mb-8"><div className="mb-4 flex gap-2" aria-label={`Step ${manualStep + 1} of 3`}>{[0, 1, 2].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${step <= manualStep ? 'bg-violet-400' : 'bg-white/10'}`} />)}</div><div className="text-xs font-bold uppercase tracking-wider text-violet-300">Step {manualStep + 1} of 3</div><h1 className="mt-2 text-3xl font-black text-white">{manualStep === 0 ? 'What should start this workflow?' : manualStep === 1 ? 'What should Wersee do?' : 'Ready to create your draft?'}</h1></div>{manualStep === 0 && <div className="grid gap-3 md:grid-cols-2">{triggerOptions.map((option) => <button key={option.type} onClick={() => setManualTrigger(option.type)} className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left ${manualTrigger === option.type ? 'border-violet-400/60 bg-violet-400/10' : 'border-white/10 bg-white/[0.025] hover:bg-white/5'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${manualTrigger === option.type ? 'bg-violet-400 text-black' : 'bg-white/10 text-white/45'}`}>{manualTrigger === option.type ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />}</span><span><span className="block font-semibold text-white">{option.label}</span><span className="mt-1 block text-xs leading-5 text-white/35">{option.description}</span></span></button>)}</div>}{manualStep === 1 && <div className="grid gap-3 md:grid-cols-2">{actionOptions.map((option) => <button key={option.type} onClick={() => setManualAction(option.type)} className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left ${manualAction === option.type ? 'border-violet-400/60 bg-violet-400/10' : 'border-white/10 bg-white/[0.025] hover:bg-white/5'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${manualAction === option.type ? 'bg-violet-400 text-black' : 'bg-white/10 text-white/45'}`}>{manualAction === option.type ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span><span><span className="block font-semibold text-white">{option.label}</span><span className="mt-1 block text-xs leading-5 text-white/35">{option.description}</span></span></button>)}</div>}{manualStep === 2 && <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]"><StepPreview definition={createManualDefinition(manualTrigger, manualAction)} /><div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"><h2 className="font-bold text-white">Wersee will handle the details</h2><ul className="mt-4 space-y-3 text-sm text-white/45">{['Automatically map customer and order data', 'Add safe retry and duplicate-run protection', 'Keep the workflow in test mode until you activate it'].map((text) => <li key={text} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> {text}</li>)}</ul></div></div>}<div className="mt-8 flex justify-end"><button onClick={() => manualStep < 2 ? setManualStep((step) => step + 1) : setMode('review')} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-black">Continue <ArrowRight className="h-4 w-4" /></button></div></div>}

      {mode === 'import' && <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-black text-white">Import a workflow</h1><p className="mt-2 text-white/45">Paste a Wersee workflow definition. It is validated before anything is saved.</p><textarea value={importText} onChange={(event) => { setImportText(event.target.value); setError(null); }} placeholder={'{\n  "schemaVersion": 1,\n  "trigger": { ... }\n}'} className="mt-7 min-h-80 w-full rounded-3xl border border-white/10 bg-black/35 p-5 font-mono text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-violet-400/50" />{error && <p className="mt-3 text-sm text-red-300">{error}</p>}<button onClick={validateImport} disabled={!importText.trim()} className="mt-5 ml-auto flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-black disabled:opacity-40"><FileJson className="h-4 w-4" /> Validate import</button></div>}

      {mode === 'review' && reviewDefinition && <div className="grid gap-7 xl:grid-cols-[1fr_380px]"><div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300"><Check className="h-3.5 w-3.5" /> Draft ready for review</span><h1 className="mt-5 text-3xl font-black text-white sm:text-4xl">{reviewDefinition.name || selectedTemplate?.name || 'Your workflow'}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-white/45">{proposal?.explanation || selectedTemplate?.description || reviewDefinition.summary}</p><div className="mt-8"><StepPreview definition={reviewDefinition} /></div></div><aside className="h-fit rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 xl:sticky xl:top-4"><h2 className="font-bold text-white">Before creating</h2><div className="mt-5 space-y-5"><div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Connections</div><div className="mt-2 flex flex-wrap gap-2">{reviewDefinition.requiredConnections.length ? reviewDefinition.requiredConnections.map((connection) => <span key={connection} className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200">{connection}</span>) : <span className="text-sm text-emerald-300">No connection required</span>}</div></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Can access</div><ul className="mt-2 space-y-2 text-sm text-white/45">{reviewDefinition.dataAccess.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Estimated per run</div><p className="mt-2 text-sm text-white/45">{reviewDefinition.estimatedUsage.emailsPerRun} email(s) · {reviewDefinition.estimatedUsage.aiActionsPerRun} AI action(s)</p></div>{proposal?.missingInformation?.length ? <div className="rounded-2xl bg-amber-400/10 p-4"><div className="text-xs font-bold text-amber-200">You can finish these details in the editor</div><ul className="mt-2 space-y-1 text-xs text-amber-100/60">{proposal.missingInformation.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}</div>{error && <p className="mt-5 text-sm text-red-300">{error}</p>}<button onClick={() => void createDraft()} disabled={busy} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-black disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WorkflowIcon className="h-4 w-4" />} Create editable draft</button><p className="mt-3 text-center text-[11px] leading-5 text-white/25">This does not activate or run the workflow.</p></aside></div>}
    </div>
  );
};
