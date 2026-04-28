"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2, Clock, DollarSign, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

type ConfigMap = Record<string, string>;

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  help?: string;
}

interface ConfigGroup {
  title: string;
  icon: LucideIcon;
  description: string;
  fields: ConfigField[];
}

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    title: "ตั้งเวลาอัตโนมัติ",
    icon: Clock,
    description: "ตั้งค่าเวลาในการรันงานอัตโนมัติ (Cron expression)",
    fields: [
      {
        key: "price_scraping_interval",
        label: "ดึงราคา",
        placeholder: "0 */6 * * *",
        help: "ความถี่ในการดึงราคาจาก Yuyutei (ค่าเริ่มต้น: ทุก 6 ชั่วโมง)",
      },
      {
        key: "card_data_interval",
        label: "รวบรวมข้อมูลการ์ด",
        placeholder: "0 3 * * *",
        help: "ความถี่ในการรวบรวมข้อมูลการ์ด (ค่าเริ่มต้น: ตี 3 ทุกวัน)",
      },
      {
        key: "exchange_rate_interval",
        label: "อัตราแลกเปลี่ยน",
        placeholder: "0 */12 * * *",
        help: "ความถี่ในการอัปเดตอัตราแลกเปลี่ยน (ค่าเริ่มต้น: ทุก 12 ชั่วโมง)",
      },
    ],
  },
  {
    title: "ตลาดซื้อขาย",
    icon: DollarSign,
    description: "ค่าธรรมเนียมตลาดซื้อขายแยกตามระดับสมาชิก",
    fields: [
      {
        key: "marketplace_fee_free",
        label: "ค่าธรรมเนียม Free (%)",
        placeholder: "5",
        help: "เปอร์เซ็นต์ค่าธรรมเนียมสำหรับผู้ใช้ทั่วไป",
      },
      {
        key: "marketplace_fee_pro",
        label: "ค่าธรรมเนียม Pro (%)",
        placeholder: "4",
        help: "เปอร์เซ็นต์ค่าธรรมเนียมสำหรับสมาชิก Pro",
      },
      {
        key: "marketplace_fee_pro_plus",
        label: "ค่าธรรมเนียม Pro+ (%)",
        placeholder: "3",
        help: "เปอร์เซ็นต์ค่าธรรมเนียมสำหรับสมาชิก Pro+",
      },
      {
        key: "primary_currency",
        label: "สกุลเงินหลัก",
        placeholder: "THB",
        help: "สกุลเงินที่ใช้แสดงราคาเป็นค่าเริ่มต้น",
      },
    ],
  },
  {
    title: "การแจ้งเตือน",
    icon: Bell,
    description: "เปิด/ปิดช่องทางการแจ้งเตือนต่างๆ",
    fields: [
      {
        key: "notification_email_enabled",
        label: "แจ้งเตือนผ่าน Email",
        placeholder: "true",
        help: "ใช้ค่า true หรือ false",
      },
      {
        key: "notification_line_enabled",
        label: "แจ้งเตือนผ่าน LINE",
        placeholder: "true",
        help: "ใช้ค่า true หรือ false",
      },
    ],
  },
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
        toast.success("บันทึกการตั้งค่าสำเร็จ");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || `บันทึกไม่สำเร็จ (${res.status})`);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="การตั้งค่าระบบ" icon={Settings} />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="mb-2 h-4 w-32" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
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
        title="การตั้งค่าระบบ"
        description="ตั้งค่าการทำงานของระบบ เวลาอัตโนมัติ และค่าธรรมเนียม"
        icon={Settings}
        actions={
          <Button onClick={() => void handleSave()} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            บันทึก
          </Button>
        }
      />

      <div className="space-y-6">
        {CONFIG_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <group.icon className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                  <p className="mt-0.5 text-meta">
                    {group.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-sm font-medium">{field.label}</label>
                    <Input
                      value={config[field.key] ?? ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                    {field.help && (
                      <p className="text-meta text-muted-foreground/70">
                        {field.help}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
