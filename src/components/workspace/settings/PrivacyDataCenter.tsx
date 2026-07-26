import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Download, ExternalLink, FileArchive, Loader2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  getDefaultPrivacyCategories,
  getStoredPrivacyConsent,
  openPrivacyChoices,
  savePrivacyConsent,
  type PrivacyCategories,
} from '../../../lib/privacyConsent';
import { trustCenterAction } from '../../../lib/trustCenter';

const privacyOptions: Array<{ key: keyof PrivacyCategories; label: string; detail: string; locked?: boolean }> = [
  { key: 'necessary', label: 'Necessary', detail: 'Authentication, security, checkout and saved choices.', locked: true },
  { key: 'preferences', label: 'Preferences', detail: 'Language and interface choices.' },
  { key: 'analytics', label: 'Analytics', detail: 'Product performance and reliability measurement.' },
  { key: 'marketing', label: 'Marketing', detail: 'Campaign measurement and relevant promotions.' },
  { key: 'personalization', label: 'Personalization', detail: 'Recommendations based on your activity.' },
];

const requestTypes = [
  ['access', 'Access my data'],
  ['correction', 'Correct information'],
  ['object', 'Object to processing'],
  ['restrict', 'Restrict processing'],
  ['automated_decision_review', 'Review an automated decision'],
] as const;

export const PrivacyDataCenter = () => {
  const [categories, setCategories] = useState<PrivacyCategories>(() => getStoredPrivacyConsent()?.categories || getDefaultPrivacyCategories());
  const [exports, setExports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [deletions, setDeletions] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [aiReviews, setAiReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const userId = auth.user.id;
      const [exportResult, requestResult, deletionResult, integrationResult, aiResult] = await Promise.all([
        supabase.from('data_exports').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('privacy_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('deletion_jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_integrations').select('id,provider,scopes,status,connected_at,last_used_at').eq('user_id', userId).order('connected_at', { ascending: false }),
        supabase.from('ai_decision_reviews').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      ]);
      const firstError = [exportResult.error, requestResult.error, deletionResult.error, integrationResult.error, aiResult.error].find(Boolean);
      if (firstError) throw firstError;
      setExports(exportResult.data || []);
      setRequests(requestResult.data || []);
      setDeletions(deletionResult.data || []);
      setIntegrations(integrationResult.data || []);
      setAiReviews(aiResult.data || []);
    } catch (loadError: any) {
      setError(loadError?.message || 'Privacy records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = async (key: string, operation: () => Promise<any>, success: string) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await operation();
      setMessage(success);
      await load();
    } catch (operationError: any) {
      setError(operationError?.message || 'The request could not be completed.');
    } finally {
      setBusy('');
    }
  };

  const saveChoices = () => run('consent', async () => {
    await savePrivacyConsent(categories, 'account_settings');
  }, 'Privacy choices saved.');

  const requestExport = () => run('export', () => trustCenterAction('request-export', { exportType: 'full' }), 'Your export is being prepared in the background.');

  const downloadExport = async (exportId: string) => run(`download:${exportId}`, async () => {
    const result = await trustCenterAction<{ signedUrl: string }>('download-export', { exportId });
    window.location.assign(result.signedUrl);
  }, 'Secure download started.');

  const submitRequest = (requestType: string) => run(`request:${requestType}`, () => trustCenterAction('privacy-request', { requestType }), 'Privacy request submitted.');

  const requestDeletion = () => run('deletion', () => trustCenterAction('request-deletion'), 'Account deletion scheduled. You can cancel it before processing begins.').finally(() => setShowDeletionConfirm(false));

  const cancelDeletion = (deletionId: string) => run(`cancel:${deletionId}`, () => trustCenterAction('cancel-deletion', { deletionId }), 'Account deletion cancelled.');

  const activeDeletion = deletions.find((item) => ['queued', 'scheduled', 'due', 'running', 'waiting_review'].includes(item.status));

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div>;

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div role="status" className={`rounded-2xl border p-4 text-sm ${error ? 'border-red-400/20 bg-red-400/10 text-red-100' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>
          {error || message}
        </div>
      )}

      <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-black text-white">Consent and tracking</h2>
            <p className="mt-1 text-sm text-white/45">Rejecting is as easy as accepting. Changes take effect immediately.</p>
          </div>
          <button onClick={openPrivacyChoices} className="text-left text-xs font-bold text-blue-300 hover:text-blue-200">Open consent sheet</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {privacyOptions.map((option) => (
            <label key={option.key} className="flex min-h-20 items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <span><span className="block text-sm font-bold text-white">{option.label}</span><span className="mt-1 block text-xs leading-4 text-white/40">{option.detail}</span></span>
              <input type="checkbox" checked={categories[option.key]} disabled={option.locked} onChange={(event) => setCategories((current) => ({ ...current, [option.key]: event.target.checked }))} className="mt-1 h-5 w-5 accent-white" />
            </label>
          ))}
        </div>
        <button disabled={busy === 'consent'} onClick={saveChoices} className="mt-4 flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-black disabled:opacity-50">
          {busy === 'consent' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save choices'}
        </button>
      </section>

      <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><h2 className="text-lg font-black text-white">Portable data export</h2><p className="mt-1 text-sm text-white/45">Machine-readable JSON and a manifest, prepared securely in the background.</p></div>
          <button disabled={busy === 'export'} onClick={requestExport} className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black disabled:opacity-50">
            {busy === 'export' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileArchive className="h-4 w-4" /> Request export</>}
          </button>
        </div>
        <div className="mt-5 space-y-2">
          {exports.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-white/35">No export requests yet.</p> : exports.map((item) => (
            <div key={item.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3"><div className="rounded-xl bg-white/[0.06] p-2.5"><Download className="h-4 w-4 text-white/60" /></div><div><p className="text-sm font-bold text-white">{item.export_type} export</p><p className="mt-0.5 text-xs text-white/35">{item.status} · {item.progress}% · {new Date(item.created_at).toLocaleString()}</p></div></div>
              {item.status === 'ready' && new Date(item.expires_at).getTime() > Date.now() && <button disabled={busy === `download:${item.id}`} onClick={() => downloadExport(item.id)} className="flex h-9 items-center justify-center gap-2 rounded-full bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15"><Download className="h-3.5 w-3.5" /> Download</button>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
        <h2 className="text-lg font-black text-white">Your data rights</h2>
        <p className="mt-1 text-sm text-white/45">Each request receives a case ID, deadline and status trail.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {requestTypes.map(([type, label]) => <button key={type} disabled={busy === `request:${type}`} onClick={() => submitRequest(type)} className="flex min-h-12 items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 text-left text-sm font-bold text-white hover:bg-white/[0.05] disabled:opacity-50"><span>{label}</span>{busy === `request:${type}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 text-white/30" />}</button>)}
        </div>
        {requests.length > 0 && <div className="mt-5 space-y-2">{requests.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-white/[0.025] px-4 py-3 text-xs"><span className="text-white/70">{item.case_id} · {String(item.request_type).replace(/_/g, ' ')}</span><span className="font-bold text-white/40">{item.status}</span></div>)}</div>}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-white"><ShieldCheck className="h-5 w-5 text-blue-300" /> Connected applications</h2>
          <div className="mt-4 space-y-2">{integrations.length === 0 ? <p className="text-sm text-white/35">No connected applications.</p> : integrations.map((item) => <div key={item.id} className="rounded-2xl border border-white/[0.07] p-3"><p className="text-sm font-bold capitalize text-white">{item.provider}</p><p className="mt-1 text-xs text-white/35">{item.status} · {(item.scopes || []).join(', ') || 'No scopes recorded'}</p></div>)}</div>
        </div>
        <div className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-white"><RefreshCw className="h-5 w-5 text-violet-300" /> Automated decisions</h2>
          <div className="mt-4 space-y-2">{aiReviews.length === 0 ? <p className="text-sm text-white/35">No important automated-decision reviews.</p> : aiReviews.map((item) => <div key={item.id} className="rounded-2xl border border-white/[0.07] p-3"><p className="text-sm font-bold text-white">{item.decision_type}</p><p className="mt-1 text-xs text-white/35">{item.status}</p></div>)}</div>
        </div>
      </section>

      <section className="rounded-3xl border border-red-400/15 bg-red-400/[0.04] p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-black text-white"><Trash2 className="h-5 w-5 text-red-300" /> Close and delete account</h2>
        {activeDeletion ? (
          <div className="mt-4 rounded-2xl border border-red-400/15 bg-black/20 p-4">
            <p className="text-sm font-bold text-white">Deletion {activeDeletion.status}</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Scheduled for {new Date(activeDeletion.scheduled_for).toLocaleString()}. Legal or financial records may be retained where required and are reviewed separately.</p>
            {['queued', 'scheduled', 'due'].includes(activeDeletion.status) && <button disabled={busy === `cancel:${activeDeletion.id}`} onClick={() => cancelDeletion(activeDeletion.id)} className="mt-3 h-10 rounded-full bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/15">Cancel deletion</button>}
          </div>
        ) : showDeletionConfirm ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-red-100"><AlertTriangle className="h-4 w-4" /> Confirm deletion request</p>
            <p className="mt-2 text-xs leading-5 text-red-100/60">Access is not removed immediately. A 30-day transition period lets you export data and cancel the request before processing begins.</p>
            <div className="mt-4 flex gap-2"><button onClick={() => setShowDeletionConfirm(false)} className="h-10 rounded-full bg-white/10 px-4 text-xs font-bold text-white">Keep account</button><button disabled={busy === 'deletion'} onClick={requestDeletion} className="h-10 rounded-full bg-red-500 px-4 text-xs font-black text-white disabled:opacity-50">Schedule deletion</button></div>
          </div>
        ) : (
          <button onClick={() => setShowDeletionConfirm(true)} className="mt-4 h-11 rounded-full border border-red-400/25 px-5 text-sm font-bold text-red-200 hover:bg-red-400/10">Request account deletion</button>
        )}
      </section>

      <button onClick={load} className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white"><Clock3 className="h-4 w-4" /> Refresh status</button>
    </div>
  );
};

