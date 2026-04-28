"use client";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export function BlogPageHeader() {
  const lang = useUIStore((s) => s.language);

  return (
    <PageHeader
      title={t(lang, "blogPageTitle")}
      description={t(lang, "blogPageDesc")}
      breadcrumb={
        <Breadcrumb items={[{ label: t(lang, "home"), href: "/" }, { label: t(lang, "blogPageTitle") }]} />
      }
      className="mb-0"
    />
  );
}
