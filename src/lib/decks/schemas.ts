import { z } from "zod";

const cardEntry = z.object({
  cardId: z.number().int().positive(),
  quantity: z.number().int().positive().max(99).default(1),
});

export const CreateDeckSchema = z.object({
  name: z.string().trim().min(1).max(120),
  leaderId: z.number().int().positive().nullable().optional(),
  cardIds: z.array(cardEntry).max(200).optional(),
  isPublic: z.boolean().optional(),
});

export const UpdateDeckSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  leaderId: z.union([z.number().int().positive(), z.null()]).optional(),
  isPublic: z.boolean().optional(),
  addCards: z.array(cardEntry).max(200).optional(),
  removeCardIds: z.array(z.number().int().positive()).max(200).optional(),
});

export type CreateDeckInput = z.infer<typeof CreateDeckSchema>;
export type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;
