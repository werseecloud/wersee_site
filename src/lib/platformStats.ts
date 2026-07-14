import { supabase } from './supabase';

export type PlatformStats = {
  earned: number;
  users: number;
  businesses: number;
  customers: number;
  creators: number;
};

export const emptyPlatformStats: PlatformStats = {
  earned: 0,
  users: 0,
  businesses: 0,
  customers: 0,
  creators: 0,
};

const completedOrderStatuses = new Set(['completed', 'paid', 'succeeded', 'success']);

const safeCount = async (table: string, buildQuery?: (query: any) => any) => {
  try {
    const baseQuery = (supabase.from(table) as any).select('id', { count: 'exact', head: true });
    const { count, error } = await (buildQuery ? buildQuery(baseQuery) : baseQuery);

    if (error) {
      if (import.meta.env.DEV) console.warn(`Could not count ${table}:`, error.message);
      return 0;
    }

    return count || 0;
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`Could not count ${table}:`, error);
    return 0;
  }
};

const fetchVisibleOrders = async () => {
  const withStatus = await supabase
    .from('orders')
    .select('amount, buyer_id, status');

  if (!withStatus.error) return withStatus.data || [];

  const withoutStatus = await supabase
    .from('orders')
    .select('amount, buyer_id');

  if (withoutStatus.error) {
    if (import.meta.env.DEV) console.warn('Could not fetch order stats:', withoutStatus.error.message);
    return [];
  }

  return withoutStatus.data || [];
};

export const fetchPlatformStats = async (): Promise<PlatformStats> => {
  const [users, businesses, listedCreators, orders] = await Promise.all([
    safeCount('profiles'),
    safeCount('businesses'),
    safeCount('profiles', (query) => query.not('username', 'is', null)),
    fetchVisibleOrders(),
  ]);

  const completedOrders = orders.filter((order: any) => {
    if (!('status' in order) || order.status == null) return true;
    return completedOrderStatuses.has(String(order.status).toLowerCase());
  });

  return {
    earned: completedOrders.reduce((sum: number, order: any) => sum + (Number(order.amount) || 0), 0),
    users,
    businesses,
    customers: new Set(completedOrders.map((order: any) => order.buyer_id).filter(Boolean)).size,
    creators: listedCreators || users,
  };
};

