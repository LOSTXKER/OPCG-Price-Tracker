import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AchievementForm } from "../achievement-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขความสำเร็จ — แอดมิน" };

export default async function EditAchievementPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const achievement = await prisma.achievement.findUnique({ where: { id } });
  if (!achievement) notFound();

  return (
    <AchievementForm
      initial={{
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        nameEn: achievement.nameEn,
        nameTh: achievement.nameTh,
        description: achievement.description,
        criteria: achievement.criteria as { type?: string; target?: number },
        honeyReward: achievement.honeyReward,
        badgeImageUrl: achievement.badgeImageUrl,
        isActive: achievement.isActive,
      }}
    />
  );
}
