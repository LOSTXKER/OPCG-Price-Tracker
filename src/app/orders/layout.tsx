import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/api/auth";
import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";

export default async function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertMarketplaceEnabled();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return <>{children}</>;
}
