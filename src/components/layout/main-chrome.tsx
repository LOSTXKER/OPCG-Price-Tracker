"use client";

import { usePathname } from "next/navigation";

function useIsChromeless() {
  const pathname = usePathname();
  return pathname.startsWith("/admin") || pathname === "/admin-login" || pathname === "/login" || pathname === "/register";
}

export function MainChrome({ children }: { children: React.ReactNode }) {
  const chromeless = useIsChromeless();
  if (chromeless) return null;
  return <>{children}</>;
}

export function PageContent({ children }: { children: React.ReactNode }) {
  const chromeless = useIsChromeless();

  if (chromeless) {
    return <>{children}</>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-32 md:px-6 md:pt-10 md:pb-24">
      {children}
    </main>
  );
}
