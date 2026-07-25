import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  resolve(
    process.cwd(),
    "prisma/migrations/20260723010000_fix_portfolio_transaction_type/migration.sql",
  ),
  "utf8",
);

describe("portfolio transaction type migration", () => {
  it("is atomic and bounded by lock and statement timeouts", () => {
    expect(migrationSql).toMatch(/BEGIN;\s*SET LOCAL lock_timeout = '5s';/);
    expect(migrationSql).toContain("SET LOCAL statement_timeout = '60s';");
    expect(migrationSql.trimEnd()).toMatch(/COMMIT;$/);
  });

  it("rejects unsupported production values before casting", () => {
    expect(migrationSql).toContain(
      `WHERE "type" NOT IN ('BUY', 'REMOVE')`,
    );
    expect(migrationSql).toContain(
      "Unsupported PortfolioTransaction.type values",
    );
  });

  it("creates and applies the enum expected by Prisma", () => {
    expect(migrationSql).toContain(
      `CREATE TYPE public."TransactionType" AS ENUM ('BUY', 'REMOVE');`,
    );
    expect(migrationSql).toContain(
      'ALTER COLUMN "type" TYPE public."TransactionType"',
    );
    expect(migrationSql).toContain(
      'USING ("type"::public."TransactionType");',
    );
  });

  it("keeps portfolio financial records out of the Supabase Data API", () => {
    expect(migrationSql).toContain(
      'ALTER TABLE public."PortfolioTransaction" ENABLE ROW LEVEL SECURITY;',
    );
    expect(migrationSql).toMatch(
      /REVOKE ALL ON TABLE public\."PortfolioTransaction"\s+FROM PUBLIC, anon, authenticated, service_role;/,
    );
    expect(migrationSql).toMatch(
      /REVOKE ALL ON SEQUENCE public\."PortfolioTransaction_id_seq"\s+FROM PUBLIC, anon, authenticated, service_role;/,
    );
    expect(migrationSql).toContain(
      'REVOKE ALL ON TABLE public."PortfolioLot" FROM service_role;',
    );
  });
});
