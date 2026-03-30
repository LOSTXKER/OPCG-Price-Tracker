import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import CreateListingClient from "./create-client";

export const metadata: Metadata = {
  title: "Create Listing",
  description: "List your OPCG cards for sale on the Meecard marketplace.",
  robots: { index: false },
  alternates: { canonical: "/marketplace/create" },
};

export default function CreateListingPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Create Listing" },
        ]}
      />
      <CreateListingClient />
    </>
  );
}
