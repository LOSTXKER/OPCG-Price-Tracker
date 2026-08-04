import type { Metadata } from "next";

import { GUIDE_META } from "@/lib/seo/copy/guide";

export const metadata: Metadata = {
  title: {
    default: GUIDE_META.hub.title,
    template: "%s | Meecard",
  },
  description: GUIDE_META.hub.description,
  alternates: { canonical: "/guide" },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
