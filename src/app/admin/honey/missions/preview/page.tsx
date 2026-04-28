import type { Metadata } from "next";
import { PreviewClient } from "./preview-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "ดูตัวอย่างภารกิจ — แอดมิน" };

export default function MissionsPreviewPage() {
  return <PreviewClient />;
}
