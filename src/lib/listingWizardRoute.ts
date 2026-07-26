export type RoutableListingType =
  | 'job'
  | 'product'
  | 'service'
  | 'digital'
  | 'asset_3d'
  | 'community'
  | 'affiliate'
  | 'virtual'
  | 'announcement'
  | 'bundle'
  | 'pos_item';

const supportedTypes = new Set<RoutableListingType>([
  'job',
  'product',
  'service',
  'digital',
  'asset_3d',
  'community',
  'affiliate',
  'virtual',
  'announcement',
  'bundle',
  'pos_item',
]);

export const normalizeListingWizardType = (
  value?: string | null,
): RoutableListingType | null => {
  if (!value) return null;
  if (value === 'physical') return 'product';
  if (value === '3d_asset') return 'asset_3d';
  if (value === 'pos') return 'pos_item';
  return supportedTypes.has(value as RoutableListingType)
    ? value as RoutableListingType
    : null;
};

export const isStandaloneListingWizardPath = (pathname: string) =>
  pathname === '/create' || pathname.startsWith('/create/');

export const replaceStandaloneListingDraftUrl = (
  type: RoutableListingType,
  draftId: string,
) => {
  if (
    typeof window === 'undefined'
    || !isStandaloneListingWizardPath(window.location.pathname)
  ) {
    return false;
  }

  window.history.replaceState(
    window.history.state,
    '',
    `/create/${type}/${encodeURIComponent(draftId)}`,
  );
  return true;
};
