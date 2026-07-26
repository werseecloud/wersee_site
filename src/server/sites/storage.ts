import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { SupabaseClient } from '@supabase/supabase-js';
import yauzl from 'yauzl';
import { normalizeArchivePath } from './security.js';
import type { PreparedSiteFile, SourceFile } from './types.js';

type StorageObject = { name: string; id?: string | null; metadata?: { size?: number; mimetype?: string } | null };
type UploadRecord = {
  id: string;
  site_id: string;
  owner_id: string;
  source_type: 'zip' | 'folder' | 'wersee_storage';
  storage_prefix: string;
  source_metadata?: Record<string, unknown> | null;
};
type Limits = { maxArchiveBytes: number; maxUnpackedBytes: number; maxFileCount: number; maxSingleFileBytes: number };

const signedObjectResponse = async (client: SupabaseClient, bucket: string, objectPath: string) => {
  const { data, error } = await client.storage.from(bucket).createSignedUrl(objectPath, 300);
  if (error || !data?.signedUrl) throw new Error(`STORAGE_DOWNLOAD_URL_FAILED:${error?.message || objectPath}`);
  const response = await fetch(data.signedUrl);
  if (!response.ok || !response.body) throw new Error(`STORAGE_DOWNLOAD_FAILED:${response.status}`);
  return response;
};

export const createSiteTempDirectory = (releaseId: string) =>
  mkdtemp(path.join(tmpdir(), `wersee-site-${releaseId.slice(0, 8)}-`));

export const removeSiteTempDirectory = async (directory: string) => {
  await rm(directory, { recursive: true, force: true });
};

const listStorageObjectsRecursive = async (
  client: SupabaseClient,
  bucket: string,
  prefix: string,
  result: Array<{ path: string; object: StorageObject }> = [],
) => {
  let offset = 0;
  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(`STORAGE_LIST_FAILED:${error.message}`);
    const items = (data || []) as StorageObject[];
    for (const object of items) {
      const objectPath = prefix ? `${prefix}/${object.name}` : object.name;
      if (object.id) result.push({ path: objectPath, object });
      else await listStorageObjectsRecursive(client, bucket, objectPath, result);
    }
    if (items.length < 1000) break;
    offset += items.length;
  }
  return result;
};

const streamResponseToFile = async (response: Response, targetPath: string, maxBytes: number) => {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('SINGLE_FILE_LIMIT');
  let received = 0;
  const source = Readable.fromWeb(response.body as any);
  const limiter = async function* (stream: Readable) {
    for await (const chunk of stream) {
      const buffer = Buffer.from(chunk);
      received += buffer.length;
      if (received > maxBytes) throw new Error('SINGLE_FILE_LIMIT');
      yield buffer;
    }
  };
  await pipeline(Readable.from(limiter(source)), createWriteStream(targetPath, { flags: 'wx' }));
  return received;
};

export const extractZip = async (response: Response, destination: string, limits: Limits) => {
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > limits.maxArchiveBytes) throw new Error('ARCHIVE_SIZE_LIMIT');
  const archivePath = path.join(destination, '.wersee-source.zip');
  await streamResponseToFile(response, archivePath, limits.maxArchiveBytes);

  const sourceFiles: SourceFile[] = [];
  const seenPaths = new Set<string>();
  let totalBytes = 0;
  let entryCount = 0;
  let zip: yauzl.ZipFile | null = null;

  try {
    zip = await yauzl.openPromise(archivePath, {
      lazyEntries: true,
      decodeStrings: true,
      validateEntrySizes: true,
      strictFileNames: true,
    });

    for await (const entry of zip.eachEntry()) {
      entryCount += 1;
      if (entryCount > limits.maxFileCount) throw new Error('FILE_COUNT_LIMIT');

      let normalized: string;
      try { normalized = normalizeArchivePath(entry.fileName); }
      catch { throw new Error('ZIP_SLIP_DETECTED'); }

      const dedupeKey = normalized.normalize('NFC').toLowerCase();
      if (seenPaths.has(dedupeKey)) throw new Error('DUPLICATE_PATH');
      seenPaths.add(dedupeKey);

      const unixMode = Number(entry.externalFileAttributes || 0) >>> 16;
      const isSymlink = (unixMode & 0o170000) === 0o120000;
      const isDirectory = entry.fileName.endsWith('/') || (unixMode & 0o170000) === 0o040000;
      if (isDirectory) continue;

      const absolutePath = path.resolve(destination, ...normalized.split('/'));
      if (!absolutePath.startsWith(`${path.resolve(destination)}${path.sep}`)) throw new Error('ZIP_SLIP_DETECTED');
      if (isSymlink) {
        sourceFiles.push({ path: normalized, absolutePath, size: 0, symlink: true });
        continue;
      }
      if (entry.isEncrypted() || !entry.canDecodeFileData()) throw new Error('UNSUPPORTED_ZIP_ENTRY');
      if (entry.uncompressedSize > limits.maxSingleFileBytes) throw new Error('SINGLE_FILE_LIMIT');
      if (totalBytes + entry.uncompressedSize > limits.maxUnpackedBytes) throw new Error('UNPACKED_SIZE_LIMIT');

      await mkdir(path.dirname(absolutePath), { recursive: true });
      const entryStream = await zip.openReadStreamPromise(entry);
      let fileBytes = 0;
      const limiter = async function* (stream: Readable) {
        for await (const chunk of stream) {
          const buffer = Buffer.from(chunk);
          fileBytes += buffer.length;
          if (fileBytes > limits.maxSingleFileBytes) throw new Error('SINGLE_FILE_LIMIT');
          if (totalBytes + fileBytes > limits.maxUnpackedBytes) throw new Error('UNPACKED_SIZE_LIMIT');
          yield buffer;
        }
      };
      await pipeline(Readable.from(limiter(entryStream)), createWriteStream(absolutePath, { flags: 'wx' }));
      totalBytes += fileBytes;
      sourceFiles.push({ path: normalized, absolutePath, size: fileBytes });
    }
    return sourceFiles;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/invalid relative path|absolute path|path traversal/i.test(message)) throw new Error('ZIP_SLIP_DETECTED');
    throw error;
  } finally {
    if (zip?.isOpen) zip.close();
    await rm(archivePath, { force: true });
  }
};

const materializeFolder = async (
  client: SupabaseClient,
  bucket: string,
  storagePrefix: string,
  relativePrefix: string,
  destination: string,
  limits: Limits,
) => {
  const objects = await listStorageObjectsRecursive(client, bucket, storagePrefix);
  if (objects.length > limits.maxFileCount) throw new Error('FILE_COUNT_LIMIT');
  const sourceFiles: SourceFile[] = [];
  let totalBytes = 0;
  for (const item of objects) {
    const relativeStoragePath = item.path.slice(relativePrefix.length).replace(/^\/+/, '');
    const normalized = normalizeArchivePath(relativeStoragePath);
    const absolutePath = path.resolve(destination, ...normalized.split('/'));
    if (!absolutePath.startsWith(`${path.resolve(destination)}${path.sep}`)) throw new Error('PATH_TRAVERSAL');
    const response = await signedObjectResponse(client, bucket, item.path);
    const size = await streamResponseToFile(response, absolutePath, limits.maxSingleFileBytes);
    totalBytes += size;
    if (totalBytes > limits.maxUnpackedBytes) throw new Error('UNPACKED_SIZE_LIMIT');
    sourceFiles.push({ path: normalized, absolutePath, size });
  }
  return sourceFiles;
};

export const materializeSiteUpload = async (
  client: SupabaseClient,
  upload: UploadRecord,
  destination: string,
  limits: Limits,
) => {
  await mkdir(destination, { recursive: true });
  if (upload.source_type === 'folder') {
    const prefix = `${upload.storage_prefix.replace(/\/$/, '')}/files`;
    return materializeFolder(client, 'site-upload-staging', prefix, prefix, destination, limits);
  }

  const metadata = upload.source_metadata || {};
  const bucket = upload.source_type === 'wersee_storage' ? String(metadata.bucket || 'business_storage') : 'site-upload-staging';
  const objectPath = upload.source_type === 'wersee_storage'
    ? String(metadata.storage_path || '')
    : `${upload.storage_prefix.replace(/\/$/, '')}/source.zip`;
  if (!objectPath) throw new Error('SOURCE_STORAGE_PATH_MISSING');
  const response = await signedObjectResponse(client, bucket, objectPath);
  return extractZip(response, destination, limits);
};

export const replacePreviewFiles = async (
  client: SupabaseClient,
  ownerId: string,
  siteId: string,
  releaseId: string,
  files: PreparedSiteFile[],
  previousStoragePaths: string[] = [],
) => {
  if (previousStoragePaths.length) {
    for (let index = 0; index < previousStoragePaths.length; index += 100) {
      const { error } = await client.storage.from('site-preview-assets').remove(previousStoragePaths.slice(index, index + 100));
      if (error) throw new Error(`PREVIEW_CLEANUP_FAILED:${error.message}`);
    }
  }
  const records = [];
  for (const file of files) {
    const storagePath = `${ownerId}/${siteId}/${releaseId}/files/${file.path}`;
    const buffer = await readFile(file.absolutePath);
    const { error } = await client.storage.from('site-preview-assets').upload(storagePath, buffer, {
      contentType: file.contentType,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw new Error(`PREVIEW_UPLOAD_FAILED:${error.message}`);
    records.push({
      release_id: releaseId,
      path: file.path,
      storage_path: storagePath,
      size_bytes: file.size,
      content_type: file.contentType,
      sha1: file.sha1,
      is_html: file.isHtml,
    });
  }
  return records;
};

export const materializeReleaseFiles = async (
  client: SupabaseClient,
  files: Array<{ path: string; storage_path: string; size_bytes: number; content_type: string; sha1: string; is_html: boolean }>,
  destination: string,
) => {
  const result: PreparedSiteFile[] = [];
  for (const file of files) {
    const normalized = normalizeArchivePath(file.path);
    const absolutePath = path.resolve(destination, ...normalized.split('/'));
    const response = await signedObjectResponse(client, 'site-preview-assets', file.storage_path);
    const size = await streamResponseToFile(response, absolutePath, Number(file.size_bytes) + 1);
    const actual = await stat(absolutePath);
    if (size !== Number(file.size_bytes) || actual.size !== Number(file.size_bytes)) throw new Error('RELEASE_FILE_SIZE_MISMATCH');
    result.push({
      path: normalized,
      absolutePath,
      size,
      contentType: file.content_type,
      sha1: file.sha1,
      isHtml: file.is_html,
    });
  }
  return result;
};

export const listWerseeStorageZips = async (client: SupabaseClient, userId: string) => {
  const objects = await listStorageObjectsRecursive(client, 'business_storage', userId);
  return objects
    .filter((item) => item.path.toLowerCase().endsWith('.zip'))
    .map((item) => ({ path: item.path, name: path.posix.basename(item.path), size: Number(item.object.metadata?.size || 0) }))
    .slice(0, 200);
};

export const removeStoragePrefix = async (client: SupabaseClient, bucket: string, prefix: string) => {
  const objects = await listStorageObjectsRecursive(client, bucket, prefix);
  const paths = objects.map((item) => item.path);
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await client.storage.from(bucket).remove(paths.slice(index, index + 100));
    if (error) throw new Error(`STAGING_CLEANUP_FAILED:${error.message}`);
  }
  return paths.length;
};
