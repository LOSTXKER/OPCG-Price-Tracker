/**
 * Shared HTTP utilities for scrapers.
 */

import { createLog } from "@/lib/logger";

const log = createLog("scraper:http");

export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_BASE_DELAY_MS = 2000;
export const SCRAPE_DELAY_MS = 1500;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic retry wrapper with exponential backoff.
 * Wraps any async function, retrying on failure up to `maxRetries` times.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    label = "request",
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY_MS,
  }: { label?: string; maxRetries?: number; baseDelay?: number } = {},
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log.warn(
        `${label} attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`,
      );
      if (attempt < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}
