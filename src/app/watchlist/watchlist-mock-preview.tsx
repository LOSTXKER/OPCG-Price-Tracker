import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { t, type Language } from "@/lib/i18n";

export function WatchlistMockPreview({ lang }: { lang: Language }) {
  const cards = [
    { code: "OP09-001", name: "Monkey D. Luffy", price: "¥3,200", change: "+12%" },
    { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800", change: "+5%" },
    { code: "OP09-044", name: "Boa Hancock", price: "¥1,900", change: "-3%" },
    { code: "OP08-058", name: "Trafalgar Law", price: "¥1,500", change: "+8%" },
    { code: "OP08-001", name: "Nami", price: "¥980", change: "+2%" },
    { code: "OP07-034", name: "Shanks", price: "¥4,100", change: "-1%" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "watchlistNav")}
        description={t(lang, "emptyWatchlistDesc")}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c) => (
          <Surface
            key={c.code}
            variant="outline"
            className="overflow-hidden"
          >
            <div className="aspect-[3/4] bg-muted" />
            <div className="p-3 space-y-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
              <div className="flex items-center justify-between">
                <p className="font-price text-sm font-semibold">{c.price}</p>
                <span
                  className={`text-xs font-medium ${
                    c.change.startsWith("+") ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {c.change}
                </span>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
