import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const actions = [
  ['approve', 'Approve'],
  ['request_changes', 'Request changes'],
  ['reject', 'Reject'],
  ['suspend', 'Suspend'],
  ['disable_payments', 'Disable payments'],
] as const;

export default function AdminInvestmentsPage() {
  const { campaignId } = useParams();
  const [listings, setListings] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let query = supabase.from('wersee_invest_listings').select('*, business:businesses(name)').order('created_at', { ascending: false });
    if (campaignId) query = query.eq('id', campaignId);
    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [campaignId]);

  const review = async (listing: any, decision: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = {};
    if (decision === 'approve') {
      patch.status = 'approved';
      patch.compliance_approved = true;
    } else if (decision === 'request_changes') {
      patch.status = 'changes_required';
    } else if (decision === 'reject') {
      patch.status = 'cancelled';
    } else if (decision === 'suspend') {
      patch.status = 'suspended';
    } else if (decision === 'disable_payments') {
      patch.payments_enabled = false;
    }

    await supabase.from('wersee_listing_compliance_reviews').insert({
      listing_id: listing.id,
      reviewer_user_id: user?.id,
      decision,
      notes: note || null,
      private_notes: note || null,
    });
    await supabase.from('wersee_invest_listings').update(patch).eq('id', listing.id);
    await supabase.from('wersee_listing_audit_events').insert({
      listing_id: listing.id,
      actor_user_id: user?.id,
      actor_type: 'admin',
      action: `review_${decision}`,
      subject_table: 'wersee_invest_listings',
      subject_id: listing.id,
      metadata: { note_present: Boolean(note) },
    });
    setNote('');
    await load();
  };

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Wersee Invest Review</h1>
        <p className="mt-2 text-sm text-gray-500">Company owners cannot approve themselves, enable payments, or verify financial and valuation fields.</p>
      </div>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Private review note" className="mb-5 min-h-24 w-full rounded-xl border border-white/10 bg-black p-4 text-sm outline-none focus:border-blue-400" />
      {loading ? (
        <div className="text-gray-500">Loading listings...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          {listings.map((listing) => (
            <div key={listing.id} className="grid gap-4 border-b border-white/5 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-xl font-black">{listing.title}</div>
                <div className="mt-1 text-sm text-gray-500">{listing.business?.name} · {listing.funding_mode} · {listing.status}</div>
                <div className="mt-2 text-xs text-gray-500">Payments: {listing.payments_enabled ? 'enabled' : 'disabled'} · Compliance: {listing.compliance_approved ? 'approved' : 'not approved'}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {actions.map(([id, label]) => (
                  <button key={id} onClick={() => review(listing, id)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-gray-300 hover:bg-white/5">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {listings.length === 0 && <div className="p-12 text-center text-gray-500">No listings to review.</div>}
        </div>
      )}
    </main>
  );
}
