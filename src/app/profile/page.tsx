import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your Meecard profile, settings and preferences.",
  robots: { index: false },
  alternates: { canonical: "/profile" },
};

export default function ProfilePage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Profile" }]} />
      <Suspense>
        <ProfileClient />
      </Suspense>
    </>
  );
}
