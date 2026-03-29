import {
  CardCondition,
  type CardCondition as CardConditionType,
} from "@/generated/prisma/client";

const CONDITIONS = new Set<string>(Object.values(CardCondition));


export function parseCondition(value: unknown): CardConditionType | null {
  if (typeof value !== "string" || !CONDITIONS.has(value)) return null;
  return value as CardConditionType;
}
