import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { isMarketplaceEnabled } from "@/lib/marketplace/feature-flag";

export const dynamic = "force-dynamic";

import { clientEnv } from "@/lib/env";
const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

// วันที่แก้เนื้อหาจริงของหน้าคงที่ (guide/about/contact/pricing ฯลฯ) — ไม่ใช่ `new Date()`
// ตอน generate เพราะนั่นคือการปลอม lastmod ทุกครั้งที่ crawler มา ซึ่ง Google จับได้แล้วเลิกเชื่อ
// lastmod ทั้งไฟล์ (รวมของจริงอย่างการ์ด/ชุดไปด้วย) — แก้มือเป็นวันที่แก้ copy ของกลุ่มนี้จริงเท่านั้น
const STATIC_CONTENT_UPDATED = new Date("2026-08-05");

// ไฟล์เดียวจงใจ — ตอนนี้มี ~3,900 URL ห่างเพดาน 50,000 URL/ไฟล์ของ Google มาก
// (เคยลอง generateSitemaps แยกไฟล์ แต่ Next ไม่สร้างตัว index ที่ /sitemap.xml ให้
// ขณะที่ robots.ts และ Search Console ชี้มาที่นั่น — ไฟล์เดียวจึงทั้งง่ายและถูกมาตรฐานกว่า)
// ถ้าวันหนึ่งจำนวนการ์ดเข้าใกล้ ~40,000 ใบ ค่อยกลับมาแยกไฟล์พร้อมทำ index เอง
// สิ่งที่แก้จากเวอร์ชันเก่า: เลิก cap การ์ดที่ 5,000 (ใบเก่าเคยหลุดเงียบๆ) และเลิกใช้
// `new Date()` เป็น lastmod ของหน้า static

async function buildStaticEntries(): Promise<MetadataRoute.Sitemap> {
  const [marketplaceEnabled, latestPrice, latestSet] = await Promise.all([
    isMarketplaceEnabled(),
    // aggregate เดียว ใช้ร่วมกันกับทุกหน้าที่โชว์ราคาตลาด ("/" trending ฯลฯ) — ไม่ยิง query ซ้ำต่อ entry
    prisma.cardPrice.aggregate({ _max: { scrapedAt: true } }),
    prisma.cardSet.aggregate({ _max: { updatedAt: true } }),
  ]);

  // หน้าที่เนื้อหาคือ "ราคาวันนี้" ต้อง lastmod ตามรอบสแครปจริง ไม่ใช่เวลาที่ sitemap ถูก generate
  const priceDataUpdated = latestPrice._max.scrapedAt ?? STATIC_CONTENT_UPDATED;
  // index รวมชุดการ์ด — อิงชุดที่เพิ่งแก้ล่าสุด
  const setsIndexUpdated = latestSet._max.updatedAt ?? STATIC_CONTENT_UPDATED;

  return [
    { url: BASE_URL, lastModified: priceDataUpdated },
    { url: `${BASE_URL}/opcg/search`, lastModified: priceDataUpdated },
    { url: `${BASE_URL}/opcg/trending`, lastModified: priceDataUpdated },
    { url: `${BASE_URL}/opcg/most-expensive`, lastModified: priceDataUpdated },
    { url: `${BASE_URL}/opcg/market-overview`, lastModified: priceDataUpdated },
    { url: `${BASE_URL}/opcg/sets`, lastModified: setsIndexUpdated },
    // /opcg/decks dropped (SEO round 2, 2026-08-07): the route is noindexed
    // (see src/app/decks/layout.tsx) — a thin hub page whose title used to
    // compete with /opcg/deck-calculator. Add back once it's indexable again.
    ...(marketplaceEnabled
      ? [{ url: `${BASE_URL}/marketplace`, lastModified: STATIC_CONTENT_UPDATED }]
      : []),
    { url: `${BASE_URL}/opcg/compare`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/opcg/drop-calculator`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/opcg/deck-calculator`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/pricing`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/about`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/contact`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/honey`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/raffle/winners`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/getting-started`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/sets`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/rarities`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/buying`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/card-types`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/colors`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/authenticity`, lastModified: STATIC_CONTENT_UPDATED },
    { url: `${BASE_URL}/guide/versions`, lastModified: STATIC_CONTENT_UPDATED },
    // /blog ตัดออกจน publish บทความจริง >= 3 โพสต์ — กลับมาใส่ตอนนั้น
    // (เกณฑ์เดียวกับ noindex ใน src/app/blog/page.tsx)
  ];
}

async function buildSetEntries(): Promise<MetadataRoute.Sitemap> {
  const sets = await prisma.cardSet.findMany({
    select: { code: true, updatedAt: true },
  });

  return sets.map((set) => ({
    url: `${BASE_URL}/opcg/sets/${set.code}`,
    lastModified: set.updatedAt,
  }));
}

async function buildCardEntries(): Promise<MetadataRoute.Sitemap> {
  // ทุกใบ ไม่มี cap — ลิมิตจริงของ Google คือ 50,000 URL ต่อไฟล์
  const cards = await prisma.card.findMany({
    select: { cardCode: true, updatedAt: true },
    orderBy: { id: "asc" },
  });

  return cards.map((card) => ({
    url: `${BASE_URL}/opcg/cards/${card.cardCode}`,
    lastModified: card.updatedAt,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [staticEntries, setEntries, cardEntries] = await Promise.all([
    buildStaticEntries(),
    buildSetEntries(),
    buildCardEntries(),
  ]);

  return [...staticEntries, ...setEntries, ...cardEntries];
}
