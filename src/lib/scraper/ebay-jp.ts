/**
 * eBay JP Scraper -- Uses eBay Browse API (Free tier: 5,000 calls/day)
 *
 * Searches for OPCG cards on eBay Japan and records SOLD prices.
 * API docs: https://developer.ebay.com/api-docs/buy/browse/overview.html
 *
 * Required env vars:
 *   EBAY_APP_ID  - eBay application ID (client ID)
 *   EBAY_CERT_ID - eBay certificate ID (client secret)
 */

const EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    throw new Error("EBAY_APP_ID and EBAY_CERT_ID environment variables are required");
  }

  const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");

  const res = await fetch(EBAY_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!res.ok) {
    throw new Error(`eBay auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export interface EbayListing {
  title: string;
  priceJpy: number;
  itemId: string;
  condition: string;
  imageUrl?: string;
}

export async function searchEbayCards(
  query: string,
  options: { limit?: number; sold?: boolean } = {}
): Promise<EbayListing[]> {
  const { limit = 50, sold = false } = options;
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    category_ids: "183454", // Trading Cards
    limit: String(limit),
    sort: "-date",
  });

  if (sold) {
    params.set("filter", "buyingOptions:{FIXED_PRICE},conditions:{NEW}");
  }

  const url = `${EBAY_BROWSE_URL}?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_JP",
      "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=JP",
    },
  });

  if (!res.ok) {
    throw new Error(`eBay search failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items = data.itemSummaries || [];

  return items.map((item: Record<string, unknown>) => ({
    title: item.title as string,
    priceJpy: Math.round(
      parseFloat((item.price as { value: string })?.value || "0")
    ),
    itemId: item.itemId as string,
    condition: (item.condition as string) || "Unknown",
    imageUrl: (item.image as { imageUrl?: string })?.imageUrl,
  }));
}

export async function isEbayConfigured(): Promise<boolean> {
  return !!(process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID);
}
