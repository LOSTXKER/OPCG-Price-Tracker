"use client";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { t } from "@/lib/i18n";
import { buildBlogHeading } from "@/lib/seo/copy/site";
import { useUIStore } from "@/stores/ui-store";

export function BlogPageHeader() {
  const lang = useUIStore((s) => s.language);
  const heading = buildBlogHeading(lang);

  return (
    <PageHeader
      title={heading.title}
      description={heading.description}
      breadcrumb={
        <Breadcrumb items={[{ label: t(lang, "home"), href: "/" }, { label: t(lang, "blogPageTitle") }]} />
      }
      className="mb-0"
    />
  );
}
