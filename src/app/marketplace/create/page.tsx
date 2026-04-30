import { redirect } from "next/navigation";
import { assertMarketplaceEnabled } from "@/lib/marketplace/feature-flag";

export default async function MarketplaceCreateRedirect() {
  await assertMarketplaceEnabled();
  redirect("/seller/listings/new");
}
