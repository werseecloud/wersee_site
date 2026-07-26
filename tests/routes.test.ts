import { describe, expect, it } from 'vitest';
import { matchPath } from 'react-router-dom';
import {
  identifiers,
  isReservedRootSegment,
  parseAccountHandle,
  parseUsername,
  parseUsernameRouteValue,
  routePatterns,
  routes,
  usernameFromAccountHandle,
} from '../src/routing/routes';

describe('typed route identifiers', () => {
  it.each([
    '@account.example_42',
    '@anderaccount',
    '@bedrijf.nl',
    '@custom_handle123',
    '@team-name_42',
  ])('preserves a valid account handle exactly: %s', (value) => {
    const handle = identifiers.accountHandle(value);
    expect(handle).toBe(value);
    expect(parseAccountHandle(value)).toBe(value);
  });

  it('never adds an @ to a username or account handle implicitly', () => {
    expect(parseAccountHandle('wersee')).toBeNull();
    expect(parseUsername('@wersee')).toBeNull();
    expect(parseUsername('wersee')).toBe('wersee');
  });

  it('removes @ only at the explicit profiles.username boundary', () => {
    const handle = identifiers.accountHandle('@bedrijf.nl');
    expect(usernameFromAccountHandle(handle)).toBe('bedrijf.nl');
    expect(parseUsernameRouteValue('@bedrijf.nl')).toBe('bedrijf.nl');
    expect(parseUsernameRouteValue('bedrijf.nl')).toBe('bedrijf.nl');
  });
});

describe('typed route builders', () => {
  it('builds an account workspace route without changing the handle', () => {
    expect(routes.accountWorkspaceChats({
      accountHandle: identifiers.accountHandle('@account.example_42'),
    })).toBe('/@account.example_42/workspace/chats');
  });

  it('builds a username profile route with the route literal @', () => {
    expect(routes.userProfile({
      username: identifiers.username('wersee'),
    })).toBe('/@wersee');
  });

  it('keeps product IDs and slugs as different identifier types', () => {
    expect(routes.productById({
      productId: identifiers.productId('prod_82hd91'),
    })).toBe('/listing/prod_82hd91');
    expect(routes.productById({
      productId: identifiers.productId('184'),
    })).toBe('/listing/184');
    expect(routes.productBySlug({
      productSlug: identifiers.productSlug('rode-sneaker'),
    })).toBe('/p/rode-sneaker');
  });

  it('encodes each nested segment and never permits path injection', () => {
    expect(routes.accountWorkspacePage({
      accountHandle: identifiers.accountHandle('@bedrijf.nl'),
      pageName: 'management-sites',
      restPath: 'site 42/settings',
    })).toBe('/@bedrijf.nl/workspace/management-sites/site%2042/settings');
    expect(() => identifiers.productId('../admin')).toThrow('Invalid product ID');
  });

  it('matches the dynamic account handle including @, dots and underscores', () => {
    const match = matchPath(
      routePatterns.accountWorkspacePage,
      '/@account.example_42/workspace/chats',
    );
    expect(match?.params.accountHandle).toBe('@account.example_42');
    expect(match?.params.pageName).toBe('chats');
  });

  it('matches standalone funding links and their checkout without an account handle', () => {
    expect(matchPath(routePatterns.publicFundCampaign, '/fund/mijn-seed-round')?.params.campaignSlug)
      .toBe('mijn-seed-round');
    expect(matchPath(routePatterns.publicFundCheckout, '/fund/mijn-seed-round/checkout')?.params.campaignSlug)
      .toBe('mijn-seed-round');
  });
});

describe('root route collision protection', () => {
  it.each(['login', 'pricing', 'settings', 'api', 'workspace', 'products', 'fund'])(
    'reserves static root segment %s',
    (segment) => {
      expect(isReservedRootSegment(segment)).toBe(true);
    },
  );

  it('does not reserve a valid custom business slug', () => {
    expect(isReservedRootSegment('mijn-bedrijf')).toBe(false);
  });
});
