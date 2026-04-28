import type { Metadata } from "next";
import { BonusForm } from "../bonus-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "สร้างกฎโบนัส — แอดมิน" };

export default function NewBonusPage() {
  return <BonusForm />;
}
