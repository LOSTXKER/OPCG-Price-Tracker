import {
  AlertChannel,
  type AlertChannel as AlertChannelType,
  type AlertDirection as AlertDirectionType,
  type UserTier,
} from "@/generated/prisma/client";
import { effectiveTier, getLimits } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { cardInclude } from "@/lib/api/query-fragments";
import { NextResponse } from "next/server";
import type { CreateAlertInput, UpdateAlertInput } from "./schemas";

/**
 * Normalise the validated `channels`/legacy `channel` shape into a
 * deduplicated `AlertChannel[]`. Returns `null` when no value is provided.
 */
function dedupeChannels(input: {
  channels?: AlertChannelType[] | AlertChannelType;
  channel?: AlertChannelType;
}): AlertChannelType[] | null {
  const raw = input.channels ?? input.channel;
  if (raw === undefined) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const seen = new Set<AlertChannelType>();
  for (const value of arr) seen.add(value);
  return seen.size === 0 ? null : Array.from(seen);
}

type AlertOwner = { id: string; tier: UserTier; tierExpiresAt: Date | null };

export type CreateAlertResult =
  | { ok: true; alert: Awaited<ReturnType<typeof prisma.priceAlert.create>> }
  | { ok: false; response: NextResponse };

export async function createAlert(
  user: AlertOwner,
  body: CreateAlertInput,
): Promise<CreateAlertResult> {
  const { cardId, targetPrice, direction } = body;
  const channels =
    dedupeChannels({ channels: body.channels, channel: body.channel }) ?? [
      AlertChannel.EMAIL,
    ];

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Card not found" }, { status: 404 }),
    };
  }

  const tier = effectiveTier(user.tier, user.tierExpiresAt);
  const limits = getLimits(tier);
  if (limits.priceAlerts !== Infinity) {
    const count = await prisma.priceAlert.count({ where: { userId: user.id } });
    if (count >= limits.priceAlerts) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: `Price alert limit reached (${limits.priceAlerts})` },
          { status: 403 },
        ),
      };
    }
  }

  if (channels.includes(AlertChannel.LINE) && !limits.lineAlerts) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "LINE alerts require a Pro plan or higher" },
        { status: 403 },
      ),
    };
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      cardId,
      targetPrice,
      direction,
      channels,
    },
    include: { card: { include: cardInclude } },
  });

  return { ok: true, alert };
}

export type UpdateAlertResult =
  | { ok: true; alert: Awaited<ReturnType<typeof prisma.priceAlert.update>> }
  | { ok: false; response: NextResponse };

export async function updateAlert(
  user: AlertOwner,
  id: number,
  body: UpdateAlertInput,
): Promise<UpdateAlertResult> {
  const existing = await prisma.priceAlert.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Alert not found" }, { status: 404 }),
    };
  }

  const data: {
    targetPrice?: number;
    direction?: AlertDirectionType;
    channels?: AlertChannelType[];
    isActive?: boolean;
    triggeredAt?: Date | null;
  } = {};

  if (body.targetPrice !== undefined) data.targetPrice = body.targetPrice;
  if (body.direction !== undefined) data.direction = body.direction;

  if (body.channels !== undefined || body.channel !== undefined) {
    const parsedChannels = dedupeChannels({
      channels: body.channels,
      channel: body.channel,
    });
    if (!parsedChannels) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "channels must be a non-empty array of valid AlertChannel values" },
          { status: 400 },
        ),
      };
    }
    data.channels = parsedChannels;
  }

  if (body.isActive !== undefined) {
    data.isActive = body.isActive;
    if (body.isActive === true && existing.isActive === false) {
      data.triggeredAt = null;
    }
  }

  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No fields to update" }, { status: 400 }),
    };
  }

  const tier = effectiveTier(user.tier, user.tierExpiresAt);
  const limits = getLimits(tier);

  const finalChannels = data.channels ?? existing.channels;
  if (finalChannels.includes(AlertChannel.LINE) && !limits.lineAlerts) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "LINE alerts require a Pro plan or higher" },
        { status: 403 },
      ),
    };
  }

  const willBeActive = data.isActive ?? existing.isActive;
  const becomingActive = willBeActive && !existing.isActive;
  if (becomingActive && limits.priceAlerts !== Infinity) {
    const activeCount = await prisma.priceAlert.count({
      where: { userId: user.id, isActive: true },
    });
    if (activeCount >= limits.priceAlerts) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: `Price alert limit reached (${limits.priceAlerts})` },
          { status: 403 },
        ),
      };
    }
  }

  const alert = await prisma.priceAlert.update({
    where: { id },
    data,
    include: { card: { include: cardInclude } },
  });

  return { ok: true, alert };
}
