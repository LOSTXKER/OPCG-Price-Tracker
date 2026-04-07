"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ConfigMap = Record<string, string>;

const CONFIG_FIELDS = [
  { key: "price_scraping_interval", label: "Price Scraping Interval (cron)", placeholder: "0 */6 * * *" },
  { key: "card_data_interval", label: "Card Data Aggregation Interval (cron)", placeholder: "0 3 * * *" },
  { key: "exchange_rate_interval", label: "Exchange Rate Update Interval (cron)", placeholder: "0 */12 * * *" },
  { key: "marketplace_fee_free", label: "Marketplace Fee — Free (%)", placeholder: "5" },
  { key: "marketplace_fee_pro", label: "Marketplace Fee — Pro (%)", placeholder: "4" },
  { key: "marketplace_fee_pro_plus", label: "Marketplace Fee — Pro+ (%)", placeholder: "3" },
  { key: "primary_currency", label: "Primary Currency", placeholder: "THB" },
  { key: "notification_email_enabled", label: "Email Notifications Enabled (true/false)", placeholder: "true" },
  { key: "notification_line_enabled", label: "LINE Notifications Enabled (true/false)", placeholder: "true" },
];

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d: { config: ConfigMap }) => setConfig(d.config ?? {}))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success("Configuration saved");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || `Save failed (${res.status})`);
      }
    } catch {
      toast.error("Network error — could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="System Configuration" icon={Settings} />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} size="sm">
              <CardContent>
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Configuration"
        icon={Settings}
        actions={
          <Button onClick={() => void handleSave()} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {CONFIG_FIELDS.map((field) => (
          <Card key={field.key} size="sm">
            <CardContent>
              <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
              <Input
                value={config[field.key] ?? ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
