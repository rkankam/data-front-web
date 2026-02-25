export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new ApiError(504, "UPSTREAM_TIMEOUT", "Upstream request timed out");
  }

  return new ApiError(500, "INTERNAL_ERROR", "Internal server error");
};
