import Link from "next/link";

const quickLinks = [
  { label: "ตลาด", href: "/" },
  { label: "ชุดการ์ด", href: "/sets" },
  { label: "คำนวณดรอป", href: "/pull-calculator" },
  { label: "ซื้อขาย", href: "/marketplace" },
];

const resourceLinks = [
  { label: "คู่มือเริ่มต้น", href: "/guide/getting-started" },
  { label: "ประเภทการ์ด", href: "/guide/card-types" },
  { label: "ความหายาก", href: "/guide/rarities" },
  { label: "สีในเกม", href: "/guide/colors" },
];

export function Footer() {
  return (
    <footer className="hidden border-t border-border/30 md:block">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-foreground">Meecard</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              ราคากลางการ์ด One Piece Card Game อัปเดตทุกวัน
              ดูราคาจาก Yuyu-tei แปลงเป็นบาท กราฟราคาย้อนหลัง
              จัดพอร์ตและติดตามมูลค่าคอลเลคชัน
            </p>
            <p className="mt-4 text-[11px] text-muted-foreground/60">
              ข้อมูลราคาอ้างอิงจาก Yuyu-tei &middot; Card images &copy; BANDAI
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              ลิงก์ด่วน
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              คู่มือ
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex items-center justify-between border-t border-border/30 pt-6">
          <p className="text-[11px] text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Meecard
          </p>
          <nav className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
            <Link href="/guide" className="transition-colors hover:text-muted-foreground">
              คู่มือ
            </Link>
            <a
              href="mailto:support@meecard.app"
              className="transition-colors hover:text-muted-foreground"
            >
              ติดต่อ
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
