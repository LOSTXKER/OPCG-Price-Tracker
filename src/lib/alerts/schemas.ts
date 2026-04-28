import { z } from "zod";
import { AlertChannel, AlertDirection } from "@/generated/prisma/client";

const channel = z.enum(
  Object.values(AlertChannel) as [AlertChannel, ...AlertChannel[]],
);
const direction = z.enum(
  Object.values(AlertDirection) as [AlertDirection, ...AlertDirection[]],
);

const channelsField = z.union([
  z.array(channel).nonempty(),
  channel,
]);

export const CreateAlertSchema = z.object({
  cardId: z.number().int().positive(),
  targetPrice: z.number().int().positive(),
  direction,
  channels: channelsField.optional(),
  channel: channel.optional(),
});

export const UpdateAlertSchema = z
  .object({
    targetPrice: z.number().int().positive(),
    direction,
    channels: channelsField,
    channel,
    isActive: z.boolean(),
  })
  .partial();

export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
export type UpdateAlertInput = z.infer<typeof UpdateAlertSchema>;
