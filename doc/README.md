# doc/ — เอกสารอ้างอิง (reference)

> อัปเดตล่าสุด: 2026-06-14
> **SSOT อยู่ที่ root** (REDESIGN · SPEC · PLAN · PROGRESS · AGENTS) — โฟลเดอร์นี้คือ reference เชิงลึกที่ cross-check กับโค้ดจริงแล้ว ไม่ทวนซ้ำ SSOT

| ไฟล์ | เนื้อหา | SSOT คู่กัน |
|------|---------|------------|
| [data-pipeline.md](data-pipeline.md) | scraper + price pipeline (Bandai / Yuyutei / SNKRDUNK), R2 image storage, cron จริงใน `vercel.json` | PLAN.md M4 |
| [honey-economy-rebalance.md](honey-economy-rebalance.md) | gamification economy: earn / spend / multipliers / anti-abuse + เหตุผลออกแบบ | PLAN.md M1 |
| [honey-action-type-migration.md](honey-action-type-migration.md) | runbook ย้าย `HoneyActionType` enum เก่า (วันนี้ freeze-only) | PLAN.md M2 |
| [MARKETPLACE_OVERHAUL.md](MARKETPLACE_OVERHAUL.md) | สเปก marketplace / seller-center — BUILT vs PENDING | PLAN.md M3 · REDESIGN P3 |

### archive/ — snapshot ประวัติ (ไม่อัปเดต)
- `detailed-plan-2026-04-28.md` — north-star business plan ฉบับแรก (1948 บรรทัด · ~60% superseded โดย SPEC/PLAN/REDESIGN · เก็บไว้เพื่อ business strategy/vision/revenue ที่ยังไม่มีที่อื่น)
- `MTOP.pdf` — SRS export จาก Confluence (binary)
