import type { Metadata } from "next";

import { GUIDE_META } from "@/lib/seo/copy/guide";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

// `title` stays an explicit { default, template } object (not the plain
// string buildPageMetadata returns) so the "%s | Meecard" template keeps
// cascading to every /guide/** child page's title — only openGraph/twitter
// come from the shared helper.
export const metadata: Metadata = {
  ...buildPageMetadata({
    title: GUIDE_META.hub.title,
    description: GUIDE_META.hub.description,
    canonical: "/guide",
    ogType: "article",
  }),
  title: {
    default: GUIDE_META.hub.title,
    template: "%s | Meecard",
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
