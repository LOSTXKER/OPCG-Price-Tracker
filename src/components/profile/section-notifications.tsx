"use client";

import { useState } from "react";
import { Bell, Link2, Mail, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { clientEnv } from "@/lib/env";
import { t } from "@/lib/i18n";
import type { SettingsData } from "./profile-types";

type Props = {
  settings: SettingsData;
  onReload: () => void;
};

export function SectionNotifications({ settings, onReload }: Props) {
  const lang = useUIStore((s) => s.language);
  const [emailAlerts, setEmailAlerts] = useState(settings.emailAlerts);
  const [lineAlerts, setLineAlerts] = useState(settings.lineAlerts);
  const [weeklyDigest, setWeeklyDigest] = useState(settings.weeklyDigest);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAlerts, lineAlerts, weeklyDigest }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectLine = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem("line_state", state);
    const clientId = clientEnv().NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
    const redirectUri = `${window.location.origin}/api/line/callback`;
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid&bot_prompt=aggressive`;
  };

  const handleDisconnectLine = async () => {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineAlerts: false }),
      });
      setLineAlerts(false);
      onReload();
    } catch (err) {
      console.error("Failed to disconnect LINE:", err);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="size-5" />
          {t(lang, "notifications")}
        </h2>
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              {t(lang, "emailAlertsLabel")}
            </span>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => { setEmailAlerts(e.target.checked); setSaved(false); }}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              {t(lang, "weeklyDigestLabel")}
            </span>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => { setWeeklyDigest(e.target.checked); setSaved(false); }}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <MessageCircle className="size-4 text-muted-foreground" />
              {t(lang, "lineAlertsLabel")}
            </span>
            <input
              type="checkbox"
              checked={lineAlerts}
              onChange={(e) => { setLineAlerts(e.target.checked); setSaved(false); }}
              disabled={!settings.lineConnected}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => void handleSave()} disabled={saving} size="sm">
            {saving ? "..." : t(lang, "saveSettings")}
          </Button>
          {saved && <span className="text-sm text-green-500">{t(lang, "saved")}</span>}
        </div>
      </div>

      {/* LINE Integration */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
          <Link2 className="size-4" />
          {t(lang, "integrations")}
        </h3>
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-4 text-green-500" />
            <span className="text-sm font-medium">LINE</span>
          </div>
          {settings.lineConnected ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-green-600">
                {t(lang, "lineConnected")}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => void handleDisconnectLine()}>
                {t(lang, "disconnectLine")}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleConnectLine}>
              <MessageCircle className="mr-1 size-3" />
              {t(lang, "connectLine")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
