import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/api/auth";

export default async function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return <>{children}</>;
}
