import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BonusList } from "./bonus-list";
import type { BonusRule } from "../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "กฎโบนัสภารกิจ — แอดมิน" };

export default async function BonusPage() {
  const rules = await prisma.missionBonusRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const serialized: BonusRule[] = rules.map((r) => ({
    ...r,
    rewards: r.rewards as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
  }));

  return <BonusList initialRules={serialized} />;
}
