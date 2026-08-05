import type { Metadata } from "next";

import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";

/**
 * Private account surface. Declared even while the marketplace flag keeps this
 * route 404 — without it the page would inherit the sitewide title and (before
 * the root canonical was removed) announce itself as the homepage the moment
 * the flag flips on.
 */
export const metadata: Metadata = {
  title: "รายการที่บันทึก",
  robots: { index: false },
};

export default async function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertMarketplaceEnabled();
  return children;
}
