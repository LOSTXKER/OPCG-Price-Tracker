import type { Metadata } from "next";
import { AchievementForm } from "../achievement-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "สร้างความสำเร็จ — แอดมิน" };

export default function NewAchievementPage() {
  return <AchievementForm />;
}
