import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default function ProfileMeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
