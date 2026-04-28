import { z } from "zod";

export const CreateMessageSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1).max(4000),
  type: z.enum(["TEXT", "IMAGE"]).optional(),
});

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;

/**
 * Schema for `Message.metadata` JSON column.
 *
 * Currently used to attach offer/order context to system messages and
 * to record optional system events (e.g. `"OFFER_ACCEPTED"`,
 * `"ORDER_PAID"`). Permissive `passthrough` to keep the column
 * forward-compatible — new keys can land before the schema is updated.
 */
export const MessageMetadataSchema = z
  .object({
    offerId: z.number().int().optional(),
    orderId: z.number().int().optional(),
    systemEvent: z.string().optional(),
  })
  .passthrough();

export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;
