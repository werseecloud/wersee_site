import { createHash, createHmac, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const MIB = 1024 * 1024;
const LOGICAL_CHUNK_SIZE = 24 * MIB;
const TRANSPORT_SLICE_SIZE = 3 * MIB;
const apply = process.argv.includes('--apply');

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const supabaseUrl = required('SUPABASE_URL').replace(/\/$/, '');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const gatewayUrl = (process.env.WERSEE_STORAGE_GATEWAY_URL || 'https://api.wersee.com').replace(/\/$/, '');
const capabilitySecret = required('WERSEE_STORAGE_CAPABILITY_SECRET');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sha256 = (body) => createHash('sha256').update(body).digest('hex');

const capability = (purpose, method, path, claims = {}) => {
  const payload = {
    purpose,
    method,
    path,
    expires_at: Math.floor(Date.now() / 1000) + 300,
    nonce: randomUUID(),
    ...claims,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', capabilitySecret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

const gatewayRequest = async (path, purpose, ownerId, init = {}) => {
  const response = await fetch(`${gatewayUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      'X-Wersee-Storage-Capability': capability(purpose, init.method || 'GET', path, {
        user_id: ownerId,
      }),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Gateway ${response.status}: ${body?.error?.code || 'UNKNOWN_ERROR'}`);
  }
  return body;
};

const storageReference = (raw) => {
  if (typeof raw !== 'string' || !raw.includes('/storage/v1/object/')) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return {
    originalUrl: raw,
    bucketId: decodeURIComponent(match[1]),
    logicalPath: match[2].split('/').map(decodeURIComponent).join('/'),
  };
};

const replaceExact = (value, replacements) => {
  if (typeof value === 'string') return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => replacements.get(item) || item);
  return value;
};

const uploadToGateway = async ({ ownerId, filename, mimeType, bytes, checksum }) => {
  const initPath = '/api/storage/uploads/init';
  const initialized = await gatewayRequest(initPath, 'upload', ownerId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalFilename: filename,
      mimeType,
      originalSize: bytes.length,
      sha256: checksum,
    }),
  });
  if (initialized.deduplicated && initialized.fileId) return initialized.fileId;

  const uploadId = initialized.id;
  if (!uploadId) throw new Error('Gateway did not return an upload id.');
  for (let chunkIndex = 0; chunkIndex < Math.ceil(bytes.length / LOGICAL_CHUNK_SIZE); chunkIndex += 1) {
    const chunkStart = chunkIndex * LOGICAL_CHUNK_SIZE;
    const chunk = bytes.subarray(chunkStart, Math.min(chunkStart + LOGICAL_CHUNK_SIZE, bytes.length));
    const chunkChecksum = sha256(chunk);
    for (let sliceOffset = 0; sliceOffset < chunk.length; sliceOffset += TRANSPORT_SLICE_SIZE) {
      const slice = chunk.subarray(sliceOffset, Math.min(sliceOffset + TRANSPORT_SLICE_SIZE, chunk.length));
      const path = `/api/storage/uploads/${uploadId}/chunks`;
      await gatewayRequest(path, 'upload', ownerId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Chunk-Index': String(chunkIndex),
          'X-Slice-Offset': String(sliceOffset),
          'X-Chunk-Length': String(chunk.length),
          'X-Chunk-Sha256': chunkChecksum,
          'X-Slice-Sha256': sha256(slice),
        },
        body: slice,
      });
    }
  }
  const completed = await gatewayRequest(`/api/storage/uploads/${uploadId}/complete`, 'upload', ownerId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!completed.fileId || completed.sha256 !== checksum) throw new Error('Gateway completion checksum mismatch.');
  return completed.fileId;
};

const verifyCdn = async (fileId, size, checksum) => {
  const url = `${gatewayUrl}/cdn/${fileId}`;
  const response = await fetch(url, { headers: { Range: `bytes=0-${Math.min(size, 1024) - 1}` } });
  if (!response.ok || ![200, 206].includes(response.status)) {
    throw new Error(`CDN verification failed with ${response.status}.`);
  }
  const etag = response.headers.get('etag');
  if (etag !== `"sha256-${checksum}"`) throw new Error('CDN ETag checksum mismatch.');
  return url;
};

const fields = [
  'image_url',
  'images',
  'thumbnail',
  'gallery_urls',
  'thumbnail_b_url',
  'winning_thumbnail',
  'share_image_url',
  'video_url',
];

const { data: listings, error: listingError } = await supabase
  .from('listings')
  .select(`id,seller_id,user_id,${fields.join(',')}`)
  .is('deleted_at', null);
if (listingError) throw listingError;

const references = new Map();
for (const listing of listings || []) {
  const ownerId = listing.seller_id || listing.user_id;
  if (!ownerId) continue;
  for (const field of fields) {
    const values = Array.isArray(listing[field]) ? listing[field] : [listing[field]];
    for (const value of values) {
      const reference = storageReference(value);
      if (!reference) continue;
      const key = `${ownerId}:${reference.bucketId}:${reference.logicalPath}`;
      const current = references.get(key) || { ...reference, ownerId, uses: [] };
      current.uses.push({ listingId: listing.id, field, originalUrl: value });
      references.set(key, current);
    }
  }
}

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  listings: listings?.length || 0,
  uniqueFiles: references.size,
  references: [...references.values()].reduce((total, item) => total + item.uses.length, 0),
}));
if (!apply) process.exit(0);

const replacementsByListing = new Map();
let migrated = 0;
for (const reference of references.values()) {
  const { data: blob, error: downloadError } = await supabase.storage
    .from(reference.bucketId)
    .download(reference.logicalPath);
  if (downloadError || !blob) throw downloadError || new Error('Supabase download returned no data.');
  const bytes = Buffer.from(await blob.arrayBuffer());
  if (!bytes.length) throw new Error('Empty files are not supported by the STRATO gateway.');
  const checksum = sha256(bytes);
  const filename = reference.logicalPath.split('/').pop() || 'file';
  const mimeType = blob.type || 'application/octet-stream';

  const { data: upload, error: uploadError } = await supabase
    .from('storage_gateway_uploads')
    .insert({
      owner_id: reference.ownerId,
      bucket_id: reference.bucketId,
      logical_path: reference.logicalPath,
      visibility: 'public',
      mime_type: mimeType,
      size_bytes: bytes.length,
      expected_checksum_sha256: checksum,
      chunk_size: TRANSPORT_SLICE_SIZE,
      part_count: Math.max(1, Math.ceil(bytes.length / TRANSPORT_SLICE_SIZE)),
      provider: 'strato',
      status: 'uploading',
    })
    .select('id')
    .single();
  if (uploadError || !upload) throw uploadError || new Error('Upload record was not created.');

  try {
    const fileId = await uploadToGateway({
      ownerId: reference.ownerId,
      filename,
      mimeType,
      bytes,
      checksum,
    });
    const { data: finalized, error: finalizeError } = await supabase.rpc('finalize_storage_gateway_object', {
      p_upload_id: upload.id,
      p_owner_id: reference.ownerId,
      p_storage_file_id: fileId,
      p_supabase_storage_path: null,
    });
    if (finalizeError || !finalized?.ok) {
      throw finalizeError || new Error(`Finalize failed: ${finalized?.code || 'UNKNOWN_ERROR'}`);
    }
    const newUrl = await verifyCdn(fileId, bytes.length, checksum);
    for (const use of reference.uses) {
      const map = replacementsByListing.get(use.listingId) || new Map();
      map.set(use.originalUrl, newUrl);
      replacementsByListing.set(use.listingId, map);
    }
    migrated += 1;
    console.log(JSON.stringify({ event: 'file_migrated', bucket: reference.bucketId, path: reference.logicalPath, bytes: bytes.length }));
  } catch (error) {
    await supabase.from('storage_gateway_uploads').update({
      status: 'failed',
      error_code: String(error instanceof Error ? error.message : error).slice(0, 100),
    }).eq('id', upload.id);
    throw error;
  }
}

let updatedListings = 0;
for (const listing of listings || []) {
  const replacements = replacementsByListing.get(listing.id);
  if (!replacements?.size) continue;
  const patch = {};
  for (const field of fields) patch[field] = replaceExact(listing[field], replacements);
  const { error } = await supabase.from('listings').update(patch).eq('id', listing.id);
  if (error) throw error;
  updatedListings += 1;
}

console.log(JSON.stringify({
  event: 'migration_complete',
  migratedFiles: migrated,
  updatedListings,
  supabaseBackupsDeleted: 0,
}));
