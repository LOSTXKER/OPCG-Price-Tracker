import { Suspense } from "react";

import { RegisterClient } from "./register-client";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-svh items-center justify-center p-4 text-sm">
          กำลังโหลด…
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
