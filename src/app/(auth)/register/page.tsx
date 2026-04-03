import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterClient } from "./register-client";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a free Meecard account to track your card portfolio, watchlist and price alerts.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-svh items-center justify-center p-4 text-sm">
          Loading…
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
