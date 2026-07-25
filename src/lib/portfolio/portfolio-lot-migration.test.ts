import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  resolve(
    process.cwd(),
    "prisma/migrations/20260723000000_add_portfolio_lots/migration.sql",
  ),
  "utf8",
);

describe("portfolio lot migration", () => {
  it("keeps historical snapshot coverage unknown", () => {
    expect(migrationSql).toMatch(
      /ADD COLUMN "totalCopyCount" INTEGER,\s*ADD COLUMN "costedCopyCount" INTEGER;/,
    );
    expect(migrationSql).not.toMatch(
      /"(?:totalCopyCount|costedCopyCount)" INTEGER NOT NULL/,
    );
  });

  it("creates one honest opening-balance lot from every existing holding", () => {
    const backfill = migrationSql.match(
      /INSERT INTO "PortfolioLot"[\s\S]*?FROM "PortfolioItem";/,
    )?.[0];

    expect(backfill).toBeDefined();
    expect(backfill).toContain('"quantity"');
    expect(backfill).toContain('"purchasePrice"');
    expect(backfill).toContain(
      `'LEGACY_OPENING_BALANCE'::"PortfolioLotSource"`,
    );
    expect(backfill).toMatch(
      /SELECT\s+"id",\s+"quantity",\s+"purchasePrice",\s+NULL,\s+NULL,/,
    );
    expect(backfill).toMatch(/"addedAt",\s+"addedAt"\s+FROM "PortfolioItem";/);
    expect(backfill).not.toContain("COALESCE");
    expect(backfill).not.toContain("PortfolioTransaction");
  });

  it("cascades lots only with their parent holding", () => {
    expect(migrationSql).toContain(
      'FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id")',
    );
    expect(migrationSql).toContain("ON DELETE CASCADE ON UPDATE CASCADE");
  });

  it("keeps private acquisition data out of the Supabase Data API", () => {
    expect(migrationSql).toContain(
      'ALTER TABLE "PortfolioLot" ENABLE ROW LEVEL SECURITY;',
    );
    expect(migrationSql).toContain(
      'REVOKE ALL ON TABLE "PortfolioLot" FROM PUBLIC, anon, authenticated;',
    );
    expect(migrationSql).toContain(
      'REVOKE ALL ON SEQUENCE "PortfolioLot_id_seq" FROM PUBLIC, anon, authenticated;',
    );
  });
});
