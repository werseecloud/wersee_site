import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  ChevronRight,
  CircleOff,
  Clipboard,
  ExternalLink,
  HardDrive,
  Loader2,
  MessageSquare,
  PackagePlus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Unplug,
  WalletCards,
  Wrench,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { appToast } from '../../../lib/feedback';

const MCP_URL = 'https://mcp.wersee.com/v1';
const ALL_CAPABILITIES = ['payments', 'listings', 'messages', 'management', 'storage', 'development', 'analytics'] as const;
type Capability = typeof ALL_CAPABILITIES[number];

type McpProfile = {
  id: string;
  user_id: string;
  business_id: string | null;
  name: string;
  status: 'active' | 'disabled';
  capabilities: Capability[];
  instructions: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type BusinessOption = { id: string; name: string };
type AuditRow = {
  id: number;
  tool_name: string;
  capability: Capability;
  risk_level: string;
  status: string;
  created_at: string;
};

type OAuthGrant = NonNullable<Awaited<ReturnType<typeof supabase.auth.oauth.listGrants>>['data']>[number];

const capabilityCards: Array<{
  id: Capability;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'payments', label: 'Payments', description: 'Create payment links and manage invoices or subscriptions.', icon: WalletCards },
  { id: 'listings', label: 'Listings', description: 'Draft, edit, publish, diagnose, and archive listings.', icon: PackagePlus },
  { id: 'messages', label: 'Messages', description: 'Read chats and send encrypted messages after confirmation.', icon: MessageSquare },
  { id: 'management', label: 'Management', description: 'Businesses, orders, CRM, forms, teams, ads, calls, and operations.', icon: Wrench },
  { id: 'storage', label: 'Storage', description: 'List, upload text, download, rename, move, and delete owned files.', icon: HardDrive },
  { id: 'development', label: 'Development', description: 'Create website drafts and work with safe development features.', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', description: 'Read real sales, listing, and operating performance.', icon: Bot },
];

const statusTone: Record<string, string> = {
  completed: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  previewed: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  failed: 'text-red-300 bg-red-500/10 border-red-500/20',
  denied: 'text-gray-300 bg-white/5 border-white/10',
};

export const McpServerSettings = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<McpProfile | null>(null);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [activity, setActivity] = useState<AuditRow[]>([]);
  const [grants, setGrants] = useState<OAuthGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('My Wersee MCP');
  const [businessId, setBusinessId] = useState('');
  const [capabilities, setCapabilities] = useState<Capability[]>([...ALL_CAPABILITIES]);
  const [instructions, setInstructions] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Sign in to manage your MCP server.');
      setUserId(userData.user.id);
      const [profileResult, businessResult, activityResult, grantsResult] = await Promise.all([
        supabase.from('mcp_servers').select('*').eq('user_id', userData.user.id).maybeSingle(),
        supabase.from('businesses').select('id,name').order('name', { ascending: true }),
        supabase.from('mcp_tool_audit_logs').select('id,tool_name,capability,risk_level,status,created_at').eq('user_id', userData.user.id).order('created_at', { ascending: false }).limit(20),
        supabase.auth.oauth.listGrants(),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (businessResult.error) throw businessResult.error;
      if (activityResult.error) throw activityResult.error;
      if (grantsResult.error) throw grantsResult.error;
      const nextProfile = profileResult.data as McpProfile | null;
      setProfile(nextProfile);
      setBusinesses((businessResult.data || []) as BusinessOption[]);
      setActivity((activityResult.data || []) as AuditRow[]);
      setGrants((grantsResult.data || []) as OAuthGrant[]);
      if (nextProfile) {
        setName(nextProfile.name);
        setBusinessId(nextProfile.business_id || '');
        setCapabilities(nextProfile.capabilities);
        setInstructions(nextProfile.instructions || '');
      }
    } catch (error) {
      console.error('MCP settings could not be loaded:', error);
      appToast(error instanceof Error ? error.message : 'MCP settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedBusiness = useMemo(() => businesses.find((business) => business.id === businessId) || null, [businessId, businesses]);

  const toggleCapability = (capability: Capability) => {
    setCapabilities((current) => current.includes(capability)
      ? current.length === 1 ? current : current.filter((item) => item !== capability)
      : [...current, capability]);
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        business_id: businessId || null,
        name: name.trim() || 'My Wersee MCP',
        capabilities,
        instructions: instructions.trim(),
        status: profile?.status || 'active',
        disabled_at: profile?.status === 'disabled' ? new Date().toISOString() : null,
      };
      const query = profile
        ? supabase.from('mcp_servers').update(payload).eq('id', profile.id)
        : supabase.from('mcp_servers').insert(payload);
      const { data, error } = await query.select('*').single();
      if (error) throw error;
      setProfile(data as McpProfile);
      appToast(profile ? 'MCP server settings saved.' : 'Your Wersee MCP server is ready to connect.');
    } catch (error) {
      console.error('MCP settings could not be saved:', error);
      appToast(error instanceof Error ? error.message : 'MCP settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleServer = async () => {
    if (!profile) return;
    const nextStatus = profile.status === 'active' ? 'disabled' : 'active';
    setSaving(true);
    try {
      const { data, error } = await supabase.from('mcp_servers').update({
        status: nextStatus,
        disabled_at: nextStatus === 'disabled' ? new Date().toISOString() : null,
      }).eq('id', profile.id).select('*').single();
      if (error) throw error;
      setProfile(data as McpProfile);
      appToast(nextStatus === 'active' ? 'MCP server enabled.' : 'MCP server disabled. Existing OAuth access is not revoked automatically.');
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'The MCP server status could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const revoke = async (clientId: string) => {
    setRevoking(clientId);
    try {
      const { error } = await supabase.auth.oauth.revokeGrant({ clientId });
      if (error) throw error;
      setGrants((current) => current.filter((grant) => grant.client.id !== clientId));
      appToast('OAuth access revoked. Active sessions and refresh tokens for this app were invalidated.');
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'OAuth access could not be revoked.');
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading MCP server settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-indigo-400/20 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_42%),#111113]">
        <div className="p-5 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-300" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Wersee Business MCP</p>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Run your business through text</h3>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-6">
                Connect ChatGPT or another MCP client to real Wersee tools. Wersee OAuth identifies your account, RLS protects your data, and every mutation needs a matching one-time confirmation.
              </p>
            </div>
            <div className={`inline-flex self-start items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold ${profile?.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-white/5 text-gray-400 border-white/10'}`}>
              <span className={`w-2 h-2 rounded-full ${profile?.status === 'active' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              {profile ? (profile.status === 'active' ? 'Server active' : 'Server disabled') : 'Not created yet'}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs md:text-sm text-gray-200 break-all">
              {MCP_URL}
            </div>
            <button onClick={copyUrl} className="px-4 py-3 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy connect link'}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">1. Add MCP URL</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">2. Continue with Wersee account</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">3. Approve access</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')} disabled={!profile || profile.status !== 'active'} className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 transition-colors">
              Open ChatGPT <ExternalLink className="w-4 h-4" />
            </button>
            {profile && (
              <button onClick={toggleServer} disabled={saving} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-sm font-semibold flex items-center gap-2 transition-colors">
                {profile.status === 'active' ? <CircleOff className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                {profile.status === 'active' ? 'Disable server' : 'Enable server'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] border border-white/5 rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Server configuration</h3>
            <p className="text-xs text-gray-500 mt-1">The MCP service runs separately on mcp.wersee.com and only receives the capabilities selected here.</p>
          </div>
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Server name</span>
            <input value={name} onChange={(event) => setName(event.target.value.slice(0, 80))} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60" placeholder="My Wersee MCP" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Business context</span>
            <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60">
              <option value="">Personal account only</option>
              {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
          {capabilityCards.map(({ id, label, description, icon: Icon }) => {
            const enabled = capabilities.includes(id);
            return (
              <button key={id} type="button" onClick={() => toggleCapability(id)} aria-pressed={enabled} className={`text-left rounded-xl border p-4 transition-colors ${enabled ? 'bg-indigo-500/10 border-indigo-400/30' : 'bg-black/30 border-white/5 hover:border-white/15'}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-gray-500'}`}><Icon className="w-4 h-4" /></span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">{label}{enabled && <Check className="w-3.5 h-3.5 text-emerald-400" />}</span>
                    <span className="block text-xs leading-5 text-gray-500 mt-1">{description}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <label className="space-y-2 block">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Instructions for your MCP</span>
          <textarea value={instructions} onChange={(event) => setInstructions(event.target.value.slice(0, 4000))} rows={4} className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60" placeholder="Example: Prefer concise summaries and use EUR for this business." />
          <span className="block text-right text-[11px] text-gray-600">{instructions.length}/4000</span>
        </label>

        <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-gray-500">{selectedBusiness ? `Tools run inside ${selectedBusiness.name}.` : 'Business-only tools will ask you to select a business first.'}</p>
          <button onClick={save} disabled={saving || capabilities.length === 0} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-50 text-sm font-semibold flex items-center gap-2 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {profile ? 'Save server' : 'Create MCP server'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[#141414] border border-white/5 rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div><h3 className="text-lg font-bold text-white">Connected applications</h3><p className="text-xs text-gray-500 mt-1">OAuth clients you approved with your Wersee account.</p></div>
            <Unplug className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {grants.length ? grants.map((grant) => (
              <div key={grant.client.id} className="rounded-xl border border-white/5 bg-black/30 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{grant.client.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{grant.scopes.join(' · ')} · connected {formatDistanceToNow(new Date(grant.granted_at), { addSuffix: true })}</p>
                </div>
                <button onClick={() => revoke(grant.client.id)} disabled={revoking === grant.client.id} className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold shrink-0">
                  {revoking === grant.client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Revoke'}
                </button>
              </div>
            )) : <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-gray-500">No applications connected yet.</p>}
          </div>
        </section>

        <section className="bg-[#141414] border border-white/5 rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div><h3 className="text-lg font-bold text-white">Recent MCP activity</h3><p className="text-xs text-gray-500 mt-1">Sanitized tool history. Message text and secrets are never logged here.</p></div>
            <button onClick={() => void load()} aria-label="Refresh MCP activity" className="p-2 rounded-lg hover:bg-white/5 text-gray-500"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            {activity.length ? activity.map((row) => (
              <div key={row.id} className="rounded-xl border border-white/5 bg-black/30 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="font-mono text-xs text-gray-200 truncate">{row.tool_name}</p><p className="text-[11px] text-gray-600 mt-1">{row.capability} · {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}</p></div>
                <span className={`px-2 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${statusTone[row.status] || statusTone.denied}`}>{row.status}</span>
              </div>
            )) : <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-gray-500">No MCP tool activity yet.</p>}
          </div>
        </section>
      </div>

      <p className="px-1 text-xs leading-5 text-gray-600">
        Safety boundary: MCP can use the Wersee business tools you enable, but cannot read or change developer secrets, OAuth tokens, payment credentials, arbitrary SQL, or server shell commands.
      </p>
    </div>
  );
};
