export type CompressionCodec = 'identity' | 'brotli';
export type BlobLocation =
  | { kind: 'object'; path: string }
  | { kind: 'pack'; path: string; packfileId: string; offset: number };

export type PreparedChunk = {
  original: Buffer;
  stored: Buffer;
  sha256: string;
  storedSha256: string;
  codec: CompressionCodec;
  ratio: number;
  detectedMime: string;
};

export type FileManifest = {
  id: string;
  originalFilename: string;
  mimeType: string;
  originalSize: number;
  physicalStoredSize: number;
  sha256: string;
  status: string;
  createdAt: string;
};

export interface StorageProvider {
  putAtomic(path: string, data: Buffer): Promise<void>;
  read(path: string, start?: number, endInclusive?: number): Promise<Buffer>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  verify(path: string, expectedSha256: string): Promise<boolean>;
  close(): Promise<void>;
}
