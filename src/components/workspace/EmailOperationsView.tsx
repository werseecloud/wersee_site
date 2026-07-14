import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type JobRow = {
  id: string;
  template_key: string;
  original_recipient: string;
  effective_recipient: string;
  delivery_mode: string;
  status: string;
  attempts: number;
  resend_email_id: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  event?: {
    event_type: string;
    category: string;
    source: string;
    source_id: string | null;
    user_id: string | null;
    team_id: string | null;
  };
};

type Overview = {
  queued: number;
  processing: number;
  sent: number;
  delivered: number;
  delayed: number;
  failed: number;
  bounced: number;
  complained: number;
  suppressed: number;
  dead_letter: number;
  last_24h: number;
  last_7d: number;
  last_30d: number;
};

type DomainStatus = {
  domain: string;
  status: string;
  spf_status: string;
  dkim_status: string;
  dmarc_status: string;
  region: string | null;
  production_sending_enabled: boolean;
  webhook_connected: boolean;
  last_checked_at: string | null;
  last_successful_send_at: string | null;
  last_error: string | null;
};

const tabs = ['overview', 'queued', 'sent', 'delivered', 'delayed', 'failed', 'bounced', 'complaints', 'suppressed', 'domain'] as const;
type Tab = typeof tabs[number];

export function EmailOperationsView() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const statusFilter = useMemo(() => {
    const map: Partial<Record<Tab, string[]>> = {
      queued: ['pending', 'scheduled'],
      sent: ['sent'],
      delivered: ['delivered'],
      delayed: ['delayed'],
      failed: ['failed', 'dead_letter'],
      bounced: ['bounced'],
      complaints: ['complained'],
      suppressed: ['suppressed'],
    };
    return map[activeTab] ?? null;
  }, [activeTab]);

  async function load() {
    setLoading(true);
    const [overviewRes, domainRes] = await Promise.all([
      supabase.from('platform_email_admin_overview').select('*').maybeSingle(),
      supabase.from('platform_email_domain_status').select('*').eq('domain', 'updates.wersee.com').maybeSingle(),
    ]);
    if (!overviewRes.error) setOverview((overviewRes.data as Overview | null) ?? null);
    if (!domainRes.error) setDomainStatus((domainRes.data as DomainStatus | null) ?? null);

    let jobQuery = supabase
      .from('platform_email_jobs')
      .select('id,template_key,original_recipient,effective_recipient,delivery_mode,status,attempts,resend_email_id,last_error_code,last_error_message,created_at,event:platform_email_events(event_type,category,source,source_id,user_id,team_id)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter) {
      jobQuery = jobQuery.in('status', statusFilter);
    }

    const jobsRes = await jobQuery;
    if (!jobsRes.error) setJobs((jobsRes.data as unknown as JobRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [activeTab]);

  async function retry(jobId: string) {
    await supabase.rpc('platform_email_admin_retry_job', { p_job_id: jobId });
    load();
  }

  const filteredJobs = jobs.filter((job) => {
    const haystack = [
      job.template_key,
      job.status,
      job.delivery_mode,
      job.original_recipient,
      job.effective_recipient,
      job.resend_email_id ?? '',
      job.event?.event_type ?? '',
      job.event?.source ?? '',
    ].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="min-h-full bg-[#080808] text-white p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Email Operations</h1>
          <p className="text-sm text-gray-400 mt-1">Platform transactional queue, delivery, suppressions, domain, and webhook status.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 bg-white text-black rounded-lg text-sm font-bold">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap ${activeTab === tab ? 'bg-white text-black font-bold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading email operations...
        </div>
      ) : activeTab === 'overview' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(overview ?? {}).map(([key, value]) => (
            <div key={key} className="border border-white/10 bg-white/[0.03] rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">{key.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-black mt-2">{value}</p>
            </div>
          ))}
        </div>
      ) : activeTab === 'domain' ? (
        <div className="border border-white/10 bg-white/[0.03] rounded-lg overflow-hidden">
          {domainStatus ? (
            <div className="grid md:grid-cols-2 gap-px bg-white/10">
              {Object.entries(domainStatus).map(([key, value]) => (
                <div key={key} className="bg-[#0d0d0d] p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-500">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-white mt-2">{String(value ?? 'Not checked')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-gray-400">No domain status has been recorded.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/30"
              placeholder="Search template, event, recipient, status, source, or Resend ID"
            />
          </label>

          <div className="overflow-x-auto border border-white/10 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Template</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">Original recipient</th>
                  <th className="text-left p-3">Effective recipient</th>
                  <th className="text-left p-3">Mode</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Attempts</th>
                  <th className="text-left p-3">Resend ID</th>
                  <th className="text-left p-3">Last error</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="bg-white/[0.02]">
                    <td className="p-3 text-gray-300 whitespace-nowrap">{new Date(job.created_at).toLocaleString()}</td>
                    <td className="p-3">{job.template_key}</td>
                    <td className="p-3 text-gray-300">{job.event?.event_type ?? '-'}</td>
                    <td className="p-3 text-gray-300">{job.original_recipient}</td>
                    <td className="p-3 text-gray-300">{job.effective_recipient}</td>
                    <td className="p-3">{job.delivery_mode}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 ${job.status === 'delivered' ? 'text-emerald-400' : job.status === 'failed' || job.status === 'dead_letter' ? 'text-red-400' : 'text-gray-300'}`}>
                        {job.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : job.status === 'failed' || job.status === 'dead_letter' ? <AlertTriangle className="w-3 h-3" /> : null}
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3">{job.attempts}</td>
                    <td className="p-3 text-gray-300">{job.resend_email_id ?? '-'}</td>
                    <td className="p-3 text-gray-400 max-w-xs truncate">{job.last_error_message ?? job.last_error_code ?? '-'}</td>
                    <td className="p-3">
                      {['failed', 'dead_letter', 'delayed'].includes(job.status) && (
                        <button onClick={() => retry(job.id)} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs">
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
