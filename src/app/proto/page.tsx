import Link from "next/link"

import { PROTOS, type ProtoStatus } from "./_registry"

/** เรียงกลุ่มตาม "ต้องทำอะไรกับมัน" — ของที่รอเบสอยู่ต้องอยู่บนสุดเสมอ */
const GROUPS: { status: ProtoStatus; note: string }[] = [
  { status: "รอเคาะ", note: "รอเบสดูแล้วบอกว่าเอาแบบไหน" },
  { status: "เคาะแล้ว", note: "เลือกแล้ว — เก็บไว้ดูว่าตอนเลือกเทียบกับอะไร" },
  { status: "เก็บอ้างอิง", note: "ของเก่า เก็บไว้เป็นตัวอย่าง ไม่ต้องตัดสินอะไร" },
  { status: "พับ", note: "ไม่เอาแล้ว" },
]

const TONE: Record<ProtoStatus, string> = {
  รอเคาะ: "bg-primary/15 text-primary",
  เคาะแล้ว: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  เก็บอ้างอิง: "bg-muted text-muted-foreground",
  พับ: "bg-muted text-muted-foreground",
}

export default function ProtoIndexPage() {
  const groups = GROUPS.map((g) => ({
    ...g,
    items: PROTOS.filter((p) => p.status === g.status),
  })).filter((g) => g.items.length > 0)

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[880px]">
        <h1 className="text-h1">หน้าลองทั้งหมด</h1>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          หน้าเทียบทางเลือกก่อนแก้ของจริง — เปิดดู กดสลับดูแต่ละแบบ แล้วบอกว่าเอาแบบไหน
          · <span className="text-foreground">ราคา ตัวเลข และรายการในหน้าพวกนี้เป็นของปลอมทั้งหมด</span>{" "}
          ใส่ไว้ให้เห็นภาพเฉยๆ
        </p>
        <p className="mt-1 text-meta">
          กดเลือกแบบไหนอยู่ ลิงก์บนแถบที่อยู่จะเปลี่ยนตาม — ก๊อปลิงก์ส่งกลับมาได้เลยว่าชอบอันนั้น
        </p>

        {groups.map((g) => (
          <section key={g.status} className="mt-8">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
              <p className="text-eyebrow">{g.status}</p>
              <p className="text-meta">{g.note}</p>
            </div>
            <ul className="space-y-2">
              {g.items.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={p.path ?? `/proto/${p.slug}`}
                    className="hairline ease-chrome flex items-start gap-3 rounded-2xl bg-card p-4 transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-h5">{p.title}</span>
                      <span className="mt-0.5 block text-body-sm text-muted-foreground">
                        {p.question}
                      </span>
                      {p.verdict && (
                        <span className="mt-1 block text-meta">→ {p.verdict}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-micro ${TONE[p.status]}`}
                      >
                        {p.status}
                      </span>
                      <span className="mt-1 block text-meta">{p.date}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
