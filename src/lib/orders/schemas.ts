import { z } from "zod";
import { OrderStatus } from "@/generated/prisma/client";

export const CreateOrderSchema = z.object({
  listingId: z.number().int().positive(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

const orderStatus = z.enum(
  Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]],
);

export const UpdateOrderSchema = z.object({
  status: orderStatus,
  trackingNumber: z.string().trim().max(120).optional(),
  shippingMethod: z.string().trim().max(120).optional(),
  cancelReason: z.string().trim().max(500).optional(),
});

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
