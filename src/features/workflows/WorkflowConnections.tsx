import React, { useState } from 'react';
import {
  AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Cloud, KeyRound,
  Loader2, Mail, Plus, RefreshCw, Server, Trash2, Wrench, X,
} from 'lucide-react';
import { destructiveAction } from '@/lib/feedback';
import { workflowService } from './service';
import type { WorkflowConnection } from './types';

interface Props {
  businessId?: string;
  connections: WorkflowConnection[];
  onBack: () => void;
  onChanged: () => Promise<void> | void;
}

const statusCopy: Record<string, { label: string; className: string }> = {
  not_connected: { label: 'Not connected', className: 'bg-white/5 text-white/45' },
  connecting: { label: 'Connecting', className: 'bg-sky-400/10 text-sky-300' },
  connected: { label: 'Connected', className: 'bg-emerald-400/10 text-emerald-300' },
  needs_attention: { label: 'Needs attention', className: 'bg-amber-400/10 text-amber-300' },
  expired: { label: 'Expired', className: 'bg-red-400/10 text-red-300' },
};

const ProviderIcon = ({ provider }: { provider: string }) => provider === 'resend'
  ? <Mail className="h-5 w-5" />
  : provider === 'mcp' ? <Wrench className="h-5 w-5" /> : <Cloud className="h-5 w-5" />;

export const WorkflowConnections: React.FC<Props> = ({ businessId, connections, onBack, onChanged }) => {
  const [adding, setAdding] = useState(false);
  const [provider, setProvider] = useState<'mcp' | 'resend' | 'http'>('mcp');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [headersText, setHeadersText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setName(''); setBaseUrl(''); setAccessKey(''); setHeadersText(''); setAdvanced(false); setError(null); };

  const connect = async () => {
    setBusy('new'); setError(null);
    try {
      let headers: Record<string, string> = {};
      if (advanced && headersText.trim()) {
        const parsed = JSON.parse(headersText);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Headers must be a simple JSON object.');
        headers = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
      }
      const result = await workflowService.connect({
        businessId, provider, name: name.trim() || (provider === 'mcp' ? 'External tool' : provider === 'resend' ? 'Email' : 'Web service'),
        baseUrl: provider === 'resend' ? undefined : baseUrl.trim(), accessKey: accessKey.trim() || undefined, headers,
        transport: provider === 'mcp' ? 'streamable_http' : 'https',
      });
      if (!result.test.ok) setError(result.test.error?.message || 'This connection needs attention.');
      else { setAdding(false); reset(); }
      await onChanged();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Wersee could not connect this account.'); }
    finally { setBusy(null); }
  };

  const test = async (connection: WorkflowConnection) => {
    setBusy(connection.id); setError(null);
    try { await workflowService.testConnection(connection.id); await onChanged(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'The connection test failed.'); }
    finally { setBusy(null); }
  };

  const remove = async (connection: WorkflowConnection) => {
    if (!await destructiveAction({ title: 'Remove connection?', description: `Workflows using “${connection.name}” will stop until another connection is selected.`, confirmText: 'Remove' })) return;
    setBusy(connection.id);
    try { await workflowService.deleteConnection(connection.id); await onChanged(); }
    finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><button onClick={onBack} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-semibold text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /> Workflows</button><h1 className="text-3xl font-black text-white sm:text-4xl">Connections</h1><p className="mt-2 max-w-2xl text-white/45">Connect tools and accounts once, then safely reuse them in your workflows. Access keys are encrypted in Wersee Vault.</p></div><button onClick={() => { setAdding(true); reset(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black"><Plus className="h-4 w-4" /> Connect a tool</button></header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">{connections.map((connection) => { const state = statusCopy[connection.status] || statusCopy.not_connected; return <article key={connection.id} className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300"><ProviderIcon provider={connection.provider} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold text-white">{connection.name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${state.className}`}>{state.label}</span></div><p className="mt-1 text-xs capitalize text-white/35">{connection.provider === 'mcp' ? 'External tool connection' : connection.provider === 'resend' ? 'Email delivery' : 'Web service'}</p></div></div>{connection.last_error && <div className="mt-4 flex gap-2 rounded-2xl bg-amber-400/[0.08] p-3 text-xs leading-5 text-amber-100/70"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> {connection.last_error}</div>}{connection.discovered_tools?.length > 0 && <div className="mt-4"><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Available actions</div><div className="mt-2 flex flex-wrap gap-2">{connection.discovered_tools.slice(0, 5).map((tool) => <span key={tool.name} title={tool.description} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">{tool.name.replaceAll('_', ' ')}</span>)}{connection.discovered_tools.length > 5 && <span className="rounded-full px-2 py-1 text-[10px] text-white/30">+{connection.discovered_tools.length - 5}</span>}</div></div>}<div className="mt-5 flex gap-2 border-t border-white/[0.07] pt-4"><button onClick={() => void test(connection)} disabled={busy === connection.id} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40">{busy === connection.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Test connection</button><button onClick={() => void remove(connection)} disabled={busy === connection.id} aria-label={`Remove ${connection.name}`} className="rounded-xl px-3 text-white/30 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div></article>; })}</div>

      {connections.length === 0 && <div className="mt-8 rounded-[32px] border border-dashed border-white/10 bg-white/[0.015] p-12 text-center"><Server className="mx-auto h-9 w-9 text-white/20" /><h2 className="mt-4 font-bold text-white">No connections yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">Connect email, a web service or an external tool. Workflows will tell you when a connection is required.</p></div>}

      {error && !adding && <div className="mt-5 rounded-2xl bg-red-400/10 p-4 text-sm text-red-200" role="alert">{error}</div>}

      {adding && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Connect a tool"><div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[30px] border border-white/10 bg-[#141414] p-5 shadow-2xl sm:rounded-[30px] sm:p-7"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-white">Connect this tool to Wersee</h2><p className="mt-1 text-sm text-white/40">Wersee tests the connection before saving it.</p></div><button onClick={() => setAdding(false)} aria-label="Close" className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div><div className="mt-6 grid grid-cols-3 gap-2">{([{ id: 'mcp', label: 'External tool', icon: Wrench }, { id: 'resend', label: 'Email', icon: Mail }, { id: 'http', label: 'Web service', icon: Cloud }] as const).map((item) => <button key={item.id} onClick={() => setProvider(item.id)} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-semibold ${provider === item.id ? 'border-violet-400/60 bg-violet-400/10 text-white' : 'border-white/10 bg-white/[0.025] text-white/45 hover:bg-white/5'}`}><item.icon className="h-5 w-5" /> {item.label}</button>)}</div><div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-xs font-semibold text-white/50">Connection name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={provider === 'mcp' ? 'Company knowledge tool' : provider === 'resend' ? 'Wersee email' : 'Customer database'} className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/50" /></label>{provider !== 'resend' && <label className="block"><span className="mb-2 block text-xs font-semibold text-white/50">Connection URL</span><input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} inputMode="url" placeholder="https://tools.example.com/mcp" className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/50" /><span className="mt-2 block text-[11px] text-white/30">Use the secure URL provided by this service.</span></label>}<label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/50"><KeyRound className="h-3.5 w-3.5" /> {provider === 'resend' ? 'Resend access key' : 'Access key (optional)'}</span><input value={accessKey} onChange={(event) => setAccessKey(event.target.value)} type="password" autoComplete="new-password" placeholder="Paste the access key provided by this service" className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/50" /></label>{provider !== 'resend' && <div><button onClick={() => setAdvanced((value) => !value)} className="flex min-h-10 w-full items-center justify-between text-left text-xs font-semibold text-white/40 hover:text-white"><span>Advanced settings</span>{advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>{advanced && <label className="block"><span className="mb-2 block text-xs text-white/40">Extra headers (JSON)</span><textarea value={headersText} onChange={(event) => setHeadersText(event.target.value)} placeholder={'{ "X-Workspace": "my-team" }'} className="min-h-28 w-full rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-white outline-none focus:border-violet-400/50" /></label>}</div>}{error && <div className="rounded-2xl bg-red-400/10 p-4 text-sm text-red-200" role="alert">{error}</div>}</div><div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => setAdding(false)} className="min-h-12 rounded-xl px-5 text-sm font-semibold text-white/45 hover:bg-white/5 hover:text-white">Cancel</button><button onClick={() => void connect()} disabled={busy === 'new' || (provider !== 'resend' && !baseUrl.trim()) || (provider === 'resend' && !accessKey.trim())} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black disabled:opacity-40">{busy === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Connect and test</button></div></div></div>}
    </div>
  );
};
