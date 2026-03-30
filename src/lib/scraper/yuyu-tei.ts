import * as cheerio from "cheerio";

const BASE_URL = "https://yuyu-tei.jp";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return cheerio.load(html);
}

export function getSetListingUrl(setCode: string): string {
  return `${BASE_URL}/sell/opc/s/${setCode}`;
}

export function getCardDetailUrl(setCode: string, internalId: string): string {
  return `${BASE_URL}/sell/opc/card/${setCode}/${internalId}`;
}

export interface ScrapedCardListing {
  name: string;
  priceJpy: number;
  inStock: boolean;
  cardUrl: string | undefined;
  yuyuteiId: string | undefined;
  imageUrl: string | undefined;
  rarity: string | undefined;
  cardCode: string | undefined;
}

export function parseSetListingPage($: cheerio.CheerioAPI): ScrapedCardListing[] {
  const cards: ScrapedCardListing[] = [];

  $(".card-product").each((_, el) => {
    const $el = $(el);

    const cardCodeText = $el.find("span.border-dark").first().text().trim();
    if (!cardCodeText) return;

    const priceText = $el.find("strong.text-end").first().text().trim();
    const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10) || 0;

    const imgEl = $el.find(".product-img img.card").first();
    const altText = imgEl.attr("alt") || "";
    const rawImageUrl = imgEl.attr("src") || undefined;
    const imageUrl = rawImageUrl?.replace(/\/\d+_\d+\//, "/front/");

    // alt format: "OP01-120 P-SEC ロロノア・ゾロ(パラレル)"
    const altMatch = altText.match(
      /^([\w-]+)\s+(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|SP|R|UC|C|L|P)?\s*(.*)/
    );
    let rarity: string | undefined = altMatch?.[2] || undefined;
    const name = altMatch?.[3]?.trim() || $el.find("h4.text-primary").first().text().trim();

    if (!rarity && name.includes("ドン!!")) {
      rarity = "DON";
    }

    const isParallel = name.includes("パラレル") || (rarity?.startsWith("P-") ?? false) || rarity === "SP";
    if (isParallel && rarity && !rarity.startsWith("P-") && rarity !== "SP" && rarity !== "DON") {
      rarity = `P-${rarity}`;
    }

    const linkEl = $el.find("a[href*='/sell/opc/card/']").first();
    const href = linkEl.attr("href");

    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() ||
      href?.split("/").pop();

    const inStock = !$el.hasClass("sold-out");

    cards.push({
      name,
      priceJpy,
      inStock,
      cardUrl: href || undefined,
      yuyuteiId,
      imageUrl,
      rarity,
      cardCode: cardCodeText,
    });
  });

  return cards;
}

export { sleep } from "./http-utils";
import { withRetry } from "./http-utils";

export async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  baseDelay = 2000
): Promise<cheerio.CheerioAPI> {
  return withRetry(() => fetchPage(url), {
    label: `YuyuTei ${url}`,
    maxRetries,
    baseDelay,
  });
}
