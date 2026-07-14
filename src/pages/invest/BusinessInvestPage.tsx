import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const wizardSteps = [
  'Company',
  'Funding type',
  'Story',
  'Financials',
  'Valuation',
  'Funding target',
  'Use of funds',
  'Team',
  'Documents',
  'Risks',
  'Rewards or preorder terms',
  'Compliance',
  'Preview',
  'Submit for review',
];

const fundingModes = ['support', 'reward', 'preorder', 'regulated_investment'];
const inputClass = 'w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-blue-400';

export default function BusinessInvestPage({ mode = 'list' }: { mode?: 'list' | 'new' | 'edit' }) {
  const navigate = useNavigate();
  const { businessId, campaignId } = useParams();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState(businessId === 'select' ? '' : businessId || '');
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    title: '',
    slug: '',
    short_description: '',
    full_description: '',
    funding_mode: 'support',
    sector: '',
    business_stage: '',
    target_amount_minor: 100000,
    minimum_amount_minor: 500,
    maximum_amount_minor: null,
    currency: 'eur',
    problem: '',
    solution: '',
    market: '',
    business_model: '',
    products: '',
    traction: '',
    compliance_note: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: businessData } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
      setBusinesses(businessData || []);
      const targetBusiness = selectedBusiness || businessData?.[0]?.id;
      if (!selectedBusiness && targetBusiness) setSelectedBusiness(targetBusiness);
      if (targetBusiness) {
        const { data } = await supabase.from('wersee_invest_listings').select('*').eq('business_id', targetBusiness).order('created_at', { ascending: false });
        setListings(data || []);
      }
      if (campaignId) {
        const { data } = await supabase.from('wersee_invest_listings').select('*').eq('id', campaignId).maybeSingle();
        if (data) setForm((prev: any) => ({ ...prev, ...data }));
      }
    };
    load();
  }, [selectedBusiness, campaignId]);

  const requiredReady = useMemo(() => {
    return Boolean(selectedBusiness && form.title && form.slug && form.short_description && form.funding_mode && form.currency);
  }, [selectedBusiness, form]);

  useEffect(() => {
    if (mode === 'list' || !selectedBusiness || !form.title) return;
    const timer = window.setTimeout(() => {
      saveDraft(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [form, selectedBusiness, mode]);

  const saveDraft = async (showSaving = true) => {
    if (!selectedBusiness || !form.title) return;
    if (showSaving) setSaving(true);
    const payload = {
      business_id: selectedBusiness,
      title: form.title,
      slug: slugify(form.slug || form.title),
      short_description: form.short_description,
      full_description: form.full_description,
      funding_mode: form.funding_mode,
      status: form.status && form.status !== 'draft' ? form.status : 'draft',
      sector: form.sector || null,
      business_stage: form.business_stage || null,
      target_amount_minor: Number(form.target_amount_minor || 0),
      minimum_amount_minor: Number(form.minimum_amount_minor || 0),
      maximum_amount_minor: form.maximum_amount_minor ? Number(form.maximum_amount_minor) : null,
      currency: String(form.currency || 'eur').toLowerCase(),
      problem: form.problem || null,
      solution: form.solution || null,
      market: form.market || null,
      business_model: form.business_model || null,
      products: form.products || null,
      traction: form.traction || null,
    };
    const request = campaignId
      ? supabase.from('wersee_invest_listings').update(payload).eq('id', campaignId)
      : supabase.from('wersee_invest_listings').insert(payload).select().single();
    const { data, error } = await request;
    if (!error) {
      setSavedAt(new Date().toLocaleTimeString());
      if (!campaignId && data?.id) navigate(`/workspace/businesses/${selectedBusiness}/invest/${data.id}/edit`, { replace: true });
    }
    setSaving(false);
  };

  const submitForReview = async () => {
    if (!campaignId || !requiredReady) return;
    await saveDraft();
    await supabase.from('wersee_invest_listings').update({ status: 'submitted' }).eq('id', campaignId);
    navigate(`/workspace/businesses/${selectedBusiness}/invest`);
  };

  if (mode === 'new' || mode === 'edit') {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <button onClick={() => navigate(`/workspace/businesses/${selectedBusiness || 'select'}/invest`)} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </button>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            {wizardSteps.map((step, index) => (
              <button key={step} onClick={() => setActiveStep(index)} className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${activeStep === index ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'}`}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">{index + 1}</span>
                {step}
              </button>
            ))}
          </aside>
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">Wersee company listing wizard</h1>
                <p className="mt-1 text-sm text-gray-500">Draft {'->'} Submitted {'->'} Under review {'->'} Approved {'->'} Scheduled or Live</p>
              </div>
              <div className="flex items-center gap-3">
                {savedAt && <span className="text-xs text-gray-500">Autosaved {savedAt}</span>}
                <button onClick={() => saveDraft()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-black hover:bg-white/5">
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>

            {activeStep === 0 && (
              <div className="space-y-4">
                <Field label="Business">
                  <select value={selectedBusiness} onChange={(event) => setSelectedBusiness(event.target.value)} className={inputClass}>
                    {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
                  </select>
                </Field>
                <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value, slug: form.slug || slugify(event.target.value) })} /></Field>
                <Field label="Slug"><input className={inputClass} value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></Field>
                <Field label="Short description"><textarea className={`${inputClass} min-h-28`} value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} /></Field>
              </div>
            )}

            {activeStep === 1 && (
              <div className="grid gap-3 md:grid-cols-2">
                {fundingModes.map((modeOption) => (
                  <button key={modeOption} onClick={() => setForm({ ...form, funding_mode: modeOption })} className={`rounded-2xl border p-4 text-left ${form.funding_mode === modeOption ? 'border-white bg-white text-black' : 'border-white/10 bg-black/30'}`}>
                    <div className="font-black">{modeOption}</div>
                    <p className="mt-2 text-sm opacity-70">{modeOption === 'regulated_investment' ? 'Payments disabled. Users can register interest only.' : 'Stripe support allowed after platform and legal checks. No ownership or return promises.'}</p>
                  </button>
                ))}
              </div>
            )}

            {activeStep === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                {['full_description', 'problem', 'solution', 'market', 'business_model', 'products', 'traction'].map((key) => (
                  <Field key={key} label={labelize(key)}><textarea className={`${inputClass} min-h-28`} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></Field>
                ))}
              </div>
            )}

            {activeStep === 5 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Target minor units"><input className={inputClass} type="number" value={form.target_amount_minor || ''} onChange={(event) => setForm({ ...form, target_amount_minor: event.target.value })} /></Field>
                <Field label="Minimum minor units"><input className={inputClass} type="number" value={form.minimum_amount_minor || ''} onChange={(event) => setForm({ ...form, minimum_amount_minor: event.target.value })} /></Field>
                <Field label="Maximum minor units"><input className={inputClass} type="number" value={form.maximum_amount_minor || ''} onChange={(event) => setForm({ ...form, maximum_amount_minor: event.target.value || null })} /></Field>
                <Field label="Currency"><input className={inputClass} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toLowerCase().slice(0, 3) })} /></Field>
              </div>
            )}

            {! [0, 1, 2, 5, 13].includes(activeStep) && (
              <div className="rounded-2xl border border-white/10 p-6 text-sm text-gray-400">
                Add detailed {wizardSteps[activeStep].toLowerCase()} records from the listing detail tables after the draft is saved. Required fields are enforced before publication by reviewer workflow.
              </div>
            )}

            {activeStep === 13 && (
              <div className="space-y-4">
                <div className={`rounded-2xl border p-4 ${requiredReady ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-red-400/30 bg-red-400/10'}`}>
                  <div className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> Publication readiness</div>
                  <p className="mt-2 text-sm text-gray-300">{requiredReady ? 'Minimum draft fields are complete. Reviewers must still approve compliance and payments.' : 'Company, title, slug, short description, funding type, and currency are required.'}</p>
                </div>
                <button onClick={submitForReview} disabled={!requiredReady || !campaignId} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-50">
                  Submit for review
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Wersee Invest listings</h1>
          <p className="mt-2 text-sm text-gray-500">Company owners can draft listings. Only reviewers can approve, schedule, publish, or enable payments.</p>
        </div>
        <button onClick={() => navigate(`/workspace/businesses/${selectedBusiness || 'select'}/invest/new`)} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-black">
          New listing
        </button>
      </div>
      <div className="mb-4">
        <select value={selectedBusiness} onChange={(event) => setSelectedBusiness(event.target.value)} className={`${inputClass} max-w-sm`}>
          {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {listings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No Wersee Invest listings yet.</div>
        ) : listings.map((listing) => (
          <button key={listing.id} onClick={() => navigate(`/workspace/businesses/${listing.business_id}/invest/${listing.id}/edit`)} className="grid w-full gap-3 border-b border-white/5 p-4 text-left hover:bg-white/[0.03] md:grid-cols-4">
            <div className="font-black">{listing.title}</div>
            <div className="text-gray-400">{listing.funding_mode}</div>
            <div className="text-gray-400">{listing.status}</div>
            <div className="text-gray-500">{listing.currency?.toUpperCase?.()}</div>
          </button>
        ))}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>{children}</label>;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
