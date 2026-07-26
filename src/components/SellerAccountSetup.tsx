import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Check, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '../lib/countries';
import {
  EU_COUNTRY_CODES,
  getCurrentSellerDsaVerification,
  getEffectiveDsaCountryCode,
  isEuCountry,
  upsertDsaSellerVerification,
} from '../lib/dsaCompliance';

export const useSellerDeclaration = (enabled: boolean) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    if (!enabled || !user) {
      setDeclared(false);
      return;
    }

    let active = true;
    setLoading(true);
    getCurrentSellerDsaVerification(user.id)
      .then((verification) => {
        if (active) setDeclared(Boolean(verification?.country_code && verification?.trader_status));
      })
      .catch((error) => console.error('Could not load seller declaration', error))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [enabled, user]);

  return { user, loading, declared, markDeclared: () => setDeclared(true) };
};

type SellerAccountSetupProps = {
  onComplete: () => void;
};

export const SellerAccountSetup = ({ onComplete }: SellerAccountSetupProps) => {
  const { user } = useAuth();
  const [countryCode, setCountryCode] = useState(getEffectiveDsaCountryCode());
  const [sellerType, setSellerType] = useState<'consumer' | 'business' | ''>('');
  const [legalName, setLegalName] = useState(String(user?.user_metadata?.full_name || ''));
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const countryOptions = useMemo(() => {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const codes = new Set([...COUNTRIES.map((country) => country.code), ...EU_COUNTRY_CODES]);
    return Array.from(codes)
      .map((code) => ({ code, name: names.of(code) || code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const save = async () => {
    const needsBusinessDetails = sellerType === 'business' && isEuCountry(countryCode);
    if (!user || !countryCode || !sellerType || (needsBusinessDetails && (!legalName.trim() || !registeredAddress.trim()))) {
      setError(needsBusinessDetails ? 'Complete the required business details to continue.' : 'Select your country and seller type to continue.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await upsertDsaSellerVerification({
        seller_id: user.id,
        trader_status: sellerType,
        legal_name: legalName.trim() || String(user.user_metadata?.full_name || user.email || '').trim(),
        contact_email: user.email || '',
        country_code: countryCode,
        registered_address: registeredAddress.trim() || null,
        registration_number: registrationNumber.trim() || null,
        status: sellerType === 'consumer' || !isEuCountry(countryCode) ? 'not_required' : 'pending',
      });
      onComplete();
    } catch (saveError: any) {
      console.error('Could not save seller declaration', saveError);
      setError(saveError?.message || 'We could not save your seller details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar">
      <div className="mx-auto max-w-md">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h4 className="text-2xl font-black tracking-tight text-white">Finish your seller account</h4>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Before you create your first product, tell buyers whether you sell privately or as a business. This information is required for EU marketplace transparency.
        </p>

        <label className="mt-7 block text-xs font-bold uppercase tracking-widest text-gray-400">
          Country of residence
          <select
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3.5 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-indigo-400/70"
          >
            <option value="">Select your country</option>
            {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
        </label>

        <fieldset className="mt-6">
          <legend className="text-xs font-bold uppercase tracking-widest text-gray-400">Seller type</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([
              ['consumer', 'Private seller', 'I sell on my own behalf, outside a business.', UserRound],
              ['business', 'Business seller', 'I sell as a company or professional trader.', Building2],
            ] as const).map(([value, title, description, Icon]) => {
              const selected = sellerType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSellerType(value)}
                  className={`relative rounded-2xl border p-4 text-left transition ${selected ? 'border-indigo-400/70 bg-indigo-500/10' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}
                >
                  <Icon className={`h-5 w-5 ${selected ? 'text-indigo-300' : 'text-gray-400'}`} />
                  <span className="mt-3 block text-sm font-black text-white">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">{description}</span>
                  {selected && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-400 text-black"><Check className="h-3 w-3" /></span>}
                </button>
              );
            })}
          </div>
        </fieldset>

        {sellerType === 'business' && isEuCountry(countryCode) && (
          <div className="mt-4 space-y-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.07] p-4">
            <p className="text-xs leading-5 text-amber-100/80">EU business sellers must provide information buyers can use to identify and contact them.</p>
            <input value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="Legal or registered name" className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none focus:border-amber-300/50" />
            <input value={registeredAddress} onChange={(event) => setRegisteredAddress(event.target.value)} placeholder="Registered business address" className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none focus:border-amber-300/50" />
            <input value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} placeholder="Company registration number (optional)" className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none focus:border-amber-300/50" />
          </div>
        )}
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-400">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving || !countryCode || !sellerType || (sellerType === 'business' && isEuCountry(countryCode) && (!legalName.trim() || !registeredAddress.trim()))}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save and continue <ArrowRight className="h-4 w-4" /></>}
        </button>
        <p className="mt-3 text-center text-[11px] leading-4 text-gray-600">You can update this later in your seller settings.</p>
      </div>
    </div>
  );
};
