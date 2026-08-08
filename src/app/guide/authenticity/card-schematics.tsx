import { cn } from "@/lib/utils";

/**
 * Page-local diagrams for /guide/authenticity.
 *
 * Deliberately schematic rather than photographic. The two techniques this page
 * leads with — lay the card next to one you trust, and hold it up to a light —
 * are spatial ideas that a paragraph describes badly and a picture explains
 * instantly. Using real card photos here would be worse than useless: labelling
 * an actual catalogue card "the suspect one" implies that specific card is
 * counterfeit, which is both false and unfair to whoever is selling it.
 *
 * So these are abstract card outlines. They carry no claim about any real card,
 * and nothing here asserts an anti-counterfeit feature Bandai has not published
 * (see the factual-discipline note in the copy module).
 */

function CardOutline({
  className,
  dashed = false,
  children,
}: {
  className?: string;
  dashed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[63/88] w-full overflow-hidden rounded-lg border",
        dashed ? "border-dashed border-muted-foreground/50" : "border-hair",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * "Compare against a card you know is genuine" — the method every source on the
 * page agrees on, shown as two cards under one light source.
 */
export function CompareSchematic({
  knownLabel,
  suspectLabel,
  lightLabel,
}: {
  knownLabel: string;
  suspectLabel: string;
  lightLabel: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-center text-eyebrow">{lightLabel}</p>
      <div
        className="mx-auto h-6 max-w-[240px] rounded-full bg-gradient-to-b from-warning/30 to-transparent"
        aria-hidden
      />
      <div className="mx-auto grid max-w-[260px] grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <CardOutline className="bg-primary/10" />
          <p className="text-center text-meta">{knownLabel}</p>
        </div>
        <div className="space-y-1.5">
          <CardOutline dashed className="bg-muted/40" />
          <p className="text-center text-meta">{suspectLabel}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The light test — a genuine card's dark inner layer blocks most of the light,
 * so a card that glows through is worth a second look. Shown as two backlit
 * outlines rather than described in two paragraphs.
 */
export function LightTestSchematic({
  opaqueLabel,
  translucentLabel,
}: {
  opaqueLabel: string;
  translucentLabel: string;
}) {
  return (
    <div className="mx-auto grid max-w-[300px] grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <CardOutline className="bg-foreground/80">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-warning)_0%,transparent_35%)] opacity-15"
            aria-hidden
          />
        </CardOutline>
        <p className="text-center text-meta">{opaqueLabel}</p>
      </div>
      <div className="space-y-1.5">
        <CardOutline dashed className="bg-foreground/80">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-warning)_0%,transparent_75%)] opacity-80"
            aria-hidden
          />
        </CardOutline>
        <p className="text-center text-meta">{translucentLabel}</p>
      </div>
    </div>
  );
}
