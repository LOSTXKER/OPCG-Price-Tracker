import type { Metadata } from "next";
import { YuyuteiMatchClient } from "./yuyutei-match-client";

export const metadata: Metadata = {
  title: "จับคู่ราคา Yuyutei — Admin",
};

export const dynamic = "force-dynamic";

export default function YuyuteiMatchingPage() {
  return <YuyuteiMatchClient />;
}
