"use client";

import type { ReactNode } from "react";
import { Calendar, Eye, Gift, Target } from "lucide-react";

import { AdminSubNav } from "@/components/admin/admin-sub-nav";

export default function MissionsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <AdminSubNav
        items={[
          { href: "/admin/honey/missions/templates", label: "เทมเพลต", icon: Target },
          { href: "/admin/honey/missions/schedule", label: "ตารางเวลา", icon: Calendar },
          { href: "/admin/honey/missions/bonus", label: "กฎโบนัส", icon: Gift },
          { href: "/admin/honey/missions/preview", label: "ดูตัวอย่าง", icon: Eye },
        ]}
      />
      {children}
    </div>
  );
}
