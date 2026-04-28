import { z } from "zod";
import { CardCondition, ListingStatus } from "@/generated/prisma/client";
import { MAX_LISTING_QUANTITY, MIN_LISTING_QUANTITY } from "@/lib/constants/ui";

const condition = z.enum(Object.values(CardCondition) as [CardCondition, ...CardCondition[]]);
const status = z.enum(Object.values(ListingStatus) as [ListingStatus, ...ListingStatus[]]);

const positiveInt = z.number().int().positive();
const nonNegativeNumber = z.number().nonnegative();
const optionalString = (max: number) =>
  z
    .union([z.string().max(max), z.null()])
    .transform((v) => (typeof v === "string" ? v : null))
    .optional();

const photos = z.array(z.string().max(2000)).max(20).optional();
const shipping = z.array(z.string().max(500)).max(20).optional();

export const CreateListingSchema = z.object({
  cardId: positiveInt,
  priceJpy: positiveInt,
  priceThb: z.union([nonNegativeNumber, z.null()]).optional(),
  condition: condition.optional(),
  quantity: z
    .number()
    .int()
    .min(MIN_LISTING_QUANTITY)
    .max(MAX_LISTING_QUANTITY)
    .optional(),
  description: optionalString(5000),
  location: optionalString(200),
  photos,
  shipping,
});

export const UpdateListingSchema = z
  .object({
    priceJpy: positiveInt,
    priceThb: z.union([nonNegativeNumber, z.null()]),
    condition,
    quantity: z
      .number()
      .int()
      .min(MIN_LISTING_QUANTITY)
      .max(MAX_LISTING_QUANTITY),
    description: optionalString(5000),
    location: optionalString(200),
    photos,
    shipping,
    status,
  })
  .partial();

export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;
