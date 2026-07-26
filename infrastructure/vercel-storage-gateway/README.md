# Wersee Storage API

Isolated TypeScript storage gateway for `api.wersee.com`. The API stores
manifests in Supabase and physical bytes on STRATO through the
`StorageProvider` interface.

## Data path

- Files are divided into 24 MiB logical chunks.
- Each logical chunk is uploaded resumably as transport slices of at most 3 MiB.
  This stays below Vercel's 4.5 MB Function payload limit.
- Every slice and logical chunk is verified with SHA-256.
- MIME detection uses the actual file signature when one is available.
- Compressible data uses Brotli only when the stored result is at least 5%
  smaller. JPEG, WebP, MP4, WebM, MP3, ZIP and similar formats stay unchanged.
- Content-addressed blobs are deduplicated by the SHA-256 of their original
  bytes within the same Wersee user and protected by reference counts.
- New STRATO data is isolated under `/users/<user-id>/`. Temporary slices,
  blobs and packfiles never cross user folders.
- The exact original filename remains in the Supabase manifest and is returned
  in viewer and download headers. Physical blob and pack names also include a
  safe, recognizable version of that filename.
- Compressed entries up to 2 MiB are grouped in immutable packfiles of
  approximately 64 MiB. Larger chunks use individual content-addressed objects.
- Downloads reconstruct chunks in order and stream them. A large file is never
  assembled completely inside a Vercel Function.

## API

### Start

`POST /api/storage/uploads/init`

```json
{
  "originalFilename": "catalog.csv",
  "mimeType": "text/csv",
  "originalSize": 25165824,
  "sha256": "optional-64-character-lowercase-sha256"
}
```

The response contains the upload ID, 24 MiB logical chunk size and 3 MiB
transport slice size. If a matching complete file already exists, the response
contains `deduplicated: true` and its file ID. Deduplication is owner-scoped.
The server-signed storage capability supplies the user ID; browser input can
never choose another user's STRATO folder.

### Upload a transport slice

`POST /api/storage/uploads/:uploadId/chunks`

Body: `application/octet-stream`, maximum 3 MiB.

Required headers:

- `X-Chunk-Index`: zero-based logical chunk index
- `X-Slice-Offset`: byte offset inside the logical chunk
- `X-Chunk-Length`: complete logical chunk length
- `X-Chunk-Sha256`: hash of the complete uncompressed logical chunk
- `X-Slice-Sha256`: hash of this transport slice

Retrying the same slice offset is idempotent. The response reports the next
missing offset or that the logical chunk is verified.

### Complete

`POST /api/storage/uploads/:uploadId/complete`

Completion re-verifies every chunk, writes immutable objects/packfiles,
reconstructs the file hash and atomically commits the manifest and reference
counts.

### Read and delete

- `GET /api/storage/files/:fileId`
- `GET /api/storage/files/:fileId/download`
- `DELETE /api/storage/files/:fileId`
- `GET /api/storage/health`
- `GET /cdn/:fileId`
- `GET /cdn/:fileId/raw`

Downloads support a single HTTP byte range and use immutable ETags.

`/cdn/:fileId` uses content negotiation. A normal browser navigation that
accepts HTML receives the responsive Wersee image viewer. Image elements and
API clients that request image bytes receive the original image directly from
the same URL. `/cdn/:fileId/raw` always returns the original bytes, regardless
of the `Accept` header. Add `?download=1` to the raw URL to force a download.

## Server-only environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRATO_SFTP_HOST`
- `STRATO_SFTP_PORT`
- `STRATO_SFTP_USERNAME`
- `STRATO_SFTP_PASSWORD`
- `STRATO_SFTP_ROOT`
- `CRON_SECRET`

Never expose these values to browsers or source control.

## Provider replacement

`src/types.ts` defines `StorageProvider`. `SftpStorageProvider` is the STRATO
implementation. An S3-compatible adapter can replace it without changing upload
sessions, manifests, compression, deduplication or API handlers.

## Verification

```text
npm install
npm run verify
```

The test suite covers signature-aware compression, the 5% threshold, lossless
restoration, path traversal protection, checksums, corrupt-slice rejection and
resumable 24 MiB logical chunks.
