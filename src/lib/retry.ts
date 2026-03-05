/**
 * Retry wrapper with exponential backoff.
 * Only retries on network errors or 5xx responses.
 * 4xx errors (401, 403, 404…) are never retried.
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry client errors (4xx)
      if (is4xxError(err)) throw err;

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) break;

      // Exponential backoff: 1s, 2s, 4s…
      await sleep(1000 * 2 ** attempt);
    }
  }

  throw lastError;
}

function is4xxError(err: unknown): boolean {
  if (err instanceof Error) {
    // Match patterns like "401", "403", "404" in the message
    const match = err.message.match(/\b(4\d{2})\b/);
    if (match) return true;
  }
  if (
    err !== null &&
    typeof err === "object" &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
  ) {
    const status = (err as { status: number }).status;
    return status >= 400 && status < 500;
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
