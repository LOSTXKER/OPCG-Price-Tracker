import { z } from "zod";

/** Body schema for `POST /api/notifications/read` — mark one or all read. */
export const MarkNotificationReadSchema = z
  .object({
    id: z.number().int().positive().optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => v.id != null || v.all === true, {
    message: "Either `id` or `all: true` is required",
  });

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;

/**
 * Zod schema for `Notification.data` (the in-app feed payload).
 *
 * The column is freeform JSON in the database, but in practice we set
 * a small set of well-known keys depending on the notification kind:
 *
 *   - `dedupKey` — set by `notify()` when the caller supplies one. Used
 *     by the same dispatcher to coalesce repeats within 24h.
 *   - `listingId` / `messageId` / `senderId` — for MESSAGE_NEW.
 *   - `cardCode` / `threshold` / `direction` — for PRICE_ALERT.
 *   - `orderId` — for ORDER_* (paid, shipped, delivered, cancelled).
 *   - `offerId` — for OFFER_* (new, counter, accept, reject).
 *   - `achievementCode` / `level` — for HONEY (achievement, level-up).
 *   - `raffleId` — for RAFFLE_WIN.
 *   - `url` — optional click-through override.
 *
 * The schema is permissive (`passthrough`) so unknown keys are allowed
 * and forward-compatible. Required fields are flagged at the
 * write-site, not here, because each kind has its own contract.
 */
export const NotificationDataSchema = z
  .object({
    dedupKey: z.string().optional(),
    listingId: z.number().int().optional(),
    messageId: z.number().int().optional(),
    senderId: z.string().optional(),
    cardCode: z.string().optional(),
    threshold: z.number().optional(),
    targetPrice: z.number().optional(),
    price: z.number().optional(),
    alertId: z.number().int().optional(),
    /**
     * Direction of the price alert. `ABOVE` / `BELOW` mirror the
     * Prisma `AlertDirection` enum stored on `PriceAlert.direction`;
     * `UP` / `DOWN` / `BOTH` are kept for legacy payloads on existing
     * Notification rows.
     */
    direction: z
      .enum(["ABOVE", "BELOW", "UP", "DOWN", "BOTH"])
      .optional(),
    currency: z.enum(["JPY", "THB"]).optional(),
    orderId: z.number().int().optional(),
    offerId: z.number().int().optional(),
    achievementCode: z.string().optional(),
    level: z.number().int().optional(),
    raffleId: z.number().int().optional(),
    url: z.string().optional(),
  })
  .passthrough();

export type NotificationData = z.infer<typeof NotificationDataSchema>;
