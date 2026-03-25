import "dotenv/config";
import pg from "pg";

const cs = process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL is not set");
const pool = new pg.Pool({
  connectionString: cs + (cs.includes("?") ? "&" : "?") + "pgbouncer=true",
  max: 2,
});

async function main() {
  console.log("=== Fixing misassigned cards ===\n");

  // Get all sets for lookup
  const { rows: sets } = await pool.query(`SELECT id, code FROM "CardSet"`);
  const setByCode = new Map(sets.map((s: { id: number; code: string }) => [s.code.toLowerCase(), s.id]));
  console.log(`Loaded ${sets.length} sets\n`);

  // Find all cards whose baseCode prefix doesn't match their assigned set
  // Exclude PRB sets (reprint boxes intentionally have cross-set cards)
  const { rows: misassigned } = await pool.query(`
    SELECT c.id, c."cardCode", c."nameEn", c."baseCode", c.rarity,
           s.code as "currentSet"
    FROM "Card" c
    JOIN "CardSet" s ON c."setId" = s.id
    WHERE c."baseCode" IS NOT NULL
      AND c."baseCode" != '-'
      AND NOT c."baseCode" LIKE UPPER(s.code) || '%'
      AND s.code NOT LIKE 'prb%'
    ORDER BY s.code, c."cardCode"
  `);

  console.log(`Found ${misassigned.length} misassigned cards (excluding PRB sets)\n`);

  let fixed = 0;
  let notFound = 0;

  for (const card of misassigned) {
    // Extract set code from baseCode (e.g., "OP09-004" -> "op09", "EB02-028" -> "eb02", "ST26-005" -> "st26")
    const match = card.baseCode.match(/^([A-Z]+\d+)/i);
    if (!match) {
      console.log(`  SKIP ${card.cardCode}: can't parse baseCode "${card.baseCode}"`);
      continue;
    }

    const targetSetCode = match[1].toLowerCase();
    const targetSetId = setByCode.get(targetSetCode);

    if (!targetSetId) {
      notFound++;
      console.log(`  ✗ ${card.cardCode} (${card.currentSet}): target set "${targetSetCode}" not found`);
      continue;
    }

    if (targetSetCode === card.currentSet) continue; // Already correct

    await pool.query(`UPDATE "Card" SET "setId" = $1 WHERE id = $2`, [targetSetId, card.id]);
    fixed++;
    console.log(`  ✓ ${card.cardCode}: ${card.currentSet} → ${targetSetCode} | ${card.nameEn}`);
  }

  console.log(`\n✅ Done: ${fixed} cards moved, ${notFound} target sets not found`);

  // Verify OP13 SP count
  const { rows: op13sp } = await pool.query(`
    SELECT COUNT(*)::int as c
    FROM "Card" c JOIN "CardSet" s ON c."setId" = s.id
    WHERE s.code = 'op13' AND c.rarity = 'SP'
  `);
  console.log(`\nOP13 SP cards after fix: ${op13sp[0].c}`);

  await pool.end();
}

main().catch(console.error);
