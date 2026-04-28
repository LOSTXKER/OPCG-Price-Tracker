import type { z } from "zod";

import { createLog } from "@/lib/logger";

const log = createLog("json-field");

/**
 * Safely parse a Prisma JSON column value at read time.
 *
 * The DB stores arbitrary JSON for columns like `Notification.data`,
 * `Message.metadata`, `HoneyTransaction.metadata` and `SavedFilter.filters`.
 * Code that reads these columns should never trust the shape blindly —
 * legacy rows, future migrations, and bugs at write sites can all leave
 * malformed values.
 *
 * `parseJsonField` runs `schema.safeParse` and:
 *
 *   - returns the parsed value on success (typed as `z.infer<typeof schema>`)
 *   - logs a warning with the supplied `label` and returns `fallback` on failure
 *
 * The label should identify the column so log output is searchable
 * (e.g. `"Notification.data"`, `"HoneyTransaction.metadata#42"`).
 */
export function parseJsonField<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string,
  fallback: T,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  log.warn(`invalid JSON in ${label}`, {
    issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })),
  });
  return fallback;
}

/**
 * Strict variant — throws on parse failure. Use when malformed data
 * should fail loudly (e.g. validating an admin-uploaded payload before
 * persisting it).
 */
export function parseJsonFieldStrict<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new Error(
    `invalid JSON in ${label}: ${result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")}`,
  );
}
