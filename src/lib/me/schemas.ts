import { z } from "zod";

const optionalNullableString = z.union([z.string(), z.null()]).optional();

export const UpdateProfileSchema = z
  .object({
    displayName: z.string(),
    bio: z.union([z.string(), z.null()]),
    profileVisibility: z.enum(["public", "friends", "private"]),
    showCollection: z.boolean(),
    showListings: z.boolean(),
    showDecks: z.boolean(),
    showStats: z.boolean(),
    showWatchlist: z.boolean(),
    hidePortfolioPrices: z.boolean(),
    hidePortfolioQty: z.boolean(),
    profileSummaryOnly: z.boolean(),
    handle: z.union([z.string(), z.null()]),
    socialLine: optionalNullableString,
    socialIg: optionalNullableString,
    socialTwitter: optionalNullableString,
    socialFacebook: optionalNullableString,
  })
  .partial();

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const CancelReasonSchema = z.object({
  reason: z.string().trim().min(1).max(200),
  comment: z.string().max(1000).optional(),
});

export const CreateAddressSchema = z.object({
  label: z.string().trim().max(60).optional(),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional(),
  addressLine: z.string().trim().min(1).max(500),
  district: z.string().trim().max(120).optional(),
  province: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().max(60).optional(),
  isDefault: z.boolean().optional(),
});

export const UpdateAddressSchema = CreateAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
