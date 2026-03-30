import { JsonLd } from "@/lib/seo/json-ld-script";
import { faqJsonLd } from "@/lib/seo/json-ld";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection({
  title = "คำถามที่พบบ่อย",
  items,
}: {
  title?: string;
  items: FaqItem[];
}) {
  return (
    <section className="mt-12 space-y-4">
      <JsonLd data={faqJsonLd(items)} />
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card">
        {items.map((item, i) => (
          <details key={i} className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span className="shrink-0 text-muted-foreground/60 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
