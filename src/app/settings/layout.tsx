import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
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
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
      <Suspense>
        <SettingsShell>{children}</SettingsShell>
      </Suspense>
    </>
  );
}
