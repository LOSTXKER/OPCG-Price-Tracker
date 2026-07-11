import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";

export default async function SettingsMarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertMarketplaceEnabled();
  return children;
}
