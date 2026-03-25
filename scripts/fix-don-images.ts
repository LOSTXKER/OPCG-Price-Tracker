import "dotenv/config";
import pg from "pg";

const cs = process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL is not set");

const pool = new pg.Pool({
  connectionString: cs + (cs.includes("?") ? "&" : "?") + "pgbouncer=true",
  max: 2,
});

const YUYU_IMG = "https://card.yuyu-tei.jp/opc/front";

async function main() {
  console.log("=== Fixing DON!! card images (Yuyu-tei URLs) ===\n");

  const { rows: donCards } = await pool.query(`
    SELECT c.id, c."cardCode", c."nameEn", c."imageUrl", c."yuyuteiId",
           s.code as "setCode"
    FROM "Card" c
    JOIN "CardSet" s ON c."setId" = s.id
    WHERE c.rarity = 'DON'
      AND (c."imageUrl" LIKE '%/-_p%' OR c."imageUrl" LIKE '%/-.%' OR c."imageUrl" IS NULL)
  `);

  console.log(`Found ${donCards.length} DON!! cards with broken images\n`);

  let fixed = 0;
  for (const card of donCards) {
    if (!card.yuyuteiId || !card.setCode) {
      console.log(`  SKIP ${card.cardCode}: missing yuyuteiId or setCode`);
      continue;
    }

    const newUrl = `${YUYU_IMG}/${card.setCode}/${card.yuyuteiId}.jpg`;

    try {
      const res = await fetch(newUrl, { method: "HEAD" });
      if (!res.ok) {
        console.log(`  SKIP ${card.cardCode}: ${newUrl} -> ${res.status}`);
        continue;
      }
    } catch {
      console.log(`  SKIP ${card.cardCode}: fetch error`);
      continue;
    }

    await pool.query(`UPDATE "Card" SET "imageUrl" = $1 WHERE id = $2`, [newUrl, card.id]);
    fixed++;
    console.log(`  ✓ [${card.setCode}] ${card.nameEn ?? card.cardCode} -> OK`);
  }

  // Also fix non-DON cards with broken Bandai images (baseCode = "-")
  const { rows: brokenImgCards } = await pool.query(`
    SELECT c.id, c."cardCode", c."nameEn", c."imageUrl", c."yuyuteiId",
           s.code as "setCode"
    FROM "Card" c
    JOIN "CardSet" s ON c."setId" = s.id
    WHERE c."baseCode" = '-'
      AND c.rarity != 'DON'
      AND (c."imageUrl" LIKE '%/-_p%' OR c."imageUrl" LIKE '%/-.%')
  `);

  if (brokenImgCards.length > 0) {
    console.log(`\n--- Also fixing ${brokenImgCards.length} non-DON cards with baseCode="-" ---\n`);
    for (const card of brokenImgCards) {
      if (!card.yuyuteiId || !card.setCode) continue;
      const newUrl = `${YUYU_IMG}/${card.setCode}/${card.yuyuteiId}.jpg`;
      try {
        const res = await fetch(newUrl, { method: "HEAD" });
        if (!res.ok) continue;
      } catch { continue; }
      await pool.query(`UPDATE "Card" SET "imageUrl" = $1 WHERE id = $2`, [newUrl, card.id]);
      fixed++;
      console.log(`  ✓ [${card.setCode}] ${card.nameEn ?? card.cardCode} -> OK`);
    }
  }

  console.log(`\n✅ Done: ${fixed} images fixed total`);
  await pool.end();
}

main().catch(console.error);
