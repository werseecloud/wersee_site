import { describe, expect, it } from 'vitest';
import { parseSitesOverviewResponse, SitesApiError } from './sitesService';

describe('parseSitesOverviewResponse', () => {
  it('accepts a valid empty overview without inventing data', () => {
    expect(parseSitesOverviewResponse({
      businesses: [],
      sites: [],
      username: null,
    })).toEqual({
      businesses: [],
      sites: [],
      username: null,
    });
  });

  it.each([
    null,
    {},
    { businesses: [], sites: null },
    { businesses: null, sites: [] },
  ])('rejects an invalid overview response: %j', (payload) => {
    expect(() => parseSitesOverviewResponse(payload)).toThrowError(SitesApiError);
  });
});
