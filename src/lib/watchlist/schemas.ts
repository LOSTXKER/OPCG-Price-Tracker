import { z } from "zod";

export const CreateWatchlistSchema = z.object({
  cardId: z.coerce.number().int().positive(),
});

export const UpdateWatchlistSchema = z
  .object({
    pinnedAt: z.union([z.literal("toggle"), z.string(), z.null()]),
  })
  .partial();

export type CreateWatchlistInput = z.infer<typeof CreateWatchlistSchema>;
export type UpdateWatchlistInput = z.infer<typeof UpdateWatchlistSchema>;
