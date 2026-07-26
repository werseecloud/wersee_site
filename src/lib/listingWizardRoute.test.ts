import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  normalizeListingWizardType,
  replaceStandaloneListingDraftUrl,
} from './listingWizardRoute';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('listing wizard routes', () => {
  it('normalizes legacy listing route aliases', () => {
    expect(normalizeListingWizardType('physical')).toBe('product');
    expect(normalizeListingWizardType('3d_asset')).toBe('asset_3d');
    expect(normalizeListingWizardType('pos')).toBe('pos_item');
    expect(normalizeListingWizardType('unknown')).toBeNull();
  });

  it('keeps an embedded workspace wizard on its workspace route', () => {
    const replaceState = vi.fn();
    vi.stubGlobal('window', {
      location: { pathname: '/@seller/workspace/create-listing' },
      history: { state: null, replaceState },
    });

    expect(replaceStandaloneListingDraftUrl('product', 'draft-1')).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('updates a standalone wizard deep link with its draft id', () => {
    const replaceState = vi.fn();
    vi.stubGlobal('window', {
      location: { pathname: '/create/pos_item' },
      history: { state: { source: 'router' }, replaceState },
    });

    expect(replaceStandaloneListingDraftUrl('pos_item', 'draft-1')).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(
      { source: 'router' },
      '',
      '/create/pos_item/draft-1',
    );
  });
});
