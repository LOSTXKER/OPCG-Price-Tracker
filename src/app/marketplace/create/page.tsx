import { redirect } from "next/navigation";

export default function MarketplaceCreateRedirect() {
  redirect("/seller/listings/new");
}
