import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Meecard account to access your portfolio, watchlist and marketplace.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-svh items-center justify-center p-4 text-sm">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
