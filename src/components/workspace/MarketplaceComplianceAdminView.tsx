import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSearch, Loader2, LockKeyhole, Search, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const MarketplaceComplianceAdminView = () => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sellers, setSellers] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [{ data: sellerRows, error: sellerError }, { data: caseRows, error: caseError }] = await Promise.all([
          supabase
            .from('seller_profiles')
            .select('id,user_id,display_name,country_code,account_type,store_status,created_at,seller_compliance_status(*),stripe_connected_accounts(*),seller_classifications(*)')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase
            .from('compliance_cases')
            .select('id,case_type,status,severity,reason,seller_profile_id,created_at')
            .order('created_at', { ascending: false })
            .limit(50),
        ]);
        if (sellerError) throw sellerError;
        if (caseError) throw caseError;
        setSellers(sellerRows || []);
        setCases(caseRows || []);
      } catch (err: any) {
        setError(err.message || 'Could not load compliance dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = sellers.filter((seller) => {
    const haystack = `${seller.display_name} ${seller.country_code} ${seller.account_type} ${seller.store_status}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-300" />
        Loading compliance records...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-200">
              <ShieldAlert className="h-4 w-4" />
              Restricted admin
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Marketplace compliance</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
              Administrators can review seller status, outstanding requirements, trader status, disputes, held amounts and audit trails. Stripe verification can be synchronized, but not manually marked as passed.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sellers"
              className="w-full rounded-2xl border border-white/10 bg-[#111] py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Sellers', sellers.length, FileSearch],
            ['Open cases', cases.filter((c) => c.status !== 'closed').length, AlertTriangle],
            ['Payout blocked', sellers.filter((s) => s.seller_compliance_status?.[0]?.payout_allowed === false).length, LockKeyhole],
            ['Payout eligible', sellers.filter((s) => s.seller_compliance_status?.[0]?.payout_allowed === true).length, CheckCircle2],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-[#111] p-5">
              <Icon className="mb-4 h-5 w-5 text-blue-300" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-black">Seller review queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="p-4">Seller</th>
                  <th className="p-4">Store</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Trader status</th>
                  <th className="p-4">Stripe</th>
                  <th className="p-4">Payout</th>
                  <th className="p-4">Risk flags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((seller) => {
                  const compliance = seller.seller_compliance_status?.[0];
                  const stripe = seller.stripe_connected_accounts?.[0];
                  const classification = seller.seller_classifications?.[0];
                  return (
                    <tr key={seller.id} className="border-t border-white/5">
                      <td className="p-4">
                        <p className="font-bold text-white">{seller.display_name}</p>
                        <p className="font-mono text-xs text-gray-500">{seller.id}</p>
                      </td>
                      <td className="p-4 text-gray-300">{seller.store_status}</td>
                      <td className="p-4 text-gray-300">{classification?.classification || seller.account_type}</td>
                      <td className="p-4 text-gray-300">{classification?.trader_status || 'not_declared'}</td>
                      <td className="p-4 text-gray-300">{compliance?.stripe_payment_status || (stripe ? 'connect_created' : 'connect_not_created')}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${compliance?.payout_allowed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                          {compliance?.payout_eligibility || 'not_eligible'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {classification?.suspicious_classification ? 'Classification review' : compliance?.risk_blocked ? 'Risk block' : 'None'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111] p-5">
          <h2 className="mb-4 text-xl font-black">Open cases</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {cases.length === 0 ? (
              <p className="text-sm text-gray-500">No compliance cases are visible to this role.</p>
            ) : cases.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{item.case_type.replace(/_/g, ' ')}</p>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-gray-300">{item.severity}</span>
                </div>
                <p className="text-sm text-gray-400">{item.reason}</p>
                <p className="mt-3 font-mono text-xs text-gray-600">{item.seller_profile_id}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
