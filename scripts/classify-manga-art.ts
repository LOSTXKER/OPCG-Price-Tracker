/**
 * classify-manga-art — ให้ AI ดูรูปการ์ดแล้วบอกว่าใบไหนเป็น "ลายมังงะ"
 *
 * ทำไมต้องมี: ฐานข้อมูลไม่มีอะไรบอกได้เลยว่าใบไหนเป็นการ์ดลายมังงะ —
 * ป้ายความหายากที่ขูดมาจากร้านญี่ปุ่นให้แค่ SP / SEC / P-SEC เท่านั้น
 * และชื่อการ์ดญี่ปุ่นก็ไม่มีคำว่า 漫画 / コミック สักใบ (ตรวจแล้ว 2026-08-30)
 *
 * สคริปต์นี้ "ไม่เขียนฐานข้อมูล" — อ่านอย่างเดียวแล้วพ่นผลเป็น JSON ให้คนตรวจ
 * ก่อน จากนั้นค่อยเอาผลที่ตรวจแล้วไปทำเป็นทะเบียนถาวร
 *
 * ใช้:
 *   npx tsx --env-file=.env scripts/classify-manga-art.ts --limit 24
 *   npx tsx --env-file=.env scripts/classify-manga-art.ts --out doc/manga-scan.json
 *
 * ธง:
 *   --limit N        จำนวนใบที่จะส่งให้ AI ดู (เรียงจากใบแพงสุดลงมา) · ไม่ใส่ = ทุกใบที่เข้าเกณฑ์
 *   --rarity A,B     ความหายากที่จะสแกน (ค่าเริ่มต้น SP,SEC,P-SEC)
 *   --out PATH       เขียนผลเป็นไฟล์ JSON
 *   --concurrency N  ส่งพร้อมกันกี่ใบ (ค่าเริ่มต้น 4)
 */
import { readFile, writeFile } from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";

import { prisma } from "@/lib/db";
import { serverEnv } from "@/lib/env";

const MODEL = "gemini-2.0-flash";

/** สิ่งที่ถาม AI — ถามเป็น "ข้อเท็จจริงที่มองเห็น" ไม่ให้มันตั้งชื่อเรียกเอง
 *  เพราะคำว่า "มังงะแดง" เป็นคำที่คนไทยเรียก ไม่ใช่คำที่ Bandai พิมพ์บนการ์ด */
const PROMPT = `You are looking at a single One Piece Trading Card Game card image.

Answer ONLY about the ARTWORK STYLE, not about the card's power or text.

"Manga art" means the illustration is drawn in original black-ink comic style —
inked line art with screentone/hatching shading, often with comic panel borders,
speed lines, or Japanese sound effects drawn into the art. It looks like a page
from the printed One Piece manga, NOT like the usual full-color painted anime
artwork used on normal cards.

Return ONLY valid JSON matching exactly this schema:
{
  "mangaArt": boolean,          // true if the illustration is manga/comic ink art as described
  "dominantInk": string,        // colour that dominates the illustration: "black" | "red" | "blue" | "gold" | "multi"
  "hasPanelBorders": boolean,   // true if comic panel frames are visible in the art
  "fullColorPainting": boolean, // true if it is the usual painted full-colour anime art
  "confidence": number,         // 0..1, how sure you are about "mangaArt"
  "reason": string              // one short sentence, max 15 words
}`;

type Verdict = {
  mangaArt: boolean;
  dominantInk: string;
  hasPanelBorders: boolean;
  fullColorPainting: boolean;
  confidence: number;
  reason: string;
};

type Row = {
  cardCode: string;
  baseCode: string | null;
  nameEn: string | null;
  nameJp: string;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function imageToBase64(url: string) {
  if (url.startsWith("http")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`โหลดรูปไม่ได้ (${res.status}) ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type") ?? "image/png";
    return { data: buf.toString("base64"), mimeType };
  }
  const buf = await readFile(url);
  return { data: buf.toString("base64"), mimeType: "image/png" };
}

async function classify(ai: GoogleGenAI, card: Row): Promise<Verdict | null> {
  if (!card.imageUrl) return null;
  const { data, mimeType } = await imageToBase64(card.imageUrl);
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { role: "user", parts: [{ text: PROMPT }, { inlineData: { data, mimeType } }] },
    ],
    config: { temperature: 0, maxOutputTokens: 300, responseMimeType: "application/json" },
  });
  const text = response.text?.trim();
  if (!text) return null;
  return JSON.parse(text) as Verdict;
}

/** ป้ายที่คนไทยใช้ — ตัดสินจากข้อเท็จจริงที่ AI เห็น ไม่ใช่ให้ AI ตั้งชื่อเอง */
function label(v: Verdict): "มังงะแดง" | "มังงะ" | "-" {
  if (!v.mangaArt) return "-";
  return v.dominantInk === "red" ? "มังงะแดง" : "มังงะ";
}

async function main() {
  const apiKey = serverEnv().GEMINI_API_KEY;
  if (!apiKey) throw new Error("ไม่มี GEMINI_API_KEY ใน .env");
  const ai = new GoogleGenAI({ apiKey });

  const rarities = (arg("rarity") ?? "SP,SEC,P-SEC").split(",").map((r) => r.trim());
  const limit = arg("limit") ? Number(arg("limit")) : undefined;
  const concurrency = Number(arg("concurrency") ?? 4);

  const cards = (await prisma.card.findMany({
    where: { rarity: { in: rarities }, imageUrl: { not: null } },
    select: {
      cardCode: true,
      baseCode: true,
      nameEn: true,
      nameJp: true,
      rarity: true,
      imageUrl: true,
      latestPriceJpy: true,
    },
    orderBy: { latestPriceJpy: "desc" },
    take: limit,
  })) as Row[];

  console.log(`สแกน ${cards.length} ใบ (ความหายาก: ${rarities.join(", ")})\n`);

  const results: (Row & { verdict: Verdict | null; label: string })[] = [];
  for (let i = 0; i < cards.length; i += concurrency) {
    const batch = cards.slice(i, i + concurrency);
    const done = await Promise.all(
      batch.map(async (card) => {
        try {
          const verdict = await classify(ai, card);
          return { ...card, verdict, label: verdict ? label(verdict) : "?" };
        } catch (err) {
          console.error(`  ✗ ${card.cardCode}: ${(err as Error).message}`);
          return { ...card, verdict: null, label: "?" };
        }
      }),
    );
    for (const r of done) {
      const price = r.latestPriceJpy ? `¥${r.latestPriceJpy.toLocaleString()}` : "—";
      console.log(
        `${r.label.padEnd(9)} ${r.cardCode.padEnd(16)} ${r.rarity.padEnd(6)} ${price.padEnd(10)} ` +
          `${(r.nameEn ?? r.nameJp).slice(0, 24).padEnd(26)} ${r.verdict?.reason ?? ""}`,
      );
    }
    results.push(...done);
  }

  const manga = results.filter((r) => r.label !== "-" && r.label !== "?");
  console.log(`\nสรุป: เจอลายมังงะ ${manga.length} ใบ จาก ${results.length} ใบ`);

  const out = arg("out");
  if (out) {
    await writeFile(out, JSON.stringify(results, null, 2));
    console.log(`เขียนผลไว้ที่ ${out}`);
  }

  await prisma.$disconnect();
}

main();
