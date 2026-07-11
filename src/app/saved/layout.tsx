import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";

export default async function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertMarketplaceEnabled();
  return children;
}
