import type { Metadata } from "next";
import { SnkrdunkMatchClient } from "./snkrdunk-match-client";

export const metadata: Metadata = {
  title: "จับคู่ SNKRDUNK — Admin",
};

export const dynamic = "force-dynamic";

export default function SnkrdunkMatchingPage() {
  return <SnkrdunkMatchClient />;
}
