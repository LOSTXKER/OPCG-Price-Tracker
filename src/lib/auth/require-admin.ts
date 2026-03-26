import { redirect } from "next/navigation";
import { getAdminUser } from "./get-admin-user";

export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) redirect("/login?redirect=/admin");
  return admin;
}
