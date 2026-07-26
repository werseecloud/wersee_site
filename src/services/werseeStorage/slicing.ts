export const LOGICAL_CHUNK_SIZE = 24 * 1024 * 1024;
export const TRANSPORT_SLICE_SIZE = 3 * 1024 * 1024;

export type TransportSlice = {
  chunkIndex: number;
  chunkOffset: number;
  absoluteOffset: number;
  length: number;
  chunkLength: number;
};

export const planTransportSlices = (
  fileSize: number,
  logicalChunkSize = LOGICAL_CHUNK_SIZE,
  transportSliceSize = TRANSPORT_SLICE_SIZE,
) => {
  if (!Number.isSafeInteger(fileSize) || fileSize < 0) throw new Error('INVALID_FILE_SIZE');
  if (!Number.isSafeInteger(logicalChunkSize) || logicalChunkSize <= 0) throw new Error('INVALID_LOGICAL_CHUNK_SIZE');
  if (!Number.isSafeInteger(transportSliceSize) || transportSliceSize <= 0) throw new Error('INVALID_TRANSPORT_SLICE_SIZE');
  const slices: TransportSlice[] = [];
  for (let chunkIndex = 0; chunkIndex < Math.ceil(fileSize / logicalChunkSize); chunkIndex += 1) {
    const chunkStart = chunkIndex * logicalChunkSize;
    const chunkLength = Math.min(logicalChunkSize, fileSize - chunkStart);
    for (let chunkOffset = 0; chunkOffset < chunkLength; chunkOffset += transportSliceSize) {
      slices.push({
        chunkIndex,
        chunkOffset,
        absoluteOffset: chunkStart + chunkOffset,
        length: Math.min(transportSliceSize, chunkLength - chunkOffset),
        chunkLength,
      });
    }
  }
  return slices;
};
