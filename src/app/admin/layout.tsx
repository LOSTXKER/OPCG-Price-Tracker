import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "./admin-shell";
import { ConfirmDialogProvider } from "@/components/admin/confirm-dialog";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <AdminShell>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </AdminShell>
  );
}
