import type { Metadata } from "next";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "สร้างอีเวนต์ — แอดมิน" };

export default function NewEventPage() {
  return <EventForm />;
}
