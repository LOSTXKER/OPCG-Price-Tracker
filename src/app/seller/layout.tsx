import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/api/auth";
import { SellerShell } from "./seller-shell";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return <SellerShell>{children}</SellerShell>;
}
