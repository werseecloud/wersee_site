export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const asApiError = (error: unknown) => {
  if (error instanceof ApiError) return error;
  const candidate = error as { code?: number | string; status?: number; statusCode?: number; type?: string };
  if (candidate?.status === 413 || candidate?.statusCode === 413 || candidate?.type === 'entity.too.large') {
    return new ApiError('REQUEST_TOO_LARGE', 'The request body exceeds the transport-slice limit.', 413);
  }
  if (typeof candidate?.code === 'number') {
    return new ApiError('STORAGE_TRANSFER_FAILED', 'The physical storage transfer failed.', 503);
  }
  return new ApiError('INTERNAL_ERROR', 'The storage request failed.', 500);
};
