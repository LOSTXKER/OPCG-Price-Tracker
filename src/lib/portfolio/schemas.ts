import { z } from "zod";
import { CardCondition } from "@/generated/prisma/client";
import { MAX_LISTING_QUANTITY, MIN_LISTING_QUANTITY } from "@/lib/constants/ui";

const condition = z.enum(
  Object.values(CardCondition) as [CardCondition, ...CardCondition[]],
);

const numericId = z.coerce.number().int().positive();
const optionalNonNegative = z.union([z.coerce.number().nonnegative(), z.null()]).optional();

export const CreatePortfolioSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const CreatePortfolioItemSchema = z.object({
  portfolioId: numericId,
  cardId: numericId,
  quantity: z.coerce
    .number()
    .int()
    .min(MIN_LISTING_QUANTITY)
    .max(MAX_LISTING_QUANTITY)
    .default(1),
  purchasePrice: optionalNonNegative,
  condition: condition.optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdatePortfolioItemSchema = z
  .object({
    quantity: z.coerce
      .number()
      .int()
      .min(MIN_LISTING_QUANTITY)
      .max(MAX_LISTING_QUANTITY),
    purchasePrice: z.union([z.coerce.number().nonnegative(), z.null()]),
    condition,
    notes: z.union([z.string().max(2000), z.null()]),
    isPrivate: z.boolean(),
  })
  .partial();

export const CreatePortfolioTransactionSchema = z.object({
  portfolioId: numericId,
  cardId: numericId,
  type: z.enum(["BUY", "SELL", "ADJUST"]),
  quantity: z.coerce.number().int().positive(),
  pricePerUnit: optionalNonNegative,
  note: z.string().max(2000).optional(),
});

export type CreatePortfolioInput = z.infer<typeof CreatePortfolioSchema>;
export type CreatePortfolioItemInput = z.infer<typeof CreatePortfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof UpdatePortfolioItemSchema>;
export type CreatePortfolioTransactionInput = z.infer<
  typeof CreatePortfolioTransactionSchema
>;
