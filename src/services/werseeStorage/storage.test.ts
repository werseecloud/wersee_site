import { describe, expect, it } from 'vitest';
import { parseGatewayInit } from './contracts';
import {
  LOGICAL_CHUNK_SIZE,
  planTransportSlices,
  TRANSPORT_SLICE_SIZE,
} from './slicing';

describe('advanced storage contract', () => {
  it('parses the normal snake_case init response', () => {
    expect(parseGatewayInit({
      id: '019c9e5a-84d8-7b9f-a333-123456789abc',
      logical_chunk_size: LOGICAL_CHUNK_SIZE,
      transport_slice_size: TRANSPORT_SLICE_SIZE,
      chunk_count: 2,
      expires_at: '2026-07-27T12:00:00.000Z',
    })).toMatchObject({ chunk_count: 2 });
  });

  it('parses a full-file dedup response', () => {
    expect(parseGatewayInit({
      deduplicated: true,
      fileId: '019c9e5a-84d8-7b9f-a333-123456789abc',
      sha256: 'a'.repeat(64),
      url: '/cdn/019c9e5a-84d8-7b9f-a333-123456789abc',
    })).toMatchObject({ deduplicated: true });
  });

  it('rejects corrupt gateway contracts', () => {
    expect(() => parseGatewayInit({
      id: '019c9e5a-84d8-7b9f-a333-123456789abc',
      logical_chunk_size: TRANSPORT_SLICE_SIZE,
      transport_slice_size: TRANSPORT_SLICE_SIZE,
      chunk_count: 1,
      expires_at: '2026-07-27T12:00:00.000Z',
    })).toThrow('GATEWAY_INIT_RESPONSE_INVALID');
  });
});

describe('logical chunks and transport slices', () => {
  it('creates exactly eight 3 MiB slices for a 24 MiB logical chunk', () => {
    const slices = planTransportSlices(LOGICAL_CHUNK_SIZE);
    expect(slices).toHaveLength(8);
    expect(slices.every((slice) => slice.length === TRANSPORT_SLICE_SIZE)).toBe(true);
    expect(slices.every((slice) => slice.chunkLength === LOGICAL_CHUNK_SIZE)).toBe(true);
  });

  it('creates a final short chunk and final short slice', () => {
    const fileSize = LOGICAL_CHUNK_SIZE + TRANSPORT_SLICE_SIZE + 17;
    const slices = planTransportSlices(fileSize);
    expect(slices).toHaveLength(10);
    expect(slices.at(-1)).toEqual({
      chunkIndex: 1,
      chunkOffset: TRANSPORT_SLICE_SIZE,
      absoluteOffset: LOGICAL_CHUNK_SIZE + TRANSPORT_SLICE_SIZE,
      length: 17,
      chunkLength: TRANSPORT_SLICE_SIZE + 17,
    });
  });

  it('uses stable offsets so retrying a slice is idempotent', () => {
    const original = planTransportSlices(LOGICAL_CHUNK_SIZE + 1)[3];
    const retry = planTransportSlices(LOGICAL_CHUNK_SIZE + 1)[3];
    expect(retry).toEqual(original);
  });
});
