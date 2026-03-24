import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 border-b border-border/50 pb-4">
        <span className="rounded-lg bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
          ADMIN
        </span>
        <h1 className="font-sans text-lg font-semibold">Admin Panel</h1>
      </header>
      {children}
    </div>
  );
}
