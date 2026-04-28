import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RaffleForm, type Prize } from "../raffle-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขตู้ Raffle — แอดมิน" };

export default async function EditRafflePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const raffle = await prisma.monthlyRaffle.findUnique({ where: { id } });
  if (!raffle) notFound();

  return (
    <RaffleForm
      initial={{
        id: raffle.id,
        month: raffle.month,
        slug: raffle.slug,
        title: raffle.title,
        titleEn: raffle.titleEn,
        titleTh: raffle.titleTh,
        description: raffle.description,
        imageUrl: raffle.imageUrl,
        color: raffle.color,
        prizes: raffle.prizes as Prize[],
        ticketCost: raffle.ticketCost,
        maxTickets: raffle.maxTickets,
        freeThreshold: raffle.freeThreshold,
        sortOrder: raffle.sortOrder,
      }}
    />
  );
}
