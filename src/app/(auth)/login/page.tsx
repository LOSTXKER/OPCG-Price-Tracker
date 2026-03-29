import { Suspense } from "react";

import { LoginClient } from "./login-client";

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
