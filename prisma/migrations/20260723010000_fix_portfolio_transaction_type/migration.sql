-- PortfolioTransaction.type was created as TEXT in the original migration while
-- the Prisma schema has always used TransactionType. Prisma 7's pg adapter casts
-- enum writes to public."TransactionType", so the missing database enum makes
-- every portfolio BUY/REMOVE write fail.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

LOCK TABLE public."PortfolioTransaction" IN ACCESS EXCLUSIVE MODE;

-- Refuse to coerce unknown production values. The migration must be extended
-- deliberately if a value outside the schema contract is ever found.
DO $$
DECLARE
  invalid_values TEXT;
BEGIN
  SELECT string_agg(format('%L', value), ', ' ORDER BY value)
  INTO invalid_values
  FROM (
    SELECT DISTINCT "type" AS value
    FROM public."PortfolioTransaction"
    WHERE "type" NOT IN ('BUY', 'REMOVE')
  ) invalid;

  IF invalid_values IS NOT NULL THEN
    RAISE EXCEPTION
      'Unsupported PortfolioTransaction.type values: %',
      invalid_values;
  END IF;
END $$;

CREATE TYPE public."TransactionType" AS ENUM ('BUY', 'REMOVE');

ALTER TABLE public."PortfolioTransaction"
  ALTER COLUMN "type" TYPE public."TransactionType"
  USING ("type"::public."TransactionType");

-- Transaction costs and notes are private and are only accessed through the
-- authenticated Next.js API over Prisma's direct database connection.
ALTER TABLE public."PortfolioTransaction" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."PortfolioTransaction"
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public."PortfolioTransaction_id_seq"
  FROM PUBLIC, anon, authenticated, service_role;

-- PortfolioLot follows the same direct-database-only contract. Its creation
-- migration already revoked client roles; remove the remaining Data API role.
REVOKE ALL ON TABLE public."PortfolioLot" FROM service_role;
REVOKE ALL ON SEQUENCE public."PortfolioLot_id_seq" FROM service_role;

COMMIT;
