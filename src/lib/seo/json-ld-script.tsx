export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // JSON-LD is data, not executable JavaScript. Escape opening tags so
        // user-provided fields cannot terminate the script element early.
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
