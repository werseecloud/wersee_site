export interface ListingDataClient {
  from(table: 'listings'): any;
}

const firstRow = <T>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

export const insertListingRecord = async <T = Record<string, unknown>>(
  client: ListingDataClient,
  payload: Record<string, unknown> | Record<string, unknown>[],
  select = '*',
): Promise<T> => {
  const { data, error } = await client.from('listings').insert(payload).select(select);
  if (error) throw error;
  const row = firstRow(data) as T | null;
  if (!row) throw new Error('LISTING_INSERT_RETURNED_NO_ROW');
  return row;
};

export const updateListingRecord = async <T = Record<string, unknown>>(
  client: ListingDataClient,
  listingId: string | number,
  patch: Record<string, unknown>,
  options: { sellerId?: string; idColumn?: string; select?: string } = {},
): Promise<T> => {
  let query = client.from('listings').update(patch).eq(options.idColumn || 'id', listingId);
  if (options.sellerId) query = query.eq('seller_id', options.sellerId);
  const { data, error } = await query.select(options.select || '*');
  if (error) throw error;
  const row = firstRow(data) as T | null;
  if (!row) throw new Error('LISTING_UPDATE_RETURNED_NO_ROW');
  return row;
};
