"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      {/* Inline styles mirror the app's CSS variables so this works without the root layout */}
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#1C1C1E", color: "#F5F5F7" }}>
        <div style={{ display: "flex", minHeight: "100svh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>⚠</div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Critical Error</h1>
          <p style={{ margin: 0, maxWidth: "28rem", fontSize: "0.875rem", color: "#B09A88" }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem", color: "#9B8A7B" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "0.375rem",
              border: "1px solid #3D3530",
              background: "#2C2724",
              color: "#F5F5F7",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
