import { z } from "zod";

/** PATCH /api/admin/cards — editable card fields. Unknown keys are stripped, so
 *  this replaces the old hand-rolled `allowedFields` allow-list. */
export const UpdateAdminCardSchema = z.object({
  id: z.number().int().positive(),
  nameEn: z.string().optional(),
  nameTh: z.string().optional(),
  imageUrl: z.string().optional(),
  rarity: z.string().optional(),
  cardType: z.string().optional(),
  color: z.string().optional(),
  colorEn: z.string().optional(),
});

/** PATCH /api/admin/sets — editable set fields. `releaseDate` is coerced to a
 *  Date (was `new Date(...)` in the handler). */
export const UpdateAdminSetSchema = z.object({
  id: z.number().int().positive(),
  nameEn: z.string().optional(),
  nameTh: z.string().optional(),
  releaseDate: z.coerce.date().optional(),
  packsPerBox: z.number().int().optional(),
  cardsPerPack: z.number().int().optional(),
  boxImageUrl: z.string().optional(),
  msrpJpy: z.number().optional(),
});
