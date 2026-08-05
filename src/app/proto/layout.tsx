import type { Metadata } from "next";

/**
 * Prototype routes render hard-coded MOCK prices and portfolio numbers. They
 * must never reach the index under the production domain — one leaked URL is
 * enough for fabricated price data to be attributed to Meecard.
 *
 * `noindex, nofollow` is the reliable signal here: the pages stay crawlable on
 * purpose (a robots.txt block would prevent Google from ever reading this tag).
 * The self-canonical also stops them inheriting the homepage's canonical.
 */
export const metadata: Metadata = {
  title: "Prototype",
  robots: { index: false, follow: false, nocache: true },
};

export default function ProtoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
