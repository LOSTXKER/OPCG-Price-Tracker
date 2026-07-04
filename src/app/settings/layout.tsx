import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsShell } from "./settings-shell";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Meecard account settings, notifications and preferences.",
  robots: { index: false },
  alternates: { canonical: "/settings" },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Breadcrumb (incl. the mobile back button) lives in SettingsShell now — it
  // knows the active sub-section, so it can render the shared 3-level trail.
  return (
    <Suspense>
      <SettingsShell>{children}</SettingsShell>
    </Suspense>
  );
}
