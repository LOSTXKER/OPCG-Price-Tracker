# `HoneyActionType` deprecation & migration plan

The `HoneyActionType` Prisma enum carries seven deprecated values that
predate the rebalance v2 economy:

```
PORTFOLIO_ADD
GIFT_SEND
GIFT_RECEIVE
LUCKY_DRAW
FIRST_PURCHASE
SHARE
AFFILIATE
```

Active `HoneyTransaction` rows for these types are read-only history.
No new code should emit them.

## Current state (phase 3.5)

- The Prisma enum still carries these values so existing rows continue
  to validate. The `///` doc-comment block above the values in
  `prisma/schema.prisma` flags them as deprecated.
- A runtime guard is wired into `grantHoney` —
  [`assertNotDeprecatedHoneyActionType`](../src/lib/honey/deprecated.ts)
  throws if any caller tries to write a deprecated value, even when the
  call site bypasses the TypeScript enum (e.g. via a string cast).
- The set of deprecated values is centralized in
  `src/lib/honey/deprecated.ts` so adding new exclusions is a one-file
  change.

## Future migration (out of phase 3.5 scope)

The eventual goal is to shrink the enum to its active members and move
historical labels to a dedicated free-form column so we don't pay the
ergonomic cost of a long enum forever.

### Step 1 — schema change

Add a sibling column on `HoneyTransaction`:

```prisma
model HoneyTransaction {
  // ...existing columns...
  legacyType String? // historical type label for rows pre-rebalance v2
}
```

### Step 2 — backfill migration

```sql
UPDATE "HoneyTransaction"
SET "legacyType" = "type"::text,
    "type" = 'EXPIRED' -- or another non-positive sentinel
WHERE "type" IN (
  'PORTFOLIO_ADD',
  'GIFT_SEND',
  'GIFT_RECEIVE',
  'LUCKY_DRAW',
  'FIRST_PURCHASE',
  'SHARE',
  'AFFILIATE'
);
```

`EXPIRED` is a safe sentinel because it's non-positive and never
contributes to multipliers; the rows are already historical and the
amounts should remain unchanged.

### Step 3 — drop the deprecated enum members

Once no rows reference the deprecated values, drop them from the enum:

```prisma
enum HoneyActionType {
  CHECKIN
  // ...active values only...
  // (deprecated values removed)
}
```

This requires `ALTER TYPE ... RENAME TO` + `CREATE TYPE` + cast +
`DROP TYPE` dance in raw SQL because Postgres doesn't allow direct
removal of enum values.

### Step 4 — adjust read sites

Admin tooling that displays transaction history will need to fall back
to `legacyType` when the modern `type` is the sentinel. The component
in `src/app/admin/honey/page.tsx` is the only consumer of the enum
that surfaces historical rows in the UI today.

## Why not do all of this now?

Phase 3.5 explicitly defers the migration; the freezing-only stance
buys us safety against accidental new writes while leaving the heavy
schema work for a window when we can coordinate the admin UI change
with the migration. Treat the runtime guard above as the locking
mechanism that makes that future window safe to schedule.
