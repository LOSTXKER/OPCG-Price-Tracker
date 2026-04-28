import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขอีเวนต์ — แอดมิน" };

export default async function EditEventPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const event = await prisma.seasonalEvent.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <EventForm
      initial={{
        id: event.id,
        name: event.name,
        nameEn: event.nameEn,
        nameTh: event.nameTh,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        honeyMultiplier: event.honeyMultiplier,
        isActive: event.isActive,
      }}
    />
  );
}
