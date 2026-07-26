import { supabase, isMissingSupabaseSchemaError } from './supabase';

export const EU_COUNTRY_CODES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

export type DsaSellerVerification = {
  id?: string;
  seller_id: string;
  business_id?: string | null;
  trader_status: 'business' | 'consumer';
  legal_name: string;
  contact_email: string;
  country_code: string;
  registered_address?: string | null;
  registration_number?: string | null;
  vat_or_tax_id?: string | null;
  status?: 'not_required' | 'pending' | 'verified' | 'rejected';
};

export const normalizeCountryCode = (countryCode?: string | null) =>
  String(countryCode || '').trim().toUpperCase();

export const isEuCountry = (countryCode?: string | null) =>
  EU_COUNTRY_CODES.has(normalizeCountryCode(countryCode));

export const inferBrowserCountryCode = () => {
  if (typeof navigator === 'undefined') return '';
  const locale = navigator.languages?.[0] || navigator.language || '';
  const country = locale.split('-')[1];
  return normalizeCountryCode(country);
};

export const getStoredDsaCountryCode = () => {
  if (typeof window === 'undefined') return '';
  return normalizeCountryCode(window.localStorage.getItem('wersee:dsa-country-code'));
};

export const storeDsaCountryCode = (countryCode: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('wersee:dsa-country-code', normalizeCountryCode(countryCode));
};

export const getEffectiveDsaCountryCode = (explicitCountryCode?: string | null) =>
  normalizeCountryCode(explicitCountryCode) || getStoredDsaCountryCode() || inferBrowserCountryCode();

export const requiresDsaSellerVerification = (input: {
  countryCode?: string | null;
  traderStatus?: string | null;
}) => {
  return isEuCountry(input.countryCode) && input.traderStatus === 'business';
};

export const isDsaVerificationComplete = (verification?: Partial<DsaSellerVerification> | null) => {
  if (!verification) return false;
  if (verification.trader_status === 'consumer' || verification.status === 'not_required') return true;
  return Boolean(
    verification.legal_name &&
    verification.contact_email &&
    verification.country_code &&
    verification.registered_address &&
    ['pending', 'verified'].includes(String(verification.status || '')),
  );
};

export const getCurrentSellerDsaVerification = async (sellerId: string) => {
  try {
    const { data, error } = await supabase
      .from('dsa_seller_verifications')
      .select('*')
      .eq('seller_id', sellerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as DsaSellerVerification | null;
  } catch (error) {
    if (isMissingSupabaseSchemaError(error)) return null;
    throw error;
  }
};

export const upsertDsaSellerVerification = async (verification: DsaSellerVerification) => {
  const countryCode = normalizeCountryCode(verification.country_code);
  const payload = {
    ...verification,
    country_code: countryCode,
    status:
      verification.trader_status === 'consumer' || !isEuCountry(countryCode)
        ? 'not_required'
        : verification.status || 'pending',
    updated_at: new Date().toISOString(),
  };

  storeDsaCountryCode(countryCode);

  const { data, error } = await supabase
    .from('dsa_seller_verifications')
    .upsert(payload, { onConflict: 'seller_id' })
    .select()
    .single();

  if (error) throw error;
  return data as DsaSellerVerification;
};

export const getPublicDsaSellerTrace = async (sellerId: string) => {
  try {
    const { data, error } = await supabase
      .from('dsa_seller_verifications')
      .select('trader_status,legal_name,contact_email,country_code,registered_address,registration_number,status')
      .eq('seller_id', sellerId)
      .in('status', ['pending', 'verified', 'not_required'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as Partial<DsaSellerVerification> | null;
  } catch (error) {
    if (isMissingSupabaseSchemaError(error)) return null;
    throw error;
  }
};
