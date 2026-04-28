import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { RaffleForm, type Prize } from "../raffle-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "สร้างตู้ Raffle — แอดมิน" };

export default async function NewRafflePage(props: {
  searchParams: Promise<{ clone?: string }>;
}) {
  const { clone } = await props.searchParams;
  if (!clone) return <RaffleForm />;

  const id = Number(clone);
  if (!Number.isInteger(id) || id < 1) return <RaffleForm />;

  const raffle = await prisma.monthlyRaffle.findUnique({ where: { id } });
  if (!raffle) return <RaffleForm />;

  return (
    <RaffleForm
      cloneFrom={{
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
