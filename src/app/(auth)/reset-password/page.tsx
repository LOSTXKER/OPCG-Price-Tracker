import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordClient } from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Meecard account.",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-svh items-center justify-center p-4 text-sm">
          Loading…
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
