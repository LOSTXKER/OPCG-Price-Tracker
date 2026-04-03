import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProfileLayoutShell } from "./profile-layout-shell";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your Meecard profile, settings and preferences.",
  robots: { index: false },
  alternates: { canonical: "/profile" },
};

export default function ProfileMeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Profile" }]} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-6">
            <div className="flex gap-8">
              <div className="hidden w-56 shrink-0 space-y-2 md:block">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-14 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="h-32 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          </div>
        }
      >
        <ProfileLayoutShell>{children}</ProfileLayoutShell>
      </Suspense>
    </>
  );
}
