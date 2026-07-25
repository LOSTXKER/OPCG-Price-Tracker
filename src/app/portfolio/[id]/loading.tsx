"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PortfolioDetailSkeleton } from "@/components/portfolio/portfolio-detail-skeleton";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export default function PortfolioDetailLoading() {
  const lang = useUIStore((state) => state.language);

  return (
    <>
      <PageHeader
        title={t(lang, "portfolioNav")}
        description={t(lang, "portfolioPageDesc")}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "portfolioNav") },
            ]}
          />
        }
      />
      <PortfolioDetailSkeleton />
    </>
  );
}
