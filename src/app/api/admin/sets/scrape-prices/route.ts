import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import * as cheerio from "cheerio";

const BASE_URL = "https://yuyu-tei.jp";
const BANDAI_EN_IMG =
  "https://asia-en.onepiece-cardgame.com/images/cardlist/card";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

interface ScrapedCard {
  cardCode: string;
  name: string;
  rarity: string;
  priceJpy: number;
  inStock: boolean;
  yuyuteiImgUrl?: string;
  yuyuteiId?: string;
  cardUrl?: string;
}

function parseCards($: cheerio.CheerioAPI): ScrapedCard[] {
  const cards: ScrapedCard[] = [];
  $(".card-product").each((_, el) => {
    const $el = $(el);
    const cardCode = $el.find("span.border-dark").first().text().trim();
    if (!cardCode) return;

    const priceText = $el.find("strong.text-end").first().text().trim();
    const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
    if (isNaN(priceJpy) || priceJpy === 0) return;

    const imgEl = $el.find(".product-img img.card").first();
    const altText = imgEl.attr("alt") || "";
    const yuyuteiImgUrl = imgEl.attr("src") || undefined;

    const altMatch = altText.match(
      /^[\w-]+\s+(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|SP|R|UC|C|L|P)?\s*(.*)/
    );
    let rarity = altMatch?.[1] || "Unknown";
    const name =
      altMatch?.[2]?.trim() ||
      $el.find("h4.text-primary").first().text().trim();

    if (rarity === "Unknown" && name.includes("ドン!!")) rarity = "DON";

    const isParallel =
      name.includes("パラレル") ||
      rarity.startsWith("P-") ||
      rarity === "SP";
    if (
      isParallel &&
      !rarity.startsWith("P-") &&
      rarity !== "SP" &&
      rarity !== "Unknown" &&
      rarity !== "DON"
    ) {
      rarity = `P-${rarity}`;
    }

    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() || href?.split("/").pop();
    const inStock = !$el.hasClass("sold-out");

    cards.push({
      cardCode,
      name,
      rarity,
      priceJpy,
      inStock,
      yuyuteiImgUrl,
      yuyuteiId,
      cardUrl: href || undefined,
    });
  });
  return cards;
}

function isParallelCard(card: ScrapedCard): boolean {
  return (
    card.name.includes("パラレル") ||
    card.rarity.startsWith("P-") ||
    card.rarity === "SP"
  );
}

function getBandaiImageUrl(baseCode: string): string {
  return `${BANDAI_EN_IMG}/${baseCode}.png`;
}

export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const setCode: string = body.setCode;

  if (!setCode) {
    return NextResponse.json(
      { error: "setCode is required" },
      { status: 400 }
    );
  }

  const url = `${BASE_URL}/sell/opc/s/${setCode}`;

  let $: cheerio.CheerioAPI;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Yuyu-tei returned ${res.status}` },
        { status: 502 }
      );
    }
    $ = cheerio.load(await res.text());
  } catch (e) {
    return NextResponse.json(
      { error: `Fetch failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 }
    );
  }

  const listings = parseCards($);

  if (listings.length === 0) {
    return NextResponse.json({
      success: true,
      setCode,
      message: "No cards found on Yuyu-tei",
      upserted: 0,
      newCards: 0,
    });
  }

  const cardSet = await prisma.cardSet.upsert({
    where: { code: setCode },
    update: {},
    create: {
      code: setCode,
      name: setCode,
      type: "BOOSTER",
    },
  });

  let upserted = 0;
  let newCards = 0;

  const baseGroups = new Map<string, ScrapedCard[]>();
  for (const card of listings) {
    const baseCode = card.cardCode.toUpperCase();
    if (!baseGroups.has(baseCode)) baseGroups.set(baseCode, []);
    baseGroups.get(baseCode)!.push(card);
  }

  for (const [baseCode, group] of baseGroups) {
    for (const card of group) {
      const isDon = card.rarity === "DON" || card.name.includes("ドン!!");
      const compositeCode =
        isDon && card.yuyuteiId
          ? `${setCode}-DON-${card.yuyuteiId}`
          : `${card.cardCode}${card.yuyuteiId ? `-${card.yuyuteiId}` : ""}`;

      const existing = await prisma.card.findUnique({
        where: { cardCode: compositeCode },
        select: { id: true },
      });

      if (existing) {
        await prisma.card.update({
          where: { id: existing.id },
          data: {
            latestPriceJpy: card.priceJpy,
            yuyuteiId: card.yuyuteiId,
            yuyuteiUrl: card.cardUrl,
            nameJp: card.name,
            rarity: card.rarity,
          },
        });

        await prisma.cardPrice.create({
          data: {
            cardId: existing.id,
            source: "YUYUTEI",
            type: "SELL",
            priceJpy: card.priceJpy,
            inStock: card.inStock,
          },
        });
      } else {
        const parallel = isParallelCard(card);
        const fallbackImage =
          isDon && card.yuyuteiImgUrl
            ? card.yuyuteiImgUrl
            : getBandaiImageUrl(baseCode);

        const created = await prisma.card.create({
          data: {
            cardCode: compositeCode,
            yuyuteiId: card.yuyuteiId,
            yuyuteiUrl: card.cardUrl,
            setId: cardSet.id,
            nameJp: card.name,
            rarity: card.rarity,
            cardType: "CHARACTER",
            color: "Unknown",
            imageUrl: fallbackImage,
            isParallel: parallel,
            baseCode,
            latestPriceJpy: card.priceJpy,
          },
        });

        await prisma.cardPrice.create({
          data: {
            cardId: created.id,
            source: "YUYUTEI",
            type: "SELL",
            priceJpy: card.priceJpy,
            inStock: card.inStock,
          },
        });

        newCards++;
      }

      upserted++;
    }
  }

  await prisma.cardSet.update({
    where: { id: cardSet.id },
    data: { cardCount: upserted },
  });

  return NextResponse.json({
    success: true,
    setCode,
    upserted,
    newCards,
    totalListings: listings.length,
  });
}
