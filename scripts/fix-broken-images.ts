import "dotenv/config";
import pg from "pg";

const cs = process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL is not set");
const pool = new pg.Pool({
  connectionString: cs + (cs.includes("?") ? "&" : "?") + "pgbouncer=true",
  max: 2,
});

const YUYU_IMG = "https://card.yuyu-tei.jp/opc/front";
const BATCH_SIZE = 50;

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("=== Fixing broken Bandai image URLs ===\n");

  const { rows: cards } = await pool.query(`
    SELECT c.id, c."cardCode", c."nameEn", c."imageUrl", c."yuyuteiId",
           c."baseCode", c.rarity, s.code as "setCode"
    FROM "Card" c
    JOIN "CardSet" s ON c."setId" = s.id
    WHERE c."imageUrl" LIKE '%onepiece-cardgame.com%'
    ORDER BY s.code, c."cardCode"
  `);

  console.log(`Total cards with Bandai URLs: ${cards.length}\n`);

  let totalChecked = 0;
  let totalBroken = 0;
  let totalFixed = 0;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (card) => {
        const ok = await checkUrl(card.imageUrl);
        return { card, ok };
      })
    );

    for (const { card, ok } of results) {
      totalChecked++;
      if (ok) continue;

      totalBroken++;

      // Try Yuyu-tei fallback
      if (card.yuyuteiId && card.setCode) {
        const yuyuUrl = `${YUYU_IMG}/${card.setCode}/${card.yuyuteiId}.jpg`;
        const yuyuOk = await checkUrl(yuyuUrl);
        if (yuyuOk) {
          await pool.query(`UPDATE "Card" SET "imageUrl" = $1 WHERE id = $2`, [yuyuUrl, card.id]);
          totalFixed++;
          console.log(`  ✓ [${card.setCode}] ${card.nameEn ?? card.cardCode}`);
          continue;
        }
      }

      console.log(`  ✗ [${card.setCode}] ${card.nameEn ?? card.cardCode} | ${card.imageUrl}`);
    }

    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= cards.length) {
      console.log(`\n  ...checked ${Math.min(i + BATCH_SIZE, cards.length)}/${cards.length} | broken=${totalBroken} fixed=${totalFixed}\n`);
    }
  }

  console.log(`\n✅ Done: ${totalChecked} checked, ${totalBroken} broken, ${totalFixed} fixed with Yuyu-tei`);
  await pool.end();
}

main().catch(console.error);
