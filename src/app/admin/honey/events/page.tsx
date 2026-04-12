import { prisma } from "@/lib/db";
import { EventsManager } from "./events-manager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.seasonalEvent.findMany({
    orderBy: { startDate: "desc" },
  });

  const serialized = events.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }));

  return <EventsManager initialEvents={serialized} />;
}
