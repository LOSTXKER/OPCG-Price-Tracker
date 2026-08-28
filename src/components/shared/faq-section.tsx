import Link from "next/link";
import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { JsonLd } from "@/lib/seo/json-ld-script";
import { faqJsonLd } from "@/lib/seo/json-ld";
import { Surface } from "@/components/ui/surface";

export interface FaqItem {
  question: string;
  answer: string;
  /**
   * Optional read-more destination rendered at the end of the answer body.
   * Kept out of the FAQPage JSON-LD on purpose — `faqJsonLd` reads only
   * question/answer. Added so answers can link in context instead of pages
   * hand-rolling an orphan link list under the FAQ box.
   */
  link?: { href: string; label: string };
}

export function FaqSection({
  title = "คำถามที่พบบ่อย",
  intro,
  items,
}: {
  title?: string;
  /**
   * Optional context sentence under the title, before the question box —
   * lets a page park its SEO paragraph here instead of spending
   * above-the-fold space on it (set detail does this, เบส 2026-08-27).
   */
  intro?: ReactNode;
  items: FaqItem[];
}) {
  return (
    <section className={title ? "mt-12 space-y-4" : "space-y-4"}>
      <JsonLd data={faqJsonLd(items)} />
      {title && <h2 className="text-h3">{title}</h2>}
      {intro && (
        <p className="max-w-3xl text-body-sm leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
      <Surface variant="outline" className="divide-y divide-hair overflow-hidden">
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
              {item.link && (
                <Link
                  href={item.link.href}
                  className="mt-2 flex w-fit items-center gap-0.5 text-sm font-medium text-primary hover:underline"
                >
                  {item.link.label}
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
          </details>
        ))}
      </Surface>
    </section>
  );
}
