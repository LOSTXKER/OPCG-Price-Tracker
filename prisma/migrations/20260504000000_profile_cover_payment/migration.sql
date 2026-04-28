-- Add public-profile commerce fields to User:
--   * coverImageUrl  — Supabase Storage URL for the profile cover banner.
--   * paymentMethods — list of payment method codes the seller accepts
--                      (e.g. "promptpay", "bank", "truemoney", "cod", "paypal").

ALTER TABLE "User" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "paymentMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
