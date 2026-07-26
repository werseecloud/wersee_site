import { supabase } from '@/lib/supabase';
import { storageApi } from './client';
import type { WerseeStoredObject } from './types';

const legacyId = (bucketId: string, path: string) =>
  `legacy:${encodeURIComponent(bucketId)}:${encodeURIComponent(path)}`;

const decodeLegacyId = (value: string) => {
  const match = value.match(/^legacy:([^:]+):(.+)$/);
  return match ? { bucketId: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) } : null;
};

export const listWerseeFiles = async (bucketId: string, prefix = '') => {
  const { data: { user } } = await supabase.auth.getUser();
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '');
  const legacyPrefix = user && ['business_storage', 'wersee-files'].includes(bucketId)
    ? [user.id, normalizedPrefix].filter(Boolean).join('/')
    : normalizedPrefix;
  const [bound, legacy, bucket] = await Promise.all([
    storageApi<{ objects: WerseeStoredObject[] }>(
      `/objects?bucket=${encodeURIComponent(bucketId)}&prefix=${encodeURIComponent(prefix)}`,
    ),
    supabase.storage.from(bucketId).list(legacyPrefix, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    }),
    supabase.from('storage_gateway_buckets').select('public,read_mode').eq('id', bucketId).maybeSingle(),
  ]);
  const prefixWithSlash = normalizedPrefix ? `${normalizedPrefix}/` : '';
  const directBound: WerseeStoredObject[] = [];
  const folderNames = new Set<string>();
  for (const object of bound.objects) {
    const relative = object.logicalPath.startsWith(prefixWithSlash)
      ? object.logicalPath.slice(prefixWithSlash.length)
      : object.logicalPath;
    const [first, ...rest] = relative.split('/');
    if (rest.length) folderNames.add(first);
    else directBound.push(object);
  }
  const logicalPaths = new Set(directBound.map((object) => object.logicalPath));
  const legacyObjects: WerseeStoredObject[] = bucket.data?.read_mode === 'strato-only'
    ? []
    : (legacy.data || []).filter((item) => Boolean(item.id)).map((item) => {
      const logicalPath = normalizedPrefix ? `${normalizedPrefix}/${item.name}` : item.name;
      return {
        objectId: legacyId(bucketId, logicalPath),
        provider: 'supabase',
        bucketId,
        logicalPath,
        fileId: null,
        mimeType: item.metadata?.mimetype || 'application/octet-stream',
        sizeBytes: Number(item.metadata?.size || 0),
        sha256: null,
        visibility: bucket.data?.public ? 'public' : 'private',
        status: 'available',
        url: null,
        createdAt: item.created_at || undefined,
        updatedAt: item.updated_at || item.created_at || undefined,
      } satisfies WerseeStoredObject;
    }).filter((item) => !logicalPaths.has(item.logicalPath));
  return {
    objects: [...directBound, ...legacyObjects],
    folders: [
      ...folderNames,
      ...(legacy.data || []).filter((item) => !item.id && item.name !== '.emptyFolderPlaceholder').map((item) => item.name),
    ].filter((name, index, all) => all.indexOf(name) === index),
    legacyError: legacy.error,
  };
};

export const resolveWerseeFile = async (
  bucketId: string,
  logicalPath: string,
  expiresIn = 180,
): Promise<WerseeStoredObject> => {
  try {
    return (await storageApi<{ object: WerseeStoredObject }>(
      `/objects/resolve?bucket=${encodeURIComponent(bucketId)}&path=${encodeURIComponent(logicalPath)}`,
    )).object;
  } catch (error: any) {
    if (error?.status !== 404) throw error;
  }
  const { data: policy } = await supabase.from('storage_gateway_buckets').select('public,read_mode')
    .eq('id', bucketId).maybeSingle();
  if (policy?.read_mode === 'strato-only') throw new Error('LEGACY_READ_DISABLED');
  const { data: { user } } = await supabase.auth.getUser();
  const legacyPath = user && ['business_storage', 'wersee-files'].includes(bucketId)
    ? `${user.id}/${logicalPath}`
    : logicalPath;
  let url: string | null;
  if (policy?.public) {
    url = supabase.storage.from(bucketId).getPublicUrl(legacyPath).data.publicUrl;
  } else {
    const { data, error } = await supabase.storage.from(bucketId).createSignedUrl(legacyPath, expiresIn);
    if (error) throw error;
    url = data.signedUrl;
  }
  return {
    objectId: legacyId(bucketId, legacyPath),
    provider: 'supabase',
    bucketId,
    logicalPath,
    fileId: null,
    mimeType: 'application/octet-stream',
    sizeBytes: 0,
    sha256: null,
    visibility: policy?.public ? 'public' : 'private',
    status: 'available',
    url,
  };
};

export const downloadWerseeFile = async (object: WerseeStoredObject) => {
  const resolved = object.url ? object : await resolveWerseeFile(object.bucketId, object.logicalPath);
  if (!resolved.url) throw new Error('DOWNLOAD_URL_UNAVAILABLE');
  return resolved.url;
};

export const deleteWerseeFile = async (object: WerseeStoredObject) => {
  const legacy = decodeLegacyId(object.objectId);
  if (legacy) {
    const { error } = await supabase.storage.from(legacy.bucketId).remove([legacy.path]);
    if (error) throw error;
    return;
  }
  await storageApi(`/objects/${encodeURIComponent(object.objectId)}`, { method: 'DELETE' });
};

export const moveWerseeFile = async (object: WerseeStoredObject, logicalPath: string) => {
  const legacy = decodeLegacyId(object.objectId);
  if (legacy) {
    const { error } = await supabase.storage.from(legacy.bucketId).move(legacy.path, logicalPath);
    if (error) throw error;
    return;
  }
  await storageApi(`/objects/${encodeURIComponent(object.objectId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logicalPath }),
  });
};
