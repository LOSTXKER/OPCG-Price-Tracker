/**
 * SNKRDUNK scraper — fetches PSA/graded card prices and last-sold data
 * from snkrdunk.com/en (USD market).
 *
 * Strategy:
 *  - SSR HTML of /en/trading-cards/{id} contains minPrice and used-card summary
 *  - /en/v1/trading-cards/{id}/used-listings API returns PSA-graded listings
 *    with isSold flag, enabling "last sold" extraction
 */

const BASE_URL = "https://snkrdunk.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const API_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/json, text/plain, */*",
  Referer: "https://snkrdunk.com/en/",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SnkrdunkCardSummary {
  snkrdunkId: number;
  productNumber: string;
  name: string;
  minPriceUsd: number | null;
  usedMinPriceUsd: number | null;
  usedListingCount: number;
  thumbnailUrl: string | null;
}

export interface SnkrdunkUsedListing {
  id: number;
  tradingCardId: number;
  listingUID: string;
  priceUsd: number;
  condition: string;
  isSold: boolean;
  thumbnailUrl: string | null;
}

export interface SnkrdunkPriceData {
  summary: SnkrdunkCardSummary;
  usedListings: SnkrdunkUsedListing[];
  /** Lowest available (unsold) PSA 10 listing price */
  psa10MinPriceUsd: number | null;
  /** Most recently sold PSA 10 price */
  psa10LastSoldUsd: number | null;
  /** Most recently sold price across all conditions */
  lastSoldUsd: number | null;
}

// ─── HTML Parsing ─────────────────────────────────────────────────────────────

/**
 * Parse the SSR HTML of a SNKRDUNK single-card page.
 * Extracts the :trading-card and :summary props embedded by the Vue SSR renderer.
 */
export function parseCardPageHtml(html: string): SnkrdunkCardSummary | null {
  // Extract dataLayer price (fast path for minPrice)
  const priceMatch = html.match(/"price":(\d+(?:\.\d+)?)/);
  const dataLayerPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

  // Extract :trading-card prop JSON (HTML-entity encoded)
  const tcMatch = html.match(/:trading-card="([^"]+)"/);
  if (!tcMatch) return null;

  let cardData: {
    id?: number;
    productNumber?: string;
    name?: string;
    minPrice?: number;
    thumbnailUrl?: string;
  };
  try {
    const decoded = tcMatch[1]
      .replace(/&#34;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    cardData = JSON.parse(decoded);
  } catch {
    return null;
  }

  if (!cardData.id || !cardData.productNumber) return null;

  // Extract :summary prop JSON for used-card data
  const summaryMatch = html.match(/:summary="([^"]+)"/);
  let usedMinPriceUsd: number | null = null;
  let usedListingCount = 0;

  if (summaryMatch) {
    try {
      const decoded = summaryMatch[1]
        .replace(/&#34;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
      const summary = JSON.parse(decoded) as {
        usedMinPriceAmount?: number;
        usedListingCount?: number;
      };
      usedMinPriceUsd = summary.usedMinPriceAmount ?? null;
      usedListingCount = summary.usedListingCount ?? 0;
    } catch {
      // ignore
    }
  }

  const minPrice = cardData.minPrice ?? dataLayerPrice;

  return {
    snkrdunkId: cardData.id,
    productNumber: cardData.productNumber,
    name: cardData.name ?? "",
    minPriceUsd: minPrice && minPrice > 0 ? minPrice : null,
    usedMinPriceUsd:
      usedMinPriceUsd && usedMinPriceUsd > 0 ? usedMinPriceUsd : null,
    usedListingCount,
    thumbnailUrl: cardData.thumbnailUrl ?? null,
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch the card detail page HTML and parse summary data.
 */
export async function fetchCardSummary(
  snkrdunkId: number
): Promise<SnkrdunkCardSummary | null> {
  const url = `${BASE_URL}/en/trading-cards/${snkrdunkId}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`SNKRDUNK page fetch failed: ${res.status} ${url}`);
  }
  const html = await res.text();
  return parseCardPageHtml(html);
}

/**
 * Fetch used/graded card listings for a SNKRDUNK card.
 * Returns up to perPage listings (sorted by latest by default).
 */
export async function fetchUsedListings(
  snkrdunkId: number,
  perPage = 20
): Promise<SnkrdunkUsedListing[]> {
  const url = `${BASE_URL}/en/v1/trading-cards/${snkrdunkId}/used-listings?perPage=${perPage}&page=1&sortType=latest&isOnlyOnSale=false`;
  const res = await fetch(url, { headers: API_HEADERS });
  if (!res.ok) {
    throw new Error(
      `SNKRDUNK used-listings fetch failed: ${res.status} ${url}`
    );
  }

  const data = (await res.json()) as {
    usedTradingCards?: {
      id: number;
      tradingCardId: number;
      listingUID: string;
      price: string;
      condition: string;
      isSold: boolean;
      thumbnailUrl: string;
    }[];
  };

  return (data.usedTradingCards ?? []).map((item) => ({
    id: item.id,
    tradingCardId: item.tradingCardId,
    listingUID: item.listingUID,
    priceUsd: parsePriceString(item.price),
    condition: item.condition,
    isSold: item.isSold,
    thumbnailUrl: item.thumbnailUrl ?? null,
  }));
}

/**
 * Parse a price string like "US $106" or "¥12,000" → number.
 */
export function parsePriceString(priceStr: string): number {
  const digits = priceStr.replace(/[^0-9.]/g, "");
  return parseFloat(digits) || 0;
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

export function getPsa10MinPrice(
  listings: SnkrdunkUsedListing[]
): number | null {
  const available = listings.filter(
    (l) => !l.isSold && l.condition === "PSA 10" && l.priceUsd > 0
  );
  if (available.length === 0) return null;
  return Math.min(...available.map((l) => l.priceUsd));
}

export function getPsa10LastSold(
  listings: SnkrdunkUsedListing[]
): number | null {
  const sold = listings.filter(
    (l) => l.isSold && l.condition === "PSA 10" && l.priceUsd > 0
  );
  // Already sorted by latest — take the first sold one
  return sold.length > 0 ? (sold[0]?.priceUsd ?? null) : null;
}

export function getLastSoldAny(
  listings: SnkrdunkUsedListing[]
): number | null {
  const sold = listings.filter((l) => l.isSold && l.priceUsd > 0);
  return sold.length > 0 ? (sold[0]?.priceUsd ?? null) : null;
}

// ─── Full price fetch ─────────────────────────────────────────────────────────

/**
 * Fetch all price data for a SNKRDUNK card ID.
 * Includes SSR-parsed summary + used listings with PSA10/lastSold aggregates.
 */
export async function fetchSnkrdunkPriceData(
  snkrdunkId: number
): Promise<SnkrdunkPriceData> {
  const [summary, usedListings] = await Promise.all([
    fetchCardSummary(snkrdunkId),
    fetchUsedListings(snkrdunkId),
  ]);

  if (!summary) {
    throw new Error(
      `Could not parse SNKRDUNK card page for ID ${snkrdunkId}`
    );
  }

  return {
    summary,
    usedListings,
    psa10MinPriceUsd: getPsa10MinPrice(usedListings),
    psa10LastSoldUsd: getPsa10LastSold(usedListings),
    lastSoldUsd: getLastSoldAny(usedListings),
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  snkrdunkId: number,
  maxRetries = 3,
  baseDelay = 2000
): Promise<SnkrdunkPriceData> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchSnkrdunkPriceData(snkrdunkId);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(String(error));
      console.warn(
        `SNKRDUNK attempt ${attempt + 1}/${maxRetries} failed for ${snkrdunkId}: ${lastError.message}`
      );
      if (attempt < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}
