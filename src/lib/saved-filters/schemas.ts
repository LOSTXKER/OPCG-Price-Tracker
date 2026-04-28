import { z } from "zod";

/**
 * Schema for `SavedFilter.filters` JSON column.
 *
 * The legacy `/api/saved-filters` route was retired in phase 2.9, but
 * the model lives on as a `SavedFilter[]` relation on User and can be
 * re-wired when we revisit saved-views in the marketplace UI. Keeping
 * a typed schema here ensures any future writer goes through Zod and
 * can't accidentally store arbitrary blobs.
 *
 * The shape mirrors the marketplace filter state used elsewhere in the
 * app — search query, paginated lists of selected filter values, sort
 * key, and the inclusive price range. Unknown keys are allowed via
 * `passthrough` so a client at HEAD can still read older rows that
 * stored extra fields.
 */
export const SavedFilterFiltersSchema = z
  .object({
    search: z.string().optional(),
    setIds: z.array(z.string()).optional(),
    rarities: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    cardType: z.string().nullable().optional(),
    sort: z.string().optional(),
    minPriceJpy: z.number().nullable().optional(),
    maxPriceJpy: z.number().nullable().optional(),
    minPriceThb: z.number().nullable().optional(),
    maxPriceThb: z.number().nullable().optional(),
  })
  .passthrough();

export type SavedFilterFilters = z.infer<typeof SavedFilterFiltersSchema>;
