import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Meecard account password.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-svh items-center justify-center p-4 text-sm">
          Loading…
        </div>
      }
    >
      <ForgotPasswordClient />
    </Suspense>
  );
}
