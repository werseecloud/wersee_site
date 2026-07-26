import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { GatewayConfig } from './config.js';
import { ApiError } from './errors.js';

const fail = (code: string, error: { message: string } | null) => {
  if (error) throw new ApiError(code, 'Storage metadata operation failed.', 503, { reason: error.message });
};

export class StorageRepository {
  readonly client: SupabaseClient;
  constructor(config: GatewayConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async health() {
    const { error } = await this.client.from('storage_api_files').select('id', { head: true, count: 'exact' }).limit(1);
    return !error;
  }

  async createUpload(input: Record<string, unknown>) {
    const { data, error } = await this.client.from('storage_api_uploads').insert(input)
      .select('id,logical_chunk_size,transport_slice_size,chunk_count,expires_at').single();
    fail('UPLOAD_CREATE_FAILED', error);
    return data!;
  }

  async upload(id: string) {
    const { data, error } = await this.client.from('storage_api_uploads').select('*').eq('id', id).maybeSingle();
    fail('UPLOAD_LOOKUP_FAILED', error);
    if (!data) throw new ApiError('UPLOAD_NOT_FOUND', 'Upload session not found.', 404);
    return data;
  }

  async chunk(uploadId: string, chunkIndex: number) {
    const { data, error } = await this.client.from('storage_api_upload_chunks').select('*')
      .eq('upload_id', uploadId).eq('chunk_index', chunkIndex).maybeSingle();
    fail('CHUNK_LOOKUP_FAILED', error);
    return data;
  }

  async upsertSlice(input: Record<string, unknown>) {
    const { error } = await this.client.from('storage_api_chunk_slices').upsert(input, {
      onConflict: 'upload_id,chunk_index,slice_offset',
    });
    fail('SLICE_RECORD_FAILED', error);
  }

  async slices(uploadId: string, chunkIndex: number) {
    const { data, error } = await this.client.from('storage_api_chunk_slices').select('*')
      .eq('upload_id', uploadId).eq('chunk_index', chunkIndex).order('slice_offset');
    fail('SLICE_LIST_FAILED', error);
    return data || [];
  }

  async upsertChunk(input: Record<string, unknown>) {
    const { data, error } = await this.client.from('storage_api_upload_chunks').upsert(input, {
      onConflict: 'upload_id,chunk_index',
    }).select('*').single();
    fail('CHUNK_RECORD_FAILED', error);
    return data!;
  }

  async blobByHash(hash: string, ownerId: string) {
    const { data, error } = await this.client.from('storage_api_blobs').select('*')
      .eq('sha256', hash).eq('owner_id', ownerId).eq('status', 'available').maybeSingle();
    fail('BLOB_LOOKUP_FAILED', error);
    return data;
  }

  async insertBlob(input: Record<string, unknown>) {
    const { data, error } = await this.client.from('storage_api_blobs').insert(input).select('*').single();
    if (error?.code === '23505') return this.blobByHash(String(input.sha256), String(input.owner_id));
    fail('BLOB_CREATE_FAILED', error);
    return data!;
  }

  async insertPack(input: Record<string, unknown>) {
    const { data, error } = await this.client.from('storage_api_packfiles').insert(input).select('*').single();
    fail('PACK_CREATE_FAILED', error);
    return data!;
  }

  async rateLimit(key: string, route: string, limit: number, windowSeconds: number) {
    const { data, error } = await this.client.rpc('storage_api_take_rate_limit', {
      p_key: key, p_route: route, p_limit: limit, p_window_seconds: windowSeconds,
    });
    fail('RATE_LIMIT_FAILED', error);
    return Boolean(data);
  }

  async chunks(uploadId: string) {
    const { data, error } = await this.client.from('storage_api_upload_chunks').select('*')
      .eq('upload_id', uploadId).order('chunk_index');
    fail('CHUNK_LIST_FAILED', error);
    return data || [];
  }

  async completeUpload(uploadId: string, file: Record<string, unknown>, links: Record<string, unknown>[]) {
    const { data, error } = await this.client.rpc('storage_api_complete_upload', {
      p_upload_id: uploadId, p_file: file, p_chunks: links,
    });
    fail('UPLOAD_COMPLETE_FAILED', error);
    return data as string;
  }

  async file(fileId: string) {
    const { data, error } = await this.client.from('storage_api_files').select('*').eq('id', fileId)
      .eq('status', 'available').maybeSingle();
    fail('FILE_LOOKUP_FAILED', error);
    if (!data) throw new ApiError('FILE_NOT_FOUND', 'File not found.', 404);
    return data;
  }

  async fileByHash(hash: string, size: number, ownerId: string) {
    const { data, error } = await this.client.from('storage_api_files').select('*')
      .eq('sha256', hash).eq('original_size', size).eq('owner_id', ownerId)
      .eq('status', 'available').limit(1).maybeSingle();
    fail('FILE_DEDUP_LOOKUP_FAILED', error);
    return data;
  }

  async hasPublicBinding(fileId: string) {
    const { data, error } = await this.client.from('storage_gateway_objects').select('id')
      .eq('storage_file_id', fileId)
      .eq('provider', 'strato')
      .eq('visibility', 'public')
      .eq('status', 'available')
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();
    fail('PUBLIC_BINDING_LOOKUP_FAILED', error);
    return Boolean(data);
  }

  async fileChunks(fileId: string) {
    const { data, error } = await this.client.from('storage_api_file_chunks')
      .select('chunk_index,original_offset,original_length,blob:storage_api_blobs(*)')
      .eq('file_id', fileId).order('chunk_index');
    fail('FILE_CHUNKS_FAILED', error);
    return data || [];
  }

  async deleteFile(fileId: string) {
    const { data, error } = await this.client.rpc('storage_api_delete_file', { p_file_id: fileId });
    fail('FILE_DELETE_FAILED', error);
    return data || [];
  }

  async cleanupExpired() {
    const { data, error } = await this.client.rpc('storage_api_expire_uploads');
    fail('CLEANUP_FAILED', error);
    return (data || []) as Array<{ storage_path: string }>;
  }
}
