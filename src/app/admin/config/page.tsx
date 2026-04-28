"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings, Clock, DollarSign, Bell, LayoutList } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { AdminFormField } from "@/components/admin/admin-form-field";
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
    title: "ค่าเริ่มต้นการแสดงผล",
    icon: LayoutList,
    description: "จำนวนรายการต่อหน้าในหน้าแอดมินและหน้าตลาด",
    fields: [
      {
        key: "admin_default_page_size",
        label: "หน้าแอดมิน (ทั่วไป)",
        placeholder: "20",
        help: "จำนวนแถวต่อหน้าในตารางแอดมินส่วนใหญ่ (ค่าเริ่มต้น: 20)",
      },
      {
        key: "admin_transactions_page_size",
        label: "ประวัติธุรกรรม Honey",
        placeholder: "30",
        help: "จำนวนรายการต่อรอบของหน้าธุรกรรม Honey (ค่าเริ่มต้น: 30)",
      },
      {
        key: "marketplace_default_page_size",
        label: "หน้าตลาดซื้อขาย",
        placeholder: "24",
        help: "จำนวนการ์ดต่อหน้าในมุมมองตลาด (ค่าเริ่มต้น: 24)",
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
  const [pristine, setPristine] = useState<ConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d: { config: ConfigMap }) => {
        const next = d.config ?? {};
        setConfig(next);
        setPristine(next);
      })
      .finally(() => setLoading(false));
  }, []);

  const dirtyKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const k of Object.keys(config)) {
      if ((config[k] ?? "") !== (pristine[k] ?? "")) keys.add(k);
    }
    for (const k of Object.keys(pristine)) {
      if ((config[k] ?? "") !== (pristine[k] ?? "")) keys.add(k);
    }
    return keys;
  }, [config, pristine]);

  const dirty = dirtyKeys.size > 0;

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
        setPristine(config);
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

  const handleReset = () => {
    setConfig(pristine);
  };

  if (loading) {
    return (
      <AdminPage
        header={<AdminPageHeader title="การตั้งค่าระบบ" icon={Settings} />}
      >
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <AdminPanel key={i}>
              <Skeleton className="mb-4 h-5 w-40" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton className="mb-2 h-4 w-32" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            </AdminPanel>
          ))}
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="การตั้งค่าระบบ"
          description="ตั้งค่าการทำงานของระบบ เวลาอัตโนมัติ และค่าธรรมเนียม"
          icon={Settings}
          meta={
            dirty ? (
              <span className="status-warning rounded-full px-2 py-0.5 text-xs font-medium">
                แก้ไขแล้ว {dirtyKeys.size} ค่า
              </span>
            ) : null
          }
        />
      }
      footer={
        <AdminSaveBar
          dirty={dirty}
          saving={saving}
          onSave={() => void handleSave()}
          onReset={handleReset}
          description={
            <span className="text-muted-foreground">
              {dirty
                ? `แก้ไขแล้ว ${dirtyKeys.size} ค่า — ยังไม่บันทึก`
                : "ไม่มีการเปลี่ยนแปลง"}
            </span>
          }
        />
      }
    >
      <div className="space-y-6">
        {CONFIG_GROUPS.map((group) => (
          <AdminPanel
            key={group.title}
            title={group.title}
            description={group.description}
            icon={group.icon}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {group.fields.map((field) => {
                const isDirty = dirtyKeys.has(field.key);
                return (
                  <AdminFormField
                    key={field.key}
                    label={
                      <span className="flex items-center gap-1.5">
                        {field.label}
                        {isDirty && (
                          <span
                            className="size-1.5 rounded-full bg-warning"
                            aria-label="ยังไม่บันทึก"
                          />
                        )}
                      </span>
                    }
                    hint={field.help}
                  >
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
                  </AdminFormField>
                );
              })}
            </div>
          </AdminPanel>
        ))}
      </div>
    </AdminPage>
  );
}
