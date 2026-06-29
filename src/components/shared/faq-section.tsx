import { JsonLd } from "@/lib/seo/json-ld-script";
import { faqJsonLd } from "@/lib/seo/json-ld";
import { Surface } from "@/components/ui/surface";

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
    <section className={title ? "mt-12 space-y-4" : "space-y-4"}>
      <JsonLd data={faqJsonLd(items)} />
      {title && <h2 className="text-h3">{title}</h2>}
      <Surface variant="outline" className="divide-y divide-[var(--p-hair)] overflow-hidden">
        {items.map((item, i) => (
          <details key={i} className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium motion-base hover:bg-muted/70 [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span className="shrink-0 text-primary/40 motion-base group-open:rotate-45 group-open:text-primary">
                +
              </span>
            </summary>
            <div className="px-5 pb-5 pt-1.5 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </div>
          </details>
        ))}
      </Surface>
    </section>
  );
}
