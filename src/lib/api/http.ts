import { ApiError } from "./errors";

type RetryConfig = {
  retries?: number;
  timeoutMs?: number;
};

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {}
) => {
  const retries = config.retries ?? 2;
  const timeoutMs = config.timeoutMs ?? 8_000;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      if (!response.ok && RETRYABLE_STATUS.has(response.status) && attempt < retries) {
        await sleep(200 * 2 ** attempt);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(200 * 2 ** attempt);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

export const fetchJson = async <T>(
  url: string,
  options: RequestInit,
  config: RetryConfig = {}
): Promise<T> => {
  const response = await fetchWithRetry(url, options, config);
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(502, "UPSTREAM_ERROR", `Upstream request failed: ${response.status} ${text}`);
  }
  return (await response.json()) as T;
};
