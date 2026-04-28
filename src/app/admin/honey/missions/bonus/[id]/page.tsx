import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BonusForm } from "../bonus-form";
import type { BonusRule } from "../../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขกฎโบนัส — แอดมิน" };

export default async function EditBonusPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const rule = await prisma.missionBonusRule.findUnique({ where: { id } });
  if (!rule) notFound();

  const serialized: BonusRule = {
    ...rule,
    rewards: rule.rewards as Record<string, unknown>,
    createdAt: rule.createdAt.toISOString(),
  };

  return <BonusForm initial={serialized} />;
}
