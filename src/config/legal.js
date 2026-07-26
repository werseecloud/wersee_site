/**
 * Central source of truth for public legal documents.
 *
 * Only values already confirmed by Wersee's published Terms of Service or
 * existing official contact channels may be exposed by public pages.
 */
export const legalConfig = Object.freeze({
  brandName: 'Wersee',

  // DEVELOPMENT TODO (legal approval required): add the official legal entity
  // name after it has been verified. Do not copy the unverified Imprint value.
  legalEntityName: null,

  // DEVELOPMENT TODO (legal approval required): add the complete registered
  // business address after verification.
  registeredAddress: null,

  // DEVELOPMENT TODO (legal approval required): add the Chamber of Commerce or
  // other official registration number after verification.
  companyRegistrationNumber: null,

  legalEmail: 'legal@wersee.com',
  supportPath: '/support',
  governingLaw: 'the laws of the Netherlands',
  competentCourts: 'the competent courts in the Netherlands',

  // Reused from section 13.3 of the published Wersee Terms of Service. Changes
  // require the same legal approval process as the Terms themselves.
  businessLiabilityCap:
    'the greater of EUR 100 or the total fees paid to Wersee in the 12 months preceding the claim',
});

