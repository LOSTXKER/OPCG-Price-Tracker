import { z } from "zod";
import {
  CardCondition,
  TransactionType,
} from "@/generated/prisma/client";
import {
  MAX_LISTING_QUANTITY,
  MAX_PORTFOLIO_BATCH_ITEMS,
  MIN_LISTING_QUANTITY,
} from "@/lib/constants/ui";

const condition = z.enum(
  Object.values(CardCondition) as [CardCondition, ...CardCondition[]],
);
const transactionType = z.enum(
  Object.values(TransactionType) as [TransactionType, ...TransactionType[]],
);

const numericId = z.coerce.number().int().positive();
const requiredNonNegative = z.number().nonnegative();
const optionalNonNegative = z
  .union([z.number().nonnegative(), z.null()])
  .optional();
const portfolioQuantity = z.coerce
  .number()
  .int()
  .min(MIN_LISTING_QUANTITY)
  .max(MAX_LISTING_QUANTITY);
const portfolioLotNote = z.string().trim().max(2000);
const nullablePortfolioLotNote = z.union([portfolioLotNote, z.null()]);
const portfolioLotDate = z.union([z.iso.date(), z.null()]);
const requiredPortfolioLotDate = z.iso.date();
const portfolioLotCost = z.union([
  z.number().int().nonnegative(),
  z.null(),
]);
const requiredPortfolioLotCost = z.number().int().nonnegative();

export const CreatePortfolioSchema = z.object({
  name: z.string().trim().min(1).max(120),
  isPublic: z.boolean(),
});

export const UpdatePortfolioSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    isPublic: z.boolean(),
  })
  .partial();

export const CreatePortfolioItemSchema = z.object({
  portfolioId: numericId,
  cardId: numericId,
  quantity: portfolioQuantity.default(1),
  purchasePrice: requiredNonNegative,
  acquiredAt: requiredPortfolioLotDate,
  lotNote: nullablePortfolioLotNote.optional(),
  condition: condition.optional(),
  notes: z.string().max(2000).optional(),
});

export const CreatePortfolioItemsBatchSchema = z
  .object({
    portfolioId: numericId,
    requestId: z.string().uuid(),
    items: z
      .array(CreatePortfolioItemSchema.omit({ portfolioId: true }))
      .min(1)
      .max(MAX_PORTFOLIO_BATCH_ITEMS),
  })
  .superRefine(({ items }, context) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const key = `${item.cardId}:${item.condition ?? CardCondition.NM}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["items", index],
          message: "Duplicate card and condition in batch",
        });
      }
      seen.add(key);
    });
  });

export const UpdatePortfolioItemSchema = z
  .object({
    // Compatibility for older clients. The route only permits these fields
    // while the holding still has exactly one acquisition lot.
    quantity: portfolioQuantity,
    purchasePrice: z.union([z.number().nonnegative(), z.null()]),
    acquiredAt: portfolioLotDate.optional(),
    lotNote: nullablePortfolioLotNote.optional(),
    condition,
    notes: z.union([z.string().max(2000), z.null()]),
    isPrivate: z.boolean(),
  })
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one item field is required",
  });

export const CreatePortfolioLotSchema = z
  .object({
    quantity: portfolioQuantity.default(1),
    unitCostJpy: requiredPortfolioLotCost,
    acquiredAt: requiredPortfolioLotDate,
    note: nullablePortfolioLotNote.optional(),
  })
  .strict();

export const UpdatePortfolioLotSchema = z
  .object({
    quantity: portfolioQuantity.optional(),
    unitCostJpy: portfolioLotCost.optional(),
    acquiredAt: portfolioLotDate.optional(),
    note: nullablePortfolioLotNote.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one lot field is required",
  });

export const CreatePortfolioTransactionSchema = z.object({
  portfolioId: numericId,
  cardId: numericId,
  type: transactionType,
  quantity: z.coerce.number().int().positive(),
  pricePerUnit: optionalNonNegative,
  note: z.string().max(2000).optional(),
});

export type CreatePortfolioInput = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof UpdatePortfolioSchema>;
export type CreatePortfolioItemInput = z.infer<typeof CreatePortfolioItemSchema>;
export type CreatePortfolioItemsBatchInput = z.infer<
  typeof CreatePortfolioItemsBatchSchema
>;
export type UpdatePortfolioItemInput = z.infer<typeof UpdatePortfolioItemSchema>;
export type CreatePortfolioLotInput = z.infer<typeof CreatePortfolioLotSchema>;
export type UpdatePortfolioLotInput = z.infer<typeof UpdatePortfolioLotSchema>;
export type CreatePortfolioTransactionInput = z.infer<
  typeof CreatePortfolioTransactionSchema
>;
