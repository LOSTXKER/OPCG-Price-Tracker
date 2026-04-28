import { z } from "zod";

export const CreateWatchlistSchema = z.object({
  cardId: z.coerce.number().int().positive(),
  note: z.union([z.string().max(280), z.null()]).optional(),
  targetPriceJpy: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
});

export const UpdateWatchlistSchema = z
  .object({
    note: z.union([z.string().max(280), z.null()]),
    targetPriceJpy: z.union([z.coerce.number().nonnegative(), z.null()]),
    pinnedAt: z.union([z.literal("toggle"), z.string(), z.null()]),
  })
  .partial();

export type CreateWatchlistInput = z.infer<typeof CreateWatchlistSchema>;
export type UpdateWatchlistInput = z.infer<typeof UpdateWatchlistSchema>;
