import {
  type CardCondition,
  type PortfolioLotSource as PortfolioLotSourceValue,
  PortfolioLotSource,
  type Prisma,
} from "@/generated/prisma/client";
import { MAX_LISTING_QUANTITY } from "@/lib/constants/ui";

export const ownerPortfolioLotSelect = {
  id: true,
  quantity: true,
  unitCostJpy: true,
  acquiredAt: true,
  note: true,
  source: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const ownerPortfolioLotOrderBy = [
  { acquiredAt: "desc" },
  { createdAt: "desc" },
  { id: "desc" },
] as const;

export type PortfolioLotValue = {
  id: number;
  quantity: number;
  unitCostJpy: number | null;
  acquiredAt: Date | null;
  note: string | null;
  source: PortfolioLotSourceValue;
  createdAt: Date;
  updatedAt: Date;
};

type LegacyPortfolioItemCost = {
  quantity: number;
  purchasePrice: number | null;
  lots?: readonly PortfolioLotValue[];
};

export type PortfolioLotAggregate = {
  quantity: number;
  recordedCostJpy: number;
  costedCopyCount: number;
  lotCount: number;
  purchasePrice: number | null;
  usesLegacyFallback: boolean;
};

/**
 * Summarize acquisition lots without treating an unknown unit cost as zero.
 * `purchasePrice` remains a compatibility-only rounded weighted average; exact
 * financial reads must use `recordedCostJpy`.
 */
export function getPortfolioLotAggregate(
  item: LegacyPortfolioItemCost,
): PortfolioLotAggregate {
  const lots = item.lots ?? [];
  if (lots.length === 0) {
    const hasKnownCost = item.purchasePrice !== null;
    return {
      quantity: item.quantity,
      recordedCostJpy: hasKnownCost
        ? item.purchasePrice! * item.quantity
        : 0,
      costedCopyCount: hasKnownCost ? item.quantity : 0,
      lotCount: 0,
      purchasePrice: item.purchasePrice,
      usesLegacyFallback: true,
    };
  }

  let quantity = 0;
  let recordedCostJpy = 0;
  let costedCopyCount = 0;

  for (const lot of lots) {
    quantity += lot.quantity;
    if (lot.unitCostJpy !== null) {
      recordedCostJpy += lot.unitCostJpy * lot.quantity;
      costedCopyCount += lot.quantity;
    }
  }

  const costCoverageComplete =
    quantity > 0 && costedCopyCount === quantity;

  return {
    quantity,
    recordedCostJpy,
    costedCopyCount,
    lotCount: lots.length,
    purchasePrice: costCoverageComplete
      ? Math.round(recordedCostJpy / quantity)
      : null,
    usesLegacyFallback: false,
  };
}

export function toOwnerPortfolioItemDto<
  T extends {
    quantity: number;
    purchasePrice: number | null;
    lots: readonly PortfolioLotValue[];
  },
>(item: T) {
  const aggregate = getPortfolioLotAggregate(item);
  const { lots, ...parent } = item;

  return {
    ...parent,
    quantity: aggregate.quantity,
    purchasePrice: aggregate.purchasePrice,
    lots: lots.map((lot) => ({
      id: lot.id,
      quantity: lot.quantity,
      unitCostJpy: lot.unitCostJpy,
      acquiredAt: lot.acquiredAt,
      note: lot.note,
      source: lot.source,
      createdAt: lot.createdAt,
      updatedAt: lot.updatedAt,
    })),
    lotCount: aggregate.lotCount,
    recordedCostJpy: aggregate.recordedCostJpy,
    costedCopyCount: aggregate.costedCopyCount,
  };
}

type PortfolioItemMutationRow = LegacyPortfolioItemCost & {
  id: number;
  portfolioId: number;
  cardId: number;
  addedAt?: Date;
  lots: readonly PortfolioLotValue[];
};

export type PortfolioLotMutationInput = {
  quantity: number;
  unitCostJpy: number | null;
  acquiredAt: Date | null;
  note: string | null;
};

export class PortfolioLotQuantityError extends Error {
  constructor() {
    super(`Quantity cannot exceed ${MAX_LISTING_QUANTITY}`);
    this.name = "PortfolioLotQuantityError";
  }
}

export class PortfolioLotConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioLotConflictError";
  }
}

function assertAggregateQuantity(quantity: number): void {
  if (quantity < 1 || quantity > MAX_LISTING_QUANTITY) {
    throw new PortfolioLotQuantityError();
  }
}

async function materializeLegacyOpeningBalance(
  tx: Prisma.TransactionClient,
  item: PortfolioItemMutationRow,
): Promise<PortfolioLotValue[]> {
  if (item.lots.length > 0) return [...item.lots];

  const openingLot = await tx.portfolioLot.create({
    data: {
      portfolioItemId: item.id,
      quantity: item.quantity,
      unitCostJpy: item.purchasePrice,
      acquiredAt: null,
      note: null,
      source: PortfolioLotSource.LEGACY_OPENING_BALANCE,
      ...(item.addedAt ? { createdAt: item.addedAt } : {}),
    },
    select: ownerPortfolioLotSelect,
  });

  return [openingLot];
}

async function writeAggregateCompatibility(
  tx: Prisma.TransactionClient,
  portfolioItemId: number,
  aggregate: PortfolioLotAggregate,
) {
  return tx.portfolioItem.update({
    where: { id: portfolioItemId },
    data: {
      quantity: aggregate.quantity,
      purchasePrice: aggregate.purchasePrice,
    },
  });
}

export async function appendPortfolioLot(
  tx: Prisma.TransactionClient,
  item: PortfolioItemMutationRow,
  input: PortfolioLotMutationInput,
) {
  const existingLots = await materializeLegacyOpeningBalance(tx, item);
  assertAggregateQuantity(
    existingLots.reduce((sum, lot) => sum + lot.quantity, 0) + input.quantity,
  );

  const lot = await tx.portfolioLot.create({
    data: {
      portfolioItemId: item.id,
      quantity: input.quantity,
      unitCostJpy: input.unitCostJpy,
      acquiredAt: input.acquiredAt,
      note: input.note,
      source: PortfolioLotSource.MANUAL,
    },
    select: ownerPortfolioLotSelect,
  });
  const lots = [...existingLots, lot];
  const aggregate = getPortfolioLotAggregate({
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    lots,
  });
  const updatedItem = await writeAggregateCompatibility(tx, item.id, aggregate);

  return { lot, lots, aggregate, updatedItem };
}

export async function createPortfolioItemWithLot(
  tx: Prisma.TransactionClient,
  input: {
    portfolioId: number;
    cardId: number;
    condition: CardCondition;
    notes: string | null;
    lot: PortfolioLotMutationInput;
  },
) {
  assertAggregateQuantity(input.lot.quantity);

  const item = await tx.portfolioItem.create({
    data: {
      portfolioId: input.portfolioId,
      cardId: input.cardId,
      quantity: input.lot.quantity,
      purchasePrice: input.lot.unitCostJpy,
      condition: input.condition,
      notes: input.notes,
    },
  });
  const lot = await tx.portfolioLot.create({
    data: {
      portfolioItemId: item.id,
      quantity: input.lot.quantity,
      unitCostJpy: input.lot.unitCostJpy,
      acquiredAt: input.lot.acquiredAt,
      note: input.lot.note,
      source: PortfolioLotSource.MANUAL,
    },
    select: ownerPortfolioLotSelect,
  });

  return {
    item,
    lot,
    lots: [lot],
    aggregate: getPortfolioLotAggregate({
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      lots: [lot],
    }),
  };
}

export async function updatePortfolioLot(
  tx: Prisma.TransactionClient,
  item: PortfolioItemMutationRow,
  lotId: number,
  input: Partial<PortfolioLotMutationInput>,
) {
  const target = item.lots.find((lot) => lot.id === lotId);
  if (!target) throw new Error("Portfolio lot does not belong to item");

  const nextQuantity = input.quantity ?? target.quantity;
  const projectedQuantity =
    item.lots.reduce((sum, lot) => sum + lot.quantity, 0) -
    target.quantity +
    nextQuantity;
  assertAggregateQuantity(projectedQuantity);

  const lot = await tx.portfolioLot.update({
    where: { id: lotId },
    data: {
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.unitCostJpy !== undefined
        ? { unitCostJpy: input.unitCostJpy }
        : {}),
      ...(input.acquiredAt !== undefined
        ? { acquiredAt: input.acquiredAt }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    },
    select: ownerPortfolioLotSelect,
  });
  const lots = item.lots.map((current) =>
    current.id === lot.id ? lot : current,
  );
  const aggregate = getPortfolioLotAggregate({
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    lots,
  });
  const updatedItem = await writeAggregateCompatibility(tx, item.id, aggregate);

  return { lot, lots, aggregate, updatedItem };
}

export async function updateSinglePortfolioLotCompatibility(
  tx: Prisma.TransactionClient,
  item: PortfolioItemMutationRow,
  input: {
    quantity?: number;
    unitCostJpy?: number | null;
    acquiredAt?: Date | null;
    note?: string | null;
  },
) {
  const lots = await materializeLegacyOpeningBalance(tx, item);
  if (lots.length !== 1) {
    throw new PortfolioLotConflictError(
      "Quantity and cost must be edited per acquisition lot",
    );
  }

  return updatePortfolioLot(
    tx,
    { ...item, lots },
    lots[0].id,
    input,
  );
}

export async function deletePortfolioLot(
  tx: Prisma.TransactionClient,
  item: PortfolioItemMutationRow,
  lotId: number,
) {
  const target = item.lots.find((lot) => lot.id === lotId);
  if (!target) throw new Error("Portfolio lot does not belong to item");

  await tx.portfolioLot.delete({ where: { id: lotId } });
  const lots = item.lots.filter((lot) => lot.id !== lotId);

  if (lots.length === 0) {
    await tx.portfolioItem.delete({ where: { id: item.id } });
    return { deletedItem: true as const, deletedLot: target, aggregate: null };
  }

  const aggregate = getPortfolioLotAggregate({
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    lots,
  });
  const updatedItem = await writeAggregateCompatibility(tx, item.id, aggregate);
  return {
    deletedItem: false as const,
    deletedLot: target,
    lots,
    aggregate,
    updatedItem,
  };
}

export function portfolioLotDateFromInput(
  value: string | null | undefined,
): Date | null {
  return value === null || value === undefined
    ? null
    : new Date(`${value}T00:00:00.000Z`);
}
