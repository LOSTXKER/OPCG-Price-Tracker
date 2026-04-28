import { z } from "zod";

export const CreateOfferSchema = z.object({
  listingId: z.number().int().positive(),
  priceThb: z.number().positive(),
  note: z.string().max(2000).optional(),
  parentId: z.number().int().positive().optional(),
});

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;

export const UpdateOfferSchema = z.object({
  action: z.enum(["accept", "reject", "cancel", "counter"]),
  counterPrice: z.number().positive().optional(),
  counterNote: z.string().max(2000).optional(),
});

export type UpdateOfferInput = z.infer<typeof UpdateOfferSchema>;
