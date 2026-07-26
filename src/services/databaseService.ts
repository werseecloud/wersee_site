import { supabase } from '../lib/supabase';
import { insertListingRecord, updateListingRecord } from '../lib/listingPersistence';

export class DatabaseService {
  static async getAuthUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting auth user:', error);
      return null;
    }
    return user;
  }

  static async get<T = any>(table: string, options: {
    select?: string;
    eq?: Record<string, any>;
    neq?: Record<string, any>;
    in?: { column: string; values: any[] };
    or?: string;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
    maybeSingle?: boolean;
  } = {}, retries = 3): Promise<T | T[] | null> {
    try {
      let query = supabase.from(table).select(options.select || '*');

      if (options.eq) {
        Object.entries(options.eq).forEach(([column, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(column, value);
          }
        });
      }

      if (options.neq) {
        Object.entries(options.neq).forEach(([column, value]) => {
          if (value !== undefined && value !== null) {
            query = query.neq(column, value);
          }
        });
      }

      if (options.in) {
        query = query.in(options.in.column, options.in.values);
      }

      if (options.or) {
        query = query.or(options.or);
      }

      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.single) {
        const { data, error } = await query.single();
        if (error) throw error;
        return data as T;
      }

      if (options.maybeSingle) {
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data as T | null;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network') || error.message?.includes('Load failed'))) {
        console.warn(`Retrying DatabaseService.get from ${table}... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return this.get(table, options, retries - 1);
      }
      console.error(`Error fetching from ${table}:`, error);
      throw error;
    }
  }

  static async insert<T>(table: string, data: any) {
    try {
      if (table === 'listings') {
        return await insertListingRecord<T>(supabase, data);
      }
      const { data: result, error } = await supabase.from(table).insert(data).select();
      if (error) throw error;
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  static async upsert<T>(table: string, data: any, onConflict: string = 'id') {
    try {
      const { data: result, error } = await supabase.from(table).upsert(data, { onConflict }).select();
      if (error) throw error;
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error(`Error upserting into ${table}:`, error);
      throw error;
    }
  }

  static async update<T>(table: string, id: string | number, data: any, idColumn: string = 'id') {
    try {
      if (table === 'listings') {
        return await updateListingRecord<T>(supabase, id, data, { idColumn });
      }
      const { data: result, error } = await supabase.from(table).update(data).eq(idColumn, id).select();
      if (error) throw error;
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  static async delete(table: string, id: string | number, idColumn: string = 'id') {
    try {
      const { error } = await supabase.from(table).delete().eq(idColumn, id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  static async getListings(sellerId?: string) {
    let query = supabase.from('listings').select('*');
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getFunnels(userId: string) {
    const { data, error } = await supabase.from('funnels').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getForms(userId: string) {
    const { data, error } = await supabase.from('forms').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}
