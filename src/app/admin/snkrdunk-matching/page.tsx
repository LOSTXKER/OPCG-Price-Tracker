import type { Metadata } from "next";
import { SnkrdunkMatchClient } from "./snkrdunk-match-client";

export const metadata: Metadata = {
  title: "SNKRDUNK Matching — Admin",
};

export const dynamic = "force-dynamic";

export default function SnkrdunkMatchingPage() {
  return <SnkrdunkMatchClient />;
}
