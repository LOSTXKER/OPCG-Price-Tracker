"use client"

import Link from "next/link"
import {
  Bell,
  ChevronRight,
  CreditCard,
  Crown,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Package,
  Shield,
  Tag,
  User,
  Wallet,
} from "lucide-react"

import { LargeTitle } from "../_components/large-title"
import { GroupedSection, GroupedRow } from "../_components/grouped-list"
import { USER } from "../_data"

/**
 * More / Settings — iOS grouped-inset table view at full fidelity.
 * Profile row → Pro upsell → account/trading/general/help sections → sign out.
 * Static mock: no API, no DB. Client component because `GroupedRow` (a client
 * component) takes lucide icon component references as props — those aren't
 * serializable across the server/client boundary from a Server Component.
 */
export default function MorePage() {
  return (
    <div className="pb-10 md:mx-auto md:max-w-2xl">
      <LargeTitle title="เพิ่มเติม" subtitle="จัดการบัญชีและตั้งค่า" />

      <div className="space-y-6">
        {/* ── Profile row ─────────────────────────────────────────── */}
        <GroupedSection>
          <Link href="#" className="ease-chrome block transition-colors active:bg-muted/60">
            <div className="flex min-h-[68px] items-center gap-3 px-4 py-3">
              {/* Custom bigger avatar — not the standard icon-circle */}
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-h5 font-semibold text-primary">
                {USER.avatarInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-semibold">{USER.name}</p>
                <p className="truncate text-meta">{USER.tier}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
            </div>
          </Link>
        </GroupedSection>

        {/* ── Pro upsell ──────────────────────────────────────────── */}
        <div className="mx-4 overflow-hidden rounded-2xl border border-primary/20 bg-primary/8 sm:mx-6">
          <Link href="#" className="ease-chrome block transition-colors active:bg-primary/15">
            <div className="flex min-h-[64px] items-center gap-3 px-4 py-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Crown className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-semibold text-primary">อัปเกรดเป็น Pro</p>
                <p className="truncate text-meta">ปลดล็อกพอร์ตไม่จำกัด + แจ้งเตือนราคา</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-primary/50" />
            </div>
          </Link>
        </div>

        {/* ── บัญชี ────────────────────────────────────────────────── */}
        <GroupedSection label="บัญชี">
          <GroupedRow
            icon={User}
            iconClassName="bg-info-soft text-info"
            title="ข้อมูลส่วนตัว"
            href="#"
          />
          <GroupedRow
            icon={Bell}
            iconClassName="bg-warning-soft text-warning"
            title="การแจ้งเตือน"
            href="#"
          />
          <GroupedRow
            icon={CreditCard}
            iconClassName="bg-success-soft text-success"
            title="การชำระเงิน"
            href="#"
          />
          <GroupedRow
            icon={Shield}
            iconClassName="bg-muted text-muted-foreground"
            title="ความเป็นส่วนตัว"
            href="#"
          />
        </GroupedSection>

        {/* ── การซื้อขาย ───────────────────────────────────────────── */}
        <GroupedSection label="การซื้อขาย">
          <GroupedRow
            icon={Tag}
            iconClassName="bg-primary/12 text-primary"
            title="รายการขายของฉัน"
            href="#"
          />
          <GroupedRow
            icon={Package}
            iconClassName="bg-warning-soft text-warning"
            title="คำสั่งซื้อ"
            href="#"
          />
          <GroupedRow
            icon={MapPin}
            iconClassName="bg-info-soft text-info"
            title="ที่อยู่จัดส่ง"
            href="#"
          />
        </GroupedSection>

        {/* ── ทั่วไป ───────────────────────────────────────────────── */}
        <GroupedSection label="ทั่วไป">
          <GroupedRow
            icon={Globe}
            iconClassName="bg-info-soft text-info"
            title="ภาษา"
            trailing={<span className="text-meta text-muted-foreground">ไทย</span>}
            href="#"
          />
          <GroupedRow
            icon={Moon}
            iconClassName="bg-muted text-muted-foreground"
            title="ธีม"
            trailing={<span className="text-meta text-muted-foreground">ระบบ</span>}
            href="#"
          />
          <GroupedRow
            icon={Wallet}
            iconClassName="bg-success-soft text-success"
            title="สกุลเงิน"
            trailing={<span className="text-meta text-muted-foreground">฿ THB</span>}
            href="#"
          />
        </GroupedSection>

        {/* ── ช่วยเหลือ ────────────────────────────────────────────── */}
        <GroupedSection label="ช่วยเหลือ">
          <GroupedRow
            icon={HelpCircle}
            iconClassName="bg-muted text-muted-foreground"
            title="ศูนย์ช่วยเหลือ"
            href="#"
          />
          <GroupedRow
            icon={Mail}
            iconClassName="bg-primary/12 text-primary"
            title="ติดต่อเรา"
            href="#"
          />
          <GroupedRow
            icon={Info}
            iconClassName="bg-muted text-muted-foreground"
            title="เกี่ยวกับ Meecard"
            href="#"
          />
        </GroupedSection>

        {/* ── ออกจากระบบ (destructive) ─────────────────────────────── */}
        <GroupedSection>
          <GroupedRow
            icon={LogOut}
            iconClassName="bg-destructive/10 text-destructive"
            title="ออกจากระบบ"
            destructive
            chevron={false}
            href="#"
          />
        </GroupedSection>

        {/* ── Version footer ────────────────────────────────────────── */}
        <p className="mt-2 text-center text-meta text-muted-foreground/60">Meecard v1.0.0</p>
      </div>
    </div>
  )
}
