"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { InvoiceItem } from "./profile-types";

function getLocaleStr(lang: Language) {
  return lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US";
}

export function SectionBilling() {
  const lang = useUIStore((s) => s.language);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/me/invoices")
      .then((r) => (r.ok ? r.json() : { invoices: [] }))
      .then((d: { invoices: InvoiceItem[] }) => setInvoices(d.invoices))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Receipt className="size-5" />
          {t(lang, "billingHistory")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t(lang, "billingSubtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
              <Receipt className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t(lang, "noBillingHistory")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">
                    {t(lang, "invoiceDate")}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                    {t(lang, "invoiceAmount")}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                    {t(lang, "invoiceStatus")}
                  </th>
                  <th className="py-2 pl-2 text-right text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/10 last:border-0">
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {new Date(inv.created * 1000).toLocaleDateString(getLocaleStr(lang), {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-2 py-2.5 text-xs font-medium tabular-nums">
                      {(inv.amountPaid / 100).toLocaleString(getLocaleStr(lang), {
                        style: "currency",
                        currency: inv.currency.toUpperCase(),
                      })}
                    </td>
                    <td className="px-2 py-2.5">
                      <Badge
                        variant={inv.status === "paid" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {inv.status === "paid"
                          ? t(lang, "invoicePaid")
                          : inv.status === "open"
                            ? t(lang, "invoicePending")
                            : t(lang, "invoiceFailed")}
                      </Badge>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {inv.pdfUrl && (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            title={t(lang, "downloadInvoice")}
                          >
                            <Download className="size-3.5" />
                          </a>
                        )}
                        {inv.hostedUrl && (
                          <a
                            href={inv.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            title={t(lang, "viewInvoice")}
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
