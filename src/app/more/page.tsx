import type { Metadata } from "next";
import MoreClient from "./more-client";

export const metadata: Metadata = {
  title: "More",
  description: "Browse, track and manage your Meecard account.",
  robots: { index: false },
  alternates: { canonical: "/more" },
};

export default function MorePage() {
  return <MoreClient />;
}
