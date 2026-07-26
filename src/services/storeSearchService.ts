import { liteClient } from 'algoliasearch/lite';
import { supabase } from '../lib/supabase';

const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || '';
const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '';
const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'wersee_store';
const ALGOLIA_ENABLED = Boolean(ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY && ALGOLIA_INDEX_NAME);
const ALGOLIA_CLIENT = ALGOLIA_ENABLED ? liteClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY) : null;

export type StoreSearchCategory =
  | 'All'
  | 'Education'
  | 'Digital'
  | '3D Assets'
  | 'Physical'
  | 'Services'
  | 'Community'
  | 'Apps'
  | 'Extensions';

export type StoreSearchKind = 'listing' | 'app' | 'extension' | 'official';

export interface StoreSearchResult {
  id: string;
  kind: StoreSearchKind;
  title: string;
  subtitle: string;
  description: string;
  category: StoreSearchCategory | string;
  type: string;
  price: number;
  rating: number;
  ratingCount: number;
  popularity: number;
  image: string;
  href: string;
  score: number;
  reasons: string[];
  isOfficial?: boolean;
  raw?: any;
}

const DEFAULT_IMAGES = {
  official:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640"%3E%3Crect width="960" height="640" fill="%23101010"/%3E%3Crect x="0" y="0" width="960" height="640" fill="%231d4ed8" opacity=".28"/%3E%3Cpath d="M0 520 C220 430 300 640 520 520 C720 410 770 500 960 430 V640 H0 Z" fill="%232563eb" opacity=".38"/%3E%3Ctext x="92" y="398" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="220" font-weight="800" letter-spacing="0"%3EWE%3C/text%3E%3C/svg%3E',
  course: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900',
  digital: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=900',
  asset3d: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=900',
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=900',
  app: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=900',
  extension: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=900',
};

const OFFICIAL_RESULT: StoreSearchResult = {
  id: 'wersee-business-community',
  kind: 'official',
  title: 'Wersee Business Community',
  subtitle: 'Wersee Official',
  description: 'Courses, templates and community resources from Wersee.',
  category: 'Education',
  type: 'community',
  price: 0,
  rating: 5,
  ratingCount: 25400,
  popularity: 25400,
  image: DEFAULT_IMAGES.official,
  href: '/listing/7',
  score: 0,
  reasons: ['Official', 'Verified'],
  isOfficial: true,
};

const algoliaCategoryFilter = (category: StoreSearchCategory) => {
  if (category === 'All') return '';
  if (category === 'Apps') return 'kind:app';
  if (category === 'Extensions') return 'kind:extension';
  if (category === 'Education') return 'category:Education OR type:community OR type:course';
  if (category === 'Digital') return 'type:digital OR type:virtual OR type:bundle OR type:asset_3d';
  if (category === '3D Assets') return 'type:asset_3d OR category:"3D Assets"';
  if (category === 'Physical') return 'type:product OR type:physical';
  if (category === 'Services') return 'type:service OR type:services OR category:Services';
  if (category === 'Community') return 'type:community OR category:Community';
  return `category:\"${category}\"`;
};

const toAlgoliaResult = (hit: any): StoreSearchResult => ({
  id: String(hit.objectID ?? hit.id ?? ''),
  kind: (hit.kind as StoreSearchKind) || 'listing',
  title: hit.title ?? hit.name ?? 'Untitled listing',
  subtitle: hit.subtitle ?? hit.brand ?? hit.author ?? hit.profiles?.username ?? 'Wersee Seller',
  description: hit.description ?? hit.short_description ?? hit.summary ?? '',
  category: hit.category ?? hit.type ?? 'Digital',
  type: hit.type ?? (hit.kind === 'app' ? 'app' : hit.kind === 'extension' ? 'extension' : 'listing'),
  price: numberValue(hit.price),
  rating: numberValue(hit.rating_avg ?? hit.rating ?? hit.review_rating),
  ratingCount: numberValue(hit.rating_count ?? hit.review_count ?? hit.reviewCount),
  popularity: numberValue(hit.popularity ?? hit.views ?? hit.install_count ?? hit.user_count),
  image: hit.image ?? hit.image_url ?? hit.icon_url ?? DEFAULT_IMAGES.product,
  href:
    hit.href || hit.url || (hit.kind === 'app' && hit.slug ? `/app/${hit.slug}` : hit.slug ? `/listing/${hit.slug}` : `/listing/${hit.id}`),
  score: 0,
  reasons: Array.isArray(hit.reasons) ? hit.reasons : [],
  isOfficial: Boolean(hit.isOfficial),
  raw: hit,
});

const normalize = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (query: string) =>
  normalize(query)
    .split(' ')
    .filter((token) => token.length > 1);

const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const categoryMatches = (result: StoreSearchResult, category: StoreSearchCategory) => {
  if (category === 'All') return true;
  if (category === 'Apps') return result.kind === 'app';
  if (category === 'Extensions') return result.kind === 'extension';
  if (category === 'Education') {
    return (
      result.category === 'Education' ||
      result.type === 'community' ||
      result.type === 'course' ||
      normalize(result.description).includes('course')
    );
  }
  if (category === 'Digital') return ['digital', 'virtual', 'bundle', 'asset_3d'].includes(result.type);
  if (category === '3D Assets') return result.type === 'asset_3d' || result.category === '3D Assets';
  if (category === 'Physical') return ['product', 'physical'].includes(result.type);
  if (category === 'Services') return ['service', 'services'].includes(result.type) || result.category === 'Services';
  if (category === 'Community') return result.type === 'community' || result.category === 'Community';
  return result.category === category;
};

const scoreResult = (result: StoreSearchResult, query: string, category: StoreSearchCategory) => {
  const tokens = tokenize(query);
  const title = normalize(result.title);
  const subtitle = normalize(result.subtitle);
  const description = normalize(result.description);
  const type = normalize(`${result.type} ${result.category}`);
  const haystack = `${title} ${subtitle} ${description} ${type}`;
  const reasons = new Set(result.reasons);
  let score = 0;

  if (categoryMatches(result, category)) {
    score += category === 'All' ? 8 : 22;
    if (category !== 'All') reasons.add('Category match');
  }

  if (tokens.length === 0) {
    score += result.isOfficial ? 18 : 0;
  } else {
    const normalizedQuery = normalize(query);
    if (title === normalizedQuery) {
      score += 95;
      reasons.add('Exact title');
    } else if (title.startsWith(normalizedQuery)) {
      score += 72;
      reasons.add('Title start');
    } else if (title.includes(normalizedQuery)) {
      score += 58;
      reasons.add('Title match');
    }

    for (const token of tokens) {
      if (title.includes(token)) score += 22;
      if (subtitle.includes(token)) score += 10;
      if (type.includes(token)) score += 9;
      if (description.includes(token)) score += 6;
      if (!haystack.includes(token)) score -= 10;
    }

    const matchedTokens = tokens.filter((token) => haystack.includes(token)).length;
    if (matchedTokens > 0) {
      score += (matchedTokens / tokens.length) * 24;
      reasons.add(matchedTokens === tokens.length ? 'Strong match' : 'Related');
    }
  }

  if (result.isOfficial) score += 16;
  if (result.rating >= 4.7) {
    score += 10;
    reasons.add('Top rated');
  } else if (result.rating >= 4.2) {
    score += 6;
  }

  if (result.popularity > 0) {
    score += Math.min(18, Math.log10(result.popularity + 1) * 5);
    if (result.popularity >= 1000) reasons.add('Popular');
  }

  if (result.price === 0) score += 3;

  return {
    ...result,
    score: Math.max(0, Math.round(score)),
    reasons: Array.from(reasons).slice(0, 3),
  };
};

const listingCategory = (listing: any): StoreSearchCategory | string => {
  if (listing.category) return listing.category;
  if (listing.type === 'community') return 'Community';
  if (listing.type === 'service') return 'Services';
  if (listing.type === 'asset_3d' || listing.category === '3D Assets') return '3D Assets';
  if (['digital', 'virtual', 'bundle'].includes(listing.type)) return 'Digital';
  return 'Physical';
};

const listingImage = (listing: any) =>
  listing.images?.[0] ||
  listing.image_url ||
  listing.image ||
  (listing.category === 'Education' || listing.type === 'community'
    ? DEFAULT_IMAGES.course
    : listing.type === 'asset_3d' || listing.category === '3D Assets'
      ? DEFAULT_IMAGES.asset3d
      : ['digital', 'virtual', 'bundle'].includes(listing.type)
      ? DEFAULT_IMAGES.digital
      : DEFAULT_IMAGES.product);

const toListingResult = (listing: any): StoreSearchResult => {
  const type = listing.type || (listing.category === 'Education' ? 'course' : 'product');
  const category = listingCategory(listing);

  return {
    id: String(listing.id),
    kind: 'listing',
    title: listing.title || 'Untitled listing',
    subtitle:
      listing.metadata?.instructor ||
      listing.profiles?.full_name ||
      listing.profiles?.username ||
      listing.metadata?.brand ||
      'Wersee Seller',
    description: listing.description || listing.metadata?.short_description || '',
    category,
    type,
    price: numberValue(listing.price),
    rating: numberValue(listing.rating_avg ?? listing.rating),
    ratingCount: numberValue(listing.rating_count),
    popularity: numberValue(listing.user_count ?? listing.views ?? listing.rating_count),
    image: listingImage(listing),
    href: `/listing/${listing.id}`,
    score: 0,
    reasons: [],
    raw: listing,
  };
};

const toAppResult = (app: any): StoreSearchResult => ({
  id: String(app.id),
  kind: 'app',
  title: app.name || 'Untitled app',
  subtitle: 'Wersee Apps',
  description: app.description || 'Public app in the Wersee ecosystem.',
  category: 'Apps',
  type: 'app',
  price: numberValue(app.price),
  rating: numberValue(app.rating_avg ?? app.rating),
  ratingCount: numberValue(app.rating_count),
  popularity: numberValue(app.install_count ?? app.user_count),
  image: app.icon_url || app.image_url || DEFAULT_IMAGES.app,
  href: app.slug ? `/app/${app.slug}` : `/app/${app.id}`,
  score: 0,
  reasons: ['App'],
  raw: app,
});

const toExtensionResult = (extension: any): StoreSearchResult => ({
  id: String(extension.id),
  kind: 'extension',
  title: extension.name || 'Untitled extension',
  subtitle: 'Wersee Extensions',
  description: extension.description || 'Automation and workflow extension for Wersee.',
  category: 'Extensions',
  type: extension.type || 'extension',
  price: numberValue(extension.price),
  rating: numberValue(extension.rating_avg ?? extension.rating),
  ratingCount: numberValue(extension.rating_count),
  popularity: numberValue(extension.install_count ?? extension.user_count),
  image: extension.icon_url || extension.image_url || DEFAULT_IMAGES.extension,
  href: '/workspace?view=custom-apps',
  score: 0,
  reasons: ['Extension'],
  raw: extension,
});

const safeSearchValue = (query: string) =>
  query
    .replace(/[,%*()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

export const searchWerseeStore = async (
  query: string,
  category: StoreSearchCategory,
): Promise<StoreSearchResult[]> => {
  const cleanQuery = safeSearchValue(query);
  const shouldSearch = cleanQuery.length > 1;
  const useAlgolia = ALGOLIA_ENABLED && shouldSearch;

  if (useAlgolia && ALGOLIA_CLIENT) {
    try {
      const index = ALGOLIA_CLIENT.initIndex(ALGOLIA_INDEX_NAME);
      const filters = algoliaCategoryFilter(category);
      const response = await index.search<any>(query.trim(), {
        hitsPerPage: 60,
        attributesToHighlight: [],
        filters: filters || undefined,
      });

      return [OFFICIAL_RESULT, ...(response.hits || []).map(toAlgoliaResult)]
        .filter((result) => categoryMatches(result, category))
        .map((result) => scoreResult(result, query, category))
        .filter((result) => {
          if (!shouldSearch) return true;
          const queryTokens = tokenize(query);
          if (queryTokens.length === 0) return true;
          const haystack = normalize(`${result.title} ${result.subtitle} ${result.description} ${result.type} ${result.category}`);
          return queryTokens.some((token) => haystack.includes(token));
        })
        .sort((a, b) => b.score - a.score || b.rating - a.rating || b.popularity - a.popularity)
        .slice(0, 60);
    } catch (error) {
      console.error('Algolia search failed', error);
    }
  }

  let listingsQuery = supabase
    .from('listings')
    .select('*, product_offers(*), profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
    .in('status', ['active', 'published'])
    .order('created_at', { ascending: false })
    .limit(120);

  if (shouldSearch) {
    listingsQuery = listingsQuery.or(
      `title.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%,type.ilike.%${cleanQuery}%`,
    );
  }

  let appsQuery = supabase
    .from('apps')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(80);

  if (shouldSearch) {
    appsQuery = appsQuery.or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`);
  }

  let extensionsQuery = supabase
    .from('extensions')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(80);

  if (shouldSearch) {
    extensionsQuery = extensionsQuery.or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%,type.ilike.%${cleanQuery}%`);
  }

  const [listingsResult, appsResult, extensionsResult] = await Promise.allSettled([
    category === 'Apps' || category === 'Extensions' ? Promise.resolve({ data: [] }) : listingsQuery,
    ['All', 'Apps'].includes(category) ? appsQuery : Promise.resolve({ data: [] }),
    ['All', 'Extensions'].includes(category) ? extensionsQuery : Promise.resolve({ data: [] }),
  ]);

  const getData = <T>(result: PromiseSettledResult<{ data?: T[]; error?: any }>) => {
    if (result.status === 'rejected') {
      console.error('Store search request failed', result.reason);
      return [];
    }
    if (result.value.error) {
      console.error('Store search request failed', result.value.error);
      return [];
    }
    return result.value.data || [];
  };

  const normalizedResults = [
    OFFICIAL_RESULT,
    ...getData<any>(listingsResult).map(toListingResult),
    ...getData<any>(appsResult).map(toAppResult),
    ...getData<any>(extensionsResult).map(toExtensionResult),
  ];

  const queryTokens = tokenize(query);

  return normalizedResults
    .filter((result) => categoryMatches(result, category))
    .map((result) => scoreResult(result, query, category))
    .filter((result) => {
      if (!shouldSearch || queryTokens.length === 0) return true;
      const haystack = normalize(`${result.title} ${result.subtitle} ${result.description} ${result.type} ${result.category}`);
      return queryTokens.some((token) => haystack.includes(token));
    })
    .sort((a, b) => b.score - a.score || b.rating - a.rating || b.popularity - a.popularity)
    .slice(0, 60);
};
