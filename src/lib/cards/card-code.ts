/**
 * Card code display rules — the single place that decides what a *reader* sees.
 *
 * The DB stores `Card.cardCode` with a machine suffix that separates printings
 * of the same card number: `_p1`..`_p8` for parallel (alternate-art) prints and
 * `_r1`..`_r2` for reprints in a later set. That suffix is **our scraper's**
 * invention — Bandai never prints it on the card, so a visitor who reads
 * "OP09-001_p1" is being shown an internal database key.
 *
 * Owner ruling (เบส, 2026-08-04, restated 2026-08-08 "เอาออกไปเลย ทั้งเว็บ"):
 * the suffix must not appear anywhere a visitor can read it — copy, labels,
 * `alt`/`aria-label`, meta tags, JSON-LD text fields, notifications, e-mail,
 * LINE messages or exported files.
 *
 * It still belongs in the places that are addresses rather than text: URLs and
 * route params, JSON-LD `sku`/`url`/`@id`, image filenames, DB queries and
 * React keys. Those keep four same-name P-SEC printings apart.
 *
 * This module deliberately has **no imports**: it is pulled into client
 * components all over the app, and the SEO copy module it used to live in
 * carries the full Thai copy dictionary with it.
 */

/** Matches the trailing printing suffix: `_p3`, `_r1`, … (case-insensitive). */
const VARIANT_SUFFIX = /_([a-z])(\d+)$/i;

/**
 * The official Bandai card number — `OP13-118_p3` → `OP13-118`.
 *
 * Verified against the live DB (2026-08-08): `Card.baseCode` is non-null for all
 * 3,838 rows and always equals `cardCode` with this suffix stripped, so this is
 * a safe string-level substitute wherever `baseCode` was not selected.
 */
export function baseCardCode(cardCode: string): string {
  return cardCode.replace(VARIANT_SUFFIX, "");
}

export type CardVariant =
  /** Alternate-art print — `_p2` → `{ kind: "parallel", index: 2 }`. */
  | { kind: "parallel"; index: number }
  /** Same card reprinted in a later set — `_r1`. */
  | { kind: "reprint"; index: number };

/**
 * The printing a code refers to, or `null` for the standard print.
 *
 * Use this when a surface lists several printings side by side and needs a word
 * to tell them apart — render "พาราเลล 2", never the raw `_p2`.
 */
export function cardVariant(cardCode: string): CardVariant | null {
  const match = cardCode.match(VARIANT_SUFFIX);
  if (!match) return null;
  const index = Number(match[2]);
  if (!Number.isFinite(index)) return null;
  return match[1].toLowerCase() === "r"
    ? { kind: "reprint", index }
    : { kind: "parallel", index };
}

export type CardCodeSummary = {
  /** Distinct Bandai card numbers, e.g. every OP02-001 printing counts once. */
  baseCardCount: number;
  /** Alternate-art / reprint records carrying a machine printing suffix. */
  variantCount: number;
  /** Every catalogue version shown in the set wall, priced or not. */
  recordCount: number;
};

/**
 * Reader-facing count semantics for a set page. A catalogue can contain 154
 * versions without containing 154 different Bandai card numbers; this keeps
 * those two claims separate while preserving every printing in the wall.
 */
export function summarizeCardCodes(
  cardCodes: readonly string[],
): CardCodeSummary {
  const baseCodes = new Set<string>();
  let variantCount = 0;

  for (const code of cardCodes) {
    baseCodes.add(baseCardCode(code));
    if (cardVariant(code)) variantCount += 1;
  }

  return {
    baseCardCount: baseCodes.size,
    variantCount,
    recordCount: cardCodes.length,
  };
}

/**
 * The printing named in words: `"Parallel 2"`, `"Reprint 1"`, `""` for a
 * standard print.
 *
 * Exists so a surface that genuinely needs to keep printings apart — a CSV
 * column, a screen-reader label — can do it without publishing `_p2`.
 */
export function printingLabel(cardCode: string): string {
  const variant = cardVariant(cardCode);
  if (!variant) return "";
  return variant.kind === "reprint"
    ? `Reprint ${variant.index}`
    : `Parallel ${variant.index}`;
}

/**
 * Reader-facing form of a full card code: `EB01-001_p1` → `EB01-001 (Parallel 1)`.
 *
 * Used where one string has to stay unique across printings — the `<title>` of
 * ~3,800 card pages, where two P-SEC prints of the same number would otherwise
 * produce byte-identical titles. Prefer `baseCardCode` anywhere a rarity badge
 * or artwork already does the telling-apart.
 */
export function formatCardCodeLabel(cardCode: string): string {
  const variant = cardVariant(cardCode);
  if (!variant || variant.kind !== "parallel") return baseCardCode(cardCode);
  return `${baseCardCode(cardCode)} (Parallel ${variant.index})`;
}
