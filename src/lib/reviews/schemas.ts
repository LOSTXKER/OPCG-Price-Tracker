import { z } from "zod";

export const CreateReviewSchema = z.object({
  revieweeId: z.string().trim().min(1).max(60),
  listingId: z.union([z.number().int().positive(), z.null()]).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.union([z.string().max(2000), z.null()]).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
