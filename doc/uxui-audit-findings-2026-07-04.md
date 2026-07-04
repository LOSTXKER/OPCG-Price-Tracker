# 📋 UX/UI Audit Findings — 2026-07-04 (หลักฐานฉบับเต็ม)

> **ไฟล์นี้ = หลักฐาน audit ห้ามแก้มือ** (generate จากผล workflow 86 agents: 19 auditors + adversarial verify ทุก finding ระดับ high)
> **แผนลงมือ = [uxui-refactor-plan.md](uxui-refactor-plan.md)** — อ้าง finding ในไฟล์นี้ด้วย ID เช่น `HOME-01`
> สถิติ: findings ทั้งหมด 235 ข้อ · ระดับ high ผ่านการ verify กับโค้ดจริง 62 ข้อ · ถูกหักตกไป 5 ข้อ (ไม่อยู่ในไฟล์นี้)
> verdict บน high: ✅ confirmed = ตรวจกับโค้ดจริงแล้วจริง · ✏️ corrected = ปัญหาจริงแต่รายละเอียดถูกปรับแก้ (อ่านหมายเหตุ verify) · med/low ไม่ได้ผ่าน verify รายข้อ — เช็คโค้ดก่อนลงมือเสมอ

## สารบัญ
- [HOME](#home) — หน้าแรก + market overview (12 ข้อ · high 5)
- [DISCOVERY](#discovery) — ค้นหา + trending + compare (13 ข้อ · high 4)
- [CARD-DETAIL](#card-detail) — Card detail (trust core — หน้าสำคัญสุด) (14 ข้อ · high 4)
- [SETS](#sets) — Sets + set detail (12 ข้อ · high 1)
- [PORTFOLIO](#portfolio) — Portfolio hub + detail (14 ข้อ · high 3)
- [TRACK](#track) — Watchlist + saved + alerts (13 ข้อ · high 4)
- [HONEY](#honey) — Honey gamification + pricing (14 ข้อ · high 4)
- [PLAY](#play) — Decks hub + calculators (12 ข้อ · high 3)
- [SETTINGS](#settings) — Settings ทุกหน้า + /more (13 ข้อ · high 3)
- [IDENTITY](#identity) — Profile (me+public) + auth (14 ข้อ · high 4)
- [COMMERCE](#commerce) — Marketplace + seller + orders + messages (ปิด flag อยู่) (14 ข้อ · high 6)
- [CONTENT](#content) — หน้า content/static (12 ข้อ · high 3)
- [ADMIN](#admin) — Admin (ตรวจแบบสรุป) (8 ข้อ · high 2)
- [KIT](#kit) — Cross-cutting: Component kit (ui + shared) (13 ข้อ · high 4)
- [CHROME](#chrome) — Cross-cutting: Layout chrome + page scaffold (12 ข้อ · high 3)
- [TOKENS](#tokens) — Cross-cutting: Design token discipline (10 ข้อ · high 3)
- [STATES](#states) — Cross-cutting: Loading / empty / error states (12 ข้อ · high 3)
- [RESPONSIVE](#responsive) — Cross-cutting: Responsive + a11y discipline (9 ข้อ · high 2)
- [IA-NAV](#ia-nav) — Cross-cutting: IA + navigation ทุกทางเข้า (9 ข้อ · high 1)

---

<a id="home"></a>
## HOME — หน้าแรก + market overview

**ขอบเขตที่ตรวจ:** / (src/app/page.tsx + src/components/home/** + src/components/market/**) · /market-overview (page.tsx + market-overview-client.tsx + _components/**)

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- ตาราง market ใช้ MarketTable ตัวเดียวร่วมกันระหว่างหน้าแรกกับ /search ผ่าน column model เดียว (market-columns.ts) พร้อม mobile list fallback ใต้ sm ตรงตาม AGENTS เป๊ะ — วินัยโครงสร้างดีมาก
- Skeleton ทุกจุดรูปร่างตรง layout จริง (MobileCardSkeleton, GridCardSkeleton, MarketTableRowSkeleton, loading.tsx ของ market-overview ที่ mirror MarketSnapshot) ตามกฎ 'ศูนย์ spinner' ของ VISION
- /market-overview ยึด visual rules ครบ: hero number เดียว (text-display), tabular numerals, ลูกศร ▲/▼ ใน DeltaPill, มี RawValueHint + PeriodChip บอกบริบทตัวเลขทุกจุด = ซื่อสัตย์กับข้อมูลแบบ Cardmarket
- Hero search มี a11y พื้นฐานดี (sr-only h1 คงที่ + animation เป็น aria-hidden) พร้อม recent/popular ใน dropdown + keyboard nav — ตรง VISION 'universal search = teleport'

### `HOME-01` — /
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** config cache ขัดกันเองทั้ง 2 หน้า: หน้าแรกตั้ง ISR 300 วิ แต่การอ่าน searchParams บังคับให้ render สดทุก request (และ grep แล้วไม่มีที่ไหนลิงก์ /?search= เลย) ส่วน /market-overview ใส่ force-dynamic ทับ revalidate ทำให้ยิง query หนักๆ 12 ชุด (aggregate ทั้งตาราง Card) ทุกครั้งที่มีคนเปิด

**หลักฐาน:** src/app/page.tsx:14,19 — `revalidate = 300` แต่ `await props.searchParams` · src/app/market-overview/page.tsx:9,11 — `dynamic = "force-dynamic"` คู่กับ `revalidate = 300`

**วิธีแก้ที่เสนอ:** หน้าแรก: ตัด searchParams/initialSearch ออก (ให้ /search รับหน้าที่ค้นหา) เพื่อให้ ISR ทำงานจริง · /market-overview: ลบ force-dynamic ให้เหลือ revalidate 300 อย่างเดียว — DB load หน้าที่คนเข้าบ่อยสุดจะลดลงมหาศาล

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดปัจจุบันทุกบรรทัด (page.tsx:14,19 · market-overview:9,11 · 12 query ใน Promise.all จริง) และ docs Next 16.2.1 ใน repo ยืนยันว่า await searchParams บังคับ dynamic rendering ทำให้ ISR 300 ตายจริง ส่วน force-dynamic มาจาก commit cfee885 ที่หว่านกัน build fail (ไม่ใช่ cache design ที่ตั้งใจ) และหมดความจำเป็นแล้ว — /raffle/winners prerender ด้วย Prisma ผ่าน build ✓ อยู่ทุกวันนี้ · ไม่ขัดทิศดีไซน์ใดๆ เพราะเป็นงาน caching ล้วน · nuance เดียว: /cards?search= (legacy redirect ที่ src/app/cards/page.tsx:15) ยัง forward query มาที่ / ได้ ควรชี้ไป /search แทนตอนแก้ และหลังลบ force-dynamic ต้อง verify build ผ่าน (หน้าจะ prerender ตอน build)

### `HOME-02` — /
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** บนมือถือ (แพลตฟอร์มหลัก) ผู้ใช้เปลี่ยนการเรียงตาราง market ไม่ได้เลย — sort ทำได้แค่คลิกหัวคอลัมน์ซึ่งซ่อนใต้ sm และ toggle 24h/7d/30d ก็โผล่เฉพาะโหมด grid ทำให้ดูการ์ดที่ขยับแรงสุดใน 7 วันจาก list view ไม่ได้

**หลักฐาน:** src/components/market/market-table.tsx:66-81 — mobile list ไม่มี sort UI (SortableHeader อยู่ใน thead ที่ hidden <sm) · home-market-overview.tsx:323-333 ตัวเลือกช่วงเวลาอยู่เฉพาะ grid view

**วิธีแก้ที่เสนอ:** เพิ่ม sort control แบบ compact (dropdown/segmented ราคา·%เปลี่ยน·rarity) ใน toolbar ที่แสดงเฉพาะ <sm และย้ายตัวเลือกช่วงเวลาให้ใช้ได้ทั้ง 2 view

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดปัจจุบันทุกบรรทัด และปัญหาหนักกว่าที่รายงาน: mobile list ไม่มี sort UI (SortableHeader อยู่ใน thead ที่ hidden <sm) · toggle 24h/7d/30d อยู่เฉพาะ grid · MobileCardItem ยัง hardcode ChangePill 24h (mobile-card-item.tsx:31,83) · default view = table ทำให้มือถือตกใน list ที่ sort ได้แค่ผ่าน tab · แม้ grid ก็เปลี่ยนแค่ % ที่แสดง ไม่เปลี่ยนลำดับ — สรุปมือถือดู top movers 7d ไม่ได้เลยทุกทาง · ไม่มี doc/comment ว่าตั้งใจ (git -L ชี้ว่า hidden sm: เป็น legacy จาก <select> เก่า) และ /search ก็ซ่อน sort dropdown บนมือถือเหมือนกัน (search-client.tsx:201) · rec ไม่ขัดทิศ desktop-โครงเดิม/iOS grammar แต่ตอนทำห้ามใช้ bottom sheet (owner veto ใน comment home-market-overview.tsx:290-292) — ใช้ dropdown/segmented ตามที่ auditor เสนอได้

### `HOME-03` — /
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** component ชุด preview 5 ไฟล์ (~400 บรรทัด: preview-row, portfolio-preview, honey-preview, market-value-card, ad-card) เป็น orphan — ไม่มีหน้าไหน render แล้ว แต่ getHomeData ยังยิง DB query 2 ชุด (newestSet, totalValue) เลี้ยงของที่ตายแล้วทุกครั้งที่ render หน้าแรก

**หลักฐาน:** src/components/home/home-client-sections.tsx:2,4,5 — export HomeHoneyPreview/HomePortfolioPreview/HomePreviewRow แต่ grep ทั้ง repo ไม่มีหน้าไหน import · src/lib/data/home.ts:57-64 ยัง query newestSet + totalValue ที่ page.tsx ไม่ได้ใช้

**วิธีแก้ที่เสนอ:** ลบ 5 ไฟล์ orphan + ตัด export ออกจาก barrel + ตัด query newestSet/totalValue ใน getHomeData (ถ้าอยากเก็บ preview ไว้ใช้ทีหลัง ให้ย้ายไป archive แทนการค้างใน tree)

**หมายเหตุจากทีม verify:** ตรวจกับโค้ดจริงแล้วตรงทุกจุด: barrel บรรทัด 2/4/5 export 3 ตัวที่ไม่มีใคร import, ห่วงโซ่ orphan 5 ไฟล์รวม 400 บรรทัดพอดี, newestSet (home.ts:57-59) + totalValueAgg (61-64) ยัง query แต่ page.tsx (caller เดียว) ไม่ destructure ไปใช้. git history ยืนยันว่า preview row ถูก redesign ทับ (bf144be→32f28e9 minimal home) แล้วลืมลบ ไม่ใช่ของตั้งใจเก็บ — PLAN/PROGRESS/VISION ไม่มีแผนใช้ต่อ. การลบไม่ขัดทิศที่เคาะ (ลบ honey-preview ยิ่งสอดคล้อง honey <5%). จุดเว่อร์เดียวคือ "ทุกครั้งที่ render" จริงๆ คือต่อรอบ ISR (revalidate=300) แต่ไม่เปลี่ยนสาระว่าเป็น dead query. คุ้มแก้ effort S จริง

### `HOME-04` — /
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** toolbar แถว 2 อัด 4 controls ในบรรทัดเดียวบนจอ ~375px: tap target จริงอยู่แค่ ~26-36px (ต่ำกว่ากฎ ≥44px ที่เคาะไว้) และ SetPicker ซึ่งเป็นแกน browse หลักโดนบีบเหลือ ~130px จนชื่อชุดถูกตัด

**หลักฐาน:** src/components/home/home-market-overview.tsx:222-285 — SetPicker(h-9) + PriceModeControl + ปุ่ม filter(py-1.5) + ViewToggle(p-1.5, toolbar.tsx:249) อยู่แถวเดียว

**วิธีแก้ที่เสนอ:** แยก SetPicker ขึ้นเป็นแถวเต็มความกว้างของตัวเองบน <sm และดัน controls ที่เหลือให้สูง min-h-11 (44px) — desktop คงเดิมได้

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดจริงทุกจุด (SetPicker h-9 ที่ set-picker.tsx:148, filter py-1.5 ที่ home-market-overview.tsx:250, ViewToggle p-1.5 ที่ toolbar.tsx:249, tap target 26-36px ต่ำกว่ากฎ tap≥44px ที่เคาะใน PLAN.md:17) และคลัสเตอร์ขวาเป็น shrink-0 ทำให้ SetPicker รับแรงบีบฝ่ายเดียวเหลือ ~95-120px บนจอ 375px (แย่กว่าที่ auditor เคลมด้วยซ้ำ) — ไม่ใช่ของตั้งใจ: PLAN.md Batch 1b ระบุว่า "ตั้งใจข้าม" toolbar นี้เพราะเสี่ยงกระทบ desktop (เลื่อน ไม่ใช่เคาะว่าดี) และบั๊ก SetPicker โดนบีบแบบเดียวกันเคยถูกยืนยัน+แก้แล้วที่ /search (basis-full sm:basis-auto) — recommendation ตรงทิศ desktop คงเดิม/มือถือ iOS grammar และตรง memory ที่ว่าผู้ใช้ browse ด้วย set ก่อน

### `HOME-05` — /
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ระบบค้นหามี 2 implementation คู่ขนานขนาดใกล้กัน (hero-search-bar 426 บรรทัด / command-search 430 บรรทัด) ที่ก๊อปตรรกะเดียวกันหมด: recent-search localStorage, debounce-fetch, keyboard nav, การ render แถวผลลัพธ์ — แก้ฝั่งหนึ่งต้องจำไปแก้อีกฝั่งเสมอ ไม่งั้น drift

**หลักฐาน:** recent-search localStorage key "meecard-recent-searches" + readRecent/writeRecent ถูกก๊อปซ้ำ 3 ที่: hero-search-bar.tsx:17-33 · command-search.tsx:38-73 · card-search.tsx:14-33 (ตัวหลังเริ่ม drift แล้ว: ไม่ slice MAX_RECENT ตอน read) · fetch effect setTimeout(...,0)+AbortController ก๊อปซ้ำที่ hero:80-95 และ command:128-157 ทั้งที่ src/hooks/use-card-search.ts มี engine กลาง (debounce 300ms) อยู่แล้วแต่ 2 surface ใหญ่สุดไม่ใช้ · drift ที่เกิดแล้ว: command มี searchError UI แต่ hero เงียบ, row rendering ต่างกัน (size-9+blur+uppercase vs size-10+ไม่มี blur) · แก้โดย: ย้าย 2 ตัวไปใช้ useCardSearch เดิม + แตก useRecentSearches ใหม่ (ยังไม่มี) + shared result-row — คงเปลือก hero ไว้ตามที่เคาะใน commit eb0d414

**วิธีแก้ที่เสนอ:** แตก hook กลาง (useRecentSearches, useCardSuggestions) + shared result-row components ให้ทั้ง 2 ตัวใช้ร่วมกัน เหลือแต่เปลือก UI ที่ต่างกัน (bar vs modal)

**หมายเหตุจากทีม verify:** ปัญหาซ้ำซ้อนจริงและคุ้มแก้ แต่ evidence ต่ำกว่าความจริง (ซ้ำ 3 ที่ไม่ใช่ 2 — card-search.tsx ก็มี readRecent/writeRecent key เดียวกัน) และ recommendation ผิดราก: useCardSearch hook + SearchResultsDropdown มีอยู่แล้วจาก commit eb0d414 ("The ONE card search") — ต้อง reuse ของเดิม ไม่ใช่สร้าง useCardSuggestions ใหม่ซ้อนเป็นตัวที่ 4 · เปลือก UI ของ hero-bar ถูกเคาะใน commit เดียวกันว่า "intentionally kept — richer than a search-select" ดังนั้น scope ต้องจำกัดที่ logic ชั้นล่าง ห้ามรวมเปลือก

### `HOME-06` — /
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ผู้ใช้ OPTCG เลือกดูจาก 'ชุดการ์ด' ก่อน (ทิศที่เคาะแล้ว) แต่หน้าแรกไม่มีทางเข้า set ที่มองเห็น — บนมือถือกว่าจะถึง SetPicker ต้อง scroll ผ่าน hero + highlights + โฆษณา ~2 จอ และมันเป็นแค่ dropdown จิ๋วใน toolbar

**หลักฐาน:** src/app/page.tsx:87-104 — ลำดับ: hero → featured+gainers+losers → AdSlot → ตาราง (mt-9) · ทางเข้า set เดียวในเนื้อหา = SetPicker เล็กๆ ใน toolbar (home-market-overview.tsx:225-233)

**วิธีแก้ที่เสนอ:** เพิ่ม set rail แบบ CMC category (chips เลื่อนแนวนอน: ชุดล่าสุด 6-8 ชุดพร้อมรูปกล่อง + ปุ่ม 'ทุกชุด' ไป /sets) วางเหนือตาราง market — แตะครั้งเดียว filter ตารางทันที

### `HOME-07` — /
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** component แสดง delta มี 3 ตัวไม่เหมือนกัน: หน้าแรกใช้ ChangePill (ไม่มี ▲/▼ — ขัด VISION §4 ข้อ 3 ที่บังคับลูกศรทุก delta), /market-overview ใช้ DeltaPill ที่ดันอยู่ในโฟลเดอร์ private ของ page ทั้งที่เป็น atom ทั่วไป, ส่วน DeltaText ที่ประกาศตัวว่า 'unified' กลับไม่มีใครใช้

**หลักฐาน:** change-pill.tsx:18 — %change ไม่มีลูกศร (สี+เครื่องหมายอย่างเดียว) · hero-market-card.tsx:227 DeltaPill (มีลูกศร) ฝังใน _components ของ page · delta-text.tsx:36 DeltaText "unified" ที่ทั้ง 2 หน้าไม่ใช้

**วิธีแก้ที่เสนอ:** รวมเป็น atom เดียว (PriceTag/DeltaText ตาม VISION atom kit) ใน components/shared รองรับ variant text/pill + ลูกศรเสมอ แล้วให้ทั้ง ChangePill กับ DeltaPill ชี้มาที่ตัวเดียว

### `HOME-08` — /
**🟠 MED** · ด้าน: a11y · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** dropdown ค้นหาของ hero เป็น combobox โดยพฤติกรรมแต่ไม่มี ARIA semantics เลย — screen reader ไม่รู้ว่ามีผลลัพธ์เปิดอยู่ และตำแหน่ง highlight จากลูกศรขึ้นลง (activeIdx) มองไม่เห็นสำหรับผู้ใช้ AT (command-search ก็อาการเดียวกัน)

**หลักฐาน:** hero-search-bar.tsx:215-226 — input ไม่มี role="combobox"/aria-expanded/aria-controls/aria-activedescendant ทั้งที่มี dropdown + keyboard nav

**วิธีแก้ที่เสนอ:** ใส่ role=combobox + aria-expanded + aria-controls ที่ input, role=listbox/option + id ที่แถวผลลัพธ์ และ aria-activedescendant ตาม activeIdx — แก้ทีเดียวใน shared component จากข้อ redundancy ด้านบนจะคุ้มสุด

### `HOME-09` — /
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ช่องค้นหายิง API ทุก keystroke (โครง debounce มีแต่ตั้ง delay ไว้ 0ms) — พิมพ์ 'luffy' = 5 requests, ผลลัพธ์กระพริบระหว่างพิมพ์ และเปลือง server โดยเฉพาะภาษาไทยที่พิมพ์ทีละอักขระ

**หลักฐาน:** hero-search-bar.tsx:83-90 — `setTimeout(() => {...fetchCards...}, 0)` = debounce 0ms (command-search.tsx:131 เหมือนกัน)

**วิธีแก้ที่เสนอ:** ปรับ delay เป็น ~250-300ms ทั้ง 2 จุด (ตัวเลขเดียว แก้บรรทัดเดียวต่อไฟล์ — abort logic ที่มีอยู่แล้วใช้ต่อได้เลย)

### `HOME-10` — /market-overview
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** section พี่น้องระดับเดียวกันในหน้าเดียวใช้หัวข้อคนละขนาด (text-h3 vs text-h4) และคนละภาษา container (ลอย vs panel) โดยไม่มีเหตุผลชั้นข้อมูล แถม header pattern ถูกเขียน 3 แบบ: SectionHeader local, inline ใน Top sets, และมี shared SectionHead อยู่แล้วที่ไม่ถูกใช้

**หลักฐาน:** market-overview-client.tsx:239 — 'Most valuable cards' ใช้ h2 text-h3 ลอยบน canvas แต่ :144 'Top sets' ใช้ h2 text-h4 ใน Surface panel + :141-157 เขียน header pattern ซ้ำ inline แทนที่จะใช้ SectionHeader ที่ประกาศเองที่ :222

**วิธีแก้ที่เสนอ:** เลือก 1 แบบ: ทุก section ใช้ text-h3 + SectionHead ตัว shared แล้วลบ SectionHeader local กับ inline header ทิ้ง — hierarchy จะอ่านเป็นระดับเดียวกันทันที

### `HOME-11` — /
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **S**

**ปัญหา:** comment 2 จุดในไฟล์เดียวขัดกันเอง (จุดบนยังบรรยาย architecture แบบ bottom sheet ที่ถูก veto ไปแล้ว) — AI/คนที่มาแก้ต่อจะเชื่อ comment ผิดตัวแล้วรื้อกลับเป็น bottom sheet

**หลักฐาน:** home-market-overview.tsx:107-108 — comment ว่า "a bottom sheet on mobile (thumb-reachable)" แต่ :290-292 บอก "owner vetoed bottom sheets app-wide" และโค้ดจริงใช้ Dialog กลางจอ

**วิธีแก้ที่เสนอ:** แก้ comment บรรทัด 107-108 ให้ตรงความจริง (dialog กลางจอบนมือถือ / popover บน md+) — งาน 1 นาทีแต่กันการถอยหลังเข้าคลอง

### `HOME-12` — /market-overview
**🔵 LOW** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ลิงก์ 'ดูการ์ดทั้งหมด' ส่ง ?sort=price_desc ไปหน้าแรกซึ่งไม่เคยอ่าน param นี้ — วันนี้บังเอิญรอด (default sort คือ price_desc อยู่แล้ว) แต่ถ้า default เปลี่ยนเมื่อไหร่ลิงก์จะพังแบบเงียบๆ

**หลักฐาน:** market-overview-client.tsx:101 — href="/?sort=price_desc" แต่ src/app/page.tsx:20 อ่านเฉพาะ sp.search

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น href="/" เฉยๆ (เอา param หลอกออก) หรือถ้าอยากรองรับ deep-link sort จริง ให้หน้าแรกอ่าน sort param แล้วส่งเข้า useMarketCards

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่มีหน้าไหนต้องรื้อทั้งหน้า — โครง desktop ของทั้ง / และ /market-overview แข็งแรงดีแล้ว แต่ถ้าจะ re-compose "first fold มือถือ" ของหน้าแรกให้ตรง insight browse-by-set มากขึ้น เสนอโครงนี้ (mobile เท่านั้น, desktop คงเดิม): (1) hero search กระชับลง (ลด pt/pb) → (2) set rail แนวนอน — ชุดล่าสุด 6-8 ชุดเป็น chip มีรูปกล่อง แตะแล้ว filter ตารางทันที + ปุ่มไป /sets → (3) highlights ยุบเหลือ module เดียวแบบ segmented (เด่น | ขึ้น | ลง) สูง ~3 แถว แทนการ stack featured+gainers+losers เต็ม 1 จอ → (4) ตาราง market พร้อม toolbar ใหม่ 2 แถว: แถว set (เต็มกว้าง) + แถว sort/filter/view ที่ tap ≥44px → (5) SEO content เดิม ผลคือตาราง market ขึ้นมาอยู่ในระยะ scroll ครึ่งจอจากเดิม ~2 จอ

---

<a id="discovery"></a>
## DISCOVERY — ค้นหา + trending + compare

**ขอบเขตที่ตรวจ:** /search (page.tsx, search-client.tsx, use-search.ts, search-pagination.tsx, photo-search-button.tsx) · /trending (page.tsx, trending-tabs.tsx) · /compare (compare-client.tsx, _components/*, compare-chart.tsx) · CommandSearchModal + trigger (shared/command-search.tsx, layout/header.tsx, header-mobile.tsx) · HeroSearchBar / HomeSearchHero (components/home) · CardSearch + useCardSearch + SearchResultsDropdown (shared) · CardPickerModal, CompareButton, CompareFloatingBar, compare-store

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- /search ใช้ MarketTable + market-columns ร่วมกับหน้าแรกจริง มี mobile list fallback และ skeleton ตรง layout ครบ (search-client.tsx:246-309)
- หน้า compare แตกไฟล์เรียบร้อยแล้ว (356 บรรทัด ไม่ใช่ 629 ตาม backlog) และใช้ CSS variable --compare-cols ตัวเดียวคุมทุก grid ให้คอลัมน์ตรงกันทั้งหน้า (compare-section.tsx:46-53)
- CompareFloatingBar แบบ cart + สถานะ seen เป็น flow ข้ามหน้าที่คิดมาดี ไม่หลอกหลอนผู้ใช้ (compare-store.ts:19, compare-floating-bar.tsx:31-34)
- trending จัดการแท็บภาษาไทยล้นจอด้วย contained horizontal scroll อย่างตั้งใจ พร้อมคอมเมนต์อธิบาย (trending-tabs.tsx:221-231)

### `DISCOVERY-01` — compare
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้า compare ล้างการ์ดที่เลือกทันทีที่ออกจากหน้า แต่ตัว rail เองมีลิงก์ชวนกดไปดูรายละเอียดการ์ด — ผู้ใช้เลือก 4-5 ใบ กดดูใบหนึ่ง กด back กลับมา = หายหมด ต้องเลือกใหม่ตั้งแต่ต้น และ refresh/แชร์ลิงก์ก็ไม่ได้เพราะไม่มี state ใน URL

**หลักฐาน:** compare-client.tsx:106-110 clear() store ตอน unmount ขณะที่ card-rail.tsx:72-75 มี Link ไป /cards/[code]

**วิธีแก้ที่เสนอ:** เก็บรายการเทียบไว้ใน URL (?cards=OP01-001,OP13-118) ให้ back/refresh/share คืนสภาพได้ แล้วค่อยล้าง store หลัง sync ลง URL — ยังคงเจตนา task-scoped ได้โดยไม่ทำร้ายคนที่แค่แวะดูการ์ด

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดปัจจุบันเป๊ะ (clear() ใน cleanup ที่ compare-client.tsx:106-110, Link ไป /cards/[code] ที่ card-rail.tsx:72-75, store ไม่มี persist) พฤติกรรม transient เป็นความตั้งใจจริง (commit 06194f6 + comment) แต่เจตนาที่ประกาศคือ "selection ห้ามตามผู้ใช้ไปหน้าอื่น" เท่านั้น — เคสกดลิงก์การ์ดใน rail ของหน้าตัวเองแล้ว back กลับมาโดนล้างหมดเป็นผลข้างเคียงที่ไม่ได้ถูกชั่ง และกลไก seen ในสโตร์ก็แก้เรื่อง floating bar ตามหลอกอยู่แล้วโดยไม่ต้องทิ้ง state ตอน back ดังนั้นเป็น trap จริง ไม่ใช่ trade-off ที่จงใจรับ recommendation (URL state) ไม่ขัดทิศที่เคาะข้อใดและยังรักษา task-scoped ได้ ข้อควรระวังตอนเข้าแผน: ส่วน "refresh ไม่ได้" ใน issue เป็นเจตนาที่ document ไว้แล้ว (store docstring) — แผนควรโฟกัส back-navigation trap เป็นหลัก ส่วน refresh/share restore เป็นของแถมจาก URL state ไม่ใช่ bug

### `DISCOVERY-02` — compare
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** มือถือ render เลนตามจำนวน tier เสมอแม้ยังไม่เลือกการ์ด — ผู้ใช้ PRO ได้ 6 คอลัมน์บนจอ 390px = เลนละ ~48px แต่ตัวเลขใน cell ใหญ่ระดับ text-2xl ถึง text-4xl ทำให้ตัวเลข/ชื่อการ์ดถูกบีบจนล้นหรืออ่านไม่ได้

**หลักฐาน:** compare-client.tsx:164-168 บังคับ gridColumnCount = tier lanes + upsell (PRO=5+1=6 เลน) และ compare-section.tsx:53 GRID_CLASS ไม่มี overflow-x-auto (คอมเมนต์ :177-182 ระบุ "No horizontal scroll")

**วิธีแก้ที่เสนอ:** ต่ำกว่า sm ให้ clamp เลนที่มองเห็นไว้ 2-3 เลนแล้วใช้ horizontal snap-scroll (แบบ Apple compare) หรืออย่างน้อยไม่ render เลนว่าง/upsell บนมือถือ เหลือปุ่ม + เดียวท้าย rail

**หมายเหตุจากทีม verify:** โค้ดจริงตรงตามที่อ้างทุกจุด: PRO=5 เลน+upsell=6 (limits.ts:105, MAX_COMPARE=6), GRID_CLASS ไม่มี overflow-x-auto, render เลนตาม tier แม้ไม่เลือกการ์ด และคณิต ~48px/เลนบน 390px ถูกต้อง จุดชี้ขาดคือคอมเมนต์เก่าที่ compare-client.tsx:174-176 ยังอ้าง "overflow-x-auto wrappers" ที่ถูกลบไปแล้ว = mobile ถูกหลงลืมตอนเปลี่ยนเป็น no-scroll ไม่ใช่ดีไซน์ที่เคาะ อีกทั้ง AGENTS.md บังคับให้ layout หนาแน่นมี fallback ต่ำกว่า sm อยู่แล้ว recommendation แก้เฉพาะมือถือจึงไม่ขัดทิศ desktop โครงเดิม (รายละเอียดปลีกย่อย: บนมือถือ cell ใหญ่สุดคือ text-3xl ไม่ใช่ text-4xl ซึ่งอยู่ที่ sm:/md: — ไม่เปลี่ยนข้อสรุป)

### `DISCOVERY-03` — search
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **S**

**ปัญหา:** บนมือถือ /search ไม่มีตัวเรียงลำดับเลย — dropdown sort ถูกซ่อนใต้ sm โดยไม่มีตัวแทน และ list fallback ก็ sort จากหัวตารางไม่ได้ ผู้ใช้มือถือติดอยู่กับ price_desc ตลอด (ตัวกรองช่วงเวลา 24h/7d ก็หายไปด้วย)

**หลักฐาน:** search-client.tsx:201 sort SelectTrigger เป็น "hidden h-9 sm:flex" และ :217 changePeriod เป็น "hidden sm:block"; mobile list ของ MarketTable ไม่มีหัวคอลัมน์ให้กด sort

**วิธีแก้ที่เสนอ:** โชว์ sort Select บนมือถือด้วย (แถวตัวกรองมี wrap อยู่แล้ว) หรือใส่ปุ่ม sort เปิด bottom-sheet ตาม iOS grammar ของหน้าอื่น

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดจริงทุกบรรทัด (search-client.tsx:201 ซ่อน sort ใต้ sm, :217 ซ่อน changePeriod, market-table.tsx mobile list ไม่มีหัวคอลัมน์) และ use-search.ts default price_desc โดยไม่มีทางเปลี่ยนบนมือถือจริง — git history ชี้ว่าเป็น leftover จาก select เก่า ไม่มี comment/doc รองรับว่าตั้งใจ แถวตัวกรองเดียวกันก็โชว์ rarity Select บนมือถืออยู่แล้ว แต่ตอนเข้าแผนต้องตัด recommendation ตัวเลือก bottom-sheet ทิ้ง เพราะเจ้าของ veto bottom sheets ทั้งแอป (comment ใน home-market-overview.tsx:290-292 ใช้ centered dialog แทน) — เหลือทางเลือกแรกคือโชว์ sort Select บนมือถือในแถว filter ที่ flex-wrap อยู่แล้ว

### `DISCOVERY-04` — search (ทุก entry point)
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ระบบค้นหาการ์ดถูกเขียนซ้ำ 3 ชุดเต็มๆ — HeroSearchBar (426 บรรทัด), CommandSearchModal (430 บรรทัด) และ CardSearch — ทั้งที่ CardSearch ประกาศตัวเป็นตัวกลางของทั้งแอปแล้ว logic recent search / fetch / แถวผลลัพธ์ก็ก๊อปกันคนละเวอร์ชัน แก้ 1 ที่อีก 2 ที่ไม่ตาม

**หลักฐาน:** card-search.tsx:36-38 docstring เคลม "The ONE card search... home hero, Cmd-K palette" แต่ใช้จริงแค่ watchlist-add-dialog.tsx:63 + alert-create-dialog.tsx:145 (docstring โกหก — เขียนใน commit eb0d414 เดียวกับที่ตัดสินใจคง hero-bar แยกไว้ "intentionally kept, richer than a search-select") · ของซ้ำจริง: (1) recent-searches logic implement ซ้ำ 3 ที่ (hero-search-bar.tsx:17-33, command-search.tsx:38-73, card-search.tsx:14-33) และ drift แล้ว — card-search dedupe case-sensitive (บรรทัด 105) อีก 2 ที่ case-insensitive; (2) hero-search-bar.tsx:80-95 + command-search.tsx:128-157 hand-roll fetch เอง (setTimeout 0ms + AbortController, limit 6/8) แทนที่จะใช้ useCardSearch (debounce 300ms, ไม่มี abort — พฤติกรรม 3 แบบไม่ตรงกัน); (3) แถวผลลัพธ์การ์ด hero:274-304 vs command:315-345 ก๊อปกันแล้วเพี้ยน (size-9/font-price/uppercase vs size-10/font-mono/raw) — CardSearch เองไม่ใช่ชุดซ้ำที่ 3 มันคือตัว canonical ที่ compose ถูกแล้ว

**วิธีแก้ที่เสนอ:** ดึง useRecentSearches hook + SearchResultRow component กลางออกมา แล้วให้ hero กับ Cmd+K ประกอบจาก engine เดียวกับ CardSearch (useCardSearch) เหลือแค่เปลือก UI ที่ต่างกัน

**หมายเหตุจากทีม verify:** ปัญหาจริงและคุ้มแก้ — evidence ทุก file:line ตรงโค้ดปัจจุบัน และ drift เกิดแล้วจริง (dedupe recent case-sensitive ใน card-search vs case-insensitive ใน hero/command · hero/command fetch เอง 0ms+abort ข้าม useCardSearch 300ms ไม่มี abort · แถวผลลัพธ์ก๊อปแล้วเพี้ยน size/font) แต่รายละเอียดเว่อร์: ไม่ใช่ "ซ้ำ 3 ชุดเต็มๆ" — CardSearch คือตัว canonical ที่ compose useCardSearch+SearchResultsDropdown ถูกแล้ว ตัว hand-roll มี 2 ชุด (hero 426 บรรทัด, command 430 บรรทัด) ส่วนที่ซ้ำครบ 3 มีแค่ logic recent-searches; และ commit eb0d414 บันทึกไว้ว่า hero-bar "intentionally kept — richer than a search-select" ดังนั้นแผนห้ามยุบเปลือก hero/palette (sets section, popular pills, photo search, nav shortcuts ต้องคงไว้) — recommendation เดิม (แชร์ hook+row, ต่างแค่เปลือก) เข้ากันได้ ไม่ขัดทิศ desktop/iOS/honey ที่เคาะแล้ว

### `DISCOVERY-05` — CommandSearchModal (มือถือ)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **M**

**ปัญหา:** มือถือกดไอคอนค้นหาแล้วได้ palette แบบ desktop ย่อส่วน: การ์ดลอยกลางจอที่ 15vh, มีปุ่ม ESC ที่จอสัมผัสใช้ไม่ได้, ผลลัพธ์สูงแค่ 50vh ใต้คีย์บอร์ด — ไม่ตรง iOS grammar ที่เจ้าของเคาะ และ dialog เขียนเองไม่มี focus trap/scroll lock

**หลักฐาน:** command-search.tsx:244 mt-[15vh] max-w-lg + ปุ่ม "ESC" (:284-290) — เป็นทางเข้าค้นหาเดียวของมือถือนอกหน้าแรก (header-mobile.tsx:68-77)

**วิธีแก้ที่เสนอ:** ต่ำกว่า md ให้ render เป็น full-screen search sheet (input ติดบน, ผลลัพธ์เต็มจอ, ปุ่ม "ยกเลิก" แทน ESC) และซ่อน kbd hint บนจอสัมผัส

### `DISCOVERY-06` — compare
**🟠 MED** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** สีเขียว price-up ถูกใช้ mark "ผู้ชนะ" (ราคาถูกสุด, power/counter สูงสุด) ซึ่งไม่ใช่กำไร/ขาดทุน — ขัดกฎ identity ที่สงวนเขียว/แดงไว้เฉพาะ P/L และฝั่งลบก็หลุดไปใช้ text-destructive แทน token ราคา ทำให้แดงสองเฉดปนกัน

**หลักฐาน:** compare-section.tsx:143-147 winner ราคาถูกสุด/power สูงสุดทาสี text-price-up และ :199 delta ลบใช้ text-destructive แทน --price-down

**วิธีแก้ที่เสนอ:** winner highlight เปลี่ยนเป็น honey accent (จุด/ขีดใต้ค่า ไม่ใช่ทาตัวเลข) และ delta ลบใช้ var(--price-down) ให้ตรงกับ DeltaText ทั้งแอป

### `DISCOVERY-07` — search
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ตัวกรอง เรียงลำดับ หน้า และโหมดดูของ /search ไม่ถูกเขียนลง URL — refresh, กด back จากหน้าการ์ด, หรือแชร์ลิงก์ แล้วทุกอย่างรีเซ็ตเหลือแค่คำค้น ผู้ใช้ที่กรองเซ็ต+เปิดหน้า 3 ไว้ต้องทำใหม่หมด

**หลักฐาน:** use-search.ts:31-43 sort/page/set/rarity/viewMode เป็น useState ล้วน มีแค่ q ที่อยู่ใน URL (:125)

**วิธีแก้ที่เสนอ:** sync sort/set/rarity/page ลง searchParams ด้วย router.replace (shallow) แบบเดียวกับที่ ?q= ทำอยู่

### `DISCOVERY-08` — search (hero + Cmd+K)
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** hero กับ Cmd+K ไม่มี debounce จริง พิมพ์ "monkey d luffy" = ยิง API ~14 ครั้ง (abort ช่วยฝั่ง client แต่ server โดนเต็ม) ทั้งที่ hook กลางที่ debounce แล้วมีอยู่

**หลักฐาน:** hero-search-bar.tsx:83-90 และ command-search.tsx:131-152 ใช้ setTimeout(...,0) = ยิง fetchCards ทุก keystroke ขณะที่มาตรฐานของ repo คือ useCardSearch debounce 300ms (use-card-search.ts:54)

**วิธีแก้ที่เสนอ:** เปลี่ยนไปใช้ useCardSearch หรืออย่างน้อยตั้ง debounce 250-300ms ให้ตรงกับที่อื่น

### `DISCOVERY-09` — search (hero vs Cmd+K vs /search)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ค้นหา 3 ทางให้ผลไม่เท่ากัน: hero เจอการ์ด+เซ็ต+ค้นด้วยรูป, Cmd+K (ทางเดียวของมือถือนอกหน้าแรก) เจอการ์ด+หน้าเพจแต่พิมพ์ "OP09" ไม่ได้ลิงก์เซ็ต, /search เจอการ์ดอย่างเดียว — ขัด VISION ที่ให้ universal search เป็น teleport ค้นการ์ด/เซ็ต/ฟีเจอร์ที่เดียว

**หลักฐาน:** hero-search-bar.tsx:154-164 มี setMatches + PhotoSearchButton:237 แต่ command-search.tsx:195-207 มีแค่ cards+NAV_ACTIONS (ไม่มีเซ็ต ไม่มีค้นด้วยรูป)

**วิธีแก้ที่เสนอ:** ทำ composition ผลลัพธ์ให้เป็นชุดเดียว (การ์ด + เซ็ต + หน้าเพจ + ปุ่มค้นด้วยรูป) แล้วให้ทั้ง hero และ Cmd+K ใช้ร่วมกัน — ทำพร้อมข้อ 1 ได้เลย

### `DISCOVERY-10` — trending
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** trending เขียนตาราง desktop และแถวมือถือของตัวเองทั้งชุด ทั้งที่มี MarketTable กลาง (รองรับ rank, sparkline, ราคา, delta, mobile fallback ครบ) — เป็นหน้าที่สามที่ render แถวการ์ดตลาดด้วยโค้ดคนละชุด ปรับดีไซน์แถวทีเดียวต้องแก้สามที่

**หลักฐาน:** trending-tabs.tsx:103-173 (TrendingRow) + :249-319 (ตาราง+mobile list เขียนเอง) ทำงานเดียวกับ MarketTable/MobileCardItem ที่ home และ /search ใช้ (market-table.tsx:22-35)

**วิธีแก้ที่เสนอ:** map TrendingCardRow เข้า CardRow แล้ว render ผ่าน MarketTable + buildMarketColumns (มี showViews อยู่แล้วสำหรับแท็บ mostViewed) เหลือ trending-tabs แค่คุมแท็บ/period

### `DISCOVERY-11` — trending
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** force-dynamic ทับ revalidate ทำให้ ISR ที่ตั้งใจไว้ตายสนิท — ทุก pageview รันคิวรี 7 ชุดสดๆ ทั้งที่ข้อมูล trending เปลี่ยนตาม cron วันละครั้ง หน้าโหลดช้าโดยไม่จำเป็น

**หลักฐาน:** trending/page.tsx:11-13 ประกาศทั้ง dynamic="force-dynamic" และ revalidate=300 พร้อมกัน แล้วยิง 7 Prisma queries × 50 แถว (:46-55)

**วิธีแก้ที่เสนอ:** เอา force-dynamic ออกให้ revalidate=300 ทำงาน (searchParams tab อ่านฝั่ง client อยู่แล้วผ่าน initialTab — ย้ายไปอ่านใน client component ถ้าจำเป็น)

### `DISCOVERY-12` — search (pagination)
**🔵 LOW** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** ปุ่ม pagination ทั้งแถวเล็กกว่า tap target ขั้นต่ำ 44px ที่เคาะไว้สำหรับมือถือ กดพลาดง่ายโดยเฉพาะเลขติดกัน

**หลักฐาน:** search-pagination.tsx:33,46,60 ปุ่มเลขหน้า/ลูกศรเป็น size-8 (32px)

**วิธีแก้ที่เสนอ:** ต่ำกว่า sm ขยายเป็น size-11 หรือย่อเหลือแค่ ก่อนหน้า/ถัดไป + ตัวเลขหน้าปัจจุบันแบบ iOS

### `DISCOVERY-13` — search / trending / compare
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** สามหน้าพี่น้องประกอบหัวหน้ากันคนละแบบ — trending มี title+คำอธิบาย, compare มี icon+badge+action, ส่วน /search ไม่มีชื่อหน้าเลยทั้ง desktop และมือถือ (breadcrumb ก็ซ่อนใต้ md) ลำดับสายตาแต่ละหน้าเริ่มไม่เท่ากัน

**หลักฐาน:** trending/page.tsx:105-107 Breadcrumb แยก + PageHeader, compare-client.tsx:214-231 ยัด breadcrumb เข้า PageHeader, search/page.tsx:60 มีแต่ Breadcrumb ไม่มี title/h1 ที่มองเห็นเลย

**วิธีแก้ที่เสนอ:** เลือก pattern เดียว: PageHeader รับ breadcrumb prop เหมือน compare แล้วใช้ทั้งสามหน้า — /search ใส่ title สั้นๆ เหนือช่องค้นหา

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่มีหน้าไหนต้องรื้อทั้งหน้า — โครงหลักของทั้ง 3 route ดีอยู่แล้ว มีจุดเดียวที่ควร re-compose เฉพาะส่วนคือ compare บนมือถือ (<sm): เปลี่ยนจาก grid เลนตาม tier ที่บีบทุกอย่างลงจอเดียว เป็น (1) rail การ์ดแบบ horizontal snap-scroll โชว์ 2-2.5 ใบ/จอ + ปุ่ม + ท้ายแถว (2) ส่วน dossier/ราคา sync การเลื่อนกับ rail หรือ fallback เป็น block ต่อการ์ดเรียงลงมา (3) เลนว่าง/เลน upsell ไม่ render บนมือถือ ใช้ badge LimitCounter เดิมสื่อ tier แทน — desktop คงโครงเดิมทั้งหมด

---

<a id="card-detail"></a>
## CARD-DETAIL — Card detail (trust core — หน้าสำคัญสุด)

**ขอบเขตที่ตรวจ:** /cards/[code] (src/app/cards/[code]/page.tsx) · src/components/cards/card-detail.tsx · src/components/cards/card-detail/* (16 ไฟล์: card-chart, grades, grade-value, edition-toggle, asks-rail, recent-sales, mock, market-feed-shared, market-table-layout, market-feed-scroll, source-logo, grade-logo, section-head, use-card-detail-tabs, use-sticky-buy) · src/components/cards/{price-chart, source-markets-table, card-listings-section, card-detail-specs, card-detail-related, card-detail-sibling-grid, card-add-to-portfolio, card-set-alert-dialog, card-effect-text}.tsx · src/components/shared/breadcrumb.tsx

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- สถาปัตยกรรมความซื่อสัตย์ของราคาแข็งแรงมาก — grades.ts แยก real/modeled ด้วย isEst, ป้าย "ตัวอย่าง" (SampleBadge) บน feed จำลอง, EN edition คืน ladder ว่างแทนตัวเลขปลอม, chart จุดเดียว/ไม่มีข้อมูลมี state ของตัวเอง — ตรง VISION Cardmarket-honesty
- card-chart.tsx คุณภาพระดับ financial chart จริง: scrub + keyboard a11y + calendar-snapped ticks + reduced-motion + helper pure มี unit test (chart-scale.test.ts)
- สอง feed (ประวัติขาย + Meecard asks) ใช้ primitive ร่วมชุดเดียว (market-feed-shared/market-table-layout) และทำ table→list ใต้ sm ตาม convention เป๊ะ
- วินัย hydration ดี — guard lang/currency ก่อน hydrate, mock ทุกตัว deterministic ไม่มี Date.now()/RNG ใน render

### `CARD-DETAIL-01` — /cards/[code]
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า server ยิง query จริงทุก pageview เพื่อป้อน props ที่ component ไม่เคยอ่าน — getCommunityPrice (aggregate communityPrice 30 วัน) + getChartSources + daysSinceUpdate ทั้งหมดเป็นของตกค้างจาก pass เก่า เปลือง DB ฟรีบนหน้าที่ traffic เยอะสุด

**หลักฐาน:** card-detail.tsx:118,126,135 ประกาศ communityPrice/availableSources/daysSinceUpdate และ destructure :159-169 ไม่รับทั้งสาม (ตรงตามรายงาน) · page.tsx:74 ยิง getCommunityPrice = prisma.communityPrice.aggregate ย้อน 30 วัน (src/lib/data/card-detail.ts:147-160) ทุก pageview — dead จริงตั้งแต่ commit 4b2600c ไม่มี consumer อื่น · แต่ getChartSources (card-detail.ts:248-270) เป็น pure function บนข้อมูลที่ fetch แล้ว ไม่ใช่ query · และ daysSinceUpdate เป็น placeholder ที่ตั้งใจคงไว้ตาม comment card-detail.tsx:385-388 ("intentionally NOT pushed (เบส) — the page still passes daysSinceUpdate, so re-add... once daily data is live") · scope ที่ถูกต้อง: ตัด getCommunityPrice query + props communityPrice, availableSources · คง daysSinceUpdate ไว้

**วิธีแก้ที่เสนอ:** ตัด 3 props นี้ออกจาก interface + ตัด query ที่ page.tsx (getCommunityPrice, getChartSources) ถ้ายังไม่มีแผนใช้ — ถ้าจะใช้ freshness cue ภายหลังค่อยเติมกลับพร้อม UI จริง

**หมายเหตุจากทีม verify:** แกนของ finding จริง: getCommunityPrice เป็น DB aggregate จริง (prisma.communityPrice.aggregate 30 วัน) ยิงทุก pageview บนหน้า force-dynamic เพื่อป้อน prop ที่ component เลิกอ่านตั้งแต่ redesign 4b2600c — ตัดได้คุ้ม แต่รายละเอียดผิด 2 จุด: (1) getChartSources ไม่ใช่ DB query เป็น pure function บน card.prices ที่ fetch มาแล้ว ตัดไม่ประหยัด DB (2) daysSinceUpdate ห้ามตัด — comment ใน card-detail.tsx:385-388 ระบุชัดว่าเบสตั้งใจคง prop นี้ไว้รอเติม freshness cue เมื่อ daily data live ทำตาม recommendation เดิมจะขัด decision ที่บันทึกไว้ในโค้ด

### `CARD-DETAIL-02` — /cards/[code]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ไฟล์หลักโตเป็น client component ยักษ์ที่ผสม data-derivation กับ presentation ทุกโซนไว้ด้วยกัน (hero, buy box, tab nav, chart zone, sticky bar) — ผ่าน redesign 8+ รอบเลยสะสม comment-essay และ state ข้ามโซนจนแก้จุดเดียวต้องอ่านทั้งไฟล์

**หลักฐาน:** card-detail.tsx = 970 บรรทัด: derive logic ~:193-475 (gradeData/marketRows/recentSales/mock wiring) + JSX ยาว :477-968 ในไฟล์ client เดียว

**วิธีแก้ที่เสนอ:** แตกเป็น hook เดียว use-card-pricing (gradeData/selectedGrade/series/marketRows) + component ย่อยตามโซน VISION: <PriceHero> <BuyBoxRail> <SectionTabs> <ChartZone> <StickyBuyBar> — state grade/edition ยังอยู่ที่พ่อไฟล์เดียว ส่งลงเป็น props

**หมายเหตุจากทีม verify:** Evidence ตรงเป๊ะทุกจุด: ไฟล์ 970 บรรทัดจริง ("use client"), derive block :193-475 จริง (gradeData/seriesList/marketRows/recentSales/mock wiring), JSX :477-968 จริง โดย hero/buy box/tab nav/chart/sticky bar inline ในไฟล์แม่ทั้งหมด, git log 45 commits (~35 รอบ ui/redesign) รองรับคำว่า "8+ รอบ" — และ PLAN.md R2 (:165) มี task ค้างอยู่แล้วว่า "แตก client components ยักษ์ แยก data hook ออกจาก presentation" ซึ่งลิสต์ไฟล์ใหญ่สุดแค่ 661 บรรทัด แปลว่า card-detail.tsx 970 ใหญ่กว่าทุกตัวในลิสต์แต่ตกสำรวจ (ลิสต์เขียนก่อนไฟล์โต) · recommendation เป็น structure-only ไม่แตะ layout/พฤติกรรม จึงไม่ขัดทิศที่เคาะ (desktop โครงเดิม/iOS grammar/breadcrumb) และต่อ pattern hook เดิมที่มีอยู่ (use-sticky-buy, use-card-detail-tabs) · nuance เดียว: มีการแตกไปแล้ว 17 โมดูลใน card-detail/ ดังนั้น scope งานคือเฉพาะไฟล์แม่ orchestrator ตามที่ recommendation เล็งไว้พอดี — effort M สมเหตุสมผล

### `CARD-DETAIL-03` — /cards/[code]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ช่องโหว่ความน่าเชื่อถือบน trust core: แถว "ขายล่าสุด" ใน buy box เป็นราคาขายจริงจาก scrape แต่กดแล้วพาไปตาราง #sources ที่เป็นข้อมูลตัวอย่างล้วน (ตัวเลขคนละชุด) — และ VISION §5.1 zone 7 (ตาราง ask ต่ำสุดต่อแหล่ง) หายไปทั้งโซน เหลือแค่ marketRows memo ที่คำนวณไว้ป้อนแถวเดียว

**หลักฐาน:** card-detail.tsx:700-707 ลิงก์ "ขายล่าสุด" (ข้อมูลจริง) ชี้ #sources แต่ :863-864 #sources render RecentSales isSample (mockRecentSales :457-460) · :345-346 comment อ้าง MarketsTable ที่ถูกลบแล้ว

**วิธีแก้ที่เสนอ:** ระยะสั้น: ให้แถวขายล่าสุดลิงก์ออกไปยังแหล่งจริง (sourceUrl) แทน #sources หรือใส่คำอธิบายว่าปลายทางเป็นตัวอย่าง · ระยะกลาง: คืนตาราง reference-markets ต่อแหล่งจากข้อมูล marketRows ที่มีอยู่แล้ว (zone 7) ให้ลิงก์มีที่ลงจริง

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดปัจจุบันทุกจุด (คลาดเคลื่อนไม่เกิน 1-2 บรรทัด): แถวขายล่าสุด (:706-707) เป็นข้อมูลจริงจาก marketRows แต่ลิงก์ไป #sources (:863-864) ที่ render mockRecentSales badged ตัวอย่าง · ที่หนักกว่านั้น comment :382-385 สารภาพเองว่าลิงก์ median ถูกถอดออกด้วยเหตุผลเดียวกันเป๊ะ ("no real breakdown to land on. Re-add it when a real per-source table returns") แต่ลิงก์ buy box รอดมา พร้อม comment stale ที่ :446-448 เคลมว่า #sources มีข้อมูลจริง — เป็น oversight ไม่ใช่ intent · zone 7 หายจริง (SourceMarketsTable กลายเป็น dead code ไม่มี import) · recommendation สอดคล้อง VISION §5.1 zone 7 และ note ในโค้ดเอง ไม่ขัดทิศที่เคาะแล้วข้อไหน

### `CARD-DETAIL-04` — src/components/cards/
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** โค้ดตายจาก redesign รอบก่อน ~800 บรรทัดยังค้างในโฟลเดอร์: SourceMarketsTable (317 บรรทัด) ไม่มีใคร import เลย, PriceChart (384 บรรทัด) เหลือแค่ค่าคงที่ CHART_PERIODS ที่หน้า compare ใช้, CardListingsSection ถูกแทนด้วย MeecardAsksRail แล้วแต่ตัว component ยังอยู่

**หลักฐาน:** source-markets-table.tsx:72 (0 importer), price-chart.tsx:154 (ใช้แค่ CHART_PERIODS จาก compare-client.tsx:14), card-listings-section.tsx:30 (ใช้แค่ type CardListing)

**วิธีแก้ที่เสนอ:** ลบ 3 ไฟล์นี้ทิ้ง — ย้าย CHART_PERIODS ไปไว้ใน compare-client (หรือ lib/constants) และย้าย type CardListing ไปไว้ใน card-detail/ ที่เป็นผู้ใช้จริง ลดความสับสนให้ AI/คนที่มาแก้ต่อ

**หมายเหตุจากทีม verify:** ตรวจกับโค้ดจริงแล้วตรงทุกจุด: SourceMarketsTable (317 บรรทัด) ไม่มี importer เลย, PriceChart (384 บรรทัด) เหลือแค่ CHART_PERIODS ที่ compare-client.tsx:14 ใช้, CardListingsSection ไม่มีใคร render (ทุก importer เอาแค่ type CardListing) และ MeecardAsksRail ใช้งานจริงแทนที่ card-detail.tsx:891 — ไม่ใช่ของตั้งใจเก็บ (CLAUDE.md ระบุ redesign in-place ไม่เก็บ v1/v2) และ recommendation ไม่ขัดทิศดีไซน์ใดๆ เพราะเป็น code hygiene ล้วน · เพิ่มเติม: src/lib/constants/source-markets.ts มี consumer เดียวคือไฟล์ตายนี้ ควรลบพร้อมกันด้วย (คลาดจิ๋ว: export อยู่บรรทัด 71 ไม่ใช่ 72 — ไม่กระทบสาระ)

### `CARD-DETAIL-05` — /cards/[code]
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** การติดป้าย "est" บนราคาที่เป็น model ไม่สม่ำเสมอ: ราคา PSA 9/8/BGS บนชิปเกรดและบน sticky buy bar โชว์เป็นตัวเลขเปล่าเหมือนราคาจริง ทั้งที่ตัวเดียวกันตรง hero มี est กำกับ — ผู้ใช้ scan ชิปเทียบราคาแล้วแยกจริง/ประมาณไม่ได้

**หลักฐาน:** card-detail.tsx:606-608 ราคาบน grade chip ไม่มี EstMark ขณะที่ hero :624 และ high-bar :671 มี · sticky bar :943-948 ก็ไม่มี

**วิธีแก้ที่เสนอ:** ใส่ EstMark (หรือ superscript ~) บนราคาชิปทุกตัวที่ isEst และบนราคา sticky bar เมื่อค่ามาจาก tier ที่ model — ใช้กติกาเดียว: ตัวเลข modeled ต้องมี mark ทุกจุดที่ปรากฏ

### `CARD-DETAIL-06` — /cards/[code]
**🟠 MED** · ด้าน: UX · จอ: มือถือ · effort: **S**

**ปัญหา:** sticky buy bar บนมือถือติดป้ายว่าเป็นราคา Meecard แต่เมื่อไม่มี listing จริง (สถานการณ์ปกติตอนนี้) มันโชว์ราคาอ้างอิงจากแหล่งนอก — attribution ผิดบนแถบที่ผู้ใช้เห็นตลอดการ scroll และตัวเลขยังไม่ตรงกับตาราง #market (mock) ที่ปุ่มทองพาไป

**หลักฐาน:** card-detail.tsx:942 label "{gradeLabel} · Meecard" แต่ :944-948 fallback ไปใช้ latest (ราคาอ้างอิง Yuyutei/modeled) เมื่อ meecardLowest เป็น null

**วิธีแก้ที่เสนอ:** เปลี่ยน label ตามแหล่งจริงของตัวเลข (เช่น "Raw · อ้างอิง" เมื่อ fallback) หรือโชว์ราคาต่ำสุดจากชุดเดียวกับที่ #market แสดง ให้ปลายทางกับแถบตรงกันเสมอ

### `CARD-DETAIL-07` — /cards/[code]
**🟠 MED** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** tap target บนมือถือหลายจุดต่ำกว่ากติกา ≥44px ที่เจ้าของเคาะ: ปุ่ม watchlist/bell/share ข้างชื่อการ์ด 36px, ปุ่ม range chart + condition filter + JP/EN toggle 40px — จุดที่ผู้ใช้มือถือกดบ่อยที่สุดบนหน้านี้

**หลักฐาน:** card-detail.tsx:411 headerIconBtn size-9 (36px) · market-feed-shared.tsx:15 SEGMENT_BTN h-10 (40px) · edition-toggle.tsx:28 min-h-10 (40px)

**วิธีแก้ที่เสนอ:** ยกฐานมือถือเป็น min-h-11/size-11 แล้วค่อยลดที่ md: (ตามแพทเทิร์นที่ SEGMENT_BTN ทำอยู่แล้วแค่เปลี่ยน h-10→h-11) — แก้ที่ constant กลาง 3 จุดจบ

### `CARD-DETAIL-08` — /cards/[code]
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ค่า offset ที่ผูกกับความสูง chrome ส่วนกลาง (header/ticker/tab bar) ถูก hardcode ซ้ำ 7+ จุดใน 2 ไฟล์ — ถ้า header เปลี่ยนสูงเมื่อไหร่ต้องไล่แก้ทุกจุดไม่งั้น scrollspy/anchor เพี้ยนแบบเงียบๆ ความสูง chart ก็ประกาศซ้ำ 4 ที่

**หลักฐาน:** card-detail.tsx:517,863,868,890,917 ทวน scroll-mt-[7.75rem] md:scroll-mt-[10.5rem] 5 ครั้ง · nav :745 top-14 md:top-[6.25rem] · h-[210px] sm:h-[280px] lg:h-[320px] ซ้ำใน card-detail.tsx:402 + card-chart.tsx:197,206,310

**วิธีแก้ที่เสนอ:** รวบเป็น CSS variable ใน globals.css (เช่น --sticky-offset-card-detail) หรือ constant เดียวในไฟล์ shared แล้วอ้างทุกจุดจากที่เดียว รวมถึง chartHeights ให้ card-chart รับเป็น class จากผู้เรียก

### `CARD-DETAIL-09` — /cards/[code]
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** feed ประวัติขาย + Meecard asks ใช้กล่อง scroll ซ้อนใน page scroll (nested scrolling) พร้อมข้อมูล 12-18 แถว — บน touch มือถือ scroll-ใน-scroll ชอบกินนิ้วผู้ใช้กลางหน้า และขัด VISION ที่ให้ตัด 8 แถวแล้วเปิด sheet แทน

**หลักฐาน:** market-table-layout.tsx:11-16 max-h-[20rem]/[24rem] overflow-y-auto + mock 12/18 แถว (:4-6) — VISION.md:103 zone 6 กำหนด cap 8 → "ดูทั้งหมด" sheet

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็นแสดง 8 แถวแรกแบน (ไม่มี inner scroll) + ปุ่ม "ดูทั้งหมด" เปิด bottom-sheet/ขยาย — ตัด MarketFeedScroll + hint bounce ออกได้เลย ลดทั้งโค้ดและ frustration

### `CARD-DETAIL-10` — /cards/[code]
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** เทียบ VISION §5.1 มีโซนหายเงียบ 2 จุด: Population strip (zone 4) ไม่มีเลยแม้ในรูป ghost (VISION สั่งชัดว่า no-data = ghost ไม่ซ่อน) และ stat รอง Lowest Ask (zone 3) มีข้อมูลใน GradeDatum อยู่แล้วแต่ไม่ถูกแสดง — หน้าเหลือ hero + delta อย่างเดียว บางกว่าสเปค trust anchor

**หลักฐาน:** ไม่มีไฟล์ population-strip ใน src/components/cards/** (ls ยืนยัน) ทั้งที่ VISION.md:101 zone 4 ให้โชว์ ghost จนข้อมูลมา · grades.ts:61 lowestAsk คำนวณแล้วแต่ zone 3 ไม่ render

**วิธีแก้ที่เสนอ:** เพิ่ม population strip แบบ ghost (บรรทัดเดียว แสดงเฉพาะ chip graded) รอ CardPopulation จริงตาม VISION §6 และเติม Lowest Ask เป็น stat รองใต้ hero จาก datum.lowestAsk ที่มีอยู่ (ติด est mark ตามข้อ EstMark)

### `CARD-DETAIL-11` — src/components/cards/card-detail/
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ของตกค้างระดับ export สะสมจากหลายรอบ: field ใน GradeDatum ที่คำนวณทุก render แต่ไม่มีใครแสดง, component ราคา 3 ตัวใน grade-value ที่ไม่มีผู้ใช้, mock generator 2 ตัวที่ผู้ใช้หายไปแล้ว, และ prop size ของ Delta ที่ไม่มีผลจริง

**หลักฐาน:** grades.ts:59-67 lastSale/lowestAsk/sales30d/isReal ไม่มี UI อ่าน · grade-value.tsx:21,60,77 Amount/GradeValue/StatValue 0 importer · mock.ts:98,130 mockComps/mockSales30d ไม่ถูกใช้ · grade-value.tsx:118 size "md"/"lg" ได้ text-sm เท่ากัน

**วิธีแก้ที่เสนอ:** กวาดลบ export/field ที่ไม่มีผู้ใช้ในรอบเดียว (lastSale/lowestAsk เก็บไว้ได้ถ้าจะทำ zone 3 ตาม VISION — แต่ให้ตัดสินใจแล้วบันทึก) และลบ prop size ที่เป็น no-op ของ Delta

### `CARD-DETAIL-12` — src/components/cards/card-detail/card-chart.tsx
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** กลไก multi-series compare + indexed mode (rebaseToIndex, fmtIndex, branch ใน tooltip/aria/last-price tag) เป็นซากจากรอบที่มี grade overlay ซึ่ง comment ใน card-detail เองบอกว่า "removed for clarity" — โค้ดตาย ~60 บรรทัดในไฟล์ 516 บรรทัดที่อ่านยากอยู่แล้ว

**หลักฐาน:** card-chart.tsx:410 drawn.slice(1) overlay + :169 prop indexed — ผู้เรียกเดียว card-detail.tsx:824 ส่ง indexed={false} และ seriesList ยาว 1 เสมอ (:264-278)

**วิธีแก้ที่เสนอ:** ตัด indexed mode + compare-lines ออกให้ chart รับ series เดียวตรงๆ (เก็บ rebaseToIndex ไว้ใน lib แยกถ้าหน้า compare จะใช้ต่อ) — ถ้าจะคืน overlay ในอนาคตค่อย re-introduce จาก git history

### `CARD-DETAIL-13` — /cards/[code]
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หัว section บนหน้าเดียวกันมี 2 สำนวน (SectionHead กับ h2 ประกอบมือ) เพราะ SectionHead ไม่มีช่องใส่ badge/desc — และ dialog ตั้งราคาแจ้งเตือนถูก mount ซ้ำสองอินสแตนซ์สำหรับการ์ดใบเดียว

**หลักฐาน:** recent-sales.tsx:166 + asks-rail.tsx:160 hand-roll <h2 class=text-h3> + badge เอง ขณะที่โซนอื่นหน้าเดียวกันใช้ SectionHead (card-detail.tsx:870,918) · CardSetAlertDialog mount ซ้ำ 2 ตัว (card-detail.tsx:724, asks-rail.tsx:284)

**วิธีแก้ที่เสนอ:** เพิ่ม slot badge/description ให้ SectionHead แล้วให้สอง feed ใช้ตัวเดียวกัน · ยก CardSetAlertDialog ขึ้นไป mount ครั้งเดียวที่ card-detail แล้วส่ง onOpen ลงไปให้ asks-rail

### `CARD-DETAIL-14` — /cards/[code]
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** สถานะ selected ทุกตัวบนหน้า (ชิปเกรด, JP/EN, range) ใช้เทา neutral ซึ่งขัดตัวอักษร VISION ที่ให้ honey เป็น accent ของ selected — โค้ดตั้งใจสงวนทองไว้ที่ CTA เดียว แต่ผลคือชิปเกรดที่เป็น axis หลักของหน้า (StockX size-selector) จืดจนแยก selected/idle ยากในมุมมองแวบแรก

**หลักฐาน:** card-detail.tsx:598 ชิปเกรด active = bg-foreground/10 (neutral) ขณะ VISION.md:24 กำหนด honey = selected · comment :680 ประกาศปุ่มซื้อเป็น "one gold element"

**วิธีแก้ที่เสนอ:** ตัดสินใจให้ขาดแล้วบันทึกลง VISION: ถ้ายึด one-gold-CTA ให้เพิ่ม contrast ของ selected (เช่น ring-foreground/30 + พื้นเข้มขึ้น) — หรือถ้าตาม VISION เดิม ให้เฉพาะชิปเกรด selected ใช้ honey บางๆ (ยังต่ำกว่า budget 5%) ส่วน range/edition คง neutral

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่ต้อง re-compose ทั้งหน้า — ลำดับโซนปัจจุบัน (identity → edition+grade → hero → chart → sold history → specs → asks → versions → related) ตรงโครง VISION §5.1 แล้ว ขาดแค่ zone 4 (population ghost) กับ zone 7 (reference markets) ที่หายไปตามที่ flag · first fold มือถือ: hero price อยู่ที่ ~500px (ผ่านได้บนจอมาตรฐาน) แต่บนจอเล็ก (SE/mini) ปุ่มทองหลุด fold — ถ้าจะบีบ แก้เบาๆ พอ: ลด mb-4 ของปุ่ม back + mt-6 ของ grid เป็น mt-4 และลดรูปการ์ดมือถือ w-44→w-40 ไม่ต้องย้ายโซน

---

<a id="sets"></a>
## SETS — Sets + set detail

**ขอบเขตที่ตรวจ:** /sets (page.tsx, sets-page-client.tsx, loading.tsx) · /sets/[setCode] (page.tsx, set-page-client.tsx) · src/components/sets/set-hero.tsx · src/components/sets/set-detail-content.tsx · src/components/sets/set-card-tile.tsx · src/components/sets/other-sets.tsx · src/components/sets/pull-rates-table.tsx · src/lib/data/set-detail.ts

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- โครง desktop ของ set detail ดีมาก: sidebar sticky รวมทุก control (filter+period+rarity jump-nav) + scrollspy ไฮไลต์ section ที่กำลังดู — ฝั่งขวาเหลือแค่กำแพงการ์ดล้วนๆ ตาม VISION การ์ด=พระเอก
- SetCardTile ตั้งใจออกแบบให้แน่น-สแกนง่าย (ราคาได้บรรทัดเต็มไม่ truncate, ตัด badge ซ้ำเพราะ section คือ rarity อยู่แล้ว) พร้อม comment อธิบายเหตุผลทุกจุด — แก้ต่อได้ไม่หลงทาง
- Data layer รวมศูนย์ที่ lib/data/set-detail.ts + cache() ใช้ร่วมทั้ง page/metadata และ DropRateDialog ทำ table→list fallback ใต้ sm ถูกต้องตาม convention
- กริด poster ของ sets index กับ other-sets ใช้คอลัมน์ชุดเดียวกัน (3/4/6/7) + gutter bleed -mx-5 ตรงกับหน้าอื่น — จังหวะหน้าเดียวกันทั้งแอป

### `SETS-01` — /sets + /sets/[setCode]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: a11y · จอ: มือถือ · effort: **M**

**ปัญหา:** ปุ่มควบคุมหลักบนมือถือของทั้ง 2 หน้า (แท็บประเภทชุด, ชิป rarity, dropdown filter, ปุ่มช่วงเวลา, ปุ่ม drop rate) สูงแค่ 28–38px ทั้งหมด ต่ำกว่ากติกา tap target ≥44px ที่เคาะไว้ นี่คือเส้นทาง browse หลักของ collector — กดพลาดง่ายบนจอสัมผัส

**หลักฐาน:** sets-page-client.tsx:115 py-2.5 text-xs (~36px) · set-detail-content.tsx:262 chip py-1.5 (~32px) · segmented-control.tsx:139 h-7 (28px) · select.tsx:53 sm=h-8 (32px) · set-page-client.tsx:85 trigger py-1.5 (~30px)

**วิธีแก้ที่เสนอ:** เพิ่มความสูงแตะขั้นต่ำบนมือถือ (min-h-11 หรือขยาย py) ให้ control พวกนี้ — แก้ที่ atom กลาง (SegmentedControl/SelectTrigger เพิ่ม size มือถือ) แล้วชิป/แท็บใน sets ปรับ padding ตาม จะได้ถูกทุกหน้าพร้อมกัน

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดจริงทั้ง 5 จุดและทุก control render บนมือถือจริง (บล็อก lg:hidden + set-hero) — สูง 28–40px ต่ำกว่า 44px หมด ไม่ใช่ของตั้งใจ เพราะ component ที่ redesign แล้วใช้ min-h-11 (44px) อยู่แล้ว: game-filter-chips.tsx:95,129 (chip แบบเดียวกัน), card-detail.tsx:761,960, mini-table, portfolio-movers และ VISION.md เคาะ ≥44px/≥56px ราย component สอดคล้องทิศ iOS grammar — หน้า sets คือหน้าที่ตกขบวน convention ตัวเอง Recommendation ไม่ขัดทิศ (scope มือถือชัด) แต่ตอนแก้ต้องระวังให้ size bump ที่ atom เป็น mobile-only กันลามไป desktop รายละเอียดคลาดเล็กน้อย: แท็บ /sets สูงจริง ~38–40px ไม่ใช่ ~36px (text-xs ถูก bump เป็น 13px/18px) — ไม่เปลี่ยนข้อสรุป

### `SETS-02` — /sets
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้ารวมชุดการ์ด (ทางเข้าหลัก) เรียง OP01→ใหม่สุด ทำให้ชุดใหม่ที่คนตามราคามากที่สุดไปอยู่ท้ายกลุ่ม — บนมือถือ 3 คอลัมน์ต้องไถหลายแถวกว่าจะเจอ แถมเรียงสวนทางกับแถบ "ชุดอื่นๆ" ใน set detail ที่เอาใหม่สุดขึ้นก่อน

**หลักฐาน:** src/app/sets/page.tsx:35 orderBy code asc (เก่าสุดขึ้นก่อน) ขณะที่ other-sets เรียง releaseDate desc (set-detail.ts:65)

**วิธีแก้ที่เสนอ:** เรียงชุดใหม่สุดขึ้นก่อน (releaseDate desc) ให้ตรงกับ other-sets และพฤติกรรมจริงของ collector — แก้ orderBy จุดเดียว

### `SETS-03` — /sets (+ home, admin, profile)
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** แถบแท็บขีดเส้นใต้ถูกเขียนมือ 4 ที่ด้วย padding/ขนาด font ที่เริ่มไม่ตรงกัน (py-2.5/py-3/py-2 · text-xs/text-sm) — ฟีเจอร์ใหม่ทุกตัวจะก๊อปต่อและ drift ต่อ

**หลักฐาน:** sets-page-client.tsx:115 class ก้อนเดียวกับ home-market-overview.tsx:209 เป๊ะ ("-mb-px shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-semibold") + variant ต่างเล็กน้อยใน admin-sub-nav.tsx:59, profile-tabs-nav.tsx:103

**วิธีแก้ที่เสนอ:** ยกเป็น TabBar atom กลางตัวเดียว (รับ options + active + onChange, รองรับทั้ง button และ Link) แล้ว migrate 4 จุดนี้มาใช้ — ได้แก้เรื่อง tap target ในข้อแรกไปพร้อมกัน

### `SETS-04` — /sets + /sets/[setCode]
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** โปสเตอร์ tile ของชุดการ์ดถูกเขียน 2 ที่ (หน้า index กับแถบ "ชุดอื่นๆ") โค้ดเกือบก๊อปกัน และเริ่ม drift แล้ว — ค่า Image sizes ไม่ตรงกับกริดจริง (index บอก 45vw ทั้งที่ 3 คอลัมน์ ≈ 31vw = โหลดรูปเกิน)

**หลักฐาน:** sets-page-client.tsx:174-216 (SetCard) กับ other-sets.tsx:40-67 tile แทบเหมือนกัน แต่ sizes ไม่ตรง (45vw vs 30vw) และบรรทัด count มี/ไม่มี

**วิธีแก้ที่เสนอ:** รวมเป็น SetPosterTile ตัวเดียวใน components/sets (prop เปิด/ปิดบรรทัดจำนวนใบ) แล้วทั้ง 2 หน้าเรียกใช้ — sizes ถูกที่เดียว จบเรื่อง drift

### `SETS-05` — /sets + /sets/[setCode]
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ทั้ง 2 หน้าเป็น force-dynamic แต่ query เกินที่ใช้จริง: หน้า index โหลดการ์ดทุกใบทั้งฐานข้อมูลแค่เพื่อเลือกรูปแรกต่อชุด และหน้า detail join ราคา PSA10 ทุกใบแล้วทิ้ง — ช้าลงทุกครั้งที่เปิดหน้าโดยไม่มีใครเห็นผล

**หลักฐาน:** sets/page.tsx:43-50 ดึงการ์ดทุกใบใน DB มาหา cover ต่อ set · set-detail.ts:31-41 include ราคา PSA10 ต่อใบ แต่ psa10PriceUsd/isParallel ไม่ถูก render เลย (SetCardTile ไม่ใช้)

**วิธีแก้ที่เสนอ:** index: เปลี่ยนเป็น query แบบ distinct ต่อ setId (หรือเก็บ coverImage ไว้ที่ CardSet) · detail: ตัด include prices กับ field psa10PriceUsd/isParallel ออกจนกว่าจะมี UI ใช้จริง

### `SETS-06` — /sets/[setCode]
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า set detail (force-dynamic, query DB หนัก) ไม่มี loading.tsx ของตัวเอง — ตอนกดจาก index จะเห็น skeleton รูปหน้า index (แท็บ+โปสเตอร์) แล้วสลับเป็น layout hero คนละทรง ขัดกฎ VISION §4.6 "skeleton รูปร่างตรงกับ layout จริง" และ skeleton ของ index เองก็คอลัมน์ไม่ตรงกริดจริง

**หลักฐาน:** ls src/app/sets/[setCode]/ ไม่มี loading.tsx · sets/loading.tsx:21 skeleton grid ใช้ lg:grid-cols-5 แต่กริดจริง lg:grid-cols-6 xl:grid-cols-7 (sets-page-client.tsx:154)

**วิธีแก้ที่เสนอ:** เพิ่ม [setCode]/loading.tsx ทรงเดียวกับหน้า detail จริง (hero ซ้ายรูป-ขวาข้อความ + แถวชิป + กริดการ์ด) และแก้คอลัมน์ skeleton ของ index ให้ตรง lg:6/xl:7

### `SETS-07` — /sets/[setCode]
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** กรอง type+color จนไม่เหลือการ์ด จะเจอแค่ข้อความจืดๆ "ไม่มีข้อมูล" กลางหน้า — เป็น dead-end ไม่มีทางไปต่อ และไม่ใช้ EmptyState/KumaEmptyState ที่เป็น atom กลาง (VISION: empty ต้องมี CTA เดียว)

**หลักฐาน:** set-detail-content.tsx:426-430 filtered-empty เป็น div เปล่า text-sm ไม่มีปุ่ม ขณะที่หน้าเดียวกันใช้ KumaEmptyState (บรรทัด 200)

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น EmptyState พร้อมปุ่ม "ล้างตัวกรอง" ที่รีเซ็ต activeType/activeColor กลับเป็น all — จุดเดียวจบ

### `SETS-08` — /sets/[setCode]
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** Drop-rate dialog เป็นทางตัน — ดูตัวเลขคร่าวๆ แล้วไปต่อไหนไม่ได้ ทั้งที่มี /drop-calculator ที่คำนวณละเอียดกว่า (แยก normal/parallel, เลือกใบที่อยากได้) แถมตัว calculator ก็ deep-link พร้อมชุดที่เลือกไว้ไม่ได้ ต้องมาเลือก set ซ้ำ

**หลักฐาน:** set-page-client.tsx:84-212 dialog จบในตัว ไม่มีลิงก์ · drop-calculator-client.tsx:31 selectedCode เริ่ม "" ไม่อ่าน URL param

**วิธีแก้ที่เสนอ:** เพิ่ม CTA ท้าย dialog "คำนวณละเอียดใน Drop Calculator" ลิงก์ไป /drop-calculator?set=<code> และให้ calculator อ่าน query param มา preselect ชุด — ต่อ funnel ฟีเจอร์เด่นให้ครบ

### `SETS-09` — /sets/[setCode]
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** pull-rates-table.tsx เป็นไฟล์กำพร้า (ไม่มีที่ไหนใช้) ที่ก๊อป logic คำนวณ/แถบ bar เดียวกับ DropRateDialog ไว้ทั้งชุด — เป็นกับดักให้คนมาแก้ผิดไฟล์ในอนาคต และมีข้อความ hardcode ที่ drift ไปแล้ว

**หลักฐาน:** pull-rates-table.tsx ไม่มีใคร import (grep เจอแค่ไฟล์ตัวเอง) และ logic fmtCount/unit ซ้ำกับ set-page-client.tsx:34-69 ทุกบรรทัด

**วิธีแก้ที่เสนอ:** ลบ pull-rates-table.tsx ทิ้ง (ขออนุมัติลบไฟล์ตาม permission) หรือถ้าจะเก็บ ให้แยก logic กลาง (fmtCount/rateForUnit/countForUnit) เป็น util เดียวใน lib/utils/pull-rate แล้วให้ dialog เรียกใช้

### `SETS-10` — /sets/[setCode]
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** tile ในกำแพงการ์ดใช้ Skeleton (กะพริบตลอด) เป็น placeholder ของรูปที่ "ไม่มีจริง" — สื่อผิดว่ากำลังโหลดไม่เสร็จสักที และไม่ตรงกับหน้า index ที่ใช้ไอคอนนิ่งๆ

**หลักฐาน:** set-card-tile.tsx:57 การ์ดไม่มีรูป render <Skeleton> ค้างถาวร ขณะที่ index ใช้ไอคอน Package (sets-page-client.tsx:196)

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น placeholder นิ่งแบบเดียวกับ index (ไอคอน + surface-1) — Skeleton สงวนไว้สำหรับสถานะกำลังโหลดจริงเท่านั้น

### `SETS-11` — /sets/[setCode]
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ตัวเลขใน drop-rate dialog เขียน font-mono/font-bold เองแทนที่จะใช้ token .text-price/.text-code ที่หน้าเดียวกันใช้อยู่ (SetCardTile) และชื่อชุดใน hero หยิบ .text-h3 มาแล้วแก้น้ำหนัก+สีทับ — ขัดหลัก "token เดียวจบ ไม่ stack ทับ" ใน AGENTS.md

**หลักฐาน:** set-page-client.tsx:138,196 ใช้ font-mono text-sm font-bold แทน .text-price · set-hero.tsx:87 ใช้ text-h3 แล้ว override font-normal text-muted-foreground

**วิธีแก้ที่เสนอ:** เปลี่ยนตัวเลขใน dialog เป็น .text-price / .text-code และชื่อชุดใน hero ใช้ token ที่ตรง role จริง (เช่น text-h4 + text-muted-foreground หรือเพิ่ม token subtitle ถ้าใช้ซ้ำหลายหน้า)

### `SETS-12` — /sets/[setCode]
**🔵 LOW** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** scrollspy/jump ใช้ magic number 4 ค่าที่ต่างกันเล็กน้อยแทนความสูง header จริง แถม window.scrollTo คำนวณเองทั้งที่ประกาศ scroll-mt ไว้แล้ว — วันไหน header เปลี่ยนสูง จุด jump จะเพี้ยนทั้งหน้า

**หลักฐาน:** set-detail-content.tsx:188 (threshold 150) · :214 (offset -132) · :405 scroll-mt-32 (128px) · :307 sticky top-32 — เลข 4 ตัวประมาณความสูง header คนละค่า

**วิธีแก้ที่เสนอ:** รวมเป็นค่ากลางค่าเดียว (CSS var หรือ const HEADER_OFFSET) แล้วให้ jump ใช้ scrollIntoView + scroll-mt แทนการคำนวณ scrollTo เอง

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่มีหน้าไหนต้องรื้อทั้งหน้า — โครงหลักทั้ง /sets และ set detail แข็งแรงดี จุดเดียวที่ควร \"ประกอบใหม่บางส่วน\" คือแถบควบคุมมือถือของ set detail: ยกกล่อง filter+period+ชิป rarity มาเป็น sticky bar บางๆ ใต้ header (frosted ตอน scroll ตาม iOS grammar) — แถวบน dropdown type/color + period, แถวล่างชิป rarity เลื่อนข้าง สูงรวม ~96px ยุบเหลือแถวชิปเดียวตอนไถลง ส่วน desktop คงโครง sidebar เดิม

---

<a id="portfolio"></a>
## PORTFOLIO — Portfolio hub + detail

**ขอบเขตที่ตรวจ:** /portfolio (hub) · /portfolio/[id] (detail: overview + insights tabs) · components: portfolio/** + assets-table/** + use-portfolio-api

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- Hub→detail split ทำถูกหลัก: การ์ดพอร์ตเป็นลิงก์จริง (stretched link, bookmarkable) และ hub จงใจไม่วาดกราฟรวมข้ามพอร์ต — ซื่อสัตย์ตาม VISION honest-money (portfolio-client.tsx:72-81)
- Scrub chart ทำครบตาม VISION §5.3: baseline ต้น range, inflow notch จาก netInvested, hero bind กับนิ้ว, honey เส้นเดียว ไม่ใช้เขียว/แดงบน chrome (portfolio-scrub-chart.tsx:264-304)
- ตาราง holdings มี list fallback ใต้ sm ตาม AGENTS.md เป๊ะ (assets-table/index.tsx:111-131) และเขียว/แดงสงวนไว้แค่กำไร/ขาดทุนจริงทั้ง area
- ใช้ typography token + Surface สม่ำเสมอเกือบทุกไฟล์ — แทบไม่มี text-[Xpx] arbitrary เลย

### `PORTFOLIO-01` — /portfolio + /portfolio/[id]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ของตกค้างจาก redesign รอบเก่า ~720 บรรทัด: 3 component ไม่ถูก import จากที่ไหนเลย (รวม donut chart ที่ VISION §5.3 ห้ามใช้แล้ว) บวก API ตายในฮุค (transactions/loadTransactions/deleteTransaction), prop `leading` ที่ไม่มีใครส่ง (assets-table/index.tsx:43) และ type HoldingsView (utils.ts:5) ที่เหลือจาก grid view เก่า — ทำให้คนแก้โค้ดครั้งหน้าอ่าน/เดาเผื่อของที่ไม่มีอยู่จริง

**หลักฐาน:** portfolio-transactions.tsx (446 บรรทัด), portfolio-collection-grid.tsx (149), portfolio-allocation-chart.tsx (125, donut เก่า) — grep ทั้ง src ไม่มี importer; use-portfolio-api.ts:185-196 loadTransactions/deleteTransaction ก็ไม่มีผู้เรียก

**วิธีแก้ที่เสนอ:** ลบ 3 ไฟล์ orphan + ตัด transactions API ออกจาก use-portfolio-api + ลบ prop/type ที่ไม่ใช้ (ขอเบสยืนยันก่อนลบไฟล์ตาม permission) — ถ้าจะทำหน้า transactions ในอนาคตค่อยเขียนใหม่บน spec ใหม่

**หมายเหตุจากทีม verify:** ตรวจกับโค้ดปัจจุบันแล้วตรงทุกจุด: 3 ไฟล์ orphan มีจริง (446+149+125=720 บรรทัดเป๊ะ) grep ทั้ง src ไม่มี importer ทั้งชื่อไฟล์และชื่อ export · loadTransactions/deleteTransaction อยู่ที่ use-portfolio-api.ts:185-196 จริง และผู้เรียก hook ทั้ง 2 ที่ (portfolio-client.tsx, portfolio-detail-client.tsx) ไม่แตะ transactions เลย · leading prop (index.tsx:43, ทะลุถึง assets-toolbar.tsx) ไม่มี callsite ไหนส่ง · HoldingsView (utils.ts:5) ไม่มีใคร reference · ไม่มี comment/แผนใน PLAN/PROGRESS/SPEC ว่าตั้งใจเก็บ · donut ถูกแทนด้วย portfolio-allocation-panel.tsx แล้ว · recommendation ไม่ขัดทิศที่เคาะและเผื่อขอเบสยืนยันก่อนลบไฟล์ตาม permission แล้ว นิตเล็ก: VISION §5.3 ห้าม donut+history+treemap "พร้อมกัน" ไม่ใช่แบน donut เด็ดขาด แต่ไม่เปลี่ยนข้อสรุป

### `PORTFOLIO-02` — /portfolio + /portfolio/[id]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** เพิ่มการ์ดได้ทีละ 1 ใบต่อการเปิด dialog 1 รอบ: เลือกการ์ด → กรอกจำนวน/ราคา → กด add → dialog ปิดและล้าง filter ทั้งหมด นักสะสมที่เพิ่ม 20 ใบต้องทำ 20 รอบเต็มๆ (รวมพิมพ์ค้นหา/เลือกเซ็ตใหม่ทุกรอบ) ทั้งที่โครง API เป็น batch อยู่แล้ว

**หลักฐาน:** add-card-dialog.tsx:145-147 — onAddBatch([single item]) แล้ว reset() + onOpenChange(false) ทันที ทั้งที่ API รับ CartItem[] เป็น batch

**วิธีแก้ที่เสนอ:** หลังกด add ให้คงอยู่ที่ step select พร้อม filter เดิม + toast ยืนยัน (หรือทำ cart จริงตาม CartItem ที่ออกแบบไว้ แล้วกด "เพิ่มทั้งหมด" ครั้งเดียว) ปิด dialog เฉพาะเมื่อผู้ใช้ปิดเอง

**หมายเหตุจากทีม verify:** Evidence ตรงเป๊ะกับโค้ดปัจจุบัน (add-card-dialog.tsx:145-147 — onAddBatch ใบเดียว → reset() ล้าง filter หมด → ปิด dialog) และ interface เป็น batch จริง (CartItem[] ทั้ง prop และ addCardsBatch ใน use-portfolio-api.ts:379) · ไล่ git history แล้วไม่เคยมี cart UI อยู่เลย = CartItem คือของออกแบบเผื่อแต่ไม่เคยสร้าง ไม่ใช่ถูกถอดโดยเจตนา · SPEC "Cart หลายใบ" ใน out-of-scope คือ marketplace cart คนละเรื่อง · recommendation สอดทิศ VISION.md:132 ที่เคาะ "ฆ่า modal-per-add + sheet ค้างไว้ add รัวๆ" ไว้แล้วสำหรับ deck editor และไม่แตะทิศที่เคาะข้ออื่นเลย (nuance เดียว: HTTP endpoint ยิงทีละใบ แต่ hook fan-out ให้แล้ว ไม่กระทบสาระ)

### `PORTFOLIO-03` — /portfolio/[id]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน่วยเงินของ "ราคาทุน" ไม่ตรงกันระหว่างตอนเพิ่มการ์ดกับตอนแก้ไข: ตอนเพิ่มพิมพ์เป็นสกุลที่ผู้ใช้เลือก (เช่น บาท) แล้วระบบแปลงเป็นเยน แต่ dialog แก้ไขโชว์เลขเยนดิบไม่มีสัญลักษณ์สกุล ถ้าผู้ใช้พิมพ์เลขบาทลงไปตอนแก้ ระบบเก็บเป็นเยน → กำไร/ขาดทุนเพี้ยนทันที

**หลักฐาน:** add-card-dialog.tsx:144 แปลง displayValueToJpy ก่อนเซฟ แต่ single-edit-dialog.tsx:229 โชว์/เซฟ String(row.purchasePrice) เป็น JPY ดิบ (bulk-edit-dialog.tsx:176,226 เหมือนกัน)

**วิธีแก้ที่เสนอ:** ให้ edit dialog แปลงค่าเป็น display currency ตอนโชว์ + แปลงกลับเป็น JPY ตอนเซฟ (เหมือน add flow) และใส่สัญลักษณ์สกุลหน้า input เหมือน add-card-detail-step.tsx:130

**หมายเหตุจากทีม verify:** Evidence ตรงกับโค้ดจริงทุก file:line — add flow แปลง display currency→JPY ก่อนเซฟ (add-card-dialog.tsx:144) แต่ edit dialogs ทั้ง single (229, 258-259) และ bulk (176, 226) โชว์/เซฟเลข JPY ดิบไม่มีสัญลักษณ์สกุล ขณะที่ default currency คือ THB และใน dialog เดียวกันราคาปัจจุบันแสดงเป็นบาทผ่าน Price component — ผู้ใช้พิมพ์เลขบาทตอนแก้จะถูกเก็บเป็นเยน P&L เพี้ยนจริง ไม่มี comment/convention ที่บอกว่าตั้งใจ และ recommendation ไม่ขัดทิศที่เคาะแล้ว (helper แปลงสกุลมีครบใน src/lib/utils/currency.ts แล้ว effort S สมจริง) ข้อควรระวังตอนแก้: round-trip THB→JPY→THB ปัดเศษเพี้ยน ±1 อย่าให้ทำ dirty-check หลอน

### `PORTFOLIO-04` — /portfolio
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** แผง hero "ยอดรวม + glow ตามทิศ P/L" ถูกเขียน 3 ครั้งใน 3 ไฟล์แทนที่จะใช้ atom เดียว — ผลข้างเคียงที่มองเห็น: hero ของ hub ไม่มี count-up (.rise/HeroNumber) ขณะ detail มี ทำให้สองหน้าพี่น้องรู้สึกไม่ใช่แอปเดียวกัน และแก้ glow ครั้งหน้าต้องไล่ 3 ที่

**หลักฐาน:** portfolio-client.tsx:171-213 hand-roll hero (blur div + eyebrow + text-display + delta) ซ้ำ pattern เดียวกับ portfolio-hero-panel.tsx:53-58 และ portfolio-mock-preview.tsx:18-40

**วิธีแก้ที่เสนอ:** ให้ hub ใช้ PortfolioHero/HeroNumber ตัวเดียวกับ detail แล้วแตก glow blur ออกเป็น prop ของ Surface หรือ component เล็กๆ (PnlGlow) ที่ mock-preview ใช้ร่วมด้วย

### `PORTFOLIO-05` — /portfolio + /portfolio/[id]
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** UI จัดการพอร์ต (rename/delete/create) มี 3 ชุดขนานกัน: การ์ดใน hub, PortfolioSidebar ใน dialog ของ switcher, และ CreatePortfolioCard — logic ยืนยันลบและฟอร์มแก้ชื่อถูก copy-paste จนแก้ที่เดียวไม่ครบแน่นอนในอนาคต

**หลักฐาน:** portfolio-hub-card.tsx:55-73 กับ portfolio-selector.tsx:52-70 — confirm-delete flow ซ้ำกันแทบทุกบรรทัด; ฟอร์ม rename/create inline ซ้ำ 4 จุด (hub-card:75-113, selector:80-107,188-214, portfolio-client:272-329)

**วิธีแก้ที่เสนอ:** แตกเป็น shared primitives: usePortfolioDeleteConfirm() + <PortfolioNameForm> ตัวเดียว แล้วให้ทั้ง 3 ที่เรียกใช้ (พฤติกรรมเดิมทุกอย่าง แค่ยุบโค้ด)

### `PORTFOLIO-06` — /portfolio + /portfolio/[id]
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ปุ่มตา (ซ่อนยอด) ตัวเดียวกันแท้ๆ หน้าตาต่างกันระหว่าง hub กับ detail เพราะ IconButton ถูกประกาศซ้ำในแต่ละไฟล์ด้วย class ต่างกัน แถม detail ยัง inline class ชุดเดียวกันซ้ำอีกรอบที่ปุ่ม Globe (บรรทัด 303) — drift แบบไม่ตั้งใจจากการ copy

**หลักฐาน:** portfolio-client.tsx:349 IconButton แบบ ghost ไม่มีขอบ vs portfolio-detail-client.tsx:430 IconButton แบบมี border+bg-card — component ชื่อเดียวกัน นิยามซ้ำ 2 ไฟล์ คนละหน้าตา

**วิธีแก้ที่เสนอ:** ยกเป็น ui/icon-button.tsx ตัวเดียว (เลือก style ใดหนึ่ง — แนะนำแบบมี hairline ของ detail เพราะลอยจากพื้นชัดกว่า) แล้วให้ทั้งสองหน้า + ปุ่ม Globe ใช้ร่วม

### `PORTFOLIO-07` — /portfolio → /portfolio/[id]
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ปุ่มซ่อนยอดเงิน (ตา) เป็น state ภายในหน้า: กดซ่อนที่ hub แล้วแตะเข้าพอร์ต → ยอดเงินโชว์เต็มทันที ทั้งที่เจตนาผู้ใช้คือ "อย่าโชว์เงินตอนนี้" (เช่น เปิดในที่สาธารณะ) — ฟีเจอร์ privacy ที่หลุดตอนเปลี่ยนหน้าคือจุดที่เจ็บจริง

**หลักฐาน:** portfolio-client.tsx:85 และ portfolio-detail-client.tsx:78 — hideBalance เป็น useState(false) แยกกันคนละหน้า

**วิธีแก้ที่เสนอ:** ย้าย hideBalance ไป ui-store (Zustand, persist) ให้ toggle เดียวมีผลทุกหน้า portfolio และจำข้ามเซสชัน

### `PORTFOLIO-08` — /portfolio/[id]
**🟠 MED** · ด้าน: ความสวยงาม · จอ: desktop · effort: **S**

**ปัญหา:** หัวตาราง holdings ตั้งใจให้ sticky แต่ชนกับ global header ที่ sticky top-0 เหมือนกันและ z สูงกว่า: พอ scroll หัวคอลัมน์จะมุดหายไปหลัง header ของแอป — ฟีเจอร์ sticky ใช้ไม่ได้จริงและดูซ้อนเหลื่อม

**หลักฐาน:** desktop-table.tsx:33 thead `sticky top-0 z-10` แต่ header.tsx:96 คือ `sticky top-0 z-50` — thead จะเลื่อนไปซ้อนใต้ header ของเว็บ

**วิธีแก้ที่เสนอ:** เปลี่ยน offset เป็นความสูง header จริง (เช่น top-14/top-16 หรือ CSS var ความสูง header) หรือถอด sticky ออกไปเลยถ้ารายการไม่ยาวพอให้คุ้ม

### `PORTFOLIO-09` — /portfolio/[id]
**🟠 MED** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** tap target ต่ำกว่าเกณฑ์ iOS 44px ที่เจ้าของเคาะ: ปุ่มดินสอแก้ไขบน mobile list = 32px, เมนู "..." บนการ์ด hub ≈28px, ปุ่ม ✓/✕ ตอน rename ≈28px — ทั้งหมดเป็น action หลักที่ต้องแตะบนมือถือ

**หลักฐาน:** action-menu.tsx:25 ปุ่มแก้ไข size-8 (32px) บนแถวมือถือ; portfolio-hub-card.tsx:157 trigger "..." p-1.5+icon 16px ≈28px

**วิธีแก้ที่เสนอ:** ขยาย hit area เป็น ≥44px (เช่น size-11 หรือคง icon เดิมแต่เพิ่ม padding/negative margin) โดยไม่ต้องขยาย icon — ทำที่ AssetEditButton ตัวเดียวได้ผลทุกแถวทั้ง mobile/desktop

### `PORTFOLIO-10` — /portfolio/[id]
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** การเปิด/ปิดพอร์ตเป็นสาธารณะคือการตัดสินใจด้าน privacy แต่เป็น icon button แตะครั้งเดียวเปลี่ยนเลย ไม่มี confirm — อยู่ติดกับปุ่ม share/eye ที่กดบ่อย โอกาสพลาดเปิดพอร์ตให้คนอื่นเห็นสูง และฟังก์ชันเดียวกันนี้ก็ซ้ำอยู่ในเมนู "..." ของ hub card อีกที่หนึ่ง

**หลักฐาน:** portfolio-detail-client.tsx:289-308 — ปุ่ม Globe/Lock ใน top bar สลับ public/private ทันทีที่แตะ มีแค่ toast แจ้งผล

**วิธีแก้ที่เสนอ:** ย้ายไปอยู่ในเมนูรอง (dropdown/share dialog) พร้อม confirm สั้นๆ ตอนจะ "เปิดเป็นสาธารณะ" หรืออย่างน้อยเปลี่ยนเป็น toggle ที่มี label ชัด ไม่ใช่ icon ล้วนใน top bar

### `PORTFOLIO-11` — /portfolio + /portfolio/[id]
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** การ mask ยอดเงินใช้ทั้ง MASKED constant, "••••" hardcode และ "••" (mobile-card.tsx:72) ปนกัน — จำนวนจุดไม่เท่ากันในหน้าเดียว ดูไม่เนี้ยบและแก้ mask style ครั้งหน้าต้องไล่ทุกไฟล์

**หลักฐาน:** portfolio-game-breakdown.tsx:114, desktop-row.tsx:130,154, mobile-card.tsx:62, switcher.tsx:104 ใช้ "••••" hardcode ขณะที่ MASKED constant มีอยู่และถูกใช้ใน hero/hub

**วิธีแก้ที่เสนอ:** ใช้ MASKED จาก lib/constants/ui ทุกจุด (หรือทำ <Masked> helper) — replace ตรงๆ ได้เลย

### `PORTFOLIO-12` — /portfolio/[id]
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** route เดียวมี skeleton 3 ทรงไม่ตรงกัน (route loading / data loading / auth loading) และไม่มีทรงไหนตรง layout จริง (หน้า จริงมี icon 3 ปุ่ม + tab control) — ขัด VISION §4.6 "skeleton รูปร่างตรงกับ layout จริง" ฝั่ง hub ก็ copy skeleton ชุดเดียวกันไว้ 2 ไฟล์ (loading.tsx กับ portfolio-client.tsx:121-144) รอ drift

**หลักฐาน:** [id]/loading.tsx:7-16 มีแถบ breadcrumb+ปุ่ม 2 ก้อน แต่ skeleton ใน client (portfolio-detail-client.tsx:166-206) ไม่มี breadcrumb และ authed-null (บรรทัด 57-64) เป็นกล่อง generic h-8/h-64 อีกทรง

**วิธีแก้ที่เสนอ:** แตก <PortfolioDetailSkeleton> / <PortfolioHubSkeleton> เป็น component เดียวต่อหน้า แล้วให้ loading.tsx, สถานะ loading และ authed-null ใช้ตัวเดียวกัน

### `PORTFOLIO-13` — /portfolio/[id]
**🔵 LOW** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า detail เป็นหน้าเดียวใน area ที่ไม่มี h1/page title: ชื่อพอร์ตปรากฏเฉพาะใน switcher pill ตัวเล็กที่ถูกตัดคำ — screen reader ไม่มี heading หลัก และผู้ใช้ที่เข้าจาก bookmark ต้องอ่านชื่อจาก pill เล็กๆ

**หลักฐาน:** portfolio-detail-client.tsx:240-247 มีแค่ Breadcrumb — ไม่มี PageHeader/h1 เลยทั้งหน้า ชื่อพอร์ตอยู่แค่ใน pill ที่ truncate 9rem (switcher.tsx:99)

**วิธีแก้ที่เสนอ:** ให้ชื่อพอร์ตเป็น h1 (ใช้ .text-h4/sr-only ก็ยังได้ถ้าไม่อยากเพิ่ม visual) หรือยก switcher pill ขึ้นเป็น heading จริงด้วย h1 ภายใน — ไม่ต้องเปลี่ยน layout

### `PORTFOLIO-14` — /portfolio/[id] (Insights)
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** แท็บ Insights เรียง panel → panel → panel แล้วจบด้วย allocation ที่เป็น section แบนไม่มีกล่อง — comment ในไฟล์บอกว่าตาม "editorial grammar" ของ home/card-detail แต่ในหน้านี้มันคือน้องคนเดียวที่หลุดจากพี่ๆ ทำให้ท้ายหน้าดูเหมือนของยังทำไม่เสร็จ

**หลักฐาน:** portfolio-allocation-panel.tsx:20 เป็น section แบน border-t ขณะ sibling ทุกตัวใน tab เดียวกันห่อ Surface panel (portfolio-detail-client.tsx:358,386)

**วิธีแก้ที่เสนอ:** เลือกทางเดียว: ห่อ allocation ด้วย Surface เหมือน movers (ง่ายสุด) หรือถ้าจะไป editorial ทั้งแท็บก็ต้องแบนทุก section พร้อมกัน

---

<a id="track"></a>
## TRACK — Watchlist + saved + alerts

**ขอบเขตที่ตรวจ:** /watchlist (page + client + toolbar + list/grid view + summary + empty + add dialog + row actions + mock preview + loading) · /saved (page + loading) · /settings/alerts (page + manager client + alert-row + alert-groups) · src/components/alerts/** (alert-form, create/edit dialog, types) · src/components/cards/card-set-alert-dialog.tsx · src/components/shared/watchlist-star.tsx · bottom-nav + /more (จุดเข้า watchlist/saved/alerts)

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- โครงโค้ด watchlist แตกไฟล์ดีมาก (toolbar/list/grid/summary/sort/types แยกชัด) — ต่อยอดง่าย เป็นตัวอย่างที่หน้าอื่นควรทำตาม
- Optimistic update + rollback + toast ครบทั้ง remove/pin/bulk (watchlist-client.tsx:259-343) — ลบแล้วหน้าไม่ค้าง พังก็คืนค่าเดิม
- Empty state มีทางไปต่อเสมอ: filtered-empty มีปุ่ม 'แสดงทุกเกม', empty หลักมี Kuma + CTA เพิ่มการ์ด
- สร้าง alert จากบริบทการ์ดทำได้ใน 2-3 แตะ เพราะ prefill ราคา/ทิศทางให้แล้ว และ AlertFormBody ถูก share ระหว่าง create/edit จริง

### `TRACK-01` — /watchlist
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** กดกระดิ่งบนการ์ดที่มี alert อยู่แล้ว ระบบเปิดฟอร์ม 'สร้าง alert ใหม่' ทำให้สร้างซ้ำได้ และไม่มีทางดู/แก้/ลบ alert เดิมจากหน้า watchlist เลย ต้องเดาเองว่าอยู่ที่ตั้งค่า

**หลักฐาน:** watchlist-client.tsx:345-348 — openSetAlert() เปิด CardSetAlertDialog (โหมดสร้างใหม่) เสมอ ไม่เช็ค entry.hasActiveAlert

**วิธีแก้ที่เสนอ:** ถ้า hasActiveAlert ให้เปิด sheet แสดง alert เดิมพร้อมปุ่มแก้ไข/ลบ (ใช้ AlertEditDialog ที่มีอยู่แล้ว) แทนฟอร์มสร้างใหม่ และเพิ่มลิงก์ 'จัดการแจ้งเตือน' ใน toolbar

**หมายเหตุจากทีม verify:** Evidence ตรงเป๊ะกับโค้ดปัจจุบัน: openSetAlert (watchlist-client.tsx:345-348) เปิด CardSetAlertDialog แบบสร้างใหม่เสมอไม่เช็ค hasActiveAlert · service เป็น prisma.create ตรงๆ ไม่มี unique constraint → สร้างซ้ำได้จริง · UI โชว์กระดิ่ง fill + tooltip "มี alert แล้ว" + filter hasAlert แต่กดแล้วได้ฟอร์มเปล่า = affordance หลอก · ในหน้า watchlist ไม่มีลิงก์จัดการ alert เลย (มีแต่ chrome กลาง) · AlertEditDialog มีจริงใน settings/alerts ใช้ reuse ได้ · ไม่ขัดทิศที่เคาะ (sheet = iOS grammar, ไม่แตะโครง desktop) · หมายเหตุตอนแก้: หลาย alert ต่อการ์ดเป็นฟีเจอร์ (BELOW+ABOVE) — sheet ต้องคงปุ่มเพิ่ม alert ใหม่ ห้าม block การสร้างเพิ่ม

### `TRACK-02` — /watchlist
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: a11y · จอ: มือถือ · effort: **M**

**ปัญหา:** แถว watchlist บนมือถือมีปุ่มจิ๋ว 5-7 ตัวเบียดกัน (checkbox 14px, pin 28px, กระดิ่ง 32px) ต่ำกว่ามาตรฐาน tap target ≥44px ที่เคาะไว้ กดพลาดง่ายมากบนแท็บหลักที่คนใช้บ่อยสุด

**หลักฐาน:** watchlist-list-view.tsx:141 checkbox size-3.5 (14px), :151 ปุ่ม pin size-7 (28px); watchlist-grid-view.tsx:94-155 ไอคอน 6 ปุ่ม size-7 ต่อการ์ด

**วิธีแก้ที่เสนอ:** มือถือ: ซ่อน checkbox+pin ไว้หลังโหมดเลือก (ปุ่ม 'เลือก' ใน toolbar) หรือ swipe action แบบ iOS เหลือปุ่มกระดิ่งเดียวที่ hit area ≥44px; desktop คงเดิมได้

**หมายเหตุจากทีม verify:** Evidence ตรงกับโค้ดจริง (checkbox 14px :141, pin 28px :151, กระดิ่ง 32px :239 + ถังขยะ 32px ที่ไม่ได้นับ) ไม่มี responsive hiding และ default view คือ list บนแท็บหลัก bottom-nav · ไม่ใช่ของตั้งใจ: มาตรฐาน tap≥44px เคาะไว้ใน PLAN.md:17 (iOS grammar), sweep ก่อนหน้าแก้เคสเดียวกันที่อื่นแล้ว (P2.2 stepper fat-finger fix), และ PLAN.md:236 มี "(option) watchlist review" ค้างไม่ติ๊ก — ส่วนคำตัดสิน "ไม่แตะ watchlist" ก่อนหน้าเป็นเรื่อง GroupedRow ไม่ใช่รับรองปุ่มจิ๋ว · recommendation ตรงทิศ proto iOS watchlist ที่เคาะแล้ว (pin/bell เป็นไอคอนสถานะ, แถว min-h-[60px] เป็น tap target, ไม่มี button cluster) และ desktop คงเดิมตามกฎ · จุดคลาดเคลื่อนเล็กน้อย: grid view cluster จริงอยู่บรรทัด 88-183 (ไม่ใช่ 94-155) และ CompareButton sm ไม่มีกล่อง size-7 (hit area ~14px เล็กกว่าที่รายงาน) — ไม่เปลี่ยนสาระ finding

### `TRACK-03` — bottom-nav + /watchlist + /saved
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** แนวคิด 'เก็บไว้ดูทีหลัง' ใช้ 3 สัญลักษณ์ 3 ชื่อ: แท็บ Bookmark ชื่อ 'รายการโปรด', ปุ่มบนการ์ดเป็นดาว, ส่วน listing ใช้หัวใจชื่อ 'รายการที่บันทึก' — ผู้ใช้ใหม่แยกไม่ออกว่า watchlist กับ saved ต่างกันยังไง และกดดาวแล้วของไปโผล่ที่แท็บ bookmark

**หลักฐาน:** bottom-nav.tsx:78 แท็บ Bookmark ป้าย th.ts:17 "รายการโปรด" · watchlist-star.tsx:89 ปุ่มบนการ์ด = Star amber · more-client.tsx:256-259 + header-user-menu.tsx:249 ใช้ Heart "รายการที่บันทึก" (ซ่อนหลัง marketplaceEnabled=false ทั้งคู่) · แต่ปุ่ม save listing จริง marketplace/[listingId]/save-button.tsx:41 และหน้า /saved (saved/page.tsx:110,128) ใช้ Bookmark — Bookmark จึงถูกใช้ทั้ง watchlist และ saved · เพิ่มเติม: desktop header.tsx:163 ใช้ Star amber (fill เมื่อ active) = Portfolio และ header.tsx:183 Bookmark น้ำเงิน = Watchlist → เปลี่ยนแท็บ watchlist เป็น Star ตาม recommendation เดิมจะชนความหมาย Star=Portfolio บน desktop ทันที

**วิธีแก้ที่เสนอ:** ล็อก 1 metaphor ต่อ 1 แนวคิด: watchlist = ดาว (เปลี่ยนไอคอนแท็บเป็น Star ให้ตรงกับปุ่มบนการ์ด) ส่วน saved listings คง Heart แต่เปลี่ยนป้ายเป็น 'ประกาศที่บันทึก' ให้ชัดว่าเป็นของ marketplace — ไม่ต้อง merge เพราะคนละ object (การ์ด vs ประกาศขาย) แต่ต้องตั้งชื่อให้เห็นความต่าง

**หมายเหตุจากทีม verify:** Evidence 3 จุดที่อ้างตรงโค้ดจริงทุกบรรทัด และปัญหา metaphor ชนกันมีจริง (Star บนการ์ด → ของโผล่แท็บ Bookmark ชื่อ "รายการโปรด" — live วันนี้) แต่ finding ไม่ครบจน recommendation ใช้ไม่ได้: (1) Heart ที่อ้างว่าเป็น icon ของ saved โผล่แค่ในเมนูที่ซ่อนหลัง marketplaceEnabled=false — touchpoint หลักของ saved (ปุ่ม save บน listing detail + หน้า /saved เอง) ใช้ Bookmark ทำให้ Bookmark double-booked ทั้ง watchlist+saved (2) ข้อเสนอ "เปลี่ยนแท็บ watchlist เป็น Star" ชนกับ desktop header ที่ Star amber = Portfolio อยู่แล้ว จะสร้าง collision ใหม่ข้าม platform ภายใต้ทิศ "desktop โครงเดิม" — ต้องเข้าแผนด้วย evidence ฉบับแก้ และเลือกทิศ unify ใหม่ (เช่น ล็อก Bookmark=watchlist ทั้งการ์ด+แท็บ แล้วหา icon อื่นให้ saved listings)

### `TRACK-04` — components/alerts
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** logic การ submit alert (ตรวจราคา, แปลงสกุลเงิน, จับ 401/403) ถูกก๊อปไว้ 3 ไฟล์เกือบบรรทัดต่อบรรทัด แก้กติกาทีต้องแก้ 3 ที่ และพฤติกรรมเริ่ม drift แล้ว: CardSetAlertDialog โชว์เครื่องหมายถูก 1.3 วิ + prefill ราคา แต่ AlertCreateDialog ปิดทันที + ช่องราคาว่าง

**หลักฐาน:** card-set-alert-dialog.tsx:88-131 = alert-create-dialog.tsx:69-108 = alert-edit-dialog.tsx:68-108 (validate + แปลง JPY + จับ 401 redirect + 403 เปิด upgrade เหมือนกัน 3 ชุด)

**วิธีแก้ที่เสนอ:** ดึงเป็น hook เดียว (เช่น useAlertSubmit) แล้วให้ CardSetAlertDialog เป็นแค่ AlertCreateDialog ที่ pre-pick การ์ดมาแล้ว พร้อมเลือกพฤติกรรม success/prefill แบบเดียวกันทุกทางเข้า

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว evidence แม่นทุก file:line — handleSubmit ซ้ำ 3 ไฟล์ตรงบรรทัดที่อ้างเป๊ะ (validate + displayValueToJpy + 401 redirect + 403 sniff "line" เปิด upgrade dialog) และ drift มีจริง: card-set มี setTimeout 1300ms โชว์เช็ค + prefill ราคาจาก currentPriceJpy ส่วน create ปิดทันที + target ว่างแม้การ์ดมี latestPriceJpy แล้ว ไม่มี hook กลางหรือ comment บอกว่าตั้งใจแยก (form UI แชร์ผ่าน AlertFormBody อยู่แล้ว แต่ submit logic ไม่ถูกดึงตาม) recommendation เป็น refactor โค้ดล้วน ไม่ขัดทิศดีไซน์ที่เคาะ แถม VISION.md บรรทัด 106 ระบุ Set Alert ต้อง pre-fill ราคา — unify จึงสอดทิศ vision ด้วย

### `TRACK-05` — /saved
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** โหลดหน้า /saved เจอ 2 ภาษา: skeleton ทรง list ที่ไม่ตรงกับ grid จริง แล้วตามด้วย spinner หมุนกลางจอ ซึ่งขัดกฎ VISION 'ศูนย์ spinner' ตรงๆ

**หลักฐาน:** saved/page.tsx:106 ใช้ LoadingState variant="spinner" ขณะที่ saved/loading.tsx:10-22 เป็น skeleton แบบ list rows แต่หน้าเว็บจริงเป็น grid การ์ด (page.tsx:139)

**วิธีแก้ที่เสนอ:** เปลี่ยน in-page loading เป็น skeleton ทรง grid การ์ด (aspect 3/4 + แถวข้อความ) แล้วแก้ loading.tsx ให้ทรงเดียวกัน

### `TRACK-06` — /saved
**🟠 MED** · ด้าน: ความสวยงาม · จอ: มือถือ · effort: **S**

**ปัญหา:** บนมือถือ /saved โชว์ทีละ 1 ใบเต็มจอ (รูป aspect 3/4 กว้างเต็ม) เห็นของครั้งละใบเดียว scroll ลึกผิดปกติ และไม่เหมือน grid การ์ด 2 คอลัมน์ที่ใช้ทุกหน้าอื่น

**หลักฐาน:** saved/page.tsx:139 — grid gap-4 sm:grid-cols-2 (มือถือ = 1 คอลัมน์) ขณะที่ card-grid.tsx:12 มาตรฐานแอปคือ grid-cols-2 ตั้งแต่ base

**วิธีแก้ที่เสนอ:** เริ่ม grid-cols-2 ตั้งแต่ base ตาม convention (sm:3 lg:3-4) รูปจะกระชับและ scan ง่ายขึ้นทันที

### `TRACK-07` — /saved
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า /saved เป็น client component ทั้ง route ต่างจาก pattern ของ watchlist (server page.tsx บางๆ + client แยก) ทำให้ตั้ง metadata/SEO ไม่ได้ และ data+presentation ปนกันแก้ยาก

**หลักฐาน:** saved/page.tsx:1 — "use client" ทั้ง route (257 บรรทัด: fetch + type + UI ในไฟล์เดียว, ไม่มี Metadata export)

**วิธีแก้ที่เสนอ:** แยกเป็น page.tsx (server, ใส่ metadata + breadcrumb) + saved-client.tsx ตามโครงเดียวกับ watchlist

### `TRACK-08` — /settings/alerts
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้าจัดการ alert เป็นฟีเจอร์กลุ่ม TRACK (คู่กับ watchlist/portfolio ตาม VISION §2) แต่ route ฝังอยู่ใต้ settings ทำให้บริบทเพี้ยน (sidebar settings ล้อมรอบ) และหน้า watchlist ที่สร้าง/โชว์สถานะ alert กลับไม่มีลิงก์ไปหน้านี้เลย

**หลักฐาน:** more-client.tsx:236-240 วาง 'จัดการแจ้งเตือนราคา' ในกลุ่ม TRACK แต่ href ชี้ /settings/alerts (อยู่ใต้ Settings shell + breadcrumb Home > Settings)

**วิธีแก้ที่เสนอ:** ย้ายเป็น /alerts ระดับบนสุด (301 จาก /settings/alerts) หรืออย่างน้อยเพิ่มลิงก์ 'จัดการแจ้งเตือน' จาก toolbar/summary ของ watchlist

### `TRACK-09` — /settings/alerts
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ลบ alert ใช้ window.confirm ของ browser (หน้าตา native, สไตล์คุมไม่ได้) ขณะที่ลบการ์ดใน watchlist ใช้ useConfirm dialog สวยตามระบบ (watchlist-client.tsx:250) — งานเดียวกันแต่คนละประสบการณ์

**หลักฐาน:** alerts-manager-client.tsx:142 — if (!window.confirm(t(lang, "deleteAlertConfirm"))) return;

**วิธีแก้ที่เสนอ:** เปลี่ยนมาใช้ useConfirm ตัวเดียวกับ watchlist (variant destructive)

### `TRACK-10` — /watchlist
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ผู้ใช้เห็น skeleton กระพริบ 2-3 ทรงไม่ตรงกับ layout จริง (route loading → auth-check skeleton → content skeleton ที่ยังวาด KPI 4 ช่องซึ่งไม่มีแล้ว) ขัดกฎ VISION §4.6 'skeleton รูปร่างตรงกับ layout จริง'

**หลักฐาน:** watchlist/loading.tsx:14-22 skeleton เป็น KPI grid 4 ช่อง ทั้งที่ watchlist-summary.tsx:13-15 ระบุว่า KPI grid ถูกแทนด้วย strip แล้ว; watchlist-client.tsx:362-378 มี skeleton ชุดที่สองอีกทรง

**วิธีแก้ที่เสนอ:** อัปเดต skeleton ทั้ง 2 จุดให้ตรงหน้าใหม่ (title + summary strip 1 บรรทัด + toolbar + list) และให้ client skeleton ใช้ component เดียวกับ loading.tsx จะได้ไม่ drift อีก

### `TRACK-11` — shared (watchlist-star + mock preview)
**🟠 MED** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ดาว watchlist ตอน active ใช้สี amber ของ Tailwind ไม่ใช่ honey-gold token (--primary #E9B970) ทำให้มี 'ทอง 2 เฉด' บนจอเดียว ขัดกฎ accent เดียว และ mock preview ใช้ green/red ดิบแทน --price-up/--price-down

**หลักฐาน:** watchlist-star.tsx:82 hardcode amber-400/amber-500 เป็นสี active; watchlist-mock-preview.tsx:36-38 ใช้ text-green-500/text-red-500

**วิธีแก้ที่เสนอ:** เปลี่ยน amber-* เป็น text-primary/bg-primary/10 ให้เข้าชุดกับ pin/bell ที่ใช้ primary อยู่แล้ว และแก้ preview เป็น token price-up/price-down

### `TRACK-12` — /watchlist
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: desktop · effort: **S**

**ปัญหา:** คอลัมน์ sparkline เปิดที่ xl: ซึ่ง AGENTS.md สงวนไว้ให้ marketplace grid เท่านั้น — ตามวินัย breakpoint ของ polish เสริมต้องเป็น lg:

**หลักฐาน:** watchlist-list-view.tsx:214 — hidden w-[120px] shrink-0 xl:block (คอลัมน์ sparkline)

**วิธีแก้ที่เสนอ:** เปลี่ยน xl:block เป็น lg:block (จอ 1024-1280 จะได้เห็นกราฟด้วย)

### `TRACK-13` — /watchlist (grid view)
**🔵 LOW** · ด้าน: a11y · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** checkbox เลือกการ์ดทีละใบแต่ tooltip/label บอกว่า 'เลือกทั้งหมด' — ข้อมูลผิดสำหรับทั้ง screen reader และ tooltip

**หลักฐาน:** watchlist-grid-view.tsx:96 — label ของ checkbox รายใบใช้ title={t(lang, "selectAll")}

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น key แบบ 'เลือกการ์ดนี้' (มี aria-label={displayName} อยู่แล้ว title ควรสอดคล้องกัน)

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่มีหน้าไหนต้องรื้อทั้งหน้า แต่ 2 จุดควร re-compose บางส่วน: (1) แถว watchlist บนมือถือ — เปลี่ยนจาก "ปุ่มจิ๋ว 5 ตัวเรียงในแถว" เป็น iOS grammar: แถว = รูป + ชื่อ + ราคา/Δ เท่านั้น, การกระทำย้ายไป swipe action (ปักหมุด/ลบ) + long-press หรือปุ่ม "เลือก" ใน toolbar สำหรับ bulk, กระดิ่งคงไว้ตัวเดียวขนาด ≥44px · desktop คง layout เดิม (2) /saved — คงเป็นหน้าแยกได้เพราะเป็น "ประกาศขายที่บันทึก" (คนละ object กับ watchlist) แต่ตอน marketplace เปิด flag กลับมา ควรย้ายเข้าเป็น sub-tab ใน Marketplace hub (Buy·Sell·Orders·Saved) ตาม VISION §2 แทนที่จะเป็น route เดี่ยวใต้ My Account

---

<a id="honey"></a>
## HONEY — Honey gamification + pricing

**ขอบเขตที่ตรวจ:** /honey (missions·activity·achievements·shop·raffle·rankings·referral) · /pricing · /raffle/winners · home honey-preview widget · src/components/honey/mission-tracker · src/components/kuma/kuma-empty-state

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- _shared kit ของ /honey (SectionHeader/HeaderPill/FilterTabs/BonusRow/RewardChips/ClaimAction) ทำให้ 7 tabs ประกอบจาก atom ชุดเดียวกันจริง — ลด duplication ภายในหน้าได้ดี
- a11y ของ tab ทำถูกต้อง: role=tab/tabpanel + aria-controls/aria-selected + hidden panel (honey-client.tsx:160-170)
- use-honey-data รวม fetch 8 endpoint ด้วย Promise.all ไว้ hook เดียว ทุก tab เป็น presentational ล้วน — แก้ UI ได้โดยไม่แตะ data
- /raffle/winners สม่ำเสมอมาก: ISR 3600s, ใช้ PageHeader/Surface/token ตรง convention, deep-link #raffle-id มี scroll-mt-24 รองรับ

### `HONEY-01` — /honey
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** nav มือถือของ honey ยังเป็น 7 แท็บไอคอนล้วนเลื่อนแนวนอน (ตาม backlog เก่า — ยังไม่ถูกแก้) ผู้ใช้ใหม่เดาไม่ออกว่าไอคอนไหนคือร้านค้า/จับรางวัล/แนะนำเพื่อน และกลุ่ม Earn/Rewards/Community ที่มีบน desktop หายหมด

**หลักฐาน:** src/app/honey/components/honey-tab-nav.tsx:159 label ครอบ hidden sm:inline → ใต้ 640px เหลือไอคอนล้วน 7 ปุ่ม + overflow-x-auto (:137) มีแค่ title attr ซึ่งไม่ช่วยบนจอสัมผัส

**วิธีแก้ที่เสนอ:** ใส่ label ใต้/ข้างไอคอนเสมอ (icon+text chip) หรือยุบเป็น segmented 3 กลุ่มตาม GROUPS เดิม และย้ายจุด flip sidebar จาก lg: มา md: ตาม convention chrome boundary

**หมายเหตุจากทีม verify:** Evidence ตรงกับโค้ดปัจจุบันทุกบรรทัด (:137 overflow-x-auto, :150 title attr, :159 hidden sm:inline, 7 items, กลุ่ม 3 หมวดอยู่หลัง hidden lg:block) และโปรเจคเองบันทึกเป็นหนี้ค้างไว้แล้วที่ PLAN.md:273 "Honey nav มือถือ: 7 แท็บไอคอนล้วนไม่มี label + scroll แนวนอน (→ P5)" — ป้าย P5 เก่าเลิกใช้แล้วทำให้ item นี้ลอยไร้เจ้าของเฟส = ยังไม่ถูกแก้จริง ไม่ใช่ของตั้งใจ · recommendation หลัก (label เสมอ / segmented ตาม GROUPS) สอดคล้องทิศ iOS grammar และ doc/archive/REDESIGN.md:170 ที่เคาะ honey มือถือเป็น Today+accordion · ข้อแม้เดียว: ส่วน "ย้าย flip lg:→md: ตาม convention" ไม่ใช่ violation บังคับ เพราะช่วง sm–lg มี tab bar แบบ icon+label ใช้งานได้ (lg: sidebar เข้าข่าย optional polish ตาม AGENTS.md) — ให้ถือเป็น optional ไม่ใช่เหตุผลหลักของ task

### `HONEY-02` — /honey
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ไฟล์ orphan 2 ไฟล์รวม ~560 บรรทัดใน honey/components ยังหน้าตาเหมือน component จริง (ดีไซน์ mission แบบ tile เก่า) — agent/คนที่มาแก้ทีหลังเสี่ยงแก้ผิดไฟล์หรือลอก pattern ที่เลิกใช้แล้ว

**หลักฐาน:** honey-hero.tsx (108 บรรทัด) และ daily-missions-card.tsx (452 บรรทัด) ไม่มี import จากไฟล์ใดใน src (ยืนยันด้วย grep ทั้ง repo)

**วิธีแก้ที่เสนอ:** ลบ honey-hero.tsx และ daily-missions-card.tsx ทิ้ง (MobileStreakRankRow ข้างในตายตามไปด้วย) — ของจริงคือ streak-card + today-missions-card แล้ว

**หมายเหตุจากทีม verify:** ตรวจกับโค้ดจริงแล้วตรงทุกจุด: honey-hero.tsx 108 บรรทัด + daily-missions-card.tsx 452 บรรทัด ใน src/app/honey/components/ ไม่มี import จากที่ไหนเลย (grep ทั้ง src+scripts, ไม่มี dynamic import/barrel) MobileStreakRankRow ใช้ภายในไฟล์เดียว ของจริงคือ streak-card + today-missions-card ผ่าน barrel today-card.tsx → missions-tab.tsx ตามที่อ้าง และความเสี่ยง "แก้ผิดไฟล์" เกิดจริงแล้ว — sweep commits ล่าสุด (2d10cc0, c8d597c, b62c15f, 204b148) เสียแรงแก้ไฟล์ตายสองไฟล์นี้ซ้ำทุกรอบ การลบไม่แตะ UI จึงไม่ขัดทิศดีไซน์ใดๆ (แค่ตอนลงมือจริงต้องขอ permission ลบไฟล์ตาม AGENTS.md)

### `HONEY-03` — /honey + home widget
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ตัวเลข reward ของ streak (10/20/30 ที่วัน 1/7/30) hardcode ซ้ำใน UI อย่างน้อย 5 จุด + มี popover อธิบาย streak 3 implementation แยกกัน (StreakGuideContent, streak-info-popover แบบ hand-rolled portal, StreakInfoPopover ใน streak-tier-indicator) — ถ้าปรับ reward ฝั่ง server จอจะโชว์เลขผิดหลายจุด

**หลักฐาน:** ตาราง/ค่า streak 10/20/30 hardcode ใน UI 6 จุด: honey-sidebar.tsx:24-34 (STREAK_TIERS + getStreakReward), streak-tier-indicator.tsx:8-18 (STREAK_TIERS ซ้ำ), streak-card.tsx:15-18 (getStreakPts) + literal +20/+30 บรรทัด 41,58, honey-preview.tsx:122, streak-info-popover.tsx:23-25 — ต้นทางจริงฝั่ง server ไม่ใช่เลข 10/20/30 อีกแล้ว: สูตร = HONEY_REWARDS.CHECKIN=5 (lib/honey/index.ts:60) × getStreakMultiplier 1/2/3 (index.ts:171-175, ถูก export อยู่แล้วที่ :586) × tier honeyMultiplier 1/2/3 (lib/billing/limits.ts:92,110,128) × seasonal → FREE ได้จริง 5/10/15 · drift เกิดแล้ว: commit c094778 เปลี่ยน CHECKIN 10→5 โดย UI ไม่ถูกอัปเดตตาม · popover 3 implementation ยืนยัน: StreakGuideContent (honey-sidebar.tsx:146), hand-rolled createPortal (streak-info-popover.tsx:45), @base-ui Popover (streak-tier-indicator.tsx:116)

**วิธีแก้ที่เสนอ:** export STREAK_TIERS + getStreakReward จาก src/lib/honey เป็น single source แล้วให้ทุก UI import และเหลือ StreakInfoPopover ตัวเดียว (ตัวที่ใช้ @base-ui popover) ใช้ร่วมกัน

**หมายเหตุจากทีม verify:** ปัญหาจริงและหนักกว่าที่รายงาน — ไม่ใช่แค่ risk อนาคต: commit c094778 ลดฐาน CHECKIN จาก 10→5 ไปแล้วแต่ UI ทุกจุดยังโชว์เลขชุดเก่า 10/20/30 ขณะที่ผู้ใช้ FREE ได้จริง 5/10/15 = จอโชว์เลขผิดอยู่วันนี้ · file:line ที่อ้างตรงจริงทุกจุด + popover 3 implementation จริง แต่ "ต้นทาง index.ts:172" ระบุไม่ครบ (นั่นคือ multiplier ไม่ใช่แต้ม 10/20/30) · recommendation ไม่ขัดทิศที่เคาะ (refactor ภายใน ไม่แตะ layout) แต่ต้องเพิ่ม decision ว่าจะโชว์เลขฐาน FREE (5/10/15) หรือเลข personalized ตาม tier ผู้ใช้

### `HONEY-04` — /pricing → /honey
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ปุ่ม "จ่ายด้วย Honey" ในหน้า pricing ลิงก์ไป /honey?tab=shop แต่หน้า honey ไม่อ่าน query param — ผู้ใช้ตกที่แท็บภารกิจแทนร้านค้า funnel ขาย Pro ผ่าน Honey ขาดกลางทาง และ sub-tab ทั้ง 7 แชร์ลิงก์/กด back ไม่ได้เลย

**หลักฐาน:** src/app/pricing/pricing-client.tsx:332 Link href="/honey?tab=shop" แต่ honey-client.tsx:71 ใช้ useState("missions") ไม่อ่าน query เลย

**วิธีแก้ที่เสนอ:** sync tab state กับ URL (?tab= ผ่าน useSearchParams + router.replace) ให้ deep-link ทำงานและ back button สลับแท็บได้ แก้จุดเดียวได้ทั้งสองปัญหา

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้วตรงทุกจุด: pricing-client.tsx:332 ลิงก์ /honey?tab=shop จริง, honey-client.tsx:71 hardcode useState("missions") จริง และไม่มีทางหนี — page.tsx ไม่อ่าน searchParams, HoneyClient ไม่รับ prop, honey-tab-nav ไม่แตะ URL เลย query param ตายสนิท เป็นลิงก์เดียวใน repo ที่ชี้ ?tab= แปลว่าฝั่ง pricing ตั้งใจ deep-link แต่ฝั่ง honey ไม่รองรับ = bug จริงไม่ใช่ตั้งใจ recommendation ไม่ขัดทิศใดที่เคาะ (ไม่เพิ่ม prominence honey แค่ทำลิงก์เดิมให้ทำงาน) หมายเหตุตอนแก้: useSearchParams ใน Next 16 ต้องครอบ Suspense boundary

### `HONEY-05` — /honey
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ไฟล์ใหญ่ตาม backlog เดิมยังไม่ถูกแตก แถมชื่อไฟล์หลอก (sidebar ทั้งที่เป็น status bar ด้านบน) — หาโค้ดยาก แก้ยาก

**หลักฐาน:** honey-sidebar.tsx 505 บรรทัด แต่ export HoneyStatusBar (ไม่ใช่ sidebar) — รวม stat card 4 ใบ + guide content 3 ชุด + RankProgress ที่ render ซ้ำ 2 ที่ (:471, :492)

**วิธีแก้ที่เสนอ:** rename เป็น honey-status-bar.tsx แล้วแตกเป็น stat-card.tsx / rank-progress.tsx / guide-contents.tsx โดยไม่เปลี่ยน behavior

### `HONEY-06` — /honey
**🟠 MED** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** VISION §1 บอก PLAY surface ต้อง "มีพลัง spring delight" และ §4 บอกทุกจอควรมี hero number 1 ตัว — ตอนนี้ /honey จืดเท่า (หรือจืดกว่า) MONEY surface: stat 4 ใบน้ำหนักเท่ากันหมด ไม่มีตัวเอก ไม่มี count-up/.rise ไม่มีหมี Kuma ทั้งที่เป็นหน้า gamification

**หลักฐาน:** honey-sidebar.tsx:186 comment "cards intentionally share visual weight so they sit as a quiet status strip" — ทั้งหน้าไม่มี .text-display เลย (ยอด Honey ใช้แค่ text-h1 :226) motion มีแต่ motion-base

**วิธีแก้ที่เสนอ:** ยกยอด Honey เป็น hero ตัวเดียว (.text-display + count-up ตอนเคลม) ส่วนตั๋ว/streak/rank ลดเป็นแถวรอง และใช้ spring motion (--motion-play) กับ moment เคลมรางวัล/เช็คอิน

### `HONEY-07` — /honey (login gate)
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** preview สำหรับคนยังไม่ login เป็นสำเนา hand-drawn 284 บรรทัดของ status bar + nav ซึ่ง diverge จากของจริงไปแล้ว — ผู้ใช้เห็นหน้า mock สีสันแบบหนึ่ง login แล้วเจออีกแบบ และต้องแก้ 2 ที่ทุกครั้งที่ redesign

**หลักฐาน:** honey-mock-preview.tsx:26-52 MOCK_NAV_GROUPS ก๊อป GROUPS จาก honey-tab-nav.tsx:23; :61-98 การ์ด mock มี tint amber/blue/orange ที่ของจริง (HoneyStatCard) ไม่มีแล้ว

**วิธีแก้ที่เสนอ:** ให้ mock ใช้ component จริง (HoneyStatusBar/HoneyTabNav) ป้อน mock data แทนการวาดใหม่ หรืออย่างน้อย import GROUPS ตัวเดียวกัน

### `HONEY-08` — /honey (ทุก tab)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** VISION §1 สงวนเขียว/แดงไว้แค่กำไร/ขาดทุน แต่ทั้ง area honey ใช้ --price-up เป็นสีสถานะ "ทำเสร็จ" อย่างเป็นระบบ (แถม activity ใช้ price-up คู่กับ text-destructive ซึ่งเป็นคนละ semantic family) — เจือจางความหมายของสีเขียวในหน้า portfolio/market

**หลักฐาน:** mission-card.tsx:37, activity-tab.tsx:142, achievements-tab.tsx:99,127, streak-card.tsx:269 (ผ่าน bg-price-up) ใช้ text-price-up กับสถานะ "เคลมแล้ว/สำเร็จ"

**วิธีแก้ที่เสนอ:** เปลี่ยนสถานะ claimed/done เป็น primary (honey) หรือ muted+checkmark และให้รายการหักลบใน activity ใช้ muted แทน destructive

### `HONEY-09` — /honey raffle + /raffle/winners
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** สี accent ต่อตู้จับรางวัล (admin กรอก hex อะไรก็ได้) ถูกเอามาทาปุ่ม CTA หลักและหัวข้อการ์ดตรงๆ — ชนกฎ honey = accent interactive เดียว และเสี่ยงได้ปุ่มแดง/เขียวที่ชนความหมาย gain/loss รวมถึง contrast ไม่การันตี

**หลักฐาน:** raffle-tab.tsx:412,476 style={{backgroundColor: accent}} ทับปุ่ม CTA และ :317 ทาสีชื่อการ์ดตาม machine.color (winners-list.tsx:156,177 ก็ตาม)

**วิธีแก้ที่เสนอ:** จำกัด machine.color ไว้แค่ decorative layer (แถบ border-top หรือ tint พื้นรูป) ตามแบบ winners-list:156 ส่วนปุ่มและหัวข้อคง token ปกติ

### `HONEY-10` — /pricing
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า pricing ไม่ได้ "ขาย" แผนไหนเลย — การ์ด 3 ใบน้ำหนักแทบเท่ากัน Pro ต่างแค่ border-foreground/30 บางๆ, badge 2 อันสไตล์เดียวกันแย่งกันเอง, CTA ทุกแผนสีเดียวกัน ผู้ใช้ไม่รู้ว่าระบบแนะนำอะไร

**หลักฐาน:** lib/billing/plans.ts:239,254 ctaClass ของ PRO/PRO_PLUS เหมือนกันเป๊ะ; badge "Most Popular" (pricing-client.tsx:181) กับ badge Pro+ (plans.ts:247) เป็น bg-foreground นิวทรัลคู่กัน

**วิธีแก้ที่เสนอ:** ให้ Pro เป็นแผนแนะนำเดียว: badge honey-gold + CTA เด่นเฉพาะ Pro (แผนอื่นใช้ outline) ตามหลัก honey = accent เดียวของ action หลัก

### `HONEY-11` — /pricing
**🟠 MED** · ด้าน: ความสวยงาม · จอ: desktop · effort: **S**

**ปัญหา:** หัวคอลัมน์ตารางเทียบ feature ตั้งใจให้ sticky แต่จะเลื่อนไปซ่อนใต้ header หลักของเว็บ — ตาราง ~20 แถว scroll ลงไปแล้วไม่รู้ว่าคอลัมน์ไหนคือ Pro/Pro+

**หลักฐาน:** pricing-client.tsx:398,402 th sticky top-0 z-10 แต่ site header ก็ sticky top-0 z-50 (header.tsx:96)

**วิธีแก้ที่เสนอ:** ตั้ง top ของ th เป็นความสูง header (เช่น top-16) หรือใช้ scroll-margin/sticky ภายใน container ของตารางเอง

### `HONEY-12` — /pricing
**🟠 MED** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** ตารางเทียบบนมือถือกลายเป็น list ยาว 3 ชุดต่อกัน — เทียบข้ามแผนไม่ได้เลย (ต้อง scroll จำค่า) และ scroll depth ยาวมากก่อนถึง FAQ

**หลักฐาน:** pricing-client.tsx:351-390 มือถือ render การ์ด 3 ใบเรียงลง แต่ละใบ list feature ครบทุก section (~20 แถว × 3 แผน)

**วิธีแก้ที่เสนอ:** ใช้ segmented switcher (FREE|PRO|PRO+) sticky ด้านบนแล้วโชว์ list ชุดเดียว หรือแถวละ feature + ค่า 3 คอลัมน์แบบย่อ (icon check) ให้เทียบในจอเดียว

### `HONEY-13` — /honey (filter strips)
**🔵 LOW** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** FilterTabs ที่ใช้ทั่วหน้า honey สูงราว 30px ต่ำกว่ามาตรฐาน tap target ≥44px ของทิศ iOS ที่เคาะไว้ — กดพลาดง่ายบนมือถือ

**หลักฐาน:** filter-tabs.tsx:41 ปุ่ม px-3 py-1.5 text-xs → สูง ~30px ใช้ใน 4 tabs (shop/activity/rankings/achievements)

**วิธีแก้ที่เสนอ:** เพิ่ม min-height เป็น ~40-44px บน base (mobile) แล้วค่อยลดที่ sm:+ ถ้าอยากคง density บน desktop

### `HONEY-14` — /honey rankings
**🔵 LOW** · ด้าน: UX · จอ: desktop · effort: **S**

**ปัญหา:** หัวตาราง leaderboard คอลัมน์ชื่อผู้ใช้ขึ้นว่า "ไม่ระบุชื่อ/Anonymous" เพราะ reuse translation key ผิดตัว — อ่านแล้วงงว่าคอลัมน์นี้คืออะไร

**หลักฐาน:** rankings-tab.tsx:98 <th>{t(lang, "anonymous")}</th> ใช้เป็นหัวคอลัมน์ชื่อผู้เล่น และ :100 ใช้ t("days") เป็นหัวคอลัมน์ streak

**วิธีแก้ที่เสนอ:** เพิ่ม key เฉพาะ เช่น leaderboardPlayer / leaderboardStreak แล้วใช้แทน

### 🧩 ข้อเสนอ re-compose ของ area นี้
/honey (mobile) ควร re-compose เบาๆ: (1) hero โซนเดียว — ยอด Honey เป็น .text-display + ปุ่มเช็คอินติดกัน (ritual หลักรายวันอยู่บนสุด ไม่ต้องผ่าน stat 4 ใบ) (2) ตั๋ว/streak/rank ยุบเป็น list row 3 แถวใต้ hero (แตะแล้วเปิด popover เดิม) (3) nav เป็น chip icon+label เลื่อนได้ หรือ segmented 3 กลุ่ม Earn·Rewards·Community แล้ว sync ?tab= ใน URL — desktop คงโครง sidebar เดิมแต่ flip ที่ md: · /pricing (mobile) เปลี่ยนส่วน compare จาก stack 3 การ์ด → sticky segmented FREE|PRO|PRO+ + feature list ชุดเดียว

---

<a id="play"></a>
## PLAY — Decks hub + calculators

**ขอบเขตที่ตรวจ:** /decks · /drop-calculator · /deck-calculator

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- Drop calculator ทำตาม atom kit ครบสุดใน area นี้: PageHeader + Surface panel + typography token (text-h3/eyebrow/meta/body-sm) + empty state มี CTA เลือกเซ็ต + mobile tabs / desktop 2-col ถูก breakpoint discipline (drop-calculator-client.tsx:206-357)
- /decks hub วางลำดับ tile คงที่ตั้งใจ — เปิดฟีเจอร์ใหม่แค่ flip disabled โดย layout ไม่ขยับ ตรงกับ VISION §5.4 (decks/page.tsx:26-27)
- Breadcrumb ตัวเดียวจัดการทั้ง desktop trail และ mobile back-circle พร้อมเหตุผลกำกับใน comment ชัดเจน (breadcrumb.tsx:30-42)
- API decks สะอาดตาม AGENTS: apiHandler + Zod parseJsonBody + prisma $transaction (api/decks/[id]/route.ts:52-85)

### `PLAY-01` — /deck-calculator
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ตั้งจำนวนการ์ดเกิน x1 ไม่ได้เลย — UI ส่ง quantity:1 ตายตัว และเพิ่มใบเดิมซ้ำ server ก็ reset กลับเป็น 1 ทั้งที่เด็ค OPTCG ใช้ 4 ใบ/ชื่อ แถม dialog ปิดตัวเองทุกครั้งที่เพิ่ม = สร้างเด็ค 50 ใบต้องเปิด modal ค้นหาซ้ำหลายสิบรอบ

**หลักฐาน:** deck-calculator-client.tsx:123 ส่ง quantity:1 เสมอ + :130 setDialogOpen(false) หลัง add ทุกครั้ง · api/decks/[id]/route.ts:81 upsert update:{quantity: c.quantity ?? 1}

**วิธีแก้ที่เสนอ:** เพิ่ม QtyStepper (≥44px, 1-4) ในแถวการ์ดแล้วส่ง quantity จริงไปที่ PATCH ที่รองรับอยู่แล้ว และไม่ปิด dialog หลัง add (เพิ่มรัวๆ ได้ตาม VISION §5.4 ฆ่า modal-per-add)

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว evidence ตรงทุกบรรทัด: client ส่ง quantity:1 ตายตัว (บรรทัด 123), dialog ปิดทุกครั้งหลัง add (บรรทัด 130 อยู่นอก try/catch), server upsert reset quantity เป็น 1 เมื่อเพิ่มใบเดิมซ้ำ (route.ts:81) และไม่มี UI ปรับจำนวนที่ไหนเลย — ทั้งที่ UpdateDeckSchema รองรับ quantity 1-99 อยู่แล้ว และ DeckMockPreview ในไฟล์เดียวกันโชว์ mock qty:4 พิสูจน์ว่าดีไซน์ตั้งใจให้มีหลายใบแต่ทำจริงไม่ได้ ส่วน recommendation (QtyStepper ≥44px + ไม่ปิด dialog) ตรงกับ VISION.md §5.4 ที่เขียน "ฆ่า modal-per-add" + "QtyStepper ≥44px 4-copy aware" ไว้ตรงตัว — จริง คุ้มแก้ ไม่ขัดทิศ

### `PLAY-02` — /deck-calculator
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ปุ่มลบเด็คทั้งใบยิง DELETE ทันทีแตะเดียว ไม่มี confirm ใดๆ — ลบแล้วกู้คืนไม่ได้ และปุ่มอยู่บนหัวหน้าติดกับ counter เผลอแตะง่ายบนมือถือ

**หลักฐาน:** deck-calculator-client.tsx:257-263 Button variant=destructive onClick={() => void deleteDeck(activeDeck.id)}

**วิธีแก้ที่เสนอ:** ใส่ confirm dialog/sheet ก่อนลบ (ชื่อเด็ค + จำนวนการ์ด + ปุ่มยืนยันแดง) — pattern เดียวกับ destructive action อื่นในแอป

**หมายเหตุจากทีม verify:** Evidence ตรงเป๊ะ (deck-calculator-client.tsx:257-263 ปุ่ม destructive ยิง deleteDeck ตรง ไม่มี confirm, ฟังก์ชันที่บรรทัด 147-155 เรียก apiDelete ทันที) และ API เป็น prisma.deck.delete hard delete กู้ไม่ได้จริง ที่สำคัญแอปมี useConfirm pattern (src/components/shared/confirm-dialog.tsx) ใช้กับ destructive action อื่นทั่วแอปแล้ว (watchlist, portfolio, transactions, alerts) — deck-calculator เป็นจุดเดียวที่ลบทั้งเด็คโดยไม่ถาม จึงเป็นความไม่สม่ำเสมอ ไม่ใช่ของตั้งใจ recommendation ไม่ขัดทิศใดที่เคาะไว้ effort S สมจริงเพราะ infrastructure พร้อมอยู่แล้ว

### `PLAY-03` — /deck-calculator
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ทั้งไฟล์ยังเป็นโค้ดก่อน redesign: หัวข้อใช้ text-sm font-semibold แทน token (.text-h5/.text-label) มี text-sm+text-muted-foreground stack ทั่วไฟล์ และผลรวมราคาใช้ Surface outline + text-lg ธรรมดา ขณะที่ drop-calculator พี่น้องกันใช้ panel + text-display hero — สองเครื่องคิดเลขหน้าตาคนละยุค

**หลักฐาน:** deck-calculator-client.tsx:276,:313 <h3 className="text-sm font-semibold"> แทน token · :269 text-muted-foreground text-sm font-medium · :239 pill สลับเด็ค template-string เอง (ไม่ใช้ segmented pattern แบบ purchase-config.tsx:101-116) · ผลรวม :267-272 ใช้ Surface variant="outline" + PriceDisplay size="lg" (=text-3xl font-semibold ไม่ใช่ .text-display) ขณะ drop-calculator ใช้ Surface variant="panel" + .text-display hero (want-list.tsx:105-107) · DeckMockPreview :414-484 ก๊อป markup เก่าชุดเดียวกัน (:447,:448 text-lg,:454,:467) · หมายเหตุ: ไฟล์ migrate บางส่วนแล้ว (text-h3 :254, text-meta :216) — เหลือเก็บตกไม่ใช่ทั้งไฟล์

**วิธีแก้ที่เสนอ:** Migrate เป็น token/kit เดียวกับ drop-calculator: หัวข้อ→.text-h5, meta→.text-meta, ผลรวม→hero number (.text-display ตัวเดียวของหน้า), pill สลับเด็ค→segmented pattern เดียวกับ unit toggle (แก้ทั้งตัวจริงและ DeckMockPreview ที่ก๊อป markup ชุดเดียวกันไว้ที่ :414-484)

**หมายเหตุจากทีม verify:** ปัญหาจริง — line cites หลัก (:276/:269/:239/:414-484) ตรงโค้ดปัจจุบันทุกจุด และ drop-calculator ใช้ panel+text-eyebrow+text-display hero จริง ขัดกับ AGENTS.md typography rules ชัด ไม่ใช่ของตั้งใจ (ไฟล์ migrate ครึ่งเดียว: มี text-h3/text-meta ปนกับ stack เก่า) · แต่รายละเอียดใน issue ผิด 2 จุด: (1) ผลรวมตัวจริงใช้ PriceDisplay size="lg" = text-3xl font-semibold ไม่ใช่ "text-lg ธรรมดา" — text-lg มีแค่ใน DeckMockPreview :448 (2) "ทั้งไฟล์ก่อน redesign" เว่อร์ไป · recommendation ไม่ขัดทิศ (VISION:59 ระบุ deck cost เป็น HeroNumber use case ตรงๆ) แต่ควรจัดคิวโดยรู้ว่า VISION §5.4 จะ rebuild deck editor ทั้งหน้าอยู่แล้ว (PLAY อยู่ท้าย spine) — งานนี้เป็น interim polish · severity ควรลดจาก high เพราะจุดที่อ่อนจริงเบากว่าที่เคลม

### `PLAY-04` — /deck-calculator
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** loadDecks ผูก dependency กับ activeDeck ทำให้ทุกครั้งที่ผู้ใช้สลับเด็ค effect รีรันแล้ว fetch /api/decks ใหม่ทั้งลิสต์โดยไม่จำเป็น (state ก็ sync ผ่าน setDecks map อยู่แล้ว) — ช้าและ re-render ฟรี

**หลักฐาน:** deck-calculator-client.tsx:96 loadDecks deps [activeDeck, lang] + :98-101 useEffect([loadDecks]) รีรันทุกครั้งที่ identity เปลี่ยน

**วิธีแก้ที่เสนอ:** ให้โหลดลิสต์ครั้งเดียวตอน mount (แยก "เลือกเด็คแรก" ออกจาก callback ด้วย functional set หรือ ref) แล้วตัด activeDeck ออกจาก deps

### `PLAY-05` — /decks
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า hub เป็น client component ทั้งไฟล์ ทำให้ export metadata ไม่ได้ — ไม่มี title/canonical/JsonLd ต่างจาก calculator ทั้งสองหน้า และ h1 เขียนเองทำให้มือถือไม่ได้ large-title (34px) แบบหน้าอื่นที่ใช้ PageHeader

**หลักฐาน:** decks/page.tsx:1 "use client" ทั้ง page.tsx · :84 hand-rolled <h1 className="text-h1"> ไม่ผ่าน PageHeader

**วิธีแก้ที่เสนอ:** แยกเป็น server page.tsx (metadata + JsonLd) + decks-client.tsx แล้วเปลี่ยน h1 ไปใช้ PageHeader ให้ได้ mobile large-title เหมือนพี่น้อง

### `PLAY-06` — /decks
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้ามี coming-soon ซ้ำ 2 โซน — ครึ่งหน้าเป็นของที่ใช้ไม่ได้ และ "เด็คของฉัน = เร็วๆ นี้" ขัดความจริงที่ผู้ใช้สร้างเด็คได้แล้วใน /deck-calculator ทำให้คนใหม่งงว่าเด็คตัวเองอยู่ไหน

**หลักฐาน:** decks/page.tsx:32-34 disabled tiles 3 อัน (comingSoon) + :101-106 section myDecks เป็นกล่อง dashed เขียน comingSoon อีกที่

**วิธีแก้ที่เสนอ:** คง disabled tiles 3 อันไว้ตาม VISION §5.4 แต่ตัด section เด็คของฉัน dashed ออก — ถ้ามีเด็คจริงให้ลิสต์เด็คจาก /api/decks พร้อมลิงก์ไป deck-calculator แทน (empty ก็ให้ CTA "สร้างเด็คแรก" ชี้ไปที่เดียวกัน)

### `PLAY-07` — /drop-calculator
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** PurchaseConfig มี compact mode เป็น dead code ทั้ง branch และ stepper +/- markup ถูกก๊อปซ้ำ 2 ชุดในไฟล์เดียว (compact/full) ทั้งที่ VISION กำหนดให้ QtyStepper เป็น shared atom ที่ deck-calculator ก็ต้องใช้

**หลักฐาน:** purchase-config.tsx:20,32 branch compact ~50 บรรทัด — grep ทั้ง src ไม่มี caller ส่ง compact เลย

**วิธีแก้ที่เสนอ:** ลบ branch compact ทิ้ง แล้ว extract stepper เป็น QtyStepper component กลาง (src/components/shared/) ให้ทั้งสองเครื่องคิดเลขใช้ตัวเดียวกัน

### `PLAY-08` — /drop-calculator
**🟠 MED** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** Tap target หลายจุดต่ำกว่ากฎ ≥44px ที่เคาะไว้สำหรับมือถือ — ปุ่ม stepper 36px, ปุ่มลบการ์ดใน want list ~26px, rarity filter chips ~26px กดพลาดง่ายบนจอเล็ก

**หลักฐาน:** purchase-config.tsx:120,137 ปุ่ม +/- size-9 (36px) · want-list.tsx:94 ปุ่มลบ p-1.5+icon 3.5 (~26px) · card-picker.tsx:64 rarity chip py-1 text-xs (~26px สูง)

**วิธีแก้ที่เสนอ:** ขยาย hit area เป็น ≥44px บนมือถือ (ตัวไอคอนคงเดิมได้ ใช้ padding/min-h) — จุดเดียวถ้าทำ QtyStepper กลางตามข้อก่อนหน้าก็แก้พร้อมกัน

### `PLAY-09` — /drop-calculator
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** สีเขียว price-up และแดง destructive ถูกยืมมาแสดง % โอกาสดรอป ทั้งที่ VISION §1 สงวนเขียว/แดงไว้เฉพาะกำไร/ขาดทุน — token ชุด chance ทำครึ่งเดียว (มีแค่ --chance-mid)

**หลักฐาน:** want-list.tsx:90,108,117 chance>=0.5 ? "text-price-up" : ... : "text-destructive" (มี --chance-mid ใน globals.css:139 แต่ไม่มี chance-high/low)

**วิธีแก้ที่เสนอ:** เพิ่ม semantic token --chance-high/--chance-low ใน globals.css (โทนแยกจาก price-up/down) แล้วเปลี่ยน want-list ให้อ้าง token ชุด chance ล้วน

### `PLAY-10` — /drop-calculator
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** JSX ฝั่ง mobile และ desktop ซ้ำกันทั้งบล็อก (~40 บรรทัด × 2) — เพิ่ม prop หรือแก้ WantList หนึ่งครั้งต้องตามแก้สองที่ พลาดง่าย

**หลักฐาน:** drop-calculator-client.tsx:271-310 (mobile tabs) กับ :318-355 (desktop 2-col) — CardPicker 9 props + PurchaseConfig + WantList ก๊อปซ้ำสองชุดเต็มๆ

**วิธีแก้ที่เสนอ:** Extract เป็น local subcomponent 2 ตัว (PickerPane / ResultsPane) แล้วให้ mobile tabs กับ desktop grid เรียกตัวเดียวกัน

### `PLAY-11` — /drop-calculator
**🔵 LOW** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** บนมือถือ เลือกการ์ดแล้วไม่เห็น % สดเลย ต้องรู้เองว่าให้สลับไป tab ผลลัพธ์ — first-time user อาจเลือกเสร็จแล้วค้างอยู่หน้าเดิม

**หลักฐาน:** drop-calculator-client.tsx:249-265 tab ผลลัพธ์มีแค่ badge ตัวเลข — ไม่มี sticky CTA/summary ตอนอยู่ tab เลือกการ์ด

**วิธีแก้ที่เสนอ:** เพิ่ม sticky bottom bar ตอนอยู่ tab เลือกการ์ดและมีของใน want list ("N ใบ · โอกาส X% → ดูผลลัพธ์") กดแล้วสลับ tab — ตรง grammar sticky-bottom CTA ของ VISION §2

### `PLAY-12` — /drop-calculator, /deck-calculator
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** Skeleton ทั้งสองหน้าไม่ตรงกับ layout จริง (ขัด VISION §4 ข้อ 6 "skeleton รูปร่างตรงกับ layout จริง") — โหลดเสร็จแล้วหน้ากระโดดเปลี่ยนโครง และ breadcrumb skeleton โผล่บนมือถือทั้งที่ breadcrumb ซ่อน

**หลักฐาน:** drop-calculator/loading.tsx วาด grid lg:grid-cols-2 + breadcrumb skeleton แต่หน้าจริงเปิดมาเป็น empty-state panel เลือกเซ็ต · deck-calculator/loading.tsx วาด 2 คอลัมน์แต่หน้าจริงเป็น single column

**วิธีแก้ที่เสนอ:** วาด skeleton ตามสภาพแรกจริงของแต่ละหน้า (drop = header + empty panel · deck = header + input แถว + ลิสต์ single column) และซ่อนส่วน breadcrumb ด้วย hidden md:flex

### 🧩 ข้อเสนอ re-compose ของ area นี้
/deck-calculator ควร re-compose ตาม VISION §5.4 (หน้าเดียวที่โครงปัจจุบันไปต่อยาก): Mobile = header (ชื่อเด็ค + count ring X/50) → hero ราคารวม (.text-display) → leader row → ลิสต์การ์ดพร้อม QtyStepper ≥44px ต่อแถว → sticky bottom "เพิ่มการ์ด" เปิด bottom-sheet ค้นหาที่ค้างไว้เพิ่มรัวๆ ได้ · Desktop = 2 คอลัมน์: ซ้าย search rail ค้าง (แทน dialog) + ขวา deck list + summary sticky · เด็คหลายใบใช้ dropdown/segmented บน header แทน pill แถวลอย · /decks และ /drop-calculator ไม่ต้องรื้อ แก้ราย finding พอ

---

<a id="settings"></a>
## SETTINGS — Settings ทุกหน้า + /more

**ขอบเขตที่ตรวจ:** /settings · /settings/account · /settings/privacy · /settings/subscription · /settings/billing · /settings/security · /settings/notifications · /settings/alerts · /settings/marketplace · /settings/addresses · /settings/export · /more

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- GroupedSection/GroupedRow สร้างทับ ListRow ตัวเดียว (grouped-list.tsx:19) — atom เดียวใช้ซ้ำตาม VISION จริง ไม่มี row ซ้อนสองระบบ
- /settings หน้าแม่บนมือถือทำ iOS grouped-inset + large-title ได้ตรง grammar ที่เคาะไว้ และ skeleton ใน settings-shell รูปร่างตรง layout จริง
- /more จัดกลุ่ม Browse/Track/Account/Preferences ชัด มี doc comment อธิบายเหตุผลการตัดสินใจของเจ้าของทุกจุด (no title, NO_HEADER_FOOTER)
- /settings/alerts เป็นหน้าลูกที่ดีสุด: skeleton ตรง layout, empty state มี CTA + ทางออก (show all games), optimistic feedback ครบ

### `SETTINGS-01` — /settings + /settings/marketplace
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** header/footer//more ซ่อนเมนู marketplace ตาม flag แต่ /settings ยังโชว์ Seller Dashboard + ปุ่ม List Card (section-marketplace.tsx:49 ลิงก์ไป /marketplace/create) เสมอ — ผู้ใช้เดินเข้า flow ที่ปิดอยู่แล้วเจอทางตัน

**หลักฐาน:** settings-shell.tsx:40 ใส่ marketplace ใน SETTINGS_SECTIONS โดยไม่เช็ค flag ขณะที่ more-client.tsx:247 เช็ค marketplaceEnabled

**วิธีแก้ที่เสนอ:** filter SETTINGS_SECTIONS ด้วย usePublicConfig().marketplaceEnabled แบบเดียวกับที่ /more ทำ (จุดกรองมีอยู่แล้วที่ visibleSections ใน settings-shell.tsx:79)

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดจริงทุกบรรทัด (settings-shell.tsx:40 ไม่เช็ค flag · more-client.tsx:247 เช็ค · section-marketplace.tsx:49 ลิงก์ /marketplace/create ซึ่ง assertMarketplaceEnabled() แล้ว 404 = ทางตันจริง) และหนักกว่า consistency เพราะขัด SPEC.md §4 ที่สั่งว่าตอน flag ปิด marketplace ต้อง invisible ทั้งหมด — /settings/marketplace ไม่มี guard เลย เป็น route marketplace เดียวที่หลุด · recommendation ไม่ขัดทิศที่เคาะ แต่ต้องเพิ่ม 1 จุด: กรองที่ visibleSections ใน settings-shell.tsx:79 คุมแค่ desktop sidebar — หน้า index มือถือ (src/app/settings/page.tsx:25-28) มี filter ซ้ำของตัวเอง ต้องกรองทั้ง 2 จุดหรือย้ายไปจุดร่วม · effort ยัง S

### `SETTINGS-02` — /settings/* (หน้าลูกทั้ง 10)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **L**

**ปัญหา:** หน้าแม่เป็น iOS grouped-inset แต่พอกด row เข้าหน้าลูกทั้ง 10 หน้า กลับเจอ desktop form (Surface + text-h2) เหมือนกันทั้งมือถือ/desktop — ภาษา UI สะดุดกลางทาง โดยเฉพาะ privacy/notifications ที่เป็น toggle ล้วนๆ ซึ่งเหมาะกับ GroupedRow ที่สุด

**หลักฐาน:** section-security.tsx:219 / account-privacy-section.tsx:101 ใช้ Surface form แบบ desktop ขณะที่หน้าแม่ settings/page.tsx:34 เป็น grouped-inset

**วิธีแก้ที่เสนอ:** แปลงหน้าลูกที่เป็น read/toggle (privacy, notifications, export) เป็น GroupedSection + GroupedRow (Switch อยู่ trailing slot) บนมือถือก่อน แล้วค่อยตามด้วยหน้า form — desktop คงโครง Surface เดิมไว้

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดจริงทุกจุด: settings/page.tsx:34 เป็น grouped-inset (md:hidden), section-security.tsx:219 เป็น Surface variant=outline + text-h2:216, account-privacy-section.tsx:101 เป็น <Card> ซึ่งเป็น local wrapper ห่อ Surface variant=outline ในไฟล์เดียวกัน (สาระตรงตามที่บรรยาย) และหน้าลูกครบ 10 หน้าไม่มีหน้าไหนใช้ GroupedRow เลย — render desktop form เหมือนกันทั้งสอง platform จริง ไม่ใช่ของตั้งใจ: PLAN.md Batch 2 จงใจทำแค่หน้าแม่ และ PROGRESS.md ระบุเองว่า settings sub ~7 หน้าเป็นงานค้างรอบหน้า = สถานะกลางทาง migration ที่รับรู้แล้ว finding นี้คืองาน batch ถัดไปที่มีหลักฐานรองรับ recommendation ตรงทิศที่เคาะ (มือถือ iOS grammar / desktop โครงเดิม) แบบเดียวกับ Batch 2/3 ที่ทำมาแล้วเป๊ะ

### `SETTINGS-03` — /settings/security
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** QR สำหรับตั้ง 2FA ถูกสร้างโดยส่ง TOTP secret ทั้งก้อนไปให้เว็บ third-party (api.qrserver.com) — เท่ากับเปิดเผยกุญแจ 2FA ของผู้ใช้ให้คนนอก และถ้าเว็บนั้นล่ม ผู้ใช้ตั้ง 2FA ไม่ได้เลย

**หลักฐาน:** section-security.tsx:361 โหลด QR จาก https://api.qrserver.com โดยฝัง TOTP uri ใน query

**วิธีแก้ที่เสนอ:** สร้าง QR ฝั่ง client เอง (เช่น lib qrcode ตัวเล็กๆ render เป็น SVG/canvas) — secret ต้องไม่ออกนอกเครื่องผู้ใช้

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้วตรงตาม evidence ทุกจุด: src/components/profile/section-security.tsx:361 ฝัง qrUri (otpauth:// URI จาก supabase.auth.mfa.enroll ที่มี TOTP secret เต็มก้อน, line 111–117) ลง query ของ https://api.qrserver.com จริง และหน้า /settings/security render component นี้ตรงๆ ไม่มี comment/convention ใน AGENTS.md/VISION.md/doc ที่บอกว่าตั้งใจ และไม่มี lib qrcode ใน package.json อยู่แล้ว — เป็น shortcut ไม่ใช่ design decision. Recommendation (render QR ฝั่ง client) ไม่ขัดทิศดีไซน์ใดๆ เพราะไม่แตะ layout เลย effort S สมเหตุสมผล. ข้อสังเกต 2 จุด: (1) ไฟล์อยู่ที่ src/components/profile/ ไม่ใช่ใต้ settings แต่ line ตรงเป๊ะ (2) การเพิ่ม dependency qrcode ต้องถามเบสก่อนตามกฎ permission ใน AGENTS.md

### `SETTINGS-04` — /settings vs /more (Preferences)
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ภาษา/สกุลเงิน/ธีมอยู่ใน /more อย่างเดียว — ผู้ใช้ที่เปิด Settings เพื่อหา 'เปลี่ยนภาษา' (ที่แรกที่ทุกคนหา) จะไม่เจอ และบน desktop /more ก็ไม่อยู่ใน nav ปกติ

**หลักฐาน:** more-client.tsx:289-346 มี Language/Currency/Theme แต่ SETTINGS_SECTIONS (settings-shell.tsx:32-43) ไม่มีเลย

**วิธีแก้ที่เสนอ:** เพิ่มกลุ่ม Preferences ใน /settings (หน้าเดียวใช้ GroupedRow + Select trailing ก๊อป pattern จาก more-client ได้เลย) — /more คง shortcut ไว้ได้ ไม่ถือว่าซ้ำเพราะ /more คือ hub

### `SETTINGS-05` — /settings/* (back affordance)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **S**

**ปัญหา:** หน้าลูก settings ใช้ back เป็น text link เล็กๆ ที่ label เป็น 'ชื่อหน้าปัจจุบัน' (เช่นอยู่หน้า Security แต่ปุ่มย้อนเขียนว่า Security) — ทั้งงงว่ากดแล้วไปไหน ทั้งซ้ำกับ h2 ข้างล่าง และไม่ตรงปุ่มวงกลม chevron ที่ตกลงเป็นมาตรฐานทุกหน้าลึก

**หลักฐาน:** settings-shell.tsx:107-113 text link label = ชื่อหน้าปัจจุบัน vs breadcrumb.tsx:66 ปุ่มวงกลม chevron มาตรฐาน 'identical on every deep page'

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็นปุ่มวงกลม chevron ตัวเดียวกับ Breadcrumb (หรือเพิ่ม section ปัจจุบันเข้า breadcrumb items ใน settings/layout.tsx:20 ให้ Breadcrumb จัดการเอง — desktop จะได้ trail ครบ 3 ชั้นด้วย ตอนนี้ค้างที่ Home > Settings)

### `SETTINGS-06` — /settings/* (form pages)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** pattern การ save ต่างกันทุกหน้า: security ใช้กล่อง banner เขียว, privacy/notifications ใช้ pill 2 วินาที, account เป็น edit-in-place ที่ save แล้วเงียบๆ, addresses เป็น form ก้อนใหญ่ — ผู้ใช้ต้องเรียนรู้ใหม่ทุกหน้าว่า 'บันทึกแล้วหรือยัง'

**หลักฐาน:** section-security.tsx:290 success banner vs section-notifications.tsx:211 inline pill vs account-profile-info.tsx:121 save-per-field ไร้ confirmation

**วิธีแก้ที่เสนอ:** เคาะ 2 pattern พอ: toggle/เลือกค่า = auto-save + SavedPill · form ที่กดปุ่ม save = toast (มี sonner ในโปรเจคอยู่แล้วแต่ settings ไม่ได้ใช้เลย) แล้วไล่ปรับทุก section ให้เข้าเกณฑ์

### `SETTINGS-07` — /settings/addresses, /settings/billing, /settings/security, /settings/subscription
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** 4 หน้าลูกโหลดข้อมูลด้วย spinner หมุนกลางกล่อง ขัดกฎ VISION §4.6 'ศูนย์ spinner — skeleton รูปร่างตรง layout จริง' ทั้งที่ /settings/alerts (alerts-manager-client.tsx:209-222) ทำ skeleton ถูกแบบแล้วในโฟลเดอร์เดียวกัน

**หลักฐาน:** section-addresses.tsx:196-198, section-billing.tsx:34, section-security.tsx:443 ใช้ Loader2 spinner กลางจอ

**วิธีแก้ที่เสนอ:** แทน spinner ด้วย Skeleton รูปร่างตาม content จริง (แถว address 2-3 แถว, แถว invoice, แถว login history) ตามแบบ alerts

### `SETTINGS-08` — /settings/export, /settings/marketplace, /settings/notifications, /settings/subscription
**🟠 MED** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** icon tile ในหน้าลูก hardcode สี Tailwind ดิบ (pink/purple/emerald/amber/blue) ขณะที่ /more ใช้ semantic token (bg-info-soft/bg-success-soft/bg-warning-soft) — นอกจากไม่ consistent แล้วยังขัด identity 'chrome จืด' เพราะจอ settings มีสีสดกระจายเกิน

**หลักฐาน:** section-export.tsx:22-44 hardcode emerald/pink/blue · section-notifications.tsx:116-154 blue/emerald/amber/purple

**วิธีแก้ที่เสนอ:** map ทุก icon tile ไปใช้ *-soft tokens ชุดเดียวกับ /more (มีครบใน globals.css:146-155 อยู่แล้ว) — เขียว/แดงสงวนให้กำไร/ขาดทุนตามกฎ

### `SETTINGS-09` — /settings/notifications + /settings/privacy
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** มี toggle switch เขียนมือ 2 ตัวคนละไฟล์ คนละขนาด และ feedback pill 'บันทึกแล้ว/ล้มเหลว' ก็ก๊อปกัน 3 ที่ (section-notifications.tsx:211, account-privacy-section.tsx:180, alert-row.tsx:217) — แก้ทีต้องแก้ 3 จุด และหน้าตา drift กันแล้วจริงๆ

**หลักฐาน:** section-notifications.tsx:33 (Toggle h-6 w-11) vs account-privacy-section.tsx:241 (Toggle h-5 w-9) — สอง switch คนละขนาด

**วิธีแก้ที่เสนอ:** สร้าง ui/switch.tsx + shared SavedPill ตัวเดียว แล้วให้ทั้ง 3 ไฟล์ import — เป็น atom ที่ VISION บังคับอยู่แล้ว

### `SETTINGS-10` — /settings/notifications + /settings/privacy
**🟠 MED** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** toggle สูง 20-24px ต่ำกว่า tap target 44px ที่เคาะไว้มาก โดยเฉพาะ notifications ที่มี 3 toggle เรียงติดกันในแถวเดียว (ChannelToggle gap-5) — บนมือถือกดพลาดง่าย

**หลักฐาน:** section-notifications.tsx:50 switch h-6 w-11 (24px) · account-privacy-section.tsx:258 h-5 w-9 (20px)

**วิธีแก้ที่เสนอ:** ขยาย hit area ของ switch ตัวใหม่ (จาก finding เรื่อง ui/switch.tsx) ด้วย padding/before:absolute ให้แตะได้ ≥44px หรือทำทั้งแถว (icon+label) เป็น label กดได้ทั้งก้อน

### `SETTINGS-11` — /settings (shell)
**🔵 LOW** · ด้าน: โครงโค้ด · จอ: มือถือ · effort: **S**

**ปัญหา:** content ของ settings เติม pb-16 ซ้อนบน pb-32 ที่ PageContent ให้เผื่อ bottom-nav อยู่แล้ว — ขัดกฎ AGENTS 'Don't double-pad' เกิดที่ว่างท้ายหน้าเกินจำเป็น ~64px

**หลักฐาน:** settings-shell.tsx:193 ใส่ pb-16 ทั้งที่ main-chrome.tsx:105 ให้ pb-32 อยู่แล้ว

**วิธีแก้ที่เสนอ:** ลบ pb-16 ออกจาก settings-shell (ถ้าต้องการ air ท้าย form บน desktop ใช้ md:pb-8 พอ)

### `SETTINGS-12` — /settings + /more (identity row)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** การ์ด identity แบบเดียวกัน hand-roll 2 ชุด (ต่างกันแค่ปลายทางลิงก์กับ badge honey) บวก sidebar identity อีกแบบใน settings-shell.tsx:122-146 และ i18n key label กลุ่มก็ซ้ำ 2 ชุด (settingsGeneral vs settingsGroupGeneral) — แก้ดีไซน์ทีต้องตาม 3 จุด

**หลักฐาน:** settings/page.tsx:38-62 กับ more-client.tsx:127-164 markup แถว user (min-h-[68px] avatar+badge+chevron) เขียนมือซ้ำกัน 2 ที่

**วิธีแก้ที่เสนอ:** extract เป็น IdentityRow component เดียว (props: href, trailing meta) ให้ /settings และ /more ใช้ร่วม แล้วยุบ i18n key ซ้ำเหลือชุดเดียว

### `SETTINGS-13` — /settings/* (page headers)
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หัวหน้าลูกไม่เท่ากัน: บางหน้ามี subtitle (คนละ class กันเอง) บางหน้าไม่มี และ /settings (desktop) render SectionAccount ซ้ำกับ /settings/account — สอง URL เนื้อหาเดียวกัน sidebar ก็ mark account active ทั้งคู่

**หลักฐาน:** section-billing.tsx:29 ใช้ page-subtitle · settings/privacy/page.tsx:17 ใช้ text-meta · section-account.tsx:21 / section-security.tsx:216 ไม่มี subtitle

**วิธีแก้ที่เสนอ:** ใช้ PageHeader size='sm' + description ให้ครบทุกหน้าลูก (มี component พร้อมแล้วที่ page-header.tsx) และให้ /settings บน desktop redirect ไป /settings/account แทนการ render ซ้ำ

### 🧩 ข้อเสนอ re-compose ของ area นี้
หน้าลูก settings บนมือถือควร re-compose เป็น grammar เดียวกับหน้าแม่ (desktop ไม่แตะ): (1) บนสุด = ปุ่มย้อนวงกลม chevron + ชื่อหน้า text-h2 (ไม่ใช่ text link ชื่อหน้าตัวเอง) (2) เนื้อหา = GroupedSection ต่อกลุ่ม — privacy/notifications: GroupedRow + Switch ที่ trailing, footer text ใต้การ์ดอธิบายผล · account: GroupedRow ค่าปัจจุบัน tap แล้วแก้ inline/sheet · addresses: GroupedSection ต่อที่อยู่ + ปุ่ม 'เพิ่มที่อยู่' เป็น row สุดท้ายในการ์ด · billing/security (login history): ListRow ในการ์ดเดียว (3) ทุก async surface ใช้ Skeleton ตาม layout แบบ alerts. /more desktop: คืน header ปกติ (ซ่อนเฉพาะ <md) เนื้อหา 2 คอลัมน์เดิมใช้ได้

---

<a id="identity"></a>
## IDENTITY — Profile (me+public) + auth

**ขอบเขตที่ตรวจ:** /profile (me redirect) · /profile/[userId] · /u/[handle] (/@handle) · /login · /register · /forgot-password · /reset-password · src/components/profile/** (root + public/, 46 ไฟล์)

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- Public profile แตกเป็น component เล็กที่ใช้ shell ร่วมกันจริง (TabSection/TabToolbar/HintTile) — 3 แท็บหน้าตาเป็นพี่น้องกัน มี doc comment อธิบายเหตุผลดีมาก
- Tab state ผูกกับ URL (?tab=) — deep link ได้ ปุ่ม back ทำงานถูก (router.replace)
- Empty state ทุกจุดมี CTA แยก owner/visitor + grid-cols.ts ฉลาดเรื่องการ์ดน้อยใบ (กันการ์ดโดดเดี่ยวกลางที่ว่าง)
- /u/[handle] กับ /profile/[userId] ใช้ loader + PublicProfileClient ตัวเดียวกัน ไม่ fork UI และ auth ทั้ง 4 หน้าใช้กล่อง error รูปแบบเดียวกัน

### `IDENTITY-01` — /login + /register (+reset)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** โครง auth ~200 บรรทัดถูกก๊อประหว่าง login กับ register (hero ซ้าย, ปุ่ม OAuth พร้อม SVG inline, divider, error box) และกติการหัสผ่านถูกประกาศซ้ำ 3 ไฟล์ — แก้ที่หนึ่งอีกที่ drift แน่นอน

**หลักฐาน:** login-client.tsx:104-184 กับ register-client.tsx:92-184 ก๊อปกันทั้ง hero panel, ปุ่ม OAuth+SVG Google/Facebook, divider, กล่อง error · PASSWORD_RULES ซ้ำ 3 ที่ (register:34, reset-password:35, section-security.tsx:83)

**วิธีแก้ที่เสนอ:** สร้าง shared kit ใน src/components/auth/: AuthShell (hero+form layout), OAuthButtons, PasswordInput (มีตา show/hide), PasswordRules, FormError แล้วให้ทั้ง 4 หน้า + section-security ใช้ชุดเดียว

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว evidence ตรงทุกจุด: diff ยืนยัน block OAuth+SVG+divider (login:146-184 = register:146-184) byte-identical, hero panel/error box/back-link/ฟังก์ชัน signInOAuth ก๊อปกันจริง (~200 บรรทัดตามอ้าง จริงๆ หนักกว่าเพราะ logic ซ้ำด้วย), PASSWORD_RULES ซ้ำ 3 ไฟล์ตาม file:line เป๊ะและกติกาเหมือนกันทุกตัวอักษร, src/components/auth/ ยังไม่มี · ไม่มี comment บอกว่าตั้งใจ และทิศ repo คือ shared component kit อยู่แล้ว · recommendation เป็น refactor ล้วนไม่เปลี่ยน visual จึงไม่ขัด desktop โครงเดิม/iOS grammar/honey — ซ้ำยังช่วยงาน PLAN Batch 6 (login left-panel) ให้แก้ที่เดียวจบ · drift เริ่มเกิดแล้วจริง (gradient hero คนละทิศ, demo block มีเฉพาะ login) ซึ่ง AuthShell แบบ slot รองรับได้

### `IDENTITY-02` — /profile/[userId] (visitor)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **S**

**ปัญหา:** แถบ CTA 'ทักผู้ขาย/บันทึก' บนมือถือ fix ไว้ที่ bottom-0 z-40 แต่ BottomNav 5 แท็บก็ fix ที่ bottom-0 z-50 บน route เดียวกัน — CTA ถูก nav ทับจนมองไม่เห็น/กดไม่ได้ และแถบเองไม่มี safe-area padding

**หลักฐาน:** profile-mobile-cta-bar.tsx:27 fixed bottom-0 z-40 vs bottom-nav.tsx:70 fixed bottom-0 z-50 (โปรไฟล์ไม่อยู่ใน CHROMELESS_ROUTES)

**วิธีแก้ที่เสนอ:** ยกแถบ CTA ขึ้นเหนือ bottom-nav (เช่น bottom-[calc(bottom-nav-height+safe-area)]) หรือถ้าเห็นว่าซ้ำกับปุ่ม Message ในฮีโร่อยู่แล้วให้ตัดแถบนี้ทิ้งไปเลย — อย่าปล่อยให้สองแถบชนกัน

**หมายเหตุจากทีม verify:** ตรวจกับโค้ดจริงแล้วตรงทุกบรรทัด: CTA bar fixed bottom-0 z-40 ไม่มี safe-area (profile-mobile-cta-bar.tsx:27) ถูก BottomNav fixed bottom-0 z-50 พื้น frost ทึบ+blur (bottom-nav.tsx:70) ทับมิดบน /profile/[userId] เพราะ route ไม่อยู่ใน CHROMELESS_ROUTES (main-chrome.tsx:11-21) — ขัด doc comment ของ component เองที่ตั้งใจให้ "stays visible while scrolling" จึงเป็นบั๊กจริง ไม่ใช่ของตั้งใจ และ fix เป็น S จริง แต่มีข้อแม้: hero มีปุ่ม Message+Save บนมือถืออยู่แล้ว (profile-hero.tsx:205 บล็อก sm:hidden) — visitor ยังติดต่อผู้ขายได้ ดังนั้น impact จริง = sticky bar เป็น dead component ไม่ใช่ conversion blocker → ทางแก้ที่ถูกสุดคือตัดแถบทิ้งตาม option B ของ recommendation และ severity เนื้อจริงควรเป็น medium มากกว่า high

### `IDENTITY-03` — /profile/[userId] (visitor)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ก่อนถึงแท็บเนื้อหา visitor ต้องเลื่อนผ่านข้อมูล trust ซ้ำ 3 ชั้น: rating โผล่ 2-3 ครั้ง, จำนวนดีล 2 ครั้ง, เวลาตอบ 2 ครั้ง และ topReview ใน SellerCard อาจเป็นรีวิวใบเดียวกับที่ ReviewsPreview โชว์อีกรอบ — ยาว รก และลด scroll depth ถึงของจริง (การ์ด/listing)

**หลักฐาน:** public-profile-client.tsx:271-297 เรียง SellerCard→TrustBlock→ReviewsPreview · deals/response โชว์ซ้ำใน profile-seller-card.tsx:60-69 และ profile-trust-block.tsx:149-171

**วิธีแก้ที่เสนอ:** รวม ProfileSellerCard + ProfileTrustBlock เป็น trust strip เดียว (rating·deals·response·verified·ที่อยู่·ขนส่ง) แล้วตัด topReview quote ทิ้งให้ ReviewsPreview ทำหน้าที่ social proof ที่เดียว

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดปัจจุบันทุก file:line — deals/response/verified ซ้ำ 2 ชั้นใน SellerCard (60-75) กับ TrustBlock buildVerifiedFacts (140-171) ที่ render ติดกันเป๊ะ (client:271-272), rating ซ้ำใน SellerCard + ReviewsPreview header, topReview (rating≥4 + มี comment) ทับเกณฑ์คัดของ ReviewsPreview จนน่าจะเป็นใบเดียวกันจริง · ไม่ใช่ความตั้งใจ — comment ใน profile-hero.tsx:295-297 และ profile-seller-card.tsx:27-35 บอกเองว่า trust facts ควรอยู่ที่ TrustBlock ที่เดียว/TrustBlock ควรเป็น commerce facts แต่ implementation ขัด (ร่องรอย refactor ค้าง) · recommendation สอดกับ VISION.md §5.5 ที่เคาะ "Reputation = 1 tier badge + stats sheet" และหนุนทิศการ์ดเป็นพระเอก · หมายเหตุตอนทำ: SellerCard โชว์ทุกคนแต่ TrustBlock เป็น visitor-only ต้องเคลียร์ owner view ตอนรวม

### `IDENTITY-04` — /u/[handle] (/@handle)
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้าโปรไฟล์ผ่าน /@handle (URL ที่ปุ่ม Share แจกและเป็น canonical) ถูกห่อด้วย PageContent+PageContainer ซ้อนกับ container ของหน้าเอง — ขอบซ้อน 2 ชั้น (px-5+px-5), padding บน/ล่างซ้ำ, max-w-5xl ใน max-w-7xl ทำให้หน้าเดียวกันหน้าตาไม่ตรงกับ /profile/[userId] และแถบ sticky tabs (-mx-5) เลิกชนขอบจอ

**หลักฐาน:** main-chrome.tsx:36-38 FULL_WIDTH_ROUTES มีแค่ /^\/profile\/.+/ จริง · profile-share-menu.tsx:41 แชร์ /@handle จริง · แต่กลไกที่ถูกคือ: middleware.ts:25-31 rewrite /@handle → /u/[handle] แบบไม่เปลี่ยน URL เบราว์เซอร์ และ usePathname() ใน PageContent เห็น URL ก่อน rewrite (/@handle) — พิสูจน์จาก flight payload ของ /opcg/sets ที่ได้ "c":["","opcg","sets"] (URL เดิม) + client hydration ใช้ location.href · ดังนั้น fix ต้องเพิ่มทั้ง /^\/@.+/ (URL หลักที่ Share แจก) และ /^\/u\/.+/ (คนเข้าตรง) เข้า FULL_WIDTH_ROUTES ไม่ใช่แค่ /^\/u\/.+/ บรรทัดเดียว · อาการห่อซ้อนยืนยันแล้ว: public-profile-client.tsx:240 มี max-w-5xl px-5 ของตัวเอง + profile-tabs-nav.tsx:73 ใช้ -mx-5 · ทดสอบสด: /profile/<id> ไม่มี main wrapper ของ PageContent ส่วนหน้าปกติมี

**วิธีแก้ที่เสนอ:** เพิ่ม /^\/u\/.+/ เข้า FULL_WIDTH_ROUTES ใน main-chrome.tsx (1 บรรทัด) แล้วเปิดสองเส้นทางเทียบกันให้เหมือนเป๊ะ ถือโอกาสยุบ generateMetadata + branch private ที่ก๊อปกันสองไฟล์ให้เป็น helper เดียว

**หมายเหตุจากทีม verify:** ปัญหาจริง: /@handle ถูก middleware rewrite ไป /u/[handle] ซึ่งไม่อยู่ใน FULL_WIDTH_ROUTES ทำให้ PageContent ห่อซ้อน (px-5+px-5, max-w-5xl ใน max-w-7xl, tabs -mx-5 ไม่ชนขอบจอ) — ยืนยันกับโค้ดและ dev server จริงแล้ว แต่ fix ที่แนะนำผิดกลไก: พิสูจน์เชิงประจักษ์ว่า usePathname() หลัง middleware rewrite คืน URL เดิมในเบราว์เซอร์ (/@handle) ไม่ใช่ /u/handle ดังนั้นเพิ่มแค่ /^\/u\/.+/ จะไม่แก้ URL canonical ที่ปุ่ม Share แจก — ต้องเพิ่ม /^\/@.+/ ด้วย ไม่ขัดทิศดีไซน์ที่เคาะแล้ว

### `IDENTITY-05` — /profile (me)
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ผู้ใช้ที่ยังไม่ล็อกอินกด Profile จะถูกส่งไป login แล้ว 'เด้งกลับไป /settings' ไม่ใช่โปรไฟล์ (ก๊อป param ผิดมา) และหน้า /profile เป็น client redirect 2 จังหวะ (getUser → fetch /api/me) พร้อม spinner เปล่า ขัดกฎ 'ศูนย์ spinner' ใน VISION

**หลักฐาน:** profile/(me)/page.tsx:32 router.replace("/login?redirect=/settings") · :40-43 spinner หมุน + fetch /api/me ฝั่ง client

**วิธีแก้ที่เสนอ:** แก้ redirect เป็น /profile และเปลี่ยนหน้านี้เป็น server component ที่อ่าน session แล้ว redirect(`/profile/${id}`) ทีเดียว — เร็วขึ้นและไม่ต้องมี spinner เลย

### `IDENTITY-06` — /profile/[userId] (mobile CTA)
**🟠 MED** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** ปุ่มหลักของ visitor บนมือถือ (ทักผู้ขาย/บันทึก ทั้งในฮีโร่และแถบ sticky) สูงแค่ 36px ต่ำกว่าเกณฑ์ tap target ≥44px ที่เคาะไว้สำหรับ mobile grammar

**หลักฐาน:** message-seller-button.tsx:33 + save-seller-button.tsx:70 ใช้ size="sm" = h-9 (button-variants.ts:23 = 36px)

**วิธีแก้ที่เสนอ:** บนแถบ CTA และแถวแอคชันมือถือใช้ size default (h-10) หรือ lg (h-12) — คง sm ไว้เฉพาะ desktop hero ได้

### `IDENTITY-07` — /profile/[userId] (visitor mobile)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **S**

**ปัญหา:** ปุ่ม 'บันทึกผู้ขาย' ถูกวาด 2-3 instance บนจอเดียว (แถวแอคชันฮีโร่ + แถบ CTA ล่าง) แต่ละตัวถือ state isSaved ของตัวเอง — กดบันทึกจุดหนึ่ง อีกจุดยังโชว์สถานะเก่า

**หลักฐาน:** save-seller-button.tsx:38 useState ภายในปุ่ม · ถูก render ซ้ำที่ profile-hero.tsx:127-129 + 205-207 และ profile-mobile-cta-bar.tsx:30

**วิธีแก้ที่เสนอ:** ยก state saved ขึ้นไปที่ PublicProfileLayout (หรือ store เล็กๆ) แล้วส่งลงเป็น props ให้ทุก instance sync กัน — หรือเหลือปุ่มเดียวตามข้อเสนอยุบแถบ CTA

### `IDENTITY-08` — /profile/[userId] (visitor)
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** เมนู ⋯ ของ visitor มีรายการ 'ดูรายการขาย' ที่กดแล้วไม่เกิดอะไรเลย (comment ยอมรับว่าใส่ให้เมนูดูไม่โล่ง) ส่วน Report แจ้ง toast ว่ารายงานถูกส่งทั้งที่ไม่มี backend — หลอกผู้ใช้เรื่อง safety ซึ่งเสี่ยงต่อความเชื่อใจ

**หลักฐาน:** profile-action-cluster.tsx:145-149 onViewListings เป็นฟังก์ชันว่าง · :139-143 Report/Block เป็น toast บอกว่า 'ส่งแล้ว'

**วิธีแก้ที่เสนอ:** ให้ 'ดูรายการขาย' เรียก setActiveTab('listings') จริง และเปลี่ยนข้อความ Report/Block เป็น 'ฟีเจอร์นี้กำลังมา' จนกว่าจะมี backend — อย่ายืนยันสิ่งที่ไม่ได้เกิด

### `IDENTITY-09` — /register + /reset-password
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** Checklist รหัสผ่านโชว์ 3 ข้อ (ยาว 8 · ตัวใหญ่ · ตัวเลข) แต่ validation จริงบังคับแค่ความยาว — ผู้ใช้เข้าใจผิดว่าอีกสองข้อเป็นข้อบังคับ หรือสับสนว่าทำไมผ่านได้ทั้งที่ยังไม่ครบ

**หลักฐาน:** register-client.tsx:19 zod บังคับแค่ .min(8) แต่ :34-38 โชว์กติกา uppercase/number เป็น checklist

**วิธีแก้ที่เสนอ:** เลือกทางเดียว: บังคับครบ 3 ข้อใน schema (แนะนำ) หรือ label สองข้อหลังว่าเป็น 'คำแนะนำ' — ให้ hint กับ validation เล่าเรื่องเดียวกัน

### `IDENTITY-10` — auth ทั้ง 4 หน้า
**🟠 MED** · ด้าน: a11y · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ปุ่มเปิด/ปิดตารหัสผ่านถูกตัดออกจาก tab order และไม่มี aria-label — ผู้ใช้คีย์บอร์ด/screen reader เข้าถึงไม่ได้เลยทั้ง 4 จุด

**หลักฐาน:** login-client.tsx:220-227 ปุ่ม show/hide password มี tabIndex={-1} ไม่มี aria-label (ซ้ำใน register ×2, reset ×1)

**วิธีแก้ที่เสนอ:** เอา tabIndex={-1} ออก ใส่ aria-label สลับ 'แสดง/ซ่อนรหัสผ่าน' + aria-pressed — แก้ครั้งเดียวใน PasswordInput ที่แชร์กัน (ผูกกับ finding เรื่อง auth kit)

### `IDENTITY-11` — src/components/profile/**
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** โฟลเดอร์ components/profile ปนสองโลก: 12 ไฟล์เป็นของหน้า /settings ล้วนๆ ส่วนของ public profile จริงอยู่ใน public/ — คน/AI ที่มาแก้ 'โปรไฟล์' จะเปิดผิดไฟล์ และของ settings ก็หาไม่เจอจากชื่อโฟลเดอร์

**หลักฐาน:** section-*.tsx + account-*.tsx + profile-data-context.tsx (12/19 ไฟล์ root) ถูก import จาก src/app/settings/** เท่านั้น

**วิธีแก้ที่เสนอ:** ย้าย section-*/account-*/profile-data-context ไป src/components/settings/ (หรือ colocate ใต้ src/app/settings/) เหลือ components/profile ไว้สำหรับ public profile + ของที่แชร์จริง (share-menu, achievements, types)

### `IDENTITY-12` — /profile/[userId] (collection tab)
**🔵 LOW** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** เมื่อคอลเลกชันมีการ์ดมากกว่าที่โหลดมา ผู้ชมเห็นแค่บรรทัด 'แสดง 24 จาก 500' โดยไม่มีทางดูที่เหลือ — ต่างจากแท็บ listings ที่มีลิงก์ 'ดูทั้งหมดใน marketplace' และแท็บ reviews ที่มีปุ่ม load more

**หลักฐาน:** collection-tab.tsx:194-200 โชว์ข้อความ 'showing {shown} of {total}' เป็น text ล้วน ไม่มีลิงก์/ปุ่ม

**วิธีแก้ที่เสนอ:** เพิ่มปุ่ม 'โหลดเพิ่ม' (ยิง API แบ่งหน้า) หรืออย่างน้อยอธิบายว่าทำไมเห็นแค่บางส่วน ให้พฤติกรรม 3 แท็บสอดคล้องกัน

### `IDENTITY-13` — /profile/[userId] (hero)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** มี dead code ค้างจากการรื้อรอบก่อน: buildTrustChips ทั้งฟังก์ชันไม่ถูกใช้, buildHeroMeta ผลิต listings/rating/reviews ที่ hero ทิ้งหมดใช้แค่ activity, และ comment 2 จุดอ้างถึง ProfileStatTiles ที่ถูกลบไปแล้ว — ทำให้คนอ่านโค้ดเข้าใจโครงผิด

**หลักฐาน:** hero-builders.ts:98-131 buildTrustChips ไม่มีใครเรียก · profile-hero.tsx:91 ใช้แค่ activity จาก buildHeroMeta · :57 comment อ้าง ProfileStatTiles ที่ไม่มีในโค้ด

**วิธีแก้ที่เสนอ:** ลบ buildTrustChips, หด buildHeroMeta ให้เหลือ buildActivityItem และแก้ comment ที่อ้าง component ผี

### `IDENTITY-14` — /profile/[userId] (private)
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้าโปรไฟล์ private ใช้ความกว้าง/gutter คนละค่ากับหน้า public ของ route เดียวกัน (px-4 ทั้งที่มาตรฐานใหม่คือ px-5) และเป็น dead-end — บอกว่า 'โปรไฟล์นี้เป็นส่วนตัว' แล้วไม่มีทางไปต่อ

**หลักฐาน:** private-profile-view.tsx:25,35 ใช้ max-w-7xl px-4 (หน้า public ใช้ max-w-5xl px-5) และจบหน้าโดยไม่มี CTA

**วิธีแก้ที่เสนอ:** ปรับ container ให้ตรงกับหน้า public (max-w-5xl px-5) และเติม CTA เดียวตามกฎ empty state เช่น 'กลับหน้าแรก' หรือ 'ดูตลาด'

### 🧩 ข้อเสนอ re-compose ของ area นี้
หน้า public profile (visitor) ควร re-compose ลำดับ stack ก่อนแท็บ — mobile: cover → avatar+ชื่อ+handle → แถวแอคชัน (ปุ่ม ≥44px) → trust strip เดียว (rating·ดีล·เวลาตอบ·verified·จังหวัด·ขนส่ง รวมจุดเดียว) → bio → sticky tabs → เนื้อหา → sticky CTA ลอยเหนือ bottom-nav (+safe-area) · desktop: เหมือนเดิมแต่ใช้ trust strip เดียวแทน SellerCard+TrustBlock สองใบ และคง ReviewsPreview เป็น social proof ที่เดียว (ตัด topReview quote) — auth ไม่ต้อง re-compose ทั้งหน้า แค่แตก shared kit

---

<a id="commerce"></a>
## COMMERCE — Marketplace + seller + orders + messages (ปิด flag อยู่)

**ขอบเขตที่ตรวจ:** /marketplace · /marketplace/[listingId] · /marketplace/create · /seller · /seller/listings · /seller/listings/new · /seller/listings/[id] · /seller/orders · /seller/orders/[id] · /seller/reviews · /seller/settings · /orders · /orders/[id] · /messages · /messages/[listingId]

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- marketplace browse แยก module เล็ก (toolbar/grid/list/filters/types) อ่านง่าย และหน้า /marketplace เป็น server component + loading.tsx skeleton ตาม convention ใหม่แล้ว
- create-wizard แยก step เป็นไฟล์ย่อย + WizardLayout กลาง — โครงดี พร้อม reuse
- หน้า seller ส่วนใหญ่ใช้ shared kit ถูกตัว (PageHeader, Surface, SegmentedControl, KumaEmptyState) และ seller dashboard/listings ใช้ semantic status token (bg-success-soft ฯลฯ) แล้ว
- แชทมี Supabase Realtime + polling fallback + สลับ list/chat บนมือถือ — โครงสถาปัตยกรรมถูกทิศ เหลือแค่เก็บ UX

### `COMMERCE-01` — /marketplace/[listingId]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ปุ่ม "ซื้อเลย" สร้างออเดอร์จริงด้วยแตะครั้งเดียว ไม่มีหน้ายืนยัน/สรุปราคา (order-sidebar.tsx:196 ในแชทก็เหมือนกัน) และถ้า API ล้มเหลว apiTry คืน null เฉยๆ — ผู้ใช้กดแล้วไม่เกิดอะไรขึ้นโดยไม่มีข้อความบอก

**หลักฐาน:** listing-actions.tsx:31 apiPost("/api/orders") ตรงๆ ไม่มี confirm + lib/api/client.ts:92 apiTry กลืน error เงียบ

**วิธีแก้ที่เสนอ:** ใส่ confirm sheet ก่อนสร้างออเดอร์ (สรุปการ์ด+ราคา+ผู้ขาย ตาม VISION §5.5 "ไม่ใช่ tap เดียว") และทุก mutation ที่ใช้ apiTry ต้องโชว์ error toast เมื่อได้ null

**หมายเหตุจากทีม verify:** เปิดโค้ดจริงแล้วตรงทุกจุด: listing-actions.tsx:31 apiPost("/api/orders") ไม่มี confirm + fail เงียบ (ok===null แล้วไม่ทำอะไร ไม่มี toast) · apiTry catch{return null} อยู่ client.ts:92-93 และ doc comment ของไฟล์เองระบุว่า helper นี้มีไว้สำหรับ "non-critical widgets" — เอามาห่อ mutation สร้างออเดอร์คือใช้ผิดเจตนาชัดเจน ไม่ใช่ design ที่ตั้งใจ · order-sidebar.tsx:196 ปุ่ม Buy Now เรียก onBuyNow ซึ่ง chat-layout.tsx:227 ก็ apiTry แบบเดียวกัน · recommendation ไม่ขัดทิศ — VISION.md:141 (§5.5) สั่งเองว่า confirm sheet ก่อนสร้าง Order จริง "ไม่ใช่ tap เดียว" · ข้อลดทอนเดียว: marketplace ยังปิด flag marketplaceEnabled=false (SPEC §4) จึงยังไม่โดนผู้ใช้จริงวันนี้ แต่ต้องแก้ก่อนเปิด flag — severity high สมเหตุผลสำหรับแผน launch

### `COMMERCE-02` — /marketplace/create + /seller/listings/new
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้าลงขายมี 2 ไฟล์ที่ copy กันเกือบทั้งไฟล์ (184 vs 177 บรรทัด) ต่างแค่ translation key กับลิงก์ cancel — แก้ bug ฝั่งเดียวอีกฝั่งจะหลุดแน่นอน

**หลักฐาน:** marketplace/create/create-client.tsx:61 กับ seller/listings/new/page.tsx:60 — handleSubmit และ state ทั้งไฟล์ซ้ำกัน ~95%

**วิธีแก้ที่เสนอ:** รวมเป็น component เดียว เช่น <CreateListingFlow cancelHref=...> ใน components/marketplace/create-wizard แล้วให้ทั้ง 2 route เรียกใช้

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว evidence ตรงทุกจุด: handleSubmit อยู่ที่ create-client.tsx:61 / page.tsx:60 จริง, 184 vs 177 บรรทัดจริง, ซ้ำกัน ~95% จริง (state+handleSubmit+JSX ทั้งก้อน ต่างแค่ translation key คนละชุด, cancel href, max-w-lg, วิธี render ปุ่ม) ไม่มี comment บอกว่าตั้งใจ duplicate และ git history ยืนยัน drift risk เกิดจริง — ทั้งสองไฟล์ถูกแก้คู่กันใน 4 commits (8baaecd, e8e5e7a, c094778, 457e547) และ i18n migration ต้องทำแยกคนละ commit (ffaff54 vs 44544e9) พร้อมสร้าง translation key ซ้ำสองชุด (mktCreate* vs sellNew*) สำหรับข้อความเดียวกัน recommendation ไม่ขัดทิศที่เคาะ — เป็น refactor ล้วนไม่แตะ visual และ components/marketplace/create-wizard มีอยู่แล้ว ทั้งสองไฟล์ import จากที่นั่นอยู่แล้ว ข้อสังเกตเดียว: marketplace ปิด flag อยู่ ทำให้ผลกระทบยังไม่ถึง user วันนี้ แต่โค้ดยังถูก maintain ต่อเนื่อง จึงคุ้มแก้ก่อนเปิด flag

### `COMMERCE-03` — /messages/[listingId]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **S**

**ปัญหา:** เปิดแชทบนมือถือแล้ว order panel (กว้าง 320px) ทับหน้าจอเกือบทั้งจอโดย default และทับปุ่มปิด (PanelRight ใน header, chat-panel.tsx:101) ด้วย z-20 — ผู้ใช้อ่านข้อความไม่ได้และปิด panel ไม่ได้ เหลือแค่ปุ่ม back ซ้ายบน

**หลักฐาน:** chat-layout.tsx:28 useState(true) + :314 "absolute inset-y-0 right-0 z-20 w-80 shadow-xl"

**วิธีแก้ที่เสนอ:** ตั้ง showOrderPanel เริ่มต้นเป็น false บนจอ <lg และเปลี่ยน panel มือถือเป็น bottom-sheet ที่มีปุ่มปิดในตัว (ตาม iOS grammar ที่เคาะไว้) — desktop คงเป็นคอลัมน์ขวาเหมือนเดิม

**หมายเหตุจากทีม verify:** Evidence ตรงทุกบรรทัด (chat-layout.tsx:28 useState(true), :314 absolute z-20 w-80, chat-panel.tsx:101 ปุ่ม toggle) และ deadlock ยืนยันจากโครงสร้างโค้ด: panel ทึบ z-20 ทับปุ่ม toggle ใน header (อยู่ชิดขวาภายใน 320px จากขอบ) ส่วน OrderSidebar ไม่มีปุ่มปิดในตัว และไม่มี guard ปิด panel บนจอเล็กที่ไหนเลย — จอ 360-430px ถูกทับ 74-89% เหลือแค่ปุ่ม back ตามที่รายงาน ที่จริงหนักกว่านั้น: tablet (md-lg) ก็ติด deadlock เดียวกัน · ไม่ใช่ของตั้งใจ (comment line 298 บอกเจตนาคือ "toggle on tablet" แต่ toggle กดไม่ได้) · route gate แค่ auth ไม่ gate marketplace flag · recommendation ไม่ขัดทิศ — desktop คง static ที่ lg: และ bottom-sheet เป็น surface ที่ VISION.md:85 อนุญาต shadow ไว้ชัดเจน

### `COMMERCE-04` — /orders/[id] + /seller/orders/[id]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้ารายละเอียดออเดอร์ฝั่งผู้ซื้อ/ผู้ขาย (419 vs 448 บรรทัด) duplicate กันทั้ง type, การ fetch, และบล็อก timeline ~70 บรรทัด — เป็นจุดที่ VISION กำหนดให้เป็น atom เดียว (CustodyTimeline)

**หลักฐาน:** orders/[id]/page.tsx:60 getTimelineSteps + type OrderDetail ซ้ำกับ seller/orders/[id]/page.tsx:76 แทบทุกบรรทัด

**วิธีแก้ที่เสนอ:** แยก OrderTimeline + OrderDetail view เป็น shared component ใน components/orders รับ prop role=buyer|seller แล้วให้ 2 หน้าเหลือแค่ action panel ที่ต่างกัน

**หมายเหตุจากทีม verify:** Evidence ตรงทุกจุด: getTimelineSteps อยู่บรรทัด 60 (buyer) / 76 (seller) จริง, type OrderDetail ซ้ำ 100% field-ต่อ-field, timeline JSX ~70 บรรทัด copy-paste จริง, ไฟล์ 419 vs 448 บรรทัดตรงตามรายงาน และ drift เกิดแล้ว (buyer ใช้ bg-[var(--p-hair)] แต่ seller ยัง bg-border) พิสูจน์ว่า duplication มีต้นทุนจริง ไม่มี comment/convention ไหนบอกว่าตั้งใจแยก · Recommendation ตรงทิศ VISION.md:65+114 ที่กำหนด CustodyTimeline เป็น atom เดียวสำหรับ orders พอดี ไม่ขัดข้อเคาะใดๆ · หมายเหตุ: หน้าเหล่านี้ปิด flag marketplaceEnabled=false อยู่ severity จึงเป็น high เชิง maintenance ไม่ใช่ user-facing แต่คุ้มแก้เพราะงาน CustodyTimeline ต้องรื้อจุดนี้อยู่แล้ว

### `COMMERCE-05` — /seller/listings/[id] + create-wizard + /seller/orders/[id]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ตัวเลือกวิธีส่งถูกประกาศ 3 ที่ด้วยค่า free-text คนละชุด ("EMS/Kerry" vs "ส่งทั่วไทย (Kerry/Flash)" vs "Kerry Express") — ลงขายด้วยชุดหนึ่ง พอมาแก้ไข listing ตัวเลือกไม่ match ค่าที่เซฟไว้ ข้อมูลใน DB ปนกันหลาย format

**หลักฐาน:** step-shipping.tsx:14 vs seller/listings/[id]/page.tsx:56 vs seller/orders/[id]/page.tsx:67 — SHIPPING_OPTIONS 3 ชุดค่าไม่ตรงกัน

**วิธีแก้ที่เสนอ:** รวมเป็น constants ไฟล์เดียว (src/lib/marketplace/constants.ts) ทั้ง shipping options และ condition labels แล้ว import ทุกจุด — เก็บค่าเป็น key คงที่ แสดงผลผ่าน translation

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว file:line ตรงทั้ง 3 จุด และ harm จริงครบวงจร: wizard เซฟ "EMS/Kerry" ฯลฯ ผ่าน Zod ที่รับ string อิสระ (ไม่มี enum) ลง Listing.shipping ส่วนหน้า edit ใช้ค่าอีกชุดที่ไม่ทับซ้อนเลย เช็คด้วย .includes() → checkbox ว่างหมด + ค่าเก่าเอาออกไม่ได้จาก UI เซฟแล้ว DB ปน format จริง หน้า orders เป็นชุดที่ 3 (เขียนลง Order.shippingMethod คนละ field) แถมค่าแปลตามภาษา UI = ปนอีกทาง ไม่มีหลักฐานว่าตั้งใจ recommendation ไม่ขัดทิศดีไซน์ที่เคาะ ข้อแย้งเดียวคือ marketplace ปิด flag อยู่ แต่เป็น bug ระดับ data format ที่จะติดไปตอนเปิด flag และแก้ทีหลังต้อง migrate — คุ้มแก้ตอนนี้

### `COMMERCE-06` — orders/messages ทั้ง area
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** mapping สถานะออเดอร์ → สี/ป้าย ถูกประกาศซ้ำ 4 ที่ด้วยสีคนละระบบ: order-status-badge (yellow/cyan/emerald ดิบ), seller dashboard (semantic token), order-status-tracker.tsx:82 (emerald-500), timeline ใน orders/[id]:246 (green-500/cyan-500/amber-500) — สถานะเดียวกันสีไม่เหมือนกันข้ามหน้า และขัดระบบ semantic status token ใน globals.css

**หลักฐาน:** order-status-badge.tsx:7-35 ORDER_STATUS_CONFIG ใช้สีดิบ 7 สี (bg-yellow-500/15, blue, cyan, emerald, green, red, orange) + hardcode label ภาษาไทยไม่ผ่าน i18n · seller/page.tsx:69-77 STATUS_COLOR ใช้ semantic (bg-warning-soft/info-soft/success-soft/danger-soft) · order-status-tracker.tsx:82,103 ใช้ emerald-500 ดิบ · orders/[id]/page.tsx:246,257 timeline ใช้ green-500 ดิบ (cyan-500 อยู่ :327 panel แจ้ง SHIPPED — ส่วน amber-500:396 เป็นไอคอนดาวรีวิว ไม่เกี่ยวกับสถานะ) · ผล: SHIPPED = cyan (badge) vs info-blue (seller dash), AWAITING_PAYMENT = yellow vs warning-orange — สถานะเดียวกันคนละสีข้ามหน้า ขัด .status-success/warning/danger/info ที่ globals.css:439-442 มีอยู่แล้ว · หมายเหตุ: ทั้งโซนปิด flag marketplaceEnabled=false (SPEC.md) → เสนอลด severity เป็น medium และผูกงานนี้กับ phase Marketplace+escrow

**วิธีแก้ที่เสนอ:** สร้าง ORDER_STATUS config เดียวใน src/lib/orders (labelKey + status-token class) ให้ badge/tracker/timeline/dashboard อ่านจากที่เดียว และแทนสีดิบทั้งหมดด้วย --success/--warning/--info/--danger

**หมายเหตุจากทีม verify:** ปัญหาซ้ำซ้อน+สีคนละระบบจริง และไม่ใช่ของตั้งใจ (globals.css มี .status-* พร้อมใช้ + VISION §4 บังคับ semantic-only + ทั้งแอป adopt แล้ว เหลือโซน orders/messages ตกค้าง) แต่ evidence จุด orders/[id]:246 ผิด — บรรทัดนั้นมีแค่ green-500, cyan-500 อยู่ :327 ส่วน amber-500:396 เป็นดาวรีวิวไม่ใช่สีสถานะ · severity ควรเป็น medium ไม่ใช่ high เพราะทั้งโซนปิดด้วย marketplaceEnabled=false ยังไม่ user-visible (SPEC.md) — คุ้มแก้ตอนถึง phase Marketplace+escrow ใน VISION spine · โบนัสที่ auditor พลาด: order-status-badge hardcode label ไทย ไม่ผ่าน i18n ทั้งที่แอป TH/EN/JP — ยิ่งหนุนให้รวม config เดียวแบบ labelKey ตาม recommendation

### `COMMERCE-07` — /marketplace/[listingId]
**🟠 MED** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** บนมือถือต้อง scroll ผ่านรูปเต็มจอ + ปุ่มดูประวัติ + ชื่อ/badge ก่อนจะเห็นราคาและปุ่มซื้อ/ทักแชท — หน้า listing ที่ราคาคือคำตอบแรกที่ user ต้องการกลับอยู่ใต้ fold

**หลักฐาน:** marketplace/[listingId]/page.tsx:213 grid — มือถือเรียง gallery (aspect 63/88 เต็มกว้าง ~500px) ก่อนราคา/CTA ที่ :273

**วิธีแก้ที่เสนอ:** มือถือให้ราคา + CTA หลักขึ้นทันทีใต้ชื่อการ์ด (หรือ sticky-bottom CTA bar ตาม ACTION grammar ใน VISION §2) แล้วค่อยตามด้วย gallery เต็ม

### `COMMERCE-08` — /messages
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้าแชทว่าง (ยังไม่เคยคุย/ยังไม่เลือกห้อง) เป็นข้อความลอยๆ ไม่มีทางไปต่อ — dead-end ขัดกฎ empty state ต้องมี CTA เดียว และไม่ใช้ KumaEmptyState เหมือนหน้าอื่น

**หลักฐาน:** chat-panel.tsx:66-69 empty = <p> เปล่า · conversation-sidebar.tsx:96-99 ไม่มี CTA

**วิธีแก้ที่เสนอ:** ใช้ KumaEmptyState + ปุ่ม "ไปดูตลาด" (/marketplace) ทั้งใน sidebar เปล่าและ panel เปล่า

### `COMMERCE-09` — /messages/[listingId]
**🟠 MED** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** ช่องพิมพ์แชทติดขอบล่างสุดของ h-dvh บน route chromeless — บน iPhone home indicator ทับปุ่มส่ง และแท็บกรองใน sidebar (conversation-sidebar.tsx:71 py-1 text-xs) สูงไม่ถึง 44px

**หลักฐาน:** chat-input.tsx:52 p-3 ไม่มี pb-safe ขณะที่ chat-layout.tsx:265 เป็น h-dvh ชิดขอบล่าง

**วิธีแก้ที่เสนอ:** เติม class pb-safe (มีใน globals.css แล้ว) ที่แถบ input และขยาย tap target แท็บกรองเป็น ≥44px

### `COMMERCE-10` — /orders /seller/** /messages
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ทุกหน้า commerce เป็น client component ที่ fetch ใน useEffect แล้วโชว์ spinner ขัดกฎ "ศูนย์ spinner" (VISION §4.6) — ผู้ใช้เห็น skeleton จาก loading.tsx แวบเดียวแล้วต่อด้วย spinner คนละหน้าตา (double loading)

**หลักฐาน:** orders/page.tsx:174 LoadingState variant="spinner" · chat-layout.tsx:255 Loader2 เต็มจอ · orders/[id]/page.tsx:119 Loader2

**วิธีแก้ที่เสนอ:** ขั้นต่ำเปลี่ยน spinner เป็น LoadingState variant=skeleton-list ให้รูปร่างตรง layout จริง; ระยะยาวย้าย fetch แรกไปเป็น server component แบบ /marketplace แล้วให้ loading.tsx ทำงานจริง

### `COMMERCE-11` — /orders vs /seller/orders
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ตัวกรองสถานะออเดอร์ feature เดียวกันแต่ 2 role ใช้ UI คนละแบบ (dropdown vs แท็บเลื่อน) และ empty state ก็คนละตัว (EmptyState ที่ :194 vs KumaEmptyState ที่ :118) โดยไม่มีเหตุผล

**หลักฐาน:** orders/page.tsx:133 มือถือใช้ Select dropdown แต่ seller/orders/page.tsx:92 ใช้ SegmentedControl ใน overflow-x-auto

**วิธีแก้ที่เสนอ:** เลือกแบบเดียว (แนะนำ SegmentedControl เลื่อนแนวนอน — เห็น count ทุกแท็บ ไม่ต้องกด 2 ครั้ง) และใช้ KumaEmptyState ทั้งคู่

### `COMMERCE-12` — /seller/listings/[id]
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้าแก้ไข listing โหลดรายการทั้งร้าน (สูงสุด 100) มาหาใบเดียว — ถ้าผู้ขายมีเกิน 100 รายการ ใบเก่าจะแก้ไขไม่ได้เลย (ขึ้น not found) และเปลืองข้อมูลทุกครั้งที่เปิด

**หลักฐาน:** seller/listings/[id]/page.tsx:88-92 apiGet("/api/seller/listings?limit=100") แล้ว .find() หา id ฝั่ง client

**วิธีแก้ที่เสนอ:** เพิ่ม GET /api/listings/[id] (เช็ค ownership) หรือ query param id ที่ endpoint เดิม แล้ว fetch ใบเดียวตรงๆ

### `COMMERCE-13` — marketplace + seller/reviews
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ดาวคะแนนผู้ขายมี component 3 ตัว 3 สี (เทา/เหลืองดิบ/honey) — signal เดียวกันหน้าตาไม่เหมือนกันข้ามหน้า และ fill-yellow-400 เป็นสีนอกระบบ token

**หลักฐาน:** listing-card.tsx:41 StarRow (fill-foreground/80) vs review-section.tsx:27 (fill-yellow-400) vs seller/reviews/page.tsx:48 (fill-primary)

**วิธีแก้ที่เสนอ:** สร้าง RatingStars shared ตัวเดียว (ใช้สี honey/primary ตาม identity) แล้วแทนทั้ง 3 จุด

### `COMMERCE-14` — /marketplace
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** เส้นคั่นแถวผู้ขายใน ListingCard ใช้สีขาวโปร่ง 4% ตายตัว — ใน light mode มองไม่เห็นเลย (ขาวบนขาว) และหลุดจากระบบ hairline token

**หลักฐาน:** listing-card.tsx:135 border-t border-white/[0.04] — hardcode สีขาวแทน var(--p-hair)

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น border-[var(--p-hair)] ให้เหมือน order-card.tsx:116 และทุกจุดอื่นใน area

### 🧩 ข้อเสนอ re-compose ของ area นี้
หน้าแชทมือถือ (/messages/[listingId]) ควร re-compose ตาม VISION §5.5: บนสุดเป็น StickyContextCard ของ listing (รูป+ชื่อ+ราคา+สถานะออเดอร์ ยุบเหลือ 56px ตอน scroll) → thread เต็มจอ → action ออเดอร์/offer ทั้งหมดย้ายไป bottom-sheet ที่เรียกจากปุ่มบน context card (เลิกใช้ panel ขวาแบบ absolute overlay บนมือถือ) · desktop คง 3 คอลัมน์เดิมได้ (list · thread · order rail) — ส่วนหน้า /marketplace/[listingId] มือถือแค่สลับลำดับบล็อก (ราคา+CTA ขึ้นก่อน gallery หรือ sticky-bottom CTA) ไม่ต้องรื้อทั้งหน้า

---

<a id="content"></a>
## CONTENT — หน้า content/static

**ขอบเขตที่ตรวจ:** /about · /contact · /guide · /guide/getting-started · /guide/card-types · /guide/rarities · /guide/colors · /guide/sets · /guide/buying · /blog · /blog/[slug] · /coming-soon

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- หน้า guide landing / about / contact / blog list ใช้ PageHeader + Surface + typography token ถูกต้องและสม่ำเสมอ — กลืนเป็นแอปเดียวกับส่วนหลักแล้ว
- SEO groundwork แน่นทุกหน้า: JSON-LD (breadcrumb/FAQ/blogPosting) + canonical + metadata ครบ ไม่ต้องแก้อะไร
- ทุก DB query ในหน้า guide มี try/catch คืนค่าว่าง — DB ล่มหน้าไม่พัง เนื้อหาหลักยังอ่านได้
- โครง responsive เป็น mobile-first ตาม breakpoint discipline จริง (grid ขยายที่ sm:/lg:) ไม่มี max-md: เลยสักจุด

### `CONTENT-01` — /blog/[slug]
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** เนื้อหาบทความทั้งก้อน (dangerouslySetInnerHTML) render แบบไร้สไตล์ — Tailwind preflight ล้าง margin/ขนาด heading ทิ้งหมด ทำให้ h2/p/ul กลายเป็นกำแพงตัวอักษรแบนๆ ขนาดเดียวกัน ไม่มี bullet ไม่มีเว้นวรรคย่อหน้า

**หลักฐาน:** blog/[slug]/page.tsx:174 ใช้ class `prose prose-neutral dark:prose-invert` แต่ repo ไม่มี @tailwindcss/typography และ globals.css ไม่มี .prose (grep = 0)

**วิธีแก้ที่เสนอ:** เพิ่มสไตล์บทความ: ติดตั้ง @tailwindcss/typography (เพิ่ม dependency — ถามเบสก่อน) หรือเขียน section `.prose` เล็กๆ ใน globals.css เองโดย map กับ token ที่มี (.text-h2/.text-body) ซึ่งคุมหน้าตาได้ตรง identity กว่า

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้วตรงทุกจุด: blog/[slug]/page.tsx:174 ใช้ prose ครอบ dangerouslySetInnerHTML จริง, @tailwindcss/typography ไม่อยู่ใน node_modules/package-lock, ไม่มี @plugin directive และไม่มี .prose ใน globals.css หรือ CSS ที่ import (shadcn, tw-animate) เลย ขณะที่ content เป็น HTML ดิบจาก admin textarea (blog-form.tsx "เนื้อหา (HTML)") และ preflight ของ Tailwind v4 ล้างสไตล์ h2/p/ul จริง — เนื้อหาจึง render แบนทั้งก้อน class prose ที่ค้างอยู่ชี้ว่าตั้งใจจะมีสไตล์แต่ไม่เคยต่อให้ครบ ไม่ใช่ design decision · recommendation ไม่ขัดทิศที่เคาะไว้ และตัวเลือกเขียน .prose เอง map กับ token สอดคล้อง AGENTS.md ที่สุด

### `CONTENT-02` — /guide/* (6 หน้าลูก)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้า guide ทุกหน้า copy-paste บล็อกเดียวกัน 4 แบบ (แหล่งอ้างอิง / กล่อง Tip / ปุ่มหน้าก่อน-ถัดไป / แถบรูปตัวอย่าง) — จะแก้ convention ใดครั้งเดียวต้องไล่ diff 6 ไฟล์ และเริ่ม drift แล้ว (หน้า buying หลุด pattern)

**หลักฐาน:** บล็อก Sources เกือบ identical 5 ไฟล์ (getting-started:483-518 ≈ card-types:505-535 ≈ rarities:638-657 ≈ colors:430-451 ≈ sets:415-448) · Info callout ซ้ำ 8+ จุด · prev/next nav ซ้ำ 6 ไฟล์ · แถบรูปการ์ดตัวอย่างซ้ำ 4 ไฟล์

**วิธีแก้ที่เสนอ:** สกัดเป็น shared components ชุดเดียวใน src/components/guide/ เช่น GuideCallout, GuideSourceList, GuidePrevNext, CardThumbStrip แล้วให้ทุกหน้าเรียกใช้

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว evidence ตรงทุกจุด: Sources block ซ้ำ 5 ไฟล์ที่ line ranges ตามอ้างเป๊ะ · Info callout wrapper เหมือนกัน 8 จุดพอดี (ต่างแค่สี) · prev/next nav ซ้ำครบ 6 ไฟล์ · แถบรูป aspect-[63/88] ซ้ำ 4 ไฟล์ · drift เกิดแล้วจริง (buying/page.tsx:178 ใช้ "← Sets" text เปล่าไม่มี icon/hover class ต่างจากอีก 5 ไฟล์ และไม่มี Sources block · sets แตก internal-link variant) — ไม่ใช่ของตั้งใจ: VISION/AGENTS ไม่ได้อนุญาต และหน้า guide มี precedent ใช้ shared components อยู่แล้ว (Breadcrumb, RelatedPages) การสกัด GuideCallout/GuideSourceList/GuidePrevNext จึงเข้าแนวเดิม · recommendation เป็น refactor ล้วนไม่เปลี่ยนหน้าตา ไม่ขัดทิศใดที่เคาะไว้ — ข้อเดียวที่ควรรู้ตอนจัดคิว: เบสให้ priority งานเห็นผลด้วยตามากกว่า refactor ล่องหน เหมาะทำพ่วงตอนแตะหน้า guide ครั้งถัดไป

### `CONTENT-03` — /guide/card-types, /guide/rarities (+ทุกหน้า guide)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้า guide เป็น SEO surface แต่ทุก request ดึงการ์ดทั้งตาราง (หลายพันแถว) มาเพื่อโชว์รูปตัวอย่างแค่ 4 ใบต่อกลุ่ม และ force-dynamic ทำให้ไม่มี cache เลย — หน้าโหลดช้าทั้งที่เนื้อหาแทบไม่เปลี่ยน

**หลักฐาน:** card-types/page.tsx:191-201 และ rarities/page.tsx:233-243 = prisma.card.findMany ทั้งตารางไม่มี take · ทุกหน้า guide ประกาศ force-dynamic (เช่น getting-started:27)

**วิธีแก้ที่เสนอ:** จำกัด query (take ต่อกลุ่ม หรือ query แยกต่อ type แบบมี limit) และเปลี่ยนหน้า guide เป็น static/ISR + client-convert ภาษา ตาม pattern สถาปัตยกรรม i18n ที่วางไว้แล้วสำหรับหน้า static

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว evidence แม่นทุกจุด: card-types:191-201 และ rarities:233-243 เป็น findMany ไม่มี take จริง (นับจาก DB = 2,756 แถวต่อ request เพื่อโชว์ 4 ใบ/กลุ่ม) และ force-dynamic มีครบทั้ง 7 หน้า guide รวม getting-started:27 · ไม่ใช่ของตั้งใจ — force-dynamic มาจาก getServerLanguage อ่าน cookie ซึ่ง memory i18n ของโปรเจคเองระบุว่าห้ามใช้กับหน้าที่ควร static · recommendation ไม่ขัดทิศใดที่เคาะไว้ (ทิศที่ล็อกเป็นเรื่อง UI ล้วน) และตรงกับ pattern client-convert ที่ sanctioned แล้วใน i18n architecture · ข้อควรระวังตอนแก้: หน้า guide มี export const metadata ต้องคง server component แล้วย้ายข้อความ i18n ลง client child แบบ home-seo-content

### `CONTENT-04` — /blog/[slug]
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** บนมือถือมีปุ่มย้อนซ้อน 2 อัน (วงกลม chevron จาก Breadcrumb ไป /blog + ลิงก์ 'บทความทั้งหมด' ที่ไปที่เดียวกัน) และบน desktop breadcrumb ชิดขอบซ้ายเต็มหน้าจอ ขณะที่ตัวบทความอยู่กึ่งกลาง max-w-3xl — ขอบซ้ายไม่ตรงกัน

**หลักฐาน:** blog/[slug]/page.tsx:103-109 Breadcrumb อยู่นอก <article className="mx-auto max-w-3xl"> (บรรทัด 111) · บรรทัด 113-119 มีลิงก์ "บทความทั้งหมด" + ArrowLeft ซ้ำอีกอัน

**วิธีแก้ที่เสนอ:** ย้าย Breadcrumb เข้าไปใน container max-w-3xl เดียวกับ article และตัดลิงก์ 'บทความทั้งหมด' ทิ้ง (ให้ Breadcrumb ทำหน้าที่ย้อนทางเดียว)

### `CONTENT-05` — /blog/[slug]
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** การนับวิวเป็น DB write แบบ blocking ก่อน render — หน่วง TTFB ทุกครั้งที่เปิดบทความ และนับซ้ำทุก refresh/บอท ทำให้เลขวิวเฟ้อไม่น่าเชื่อถือ

**หลักฐาน:** blog/[slug]/page.tsx:76-79 `await prisma.blogPost.update({ viewCount: increment })` ก่อน return JSX ทุก request

**วิธีแก้ที่เสนอ:** ย้าย increment ไปทำหลังตอบหน้าแล้วด้วย after() ของ next/server (fire-and-forget) — ถ้าอยากแม่นขึ้นค่อยกรอง bot user-agent ทีหลัง

### `CONTENT-06` — /coming-soon
**🟠 MED** · ด้าน: a11y · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** interactive ซ้อน interactive เป็น HTML ที่ผิดและ screen reader อ่านสับสน — และหน้านี้เป็น dead-end มีแค่ปุ่มกลับหน้าแรก ทั้งที่ VISION §5.7 ระบุว่าเกม coming-soon ควรมี notify-me ให้ผู้ใช้ทิ้ง intent ไว้

**หลักฐาน:** coming-soon/page.tsx:57-62 `<Link href="/"><Button>…</Button></Link>` — a ครอบ button (ทั้ง repo ใช้ Button render={<Link/>})

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น Button render={<Link href="/"/>} ตาม pattern repo และเพิ่ม CTA รอง 'แจ้งเตือนเมื่อเปิด' (เก็บ email/LINE) ให้หน้าไม่ตัน

### `CONTENT-07` — /guide/* (6 หน้าลูก) + /blog/[slug]
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **M**

**ปัญหา:** หน้าลูก guide ทั้ง 6 และหน้าบทความ blog ประกอบ header เอง ไม่ผ่าน PageHeader — บนมือถือเลยไม่ได้ iOS large-title (ได้ 28px แทน 34px) ต่างจาก guide landing / about / contact / blog list ที่เป็นพี่น้องกัน ทำให้ area เดียวกันหัวหน้าไม่เท่ากัน

**หลักฐาน:** getting-started:167-184 hand-roll Breadcrumb + h1.text-h1 + p.text-lg — ขณะที่ page-header.tsx:27-30 เขียนกำกับว่าห้าม hand-roll และใช้ .text-large-title (34px มือถือ)

**วิธีแก้ที่เสนอ:** เปลี่ยนหน้าลูกทั้งหมดมาใช้ PageHeader (รับ breadcrumb + title + description อยู่แล้ว) — ได้ทั้ง large-title มือถือและ subtitle token ฟรี

### `CONTENT-08` — /guide/buying
**🟠 MED** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า buying คือหน้าที่ตกยุคสุดในกลุ่ม guide: ปุ่ม nav ไม่เข้าชุด, วงกลมเลขลำดับแทบมองไม่เห็น (สี muted จางอยู่แล้วยังเอา opacity 10% ซ้ำ), ใช้ emoji/เครื่องหมายพิมพ์แทน lucide icon ที่ทั้งแอปใช้ — ดูเป็นหน้าจากเว็บคนละตัว

**หลักฐาน:** buying/page.tsx:180 ปุ่มย้อนเป็นข้อความ "← Sets" เปล่า (ทุกหน้าพี่น้องใช้ ArrowLeft icon + motion) · :142 เลขลำดับใช้ bg-muted/10 จนกลืนหาย · :119,123,153 ใช้ ✓/✗/📊 แทน icon system

**วิธีแก้ที่เสนอ:** ปรับให้เข้าชุดพี่น้อง: prev/next ใช้ pattern เดียวกับหน้าอื่น, เลขลำดับใช้ bg-primary/10 text-primary แบบ getting-started, แทน ✓/✗/📊 ด้วย lucide icon (Check/X/BarChart3)

### `CONTENT-09` — /guide/getting-started, /guide/rarities, /guide/card-types
**🟠 MED** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้า guide สาดสีจัดจ้าน 8+ hue บน chrome ขัด identity espresso-neutral + honey<5% — สีที่เป็นของจริงของโดเมน (6 สีการ์ด, สี rarity tier) มีเหตุผล แต่สีตกแต่ง (icon เฟสเทิร์น, icon ปัจจัยราคา, กล่อง Tip 4 สี) เลือกสีตามใจ ไม่ผูกกับ token ระบบ

**หลักฐาน:** getting-started:46-76 phase icons ใช้ bg-emerald/blue/amber/rose/purple-500 ทึบ · rarities:157-198 price factors สุ่ม 6 hue · hex hardcode inline ทั่วไฟล์ (#EF4444, #EC4899 ฯลฯ)

**วิธีแก้ที่เสนอ:** คงสีเฉพาะจุดที่สีคือข้อมูล (สีการ์ด/rarity) แล้วเปลี่ยนสีตกแต่งเป็น neutral (bg-muted + text-muted-foreground) กับ honey accent จุดเดียว — กล่อง Tip ใช้ semantic token (--info/--warning) แทนสุ่ม hue

### `CONTENT-10` — /guide/getting-started, /guide/rarities, /guide/sets, /guide/card-types
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หัวข้อระดับเดียวกันในหน้าเดียวกันสลับระหว่าง text-h2 (22px bold) กับ text-xl font-semibold (20px semibold) — ขนาด/น้ำหนัก font กระโดดแบบไม่มีเหตุผล และขัดกฎ AGENTS.md เรื่องใช้ semantic token

**หลักฐาน:** getting-started:436, rarities:503, sets:324 ใช้ `text-xl font-semibold` เป็นหัว section ขณะที่ section พี่น้องในหน้าเดียวกันใช้ text-h2 · intro 5 หน้า hand-roll `text-lg leading-relaxed text-muted-foreground`

**วิธีแก้ที่เสนอ:** แทนทุก `text-xl font-semibold` ที่เป็นหัว section ด้วย text-h2 และเปลี่ยน intro paragraph เป็น token เดียว (text-body หรือ class ใหม่หน้าเดียว) ให้ 6 หน้าตรงกัน

### `CONTENT-11` — /guide/sets
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้าคู่มือ 'ระบบชุดการ์ด' ทำตัวเป็นหน้า browse ซ้ำกับ /sets ทั้งหน้า — scroll ยาวมากบนมือถือ, เนื้อหา educational (โครงสร้าง pack, card code) จมอยู่ท้าย และมีสอง surface โชว์ข้อมูลเดียวกันให้ดูแล

**หลักฐาน:** sets/page.tsx:337-403 render รายชื่อชุดทั้งหมดจาก DB ทุกชุด ทั้งที่ :326-333 มีลิงก์ 'ดูทุกชุด' ไป /sets อยู่แล้ว

**วิธีแก้ที่เสนอ:** จำกัดรายการต่อกลุ่มเหลือ 4-5 ชุดล่าสุด + ปุ่ม 'ดูทั้งหมด N ชุด' ลิงก์ไป /sets — หน้า guide สอน concept ส่วนหน้า /sets เป็นที่ browse

### `CONTENT-12` — /blog
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** โพสต์ที่ไม่มีรูปปกจะหาย block รูปทั้งก้อน ทำให้การ์ดใน grid สูงไม่เท่ากันแบบสุ่ม ดูไม่เรียบร้อยเมื่อปนกัน

**หลักฐาน:** blog/page.tsx:84-94 block รูป aspect-[16/9] render เฉพาะเมื่อ post.coverImage มีค่า

**วิธีแก้ที่เสนอ:** ใส่ placeholder คงสัดส่วน 16/9 เสมอ (พื้น bg-muted + logo หมี Meecard จางๆ) ให้ grid นิ่งทุกกรณี

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่มีหน้าไหนต้องรื้อทั้งหน้า — โครง layout ของทุกหน้าใน area นี้ใช้ได้แล้ว (single column max-w-3xl สำหรับ prose, grid 2-3 คอลัมน์สำหรับ tile) ปัญหาหลักคือ (1) บทความ blog ไร้สไตล์เพราะ .prose ไม่มีจริง (2) การ copy-paste ข้าม 6 หน้า guide และ (3) หน้า buying ที่ตกยุค — ทั้งหมดแก้ระดับ component/token ได้โดยไม่ต้อง re-compose

---

<a id="admin"></a>
## ADMIN — Admin (ตรวจแบบสรุป)

**ขอบเขตที่ตรวจ:** /admin (dashboard) · /admin/sets · /admin/cards + /admin/cards/[id] · /admin/drop-rates · /admin/yuyutei-matching · /admin/snkrdunk-matching · /admin/image-matching · /admin/honey (ภาพรวม/ranks/missions/shop/achievements/raffle/events) · /admin/blog + blog/[id] · /admin/users · /admin/config · /admin/logs · /admin-login · src/components/admin/** (17 shared components)

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- มี shared admin kit จริงและถูกใช้กว้าง: AdminPage/AdminPageHeader/AdminPanel/AdminSaveBar/AdminToolbar/ConfirmDialog — เกือบทุกหน้า compose จากชุดเดียวกัน จังหวะ spacing สม่ำเสมอ
- AdminShell ดีมาก: sidebar จัดกลุ่ม 4 หมวด + ย่อได้ (จำสถานะใน localStorage) + mobile ใช้ Sheet + theme toggle — chrome นิ่งทั้ง ~40 หน้า
- Mutation UX เป็นระบบ: ทุกฟอร์มใช้ AdminSaveBar (sticky, โผล่เมื่อ dirty) + adminFetch + toast + confirm dialog ก่อนลบ — สำหรับเครื่องมือภายในถือว่าเกินมาตรฐาน
- Dashboard ชี้งานได้จริง: การ์ดคุณภาพข้อมูล (ชื่อ EN/TH/รูป) กดแล้ว deep-link ไป /admin/cards?missing=... ต่องานได้ทันที ไม่ใช่แค่ตัวเลขโชว์

### `ADMIN-01` — /admin/honey/missions/* + /admin/honey/shop
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** ตาราง honey (เทมเพลต/ตารางเวลา/โบนัส/ร้านค้า/พรีวิว) บนมือถือต้องเลื่อนแนวนอน 7 คอลัมน์ ขัดกฎใน AGENTS.md ตรงๆ ที่ห้ามพึ่ง overflow-x-auto อย่างเดียว ปุ่มแก้ไข/ลบเป็น icon-xs (~24px) เล็กกว่า tap target 44px มาก

**หลักฐาน:** templates-list.tsx:95, schedule-list.tsx:83, bonus-list.tsx:94, honey-shop-manager.tsx:113 — ทุกไฟล์ใช้ overflow-x-auto ครอบ <table> โดยไม่มี list fallback ใต้ sm

**วิธีแก้ที่เสนอ:** แก้พร้อมข้อบน — AdminDataTable มี mobile fallback เป็น default อยู่แล้ว migrate แล้วปัญหานี้หายเอง ไม่ต้องออกแบบใหม่

**หมายเหตุจากทีม verify:** file:line ตรงเป๊ะทั้ง 4 จุด ไม่มี sm fallback ในไฟล์ไหนเลย (แถมมีไฟล์ที่ 5: preview-client.tsx:66 ที่ evidence ไม่ได้ list) ขัด AGENTS.md ตรงตัวและไม่ใช่ของตั้งใจ — AdminDataTable มี mobile fallback เป็น default จริงและ admin/cards+logs+users migrate แล้ว หน้า honey คือ straggler recommendation ไม่ขัดทิศที่เคาะ (ทิศพวกนั้นเป็นฝั่ง user-facing, honey<5% คือ budget สี accent ไม่ใช่หน้า admin) จุดคลาดเคลื่อนจิ๋วใน prose: icon-xs จริงๆ = 28px ไม่ใช่ ~24px และมีแค่ templates ที่ 7 คอลัมน์ (อีก 3 ตาราง = 6) — ไม่เปลี่ยนสาระ ยังต่ำกว่า tap target 44px มาก

### `ADMIN-02` — admin ทั้ง section (blog, honey templates/schedule/bonus/shop, transaction list)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** มี AdminDataTable ที่ทำครบทุกอย่างอยู่แล้ว แต่มีแค่ 3 หน้าใช้ (cards, users, logs) — อีก 8+ หน้าเขียนตารางเองโดย copy หัวตาราง/สไตล์เดิมซ้ำๆ หน้า blog ถึงขั้นเขียน mobile list fallback เองทั้งชุดซ้ำกับที่ component กลางมีให้ฟรี

**หลักฐาน:** admin-data-table.tsx:64 มีครบ (sort/select/skeleton/empty/mobile fallback) แต่ grep พบใช้แค่ 3 หน้า ขณะที่ 11 ไฟล์เขียน <table> เอง เช่น blog/page.tsx:108-204, templates-list.tsx:95

**วิธีแก้ที่เสนอ:** ย้ายหน้า list ทั้งหมด (blog, honey templates/schedule/bonus/shop, transaction list) ไปใช้ AdminDataTable แล้วลบตารางที่เขียนเอง — เหลือ hand-rolled ได้เฉพาะ matching tools ที่โครงพิเศษจริง

**หมายเหตุจากทีม verify:** ตรวจกับโค้ดจริงแล้วตรงทุกจุด: AdminDataTable (admin-data-table.tsx:64) มีครบ sort/select/skeleton/empty/mobile fallback แต่มี consumer แค่ 3 ไฟล์ (cards-browser, logs, users-manager) ขณะที่ 11 ไฟล์เขียน <table> เอง · blog/page.tsx:108-204 เขียนทั้ง desktop table + mobile ul fallback เองซ้ำกับของกลางจริง · หนักกว่าที่รายงานด้วยซ้ำ — ตาราง honey (bonus/templates/preview/schedule/shop) ใช้ overflow-x-auto เดี่ยวๆ ไม่มี mobile fallback ขัดกฎ AGENTS.md ตรงๆ · ไม่พบหลักฐานว่าตั้งใจ partial adoption และไม่ขัดทิศ redesign (เป็น admin internal, component กลาง render สไตล์เดียวกับตารางที่เขียนมือ) · จุดเดียวที่คลาด: templates-list ตารางอยู่บรรทัด 96 ไม่ใช่ 95 (95 คือ div ครอบ) — เล็กเกินกว่าจะนับเป็น corrected

### `ADMIN-03` — /admin-login
**🟠 MED** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า login แอดมินเป็น shadcn-zinc ดำเย็นล้วน hardcode ทั้งหน้า ไม่แตะ token espresso เลยและไม่ตอบสนอง light mode — เป็นหน้าเดียวใน section ที่หลุดจาก identity ทั้งระบบ (VISION เรียกลุคนี้ว่า "generic" ตรงๆ)

**หลักฐาน:** admin-login/page.tsx:58 bg-zinc-950, :67 bg-zinc-900 ring-white/10, :133 red-500 — ไม่มี token ของธีมสักตัว

**วิธีแก้ที่เสนอ:** สลับ class zinc/white เป็น token (bg-background, bg-card, text-muted-foreground, border-[var(--p-hair)], .status-danger) — โครงหน้าเดิมดีอยู่แล้ว แก้แค่สี

### `ADMIN-04` — /admin/config
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ค่าตั้งระบบทุกตัวเป็นช่องพิมพ์ข้อความล้วน รวมถึง flag เปิด/ปิด Marketplace (ต้องพิมพ์ true/false เอง) และค่าธรรมเนียม % — พิมพ์ "True" หรือ "5%" ผิดนิดเดียวก็บันทึกผ่านเงียบๆ แล้วพังทั้งโซนโดยไม่รู้ตัว

**หลักฐาน:** config/page.tsx:37-43 marketplace_enabled เป็น free-text placeholder "false" และ ~บรรทัด 279 ทุก field render เป็น <Input> ตัวเดียวกันหมด

**วิธีแก้ที่เสนอ:** เพิ่ม type ให้ ConfigField (boolean → Switch, number → input number มี min/max, cron → text + ตัวอย่าง) และ validate ก่อนบันทึก ปัดค่าที่ parse ไม่ได้ทิ้งพร้อม toast บอก

### `ADMIN-05` — /admin/yuyutei-matching + honey + shared admin components
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** สีสถานะ/ปุ่มใช้ 2 ภาษาปนกัน: พบ raw palette (green-600, violet-600, red-500, amber-500, blue-500) ~35 จุดใน 9 ไฟล์ ทั้งที่มี token semantic (success/warning/danger/info + .status-*) และ AdminStatusBadge อยู่แล้ว — บางทีปนกันในหน้าเดียวกันเอง และมี StatusBadge ซ้ำ 2 ตัว (matching-ui.tsx vs snkrdunk/match-ui.tsx ที่ wrap AdminStatusBadge ถูกแล้ว)

**หลักฐาน:** yuyutei-match-row.tsx:260,271 (bg-violet-600/bg-green-600), matching-ui.tsx:10-15 (StatusBadge สีดิบ) — สวนทาง STATUS_TABS ใน yuyutei-match-client.tsx:44-48 ที่ใช้ bg-success/info/warning/danger ถูกต้อง

**วิธีแก้ที่เสนอ:** กวาดเปลี่ยน raw palette เป็น semantic tone ทั้ง 9 ไฟล์ ลบ StatusBadge ใน matching-ui.tsx ให้ทุก matching page ใช้ wrapper แบบ snkrdunk และเปลี่ยน tone map ใน admin-bulk-bar.tsx:82-89 เป็น token — ไม่งั้นเปลี่ยนธีมทีไรหลุดเป็นหย่อมๆ

### `ADMIN-06` — ฟอร์ม honey/blog ทั้งหมด (event, achievement, template, bonus, schedule, shop, raffle)
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ฟอร์ม 7+ ตัว copy โครงเดียวกันทั้งชุด: initialState / dirty เทียบ JSON.stringify / startTransition+adminFetch+toast / router.push+refresh / hack getElementById().requestSubmit() — เพิ่ม entity ใหม่ทีไรต้อง copy ~80 บรรทัดเดิม และแก้ pattern กลางต้องไล่แก้ทุกไฟล์

**หลักฐาน:** event-form.tsx:84 dirty ด้วย JSON.stringify, :162-164 document.getElementById(FORM_ID)?.requestSubmit() — โครงเดียวกันซ้ำใน achievement-form.tsx:102 และฟอร์มอื่นอีก 5+ ไฟล์

**วิธีแก้ที่เสนอ:** สกัดเป็น hook useAdminForm(initial, {url, redirect}) คืน {form, setField, dirty, saving, submit} และให้ AdminSaveBar รับ prop formId แล้ว render <Button type="submit" form={formId}> แทน hack getElementById

### `ADMIN-07` — /admin (dashboard)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** relativeTime ถูกเขียนซ้ำใน dashboard เพราะ signature ต่างกันนิดเดียว (รับ Date vs string) — ถ้าอยากเปลี่ยนรูปแบบเวลา ต้องแก้ 2 ที่

**หลักฐาน:** admin/page.tsx:124-134 เขียนฟังก์ชัน relativeTime เองทั้งก้อน ทั้งที่ lib/utils/time.ts:8 export relativeTime อยู่แล้ว (matching pages ก็ใช้ตัว lib ผ่าน matching-ui)

**วิธีแก้ที่เสนอ:** ขยาย relativeTime ใน lib/utils/time.ts ให้รับ Date | string แล้วลบตัวโลคัลใน admin/page.tsx ทิ้ง

### `ADMIN-08` — /admin/honey/* (layout)
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** แท็บ 7 อันของ honey เขียนเองกับมือ แต่ sub-tab ของ missions ที่ซ้อนอยู่ข้างในใช้ AdminSubNav — สอง tab bar คนละ implementation สไตล์ต่างกันเล็กน้อย ซ้อนกันบนจอเดียว

**หลักฐาน:** honey/layout.tsx:42-59 เขียน tab nav เอง ขณะ missions/layout.tsx:11-18 ใช้ AdminSubNav ที่เป็น component กลาง

**วิธีแก้ที่เสนอ:** ให้ honey/layout.tsx ใช้ AdminSubNav ตัวเดียวกัน (เพิ่ม prop icon ถ้ายังไม่รองรับ) แล้วลบ nav ที่เขียนเอง

---

<a id="kit"></a>
## KIT — Cross-cutting: Component kit (ui + shared)

**ขอบเขตที่ตรวจ:** src/components/ui/** (23 ไฟล์ อ่านครบ) · src/components/shared/** (42 ไฟล์ อ่านครบ) · src/components/kuma/kuma-empty-state.tsx · src/components/layout/** (13 ไฟล์ อ่านครบ) · จุดใช้งานอ้างอิง: watchlist-list-view, market-table, assets-table, card-detail, header, more-client

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- Surface ถูก adopt กว้างจริง (118 ไฟล์ import) — การใช้ .panel ดิบๆ ในหน้า feature เหลือแค่ ~6 จุด แปลว่า primitive หลักชนะแล้ว
- SegmentedControl เป็น canonical ที่แข็งแรง: 16 หน้าใช้, ทำ role=radiogroup ถูกต้อง, มี locked-tier state ในตัว
- GroupedList (iOS grouped-inset) ต่อยอดจาก ListRow ตามเจตนา 'row implementation เดียว' และ docstring ทุกไฟล์อธิบายว่าตัวไหน canonical/แทนอะไร — วัฒนธรรมเอกสารในโค้ดดีมาก
- HeroNumber / TypewriterText / MiniSparkline เคารพ prefers-reduced-motion ตาม VISION §4.7 ครบ

### `KIT-01` — layout/header.tsx · shared/watchlist-star.tsx · header-constants.ts
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** chrome หลักใช้สีดิบนอกระบบ token: น้ำเงินบน bookmark (ขัดกฎ 'accent เดียว = honey, icon อื่น neutral'), amber-500 (ส้มจัด) ไม่ใช่ honey-gold #E9B970 — ผลคือใน CardActionRow เดียวกัน ดาว watchlist เป็น amber แต่ปุ่ม compare เป็น honey สองโทนทองตีกันเอง ดูไม่ premium

**หลักฐาน:** header.tsx:183 Bookmark ใช้ text-blue-500, :167 Star ใช้ fill-amber-500, :198 ping bg-red-400; watchlist-star.tsx:73-83 ใช้ amber-400/500 ขณะ compare-button ใช้ text-primary

**วิธีแก้ที่เสนอ:** กวาด amber-*/blue-*/red-* บน chrome ให้เหลือ token: active/selected → primary(honey), แจ้งเตือน → --danger; ยกเว้นได้เฉพาะ tier-gold ถ้าตั้งใจ ก็ควรประกาศเป็น token --tier-gold ไม่ใช่ amber-500 กระจาย 6 ไฟล์

**หมายเหตุจากทีม verify:** ตรวจโค้ดจริงแล้ว evidence ตรงทุกบรรทัด: header.tsx:167 amber star (ตีกับ honey pill รอบตัวมันเอง), :183 blue bookmark, :198 red-400 ping, watchlist-star.tsx:73-83 amber ขณะ compare-button.tsx:125-128 ใช้ text-primary — และ card-action-row.tsx:37-50 ยืนยันสองปุ่ม render ติดกันจริง. VISION.md L24-27 เขียนกฎชัด: honey = accent เดียว, icons = neutral, แดงห้ามใช้บน chrome (--danger token มีอยู่แล้วใน globals.css). ไม่พบหลักฐานว่าตั้งใจ (ไม่มี comment/history/memory) — เป็นสีเก่าที่รอด redesign sweep. Recommendation สอดคล้อง VISION ไม่แตะโครง layout จึงไม่ขัดทิศที่เคาะแล้ว

### `KIT-02` — shared/price-display.tsx · shared/delta-text.tsx · globals.css
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** delta ราคามี 2 atom ที่ใช้คนละ token vocabulary (price-up/down vs success/danger) ทั้งที่ค่าเท่ากัน — คือ drift ตรงตามที่ VISION §4 เตือน และ atom `PriceTag` ใน VISION §3 ยังไม่มีจริง งานถูกหั่นเป็น PriceDisplay/Price/PriceUsd/DeltaText ที่ format ลูกศร/สี/ชิปคนละแบบ

**หลักฐาน:** price-display.tsx:70-71 ใช้ text-price-up/down, delta-text.tsx:58-59 ใช้ text-success/text-danger — ตรงตามรายงาน แต่ globals.css สอง token set ค่าเท่ากันเฉพาะ light mode (--price-up:137 = --success:144 = #34C759 · --price-down:138 = --destructive:97 = #FF3B30); ใน dark mode --price-down = #FF6155 (บรรทัด 208 จงใจ push ให้อิ่มขึ้น ตาม comment 205-207) ขณะที่ --danger = var(--destructive) = #FF7A6B (บรรทัด 177/219) → delta ราคาลงใน dark mode render คนละสีจริงระหว่างสอง atom ซึ่งขัดกับ doc comment ของ DeltaText เอง (delta-text.tsx:33-34 เคลม "theming stays consistent") — drift เป็น visual bug ที่มองเห็นแล้ว ไม่ใช่แค่ duplication

**วิธีแก้ที่เสนอ:** สร้าง PriceTag ตัวเดียว (ราคา + ลูกศร + delta, ใช้ --price-up/down เท่านั้น) แล้วให้ DeltaText/ชิป change ใน PriceDisplay ยุบเข้าไป; สงวน success/danger ไว้กับ status ที่ไม่ใช่เงิน (badge/form)

**หมายเหตุจากทีม verify:** ปัญหาจริงและหนักกว่าที่รายงาน: file:line ทุกจุดตรงโค้ดปัจจุบัน, PriceTag ตาม VISION §3 ยังไม่มีจริง (globals.css:590 comment "Adopt on PriceTag in P1" ยืนยัน; ตัวใน admin/snkrdunk-matching เป็น namesake คนละตัว) และ recommendation ตรงทิศ VISION ทุกข้อ แต่ evidence "สอง token ค่าเดียวกัน" จริงแค่ light mode — dark mode ค่าฝั่งลงแยกกันแล้ว ทำให้ราคาตกแสดงคนละสีจริงบนจอระหว่าง PriceDisplay กับ DeltaText ไม่ใช่แค่ token ซ้ำ

### `KIT-03` — ui/card.tsx · layout/section.tsx · layout/section-card.tsx · ui/separator.tsx
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ไฟล์ kit 4 ตัวเป็น orphan ไม่มีใคร import เลย (~300 บรรทัด) โดย Section/SectionCard ทับหน้าที่กับ shared/section-head.tsx ที่ชนะไปแล้ว — ของตายพวกนี้หลอก AI/คนใหม่ว่าเป็นส่วนหนึ่งของ kit ทางการ

**หลักฐาน:** grep ทั้ง src: import "@/components/ui/card" = 0, layout/section = 0, layout/section-card = 0, ui/separator = 0

**วิธีแก้ที่เสนอ:** ลบทั้ง 4 ไฟล์ (ขออนุมัติก่อนตาม permission) และประกาศใน docstring ว่า SectionHead = ตัว heading ทางการ, Surface = ตัว card ทางการ

**หมายเหตุจากทีม verify:** ตรวจจริงแล้ว: 4 ไฟล์มีอยู่ (รวม 297 บรรทัด ≈ ~300 ตามอ้าง) และ import = 0 ทุกรูปแบบ (alias/relative/dynamic/barrel — 2 ไฟล์ profile ที่ใช้ชื่อ Card นิยาม local เอง ไม่ได้ import ui/card) · ไม่มี doc/comment ไหนสงวนไว้ · VISION.md L68 เคาะ Surface เป็นการ์ดทางการ + SectionHead ใช้จริง 12+ ไฟล์ ยืนยันว่า Section/SectionCard แพ้แล้วจริง · ui/card+separator เป็น shadcn stock เพิ่มกลับด้วย CLI ได้ ลบเสี่ยงต่ำ · PLAN.md L86 มี precedent orphan-cleanup แบบเดียวกันอยู่แล้ว · recommendation ไม่ขัดทิศใดที่เคาะไว้ และระบุขออนุมัติก่อนลบถูกต้องตาม permission

### `KIT-04` — ui/list-row.tsx vs table fallbacks ทั้งแอป
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: โครงโค้ด · จอ: มือถือ · effort: **L**

**ปัญหา:** ListRow คือ atom ที่ VISION §3 ระบุว่า 'มีแล้ว' สำหรับ table→list fallback ทุกจุด แต่ในความจริงไม่มี fallback ตัวไหนใช้เลย — watchlist ถึงขั้นสร้าง component ชื่อ ListRow ซ้อนชื่อกันคนละหน้าตา ทำให้ density/tap-target แต่ละหน้าไม่เท่ากันและแก้ทีต้องแก้หลายที่

**หลักฐาน:** ui/list-row.tsx มี importer เดียวคือ ui/grouped-list.tsx (grouped/settings — ไม่ใช่ table→list fallback) ✓; watchlist-list-view.tsx:102 ประกาศ local function ListRow ชื่อชนจริง (ไม่ชน compile เพราะไม่ได้ import ตัว ui แต่ชวนสับสน) ✓; assets-table/mobile-card.tsx:40 hand-roll จริง ✓; แก้: market-table.tsx:66 เป็นแค่ container ของ mobile fallback — row ที่ hand-roll จริงคือ MobileCardItem ใน src/components/home/mobile-card-item.tsx:35 (min-h-[52px] ต่ำกว่ามาตรฐาน 56px ของ ListRow); เพิ่ม: (1) นี่คือ regression — PLAN.md P1.3 เคย adopt ListRow ใน card-table + most-valuable แล้ว แต่ไฟล์ถูกลบใน commit eb6cdec (dead-code cleanup) โดย AGENTS.md ยังอ้าง card-table.tsx เป็นตัวอย่าง pattern ทั้งที่ไฟล์ไม่มีแล้ว (2) docstring ของ list-row.tsx อ้าง REDESIGN.md §4.3 ซึ่งไฟล์นั้นไม่มีในโปรเจคแล้ว (3) ข้อจำกัดต่อทาง (ก): row ของ watchlist/assets/market มี interactive หลายชิ้นต่อแถว (checkbox, pin, alert, edit menu, CardImageButton) แต่ ListRow ปัจจุบัน render ทั้งแถวเป็น Link/button เดียว — nested interactive ทำไม่ได้ตาม HTML/a11y ต้องรื้อ API ไม่ใช่แค่ "เพิ่ม slot"

**วิธีแก้ที่เสนอ:** เลือกทาง: (ก) migrate mobile row ของ watchlist/market/assets มาใช้ ui/ListRow (เพิ่ม slot ที่ขาด เช่น checkbox/sparkline) หรือ (ข) ถ้า row พวกนี้ซับซ้อนเกิน ให้เปลี่ยนชื่อ local ListRow และเขียนบน docstring ว่า ListRow ใช้เฉพาะ grouped/settings — ห้ามปล่อยชื่อชนแบบนี้

**หมายเหตุจากทีม verify:** ปัญหาจริง: VISION.md:67 เคลม ListRow "(มีแล้ว)" สำหรับทุก table→list fallback แต่ importer เดียวคือ grouped-list.tsx (settings/grouped ไม่ใช่ table fallback) และชื่อชนที่ watchlist-list-view.tsx:102 จริงเป๊ะ — หนักกว่าที่รายงานด้วยซ้ำเพราะเป็น regression (PLAN.md P1.3 เคย adopt ใน card-table/most-valuable แล้วถูกลบตอน cleanup eb6cdec) แต่ evidence คลาดเคลื่อน 1 จุด (market-table.tsx:66) และทาง (ก) ประเมินเบาไป: row เหล่านี้มี interactive หลายชิ้นต่อแถว ขณะที่ ListRow wrap ทั้งแถวเป็น Link/button เดียว ต้องรื้อ API ไม่ใช่แค่เพิ่ม slot — ทาง (ข) rename+scope docstring สมจริงกว่า และไม่ขัดทิศที่เคาะไว้

### `KIT-05` — cards/card-detail/* (EditionToggle·source-logo·grades) + ui/hero-number
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** atom ที่ VISION §3 บอกให้ใช้ทั้งแอป (EditionToggle/SourceBadge/GradeChip) ถูกขังอยู่ในโฟลเดอร์ private ของ card-detail — marketplace/comps/chart legend ที่จะมาต้องข้าม boundary ไปหยิบ และ hero ราคาใน card-detail เองก็ไม่ใช้ HeroNumber atom (ไม่มี count-up ไม่ scrub-bindable)

**หลักฐาน:** edition-toggle.tsx, source-logo.tsx, grades.ts อยู่ใน components/cards/card-detail/ ส่วน HeroNumber มี importer เดียว (portfolio-hero) — card-detail.tsx:621 ใช้ span text-display ดิบแทน

**วิธีแก้ที่เสนอ:** ยกไฟล์ 3 ตัวขึ้น ui/ (หรือ shared/) พร้อมประกาศเป็น kit ทางการ และให้ hero ราคา card-detail ใช้ HeroNumber ตัวเดียวกับ portfolio ตามกฎ 'atom เดียว byte-identical'

### `KIT-06` — kit ทั้งชุด (props API)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** vocab ของ size prop แตกเป็น 3 สำนักใน kit เดียวกัน — โดยเฉพาะ "card" ของ PriceDisplay ที่ไม่ใช่ขนาดจริงๆ ทำให้จำ API ไม่ได้และ AI ที่มาแก้ต้องเปิดไฟล์ดูทุกครั้ง

**หลักฐาน:** size="default"|"sm" (delta-text.tsx:15, empty-state.tsx:26, segmented-control.tsx:35) vs size="sm"|"md" (compare-button.tsx:14, rarity-badge.tsx:6, toolbar.tsx:62) vs price-display.tsx:8-25 size="sm|card|md|lg"

**วิธีแก้ที่เสนอ:** เคาะมาตรฐานเดียว (แนะนำ sm|md|lg โดย md = default) แล้วไล่ปรับพร้อม deprecation alias ชั่วคราว; เปลี่ยน "card" ของ PriceDisplay เป็นชื่อขนาดปกติ

### `KIT-07` — shared/command-search.tsx vs shared/card-search.tsx
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** card-search ประกาศตัวว่าเป็น 'The ONE card search' แต่ Cmd-K palette (command-search 430 บรรทัด) ทำ engine ของตัวเองซ้ำหมด: recent-search persistence, debounce fetch, keyboard nav, result row — แก้ UX ค้นหาต้องแก้ 2 ที่เสมอ

**หลักฐาน:** command-search.tsx:54-73 มี readRecent/writeRecent ก๊อปเหมือน card-search.tsx:17-33 (localStorage key เดียวกัน) และ render result row เอง ไม่ผ่าน SearchResultsDropdown

**วิธีแก้ที่เสนอ:** แยก logic recent-search + result-row ออกเป็น module กลาง (hook + row component) แล้วให้ทั้ง CardSearch และ CommandSearchModal ประกอบจากตัวเดียวกัน — palette เก็บเฉพาะส่วน NAV_ACTIONS ที่เป็นของตัวเอง

### `KIT-08` — shared/sparkline.tsx vs ui/mini-sparkline.tsx
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** sparkline จิ๋วมี 2 ตัวคนละโฟลเดอร์คนละ API (อันหนึ่ง width/height ตายตัว อีกอัน viewBox+gradient) ทำให้เส้น trend ใน watchlist หน้าตาต่างจาก market/portfolio โดยไม่มีเหตุผล

**หลักฐาน:** shared/sparkline.tsx (4 importers: trending/market/assets/home) vs ui/mini-sparkline.tsx (1 importer: watchlist) — SVG polyline เหมือนกัน ต่างแค่ gradient fill กับ props

**วิธีแก้ที่เสนอ:** รวมเป็นตัวเดียวใน ui/ ให้ gradient เป็น prop (`fill?: boolean`) แล้ว migrate 5 จุด ลบอีกไฟล์ทิ้ง

### `KIT-09` — src/components/shared/ (ทั้งโฟลเดอร์)
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** shared/ กลายเป็นลิ้นชักรวม ไม่มีหมวด — widget เฉพาะทาง (notification-bell, streak-tier-indicator, upgrade-dialog) อยู่ปนกับ atom แสดงผล (delta-text, rarity-badge) ทำให้ตอบคำถาม 'kit ทางการมีอะไรบ้าง' ไม่ได้จากโครงไฟล์

**หลักฐาน:** 42 ไฟล์แบน: primitive 14 บรรทัด (section-head) ปนกับ feature widget 400+ บรรทัด (command-search:430, notification-bell:417, set-picker:320, upgrade-dialog:225)

**วิธีแก้ที่เสนอ:** จัด 3 ชั้นชัด: ui/ = primitive ไร้ business logic · shared/ = composite ใช้ข้ามฟีเจอร์ (badge/price/search) · ของที่ผูก feature เดียว (streak, notification-bell, upgrade-*) ย้ายเข้าโฟลเดอร์ feature ของมัน — ทำเป็น mechanical move ไม่แก้โค้ดข้างใน

### `KIT-10` — ui/segmented-control vs ViewToggle/Tabs/EditionToggle/GameFilterChips
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** pattern 'pill เลือก 1 จาก N' มี 5 implementation ทั้งที่ SegmentedControl เป็น canonical (16 หน้าใช้) — active style ตอนนี้เผอิญตรงกัน แต่แก้ทีเดียวไม่ได้ ต้องไล่ 5 ที่

**หลักฐาน:** toolbar.tsx:221 ViewToggle, ui/tabs.tsx (ใช้ที่ notification-bell เดียว), card-detail/edition-toggle.tsx:23 hand-roll pill, game-filter-chips.tsx:37 ยอมรับเองว่า 'byte-identical to SegmentedControl'

**วิธีแก้ที่เสนอ:** ยุบ ViewToggle ให้เป็น SegmentedControl (เหลือ 1 จุดใช้), ให้ EditionToggle ประกอบจาก SegmentedControl variant pill, และตัดสิน ui/tabs (ใช้ที่เดียว) ว่าจะเก็บไว้เฉพาะเคส content-panel หรือลบ

### `KIT-11` — layout/footer.tsx
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: มือถือ · effort: **S**

**ปัญหา:** footer ใช้ gutter 16px สวนมาตรฐาน 20px ที่เพิ่งเคาะ — เนื้อหา footer บนมือถือเหลื่อมกับคอนเทนต์ด้านบน 4px

**หลักฐาน:** footer.tsx:83 px-4 pt-10 ขณะที่ page-container.tsx:49 กำหนด gutter ฐานมือถือ = px-5 (20px, owner call)

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น px-5 md:px-6 lg:px-8 ให้ตรง PageContainer (หรือใช้ PageContainer ห่อเลย)

### `KIT-12` — shared/loading-state.tsx vs shared/page-skeleton.tsx
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** skeleton รูปตารางมี 2 implementation ให้เลือกโดยไม่มีเกณฑ์ ทำให้ loading state ตารางแต่ละหน้ากระพริบไม่เหมือนกัน

**หลักฐาน:** loading-state.tsx:67-87 variant skeleton-table กับ page-skeleton.tsx:56-85 TableSkeleton — โครง header+N rows เหมือนกันคนละ markup

**วิธีแก้ที่เสนอ:** ให้ LoadingState เป็นทางเข้าเดียว (variant skeleton-table เรียกใช้ TableSkeleton ภายใน หรือลบอันใดอันหนึ่ง) แล้วระบุใน docstring ว่า loading.tsx ใช้ PageSkeleton, in-panel ใช้ LoadingState

### `KIT-13` — ui/surface.tsx (header/footer slot)
**🔵 LOW** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** slot header/footer ของ Surface ไม่มีผู้ใช้เลย และมีบั๊กแฝง: ถ้าใครเริ่มใช้ ตัว body จะได้ class .panel ซ้อนใน panel (พื้นหลัง+เงาสองชั้น)

**หลักฐาน:** surface.tsx:92 `surfaceVariants({ padding })` ไม่ส่ง variant → cva เติม default "panel" ให้ div เนื้อหาข้างใน ซ้อน .panel สองชั้น; grep ทั้ง repo ไม่มีใครใช้ slot นี้

**วิธีแก้ที่เสนอ:** แก้เป็น surfaceVariants({ variant: "ghost", padding }) หรือถ้าไม่มีแผนใช้ ให้ตัด slot ทิ้งเพื่อลด API ตาย (SectionCard ที่ทำหน้าที่นี้ก็ orphan อยู่แล้ว — ตัดสินทีเดียวทั้งชุด)

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่ต้อง re-compose หน้าไหน แต่ควรประกาศ "kit ทางการ" ครั้งเดียวเป็นตาราง canon ใน AGENTS.md แล้ว deprecate ให้จบ: [CANONICAL] Surface(.panel) · SectionHead · SegmentedControl · ListRow+GroupedList · EmptyState(รวม Kuma เป็น prop) · PriceTag(ใหม่ ยุบ PriceDisplay/DeltaText) · HeroNumber · Sparkline(รวม 2 ตัว) · Skeleton/LoadingState · FilterToolbar · PageContainer/PageHeader — [DEPRECATE/ลบ] ui/card.tsx, layout/section.tsx, layout/section-card.tsx, ui/separator.tsx, ui/tabs(ถ้า migrate notification-bell แล้ว), ViewToggle, shared/sparkline หรือ ui/mini-sparkline อย่างใดอย่างหนึ่ง — [ย้ายเข้า feature] notification-bell, streak-tier-indicator, upgrade-badge/dialog, limit-counter — [ยกขึ้น kit] edition-toggle, source-logo, grades จาก card-detail/ ลำดับที่คุ้มสุด: ลบ orphan (ครึ่งวัน) → รวม EmptyState → PriceTag+token เดียว → กวาด amber/blue บน chrome

---

<a id="chrome"></a>
## CHROME — Cross-cutting: Layout chrome + page scaffold

**ขอบเขตที่ตรวจ:** src/app/layout.tsx (root scaffold) · src/components/layout/main-chrome.tsx · src/components/layout/page-container.tsx · src/components/layout/page-header.tsx · src/components/layout/header.tsx + header-mobile.tsx + header-market-ticker.tsx + header-constants.ts · src/components/layout/bottom-nav.tsx · src/components/layout/footer.tsx · src/components/layout/section.tsx + section-card.tsx · src/components/shared/breadcrumb.tsx · /settings (layout + settings-shell + page) · /more (more-client) · /u/[handle] เทียบ /profile/[userId] (public-profile-client + profile-mobile-cta-bar) · /decks · /guide/* + /blog/[slug] (ROUTE_WIDTH) · admin-shell / seller-shell (PageContainer inShell)

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- main-chrome.tsx รวมการตัดสินใจ scaffold ต่อ route ไว้ที่เดียวแบบ declarative (CHROMELESS_ROUTES / NO_HEADER_FOOTER_ROUTES / FULL_WIDTH_ROUTES / ROUTE_WIDTH) — เพิ่มหน้าใหม่แล้วรู้ทันทีว่าต้องไปแก้ตรงไหน
- PageHeader ตัวเดียวฝัง iOS large-title (มือถือ) → text-h1 (desktop) ให้อัตโนมัติ และถูกใช้กว้างมาก (60+ ไฟล์ รวม admin/seller ผ่าน AdminPageHeader ที่ wrap ต่ออย่างถูกวิธี)
- admin-shell / seller-shell ใช้ PageContainer inShell ตรงตาม convention — ไม่ double-pad และ width ต่อ route ประกาศชัด
- bottom-nav ทำตาม iOS grammar จริง: 5 แท็บคงที่ ทุกแท็บเป็น destination จริง, frost + hairline + pb-safe และ card-detail ทำ sticky CTA ลอยเหนือ nav ถูกต้อง (bottom: calc(4rem + safe-area))

### `CHROME-01` — /profile/[userId] (มุมมองคนอื่น)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: มือถือ · effort: **S**

**ปัญหา:** แถบ CTA "ทักผู้ขาย/บันทึก" บนหน้าโปรไฟล์คนขาย ถูก bottom-nav (z-50) ทับสนิทเพราะทั้งคู่ fixed bottom-0 บนมือถือ — ผู้ใช้กดปุ่มหลักของหน้าไม่ได้เลย

**หลักฐาน:** src/components/profile/public/profile-mobile-cta-bar.tsx:27 `fixed inset-x-0 bottom-0 z-40` ชนกับ bottom-nav.tsx:70 `fixed bottom-0 z-50`

**วิธีแก้ที่เสนอ:** ยกแถบ CTA ขึ้นเหนือ bottom-nav แบบเดียวกับ card-detail.tsx:939 (`bottom: calc(4rem + env(safe-area-inset-bottom))`) และเพิ่ม padding ท้ายหน้าให้พ้นสองแถบซ้อน

**หมายเหตุจากทีม verify:** เช็คโค้ดจริงแล้วตรงทุกจุด: CTA bar (z-40, fixed bottom-0, md:hidden) ชน bottom-nav (z-50, fixed bottom-0, .frost ทึบ+จับ touch, md:hidden) บนหน้า /profile/[userId] ซึ่งไม่ใช่ chromeless route → bottom-nav ทับปุ่มทักผู้ขาย/บันทึกสนิทบนมือถือ ขัด doc comment ของ component เองที่บอกว่าต้องกดได้ตลอด recommendation ก็ลอก pattern ที่มีอยู่แล้วใน card-detail.tsx:939 (bottom: calc(4rem + env(safe-area-inset-bottom)) + page padding บรรทัด 478) ไม่ขัดทิศ desktop/iOS grammar ใดๆ effort S สมจริง

### `CHROME-02` — /settings ทั้ง family
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** /settings ไม่ใช่ chromeless จึงถูก PageContent ห่อ PageContainer อยู่แล้ว แต่ settings-shell ห่อ PageContainer ซ้ำอีกชั้น → gutter มือถือกลายเป็น 40px (desktop 48px) ขัด AGENTS ข้อ "don't double-pad" — ผลคือ h1 ของ settings (page.tsx:35 `text-large-title px-5` ใน -mx-5) เยื้องลึกกว่าหน้าอื่น 2 เท่า

**หลักฐาน:** settings-shell.tsx:103 `<PageContainer className="py-2 md:py-6">` (ไม่มี inShell) ซ้อนใน PageContainer ของ PageContent (main-chrome.tsx:113)

**วิธีแก้ที่เสนอ:** เอา PageContainer ชั้นในออก (หรือใส่ inShell) แล้วรื้อ -mx-5/px-5 ที่ชดเชยกันใน settings/page.tsx ให้เหลือ gutter 20px ชั้นเดียวเท่าหน้าอื่น

**หมายเหตุจากทีม verify:** Evidence ตรงโค้ดจริงทุกบรรทัด: /settings ไม่อยู่ใน CHROMELESS_ROUTES จึงถูก PageContent ห่อ PageContainer แล้ว (main-chrome.tsx:113) แต่ settings-shell.tsx:103 ห่อ PageContainer ซ้ำโดยไม่มี inShell → gutter มือถือ 40px / md 48px (lg หนักถึง 64px) ทั้ง family. ไม่ใช่ของตั้งใจ: inShell ถูกใช้ใน admin/seller shells ที่ chromeless จริง, comment ใน page-container.tsx:44-48 ระบุว่า -mx-5 ของ settings มีไว้ cancel padding "ชั้นเดียว" และ /more ที่ใช้ iOS grouped grammar เดียวกัน zero inset เพื่อให้การ์ดอยู่ 20px ขณะที่ /settings ไปอยู่ 40px. Recommendation ไม่ขัดทิศ (desktop โครงเดิม, ยิ่งตรง iOS grammar). หมายเหตุตอนแก้: ต้อง override inset default px-5 ของ GroupedSection ด้วย (แบบ SECTION_INSET ใน more-client.tsx:75) ไม่งั้นการ์ดเด้งกลับ 40px

### `CHROME-03` — /u/[handle]
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้าโปรไฟล์เดียวกันได้ scaffold คนละแบบตาม URL: /profile/<id> ได้ full-bleed แต่ /u/<handle> โดนห่อด้วย main+PageContainer ของ PageContent → กรอบ max-w-7xl + gutter ซ้อน (px-5 นอก + px-5 ใน public-profile-client.tsx:240 = 40px) + pt/pb ซ้อน

**หลักฐาน:** main-chrome.tsx:36-38 FULL_WIDTH_ROUTES มีแค่ /^\/profile\/.+/ แต่ u/[handle]/page.tsx:82 render PublicProfileClient ตัวเดียวกัน → /profile/<id> ได้ unwrapped scaffold (component คุม container เอง: max-w-5xl px-5 pt-6, public-profile-client.tsx:240) ส่วน /u/<handle> โดน PageContent ห่อด้วย main (pt-8 pb-32 + hero-search-glow) + PageContainer (max-w-7xl px-5) → gutter ซ้อน 40px + pt (32+24) / pb (128+96) ซ้อน + ambient glow เกินมา. เพิ่มเติม: src/middleware.ts:25-31 rewrite /@handle → /u/handle (browser URL คง /@handle) และ canonical/share-menu ชี้ /@handle ทั้งหมด — usePathname() ฝั่ง client อ่านจาก browser URL (ยืนยันจาก node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md) ดังนั้น fix ต้องเพิ่มทั้ง /^\/u\/.+/ และ /^\/@.+/ เข้า FULL_WIDTH_ROUTES ไม่ใช่แค่ตัวแรก

**วิธีแก้ที่เสนอ:** เพิ่ม /^\/u\/.+/ เข้า FULL_WIDTH_ROUTES ให้สอง route ใช้ scaffold เดียวกัน

**หมายเหตุจากทีม verify:** ปัญหาจริงและคุ้มแก้ — evidence ทุก file:line ตรงกับโค้ดปัจจุบัน scaffold ซ้อนจริง (gutter 40px + pt/pb ซ้อน + hero-glow เกินมา) และไม่ใช่ของตั้งใจ (comment FULL_WIDTH_ROUTES ระบุ intent ให้ public profile คุม layout เอง) แต่รายละเอียดผิด 2 จุด: (1) คำว่า "full-bleed" ไม่แม่น — component เป็น rounded card คุม max-w-5xl เอง ไม่ใช่ full-bleed (2) recommendation ไม่ครบ: middleware rewrite /@handle→/u/handle ทำให้ browser pathname (ที่ usePathname เห็น) เป็น /@handle ซึ่งเป็น access path หลัก (canonical + share menu) — เพิ่มแค่ /^\/u\/.+/ จะไม่ match ต้องเพิ่ม /^\/@.+/ ด้วย

### `CHROME-04` — /blog/[slug] + /guide/*
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ความกว้างหน้าอ่านถูกประกาศ 2 ที่และขัดกัน — ตัวใน (max-w-3xl/768px) ไม่มีวันถึงเพราะตัวนอกบีบไว้ที่ 672px กลายเป็น dead code ที่หลอกคนแก้ทีหลังว่าหน้ากว้าง 3xl

**หลักฐาน:** main-chrome.tsx:47-48 กำหนด width "reading" (max-w-2xl) แต่ blog/[slug]/page.tsx:111 และ guide/*/page.tsx ห่อ `mx-auto max-w-3xl` ซ้อนข้างใน

**วิธีแก้ที่เสนอ:** เลือกความจริงหนึ่งเดียว: ลบ wrapper max-w-3xl ในหน้า แล้วถ้าอยากได้ 768px ก็แก้ ROUTE_WIDTH เป็น narrow ที่เดียว

### `CHROME-05` — /guide/* (6 หน้า) + /decks
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **M**

**ปัญหา:** หน้าอื่นทั้งแอปได้ iOS large-title (34px) บนมือถือผ่าน PageHeader แต่ guide ทั้ง 6 หน้าและ /decks เขียน h1 เอง → หัวหน้ากระโดดเล็กลงผิดพี่น้อง และไม่ได้ layout icon/badge/actions มาตรฐาน

**หลักฐาน:** guide/rarities/page.tsx:302 และ decks/page.tsx:84 hand-roll `<h1 className="text-h1">` แทน PageHeader

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น PageHeader (title+description) ทั้ง 7 หน้า — ได้ large-title มือถือฟรีและตัด markup ซ้ำ

### `CHROME-06` — bottom-nav (ทุกหน้าลึก)
**🟠 MED** · ด้าน: UX · จอ: มือถือ · effort: **S**

**ปัญหา:** อยู่ที่ /cards/[code], /search, /trending, /honey, /settings, /decks ฯลฯ จะไม่มีแท็บไหนติดสว่างเลย — ขัด iOS grammar ที่แท็บต้นทางต้องติดค้างระหว่างอยู่ใน stack ของมัน ผู้ใช้เสีย sense of place

**หลักฐาน:** bottom-nav.tsx:11-14 isTabActive เช็คแค่ pathname ตรงหรือขึ้นต้นด้วย href ของ 5 แท็บ

**วิธีแก้ที่เสนอ:** ทำ map เจ้าของ route → แท็บ (เช่น /cards,/search,/trending → ชุดการ์ด · /settings,/honey,/decks,/messages → เพิ่มเติม) ใช้ตัดสิน active แทน prefix ตรงๆ

### `CHROME-07` — footer (ทุกหน้า)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **S**

**ปัญหา:** gutter มือถือฐานทั้งแอปย้ายเป็น px-5 (20px) แล้ว (page-container.tsx:44-49) แต่ footer ยังเป็น px-4 → เนื้อหา footer เยื้องไม่ตรงกับเนื้อหาหน้า 4px ทุกหน้า และเป็นการ hand-roll container ที่ PageContainer มีให้แล้ว

**หลักฐาน:** footer.tsx:83 hand-roll `mx-auto max-w-7xl px-4 ... md:px-6 lg:px-8`

**วิธีแก้ที่เสนอ:** เปลี่ยน wrapper ใน footer เป็น `<PageContainer>` (เหลือแค่ pt/pb เอง) จะได้เกาะ gutter กลางอัตโนมัติเมื่อแก้ครั้งหน้า

### `CHROME-08` — header desktop
**🟠 MED** · ด้าน: ความสวยงาม · จอ: desktop · effort: **S**

**ปัญหา:** chrome ต้องจืดและ icon เป็น neutral ตาม VISION (honey = accent เดียว) แต่ header desktop มี bookmark สีน้ำเงินค้างถาวร และดาวสี amber ดิบแทน token honey — สี accent แปลกปลอมบน chrome แย่งการ์ดที่ควรเป็นพระเอก

**หลักฐาน:** header.tsx:183 `Bookmark className="... text-blue-500"` (ติดสีน้ำเงินตลอดแม้ inactive) + :167 Star fill-amber-500

**วิธีแก้ที่เสนอ:** ให้ icon quick-link เป็น neutral (muted-foreground) และ state active ใช้ text-primary/honey token เหมือน nav links อื่นในไฟล์เดียวกัน

### `CHROME-09` — ทุกหน้าที่มี footer
**🟠 MED** · ด้าน: ความสวยงาม · จอ: มือถือ · effort: **S**

**ปัญหา:** ระยะกัน bottom-nav ถูกใส่ทั้งใน PageContent (pb-32=128px) และใน footer (pb-28) — บนมือถือเกิดแถบว่าง ~128px ระหว่างจบเนื้อหากับเส้น footer ทุกหน้า เป็น dead scroll ที่ไม่ premium

**หลักฐาน:** main-chrome.tsx:105 `<main ... pb-32 md:pb-24>` + footer.tsx:83 `pb-28` — เคลียร์ bottom-nav ซ้ำสองที่

**วิธีแก้ที่เสนอ:** ให้ footer เป็นคนเคลียร์ nav ที่เดียว แล้วลด pb ของ main ลงเหลือระยะหายใจปกติ (เช่น pb-12) — คงไว้ 128px เฉพาะ route ที่ไม่มี footer (/more)

### `CHROME-10` — ปุ่มย้อนบนมือถือ (settings vs หน้าลึกอื่น)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **S**

**ปัญหา:** affordance ย้อนกลับบนมือถือมี 2 หน้าตา: หน้าลูกลึกทั่วไปได้ปุ่มวงกลม chevron แต่ settings sub-page ได้ลิงก์ตัวหนังสือ — grammar เดียวกันควรหน้าตาเดียวกันทั้งแอป

**หลักฐาน:** breadcrumb.tsx:66 ปุ่มวงกลม chevron (ตามที่เจ้าของเคาะ) แต่ settings-shell.tsx:107-113 ใช้ text-link `‹ ชื่อ section` คนละแบบ

**วิธีแก้ที่เสนอ:** ให้ settings sub-page ใช้ปุ่มวงกลมตัวเดียวกับ Breadcrumb (หรือ export ปุ่มย้อนเป็น component แยกแล้วใช้ร่วม)

### `CHROME-11` — chrome ทั้งระบบ (โค้ด)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ตรรกะ active-route และ scrolled-header เขียนซ้ำหลายไฟล์ด้วยรายละเอียดต่างกันเล็กน้อย (บางตัวกัน hydration mismatch บางตัวไม่) — แก้พฤติกรรมทีต้องไล่หลายจุด เสี่ยง drift

**หลักฐาน:** logic isActive ก๊อปกัน 6 ที่ (bottom-nav.tsx:11, header-constants.ts:30, admin-shell.tsx:111, seller-shell.tsx:77, admin-sub-nav.tsx:38, admin/honey/layout.tsx:33) + scroll-state ซ้ำ 2 ที่ (header.tsx:52-58, header-mobile.tsx:31-39)

**วิธีแก้ที่เสนอ:** แยกเป็น `isPathActive(pathname, href, {exact})` ใน lib และ hook `useScrolled(threshold)` ตัวเดียว แล้วให้ทุก chrome import ใช้ร่วม

### `CHROME-12` — header desktop (2 แถวบน)
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: desktop · effort: **S**

**ปัญหา:** แถว ticker กับแถว nav หลักที่ซ้อนกันใช้ padding ต่างกัน 8px — ขอบซ้ายของ chip แรกกับโลโก้ (และขอบขวาของปุ่ม) ไม่ตรงแนวกัน ดูเบี้ยวเมื่อ chrome โปร่งใส

**หลักฐาน:** header-market-ticker.tsx:66 `px-4 lg:px-6` vs header.tsx:115 `px-6 lg:px-8`

**วิธีแก้ที่เสนอ:** ปรับสองแถวให้ใช้ px ชุดเดียวกัน (px-6 lg:px-8)

---

<a id="tokens"></a>
## TOKENS — Cross-cutting: Design token discipline

**ขอบเขตที่ตรวจ:** src/app/globals.css (token ทั้งไฟล์) · grep sweep ทั่ว src/app + src/components (text-[Npx] / duration / border / สี hex / spacing / rounded / shadow) · src/components/ui/surface.tsx · src/components/ui/toolbar.tsx · src/components/ui/sheet.tsx + dialog.tsx + select.tsx + dropdown-menu.tsx · src/components/cards/card-detail.tsx · src/components/layout/header-constants.ts + bottom-nav.tsx · src/components/profile/profile-types.ts · src/components/orders/order-status-badge.tsx · src/components/ads/consent-banner.tsx · src/app/honey/components/* · src/app/proto/** (sandbox)

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- Typography discipline เกือบสมบูรณ์: text-[Npx] arbitrary เหลือ 2 จุดและอยู่ใน /proto sandbox เท่านั้น — โค้ดจริงใช้ semantic token (.text-h1..price-lg) ครบ
- Motion token ถูก adopt วงกว้างแล้ว: .motion-base/.motion-slow ใช้ใน 105 ไฟล์, .ease-chrome 89 ไฟล์ — เหลือ hardcode แค่ ~23 ไฟล์
- วินัยเขียว/แดง: หน้าเงิน (portfolio/cards/home) ใช้ --price-up/--price-down ล้วน (54 ไฟล์) ไม่พบ text-green/red raw ใน component เงินเลย
- Hairline primitive เป็น vocabulary หลักจริง: border-[var(--p-hair)] 312 จุด + .hairline 63 + divide-[var(--p-hair)] 63 — ครองสัดส่วนใหญ่ของแอป

### `TOKENS-01` — header + โปรไฟล์ (ป้าย Pro)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ป้ายระดับสมาชิก Pro ถูกนิยาม 2 ที่ด้วยสี hex ฝังมือทั้งคู่ และค่าไม่ตรงกันเอง — สีทอง Pro ใน header กับในหน้าโปรไฟล์เป็นคนละเฉด แถม hex เหล่านี้คือค่า --primary โหมดสว่างที่ก๊อปมาแปะ (dark ก็ไม่ตรง --primary #E9B970)

**หลักฐาน:** header-constants.ts:44-46 bg-[#A57E61]/15 text-[#73533E] dark:text-[#C49A70]/[#E0B865] vs profile-types.ts:112-117 bg-[#73533E] text-white ring-[#A57E61]/30 + Pro+ ใช้ amber-500 ที่หนึ่ง amber-600 อีกที่

**วิธีแก้ที่เสนอ:** รวมเป็น source เดียว (เช่น TIER_DISPLAY ใน shared) แล้วใช้ class จาก token: bg-primary/15 text-primary — ได้สีทองตรงกันทั้งสองโหมดอัตโนมัติและแก้ที่เดียวจบ

**หมายเหตุจากทีม verify:** ตรวจแล้วตรงทุกจุด: header-constants.ts:44-46 และ profile-types.ts:111-117 นิยามป้าย Pro ซ้ำด้วย hex ฝังมือคนละเฉดจริง (Pro+ amber-500/15 vs amber-600 ทึบ) · globals.css ยืนยัน --primary light=#73533E dark=#E9B970 ดังนั้นเฉด dark ที่ hardcode (#C49A70/#E0B865) ไม่ตรง token จริง · ใช้งานสด 5 จุด (header, /more, settings x2, profile-hero) ไม่มี comment บอกว่าตั้งใจแยก · VISION.md §token 3 ชั้นสั่ง "เลิก hardcode" ตรงๆ — recommendation ไปทางเดียวกับทิศ Foundation ข้อเดียวที่ควรเผื่อตอนทำ: ป้ายบน profile-hero ทับรูป cover ต้องมี variant ทึบ (bg-primary text-primary-foreground) ไม่ใช่เฉดอ่อน /15 ทุกที่

### `TOKENS-02` — overlay ทุกตัว (dialog/sheet/dropdown/popover/palette)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** Elevation token 3 ชั้นถูกสร้างไว้แล้วตาม VISION แต่ไม่มี component ไหนใช้เลยแม้แต่ตัวเดียว — overlay แต่ละตัวเลือกเงาเองคนละสูตร (มีอย่างน้อย 5 สูตรต่างกัน) เงา dialog ไม่เท่า sheet ไม่เท่า select ทั้งที่เป็นชั้นเดียวกัน

**หลักฐาน:** globals.css:133-135 นิยาม --elev-flat/raised/overlay แต่ grep ใน tsx = 0 การใช้ · sheet.tsx:56 shadow-lg / dialog.tsx:62 shadow-xl / select.tsx:97 shadow-md ring-foreground/10 / command-search.tsx:245 + card-picker-modal.tsx:229 shadow-2xl

**วิธีแก้ที่เสนอ:** map ทีเดียว: dialog/select/dropdown/popover/command-palette → shadow-[var(--elev-overlay)] · แถบลอย (admin-save-bar, compare-floating-bar, honey-toast, scroll-to-top) → --elev-raised · จบแล้วห้าม shadow-lg/xl/2xl นอก 2 token นี้

**หมายเหตุจากทีม verify:** Evidence ตรวจแล้วตรงทุก file:line (sheet-lg / dialog-xl / select-md+ring / command-search+card-picker-2xl และ dropdown-xl+blur ที่ไม่ได้อ้างอีกสูตร รวม ≥5 สูตรจริง) · --elev-raised/overlay = 0 การใช้จริงทุกทาง · ไม่ใช่ความตั้งใจ เพราะ comment ใน globals.css:130-132 และ VISION.md:78,85 เขียนชัดว่า token เหล่านี้ต้องเป็นเงาของ nav/sheet/dialog — สภาพปัจจุบันคือ VISION §4 ที่ค้าง implement · recommendation ไม่ขัดทิศที่เคาะ (ไม่แตะโครง desktop/iOS grammar/honey) · หมายเหตุเล็ก: --elev-flat ถูกใช้ทางอ้อมผ่าน --panel-shadow ใน dark mode (globals.css:187) ดังนั้น "ไม่มีใครใช้แม้แต่ตัวเดียว" เว่อร์ไปเล็กน้อยแต่ไม่กระทบแก่นของ finding

### `TOKENS-03` — ทั้งแอป (hairline system)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** เส้นขอบมี 2 token แข่งกัน (--border ของ shadcn กับ --p-hair ของ redesign) ค่าไม่เท่ากันทั้ง light/dark ทำให้การ์ดข้างกันขอบเข้มไม่เท่ากัน แถม --p-hair ไม่ได้ลงทะเบียนใน @theme เลยต้องเขียนแบบ arbitrary border-[var(--p-hair)] ยาวๆ 375+ จุด

**หลักฐาน:** globals.css:98 --border:#E5D9CE vs :118 --p-hair:rgba(...,0.10) · border-[var(--p-hair)] 312 จุด vs border-border 55 + border-border/NN 6 (toolbar.tsx:39) + ring-border/NN ~15 จุด

**วิธีแก้ที่เสนอ:** เพิ่ม --color-hair: var(--p-hair) ใน @theme inline แล้ว codemod → border-hair / divide-hair / ring-hair ทั้งแอป พร้อมกวาด border-border/NN และ ring-border/NN ที่เหลือให้เข้า token เดียว

**หมายเหตุจากทีม verify:** ตรวจกับโค้ดจริงแล้วตรงเกือบเป๊ะ: globals.css:98/:118 ตรงบรรทัด, border-[var(--p-hair)] 312 จุดเป๊ะ (+divide 63 +ring 28 = 403 จุด arbitrary), border-border/NN 6 จุดรวม toolbar.tsx:39, และ --p-hair ไม่อยู่ใน @theme จริง จุดเดียวที่คลาด: border-border จริงๆ ~65 จุดใน 40 ไฟล์ (ไม่ใช่ 55) — คลาดเล็กน้อยไม่กระทบสาระ ปัญหาเป็นของจริงไม่ใช่ตั้งใจ: ค่าต่างกันทั้ง light (#E5D9CE ทึบอุ่น vs rgba เทาโปร่ง) และ dark (alpha 0.12 vs 0.09) และ border-border ที่เหลือกระจายในไฟล์ feature 35 ไฟล์ (รวม card-detail/asks-rail.tsx ซึ่งเป็นหน้าต้นแบบ redesign เอง) ไม่ใช่แค่ shadcn primitives — เป็น drift ชัดเจน VISION.md ระบุ --p-hair เป็น hairline primitive ตัวเดียว recommendation เป็น token consolidation ล้วนๆ ไม่แตะ layout/honey/chrome ไม่ขัดทิศที่เคาะไว้

### `TOKENS-04` — cards/[code] + โปรไฟล์สาธารณะ (sticky offset)
**🟠 MED** · ด้าน: โครงโค้ด · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ความสูง chrome ด้านบน (header+ticker) ถูกฝังเป็นเลข magic กระจายหลายไฟล์ และสองหน้าเชื่อคนละค่า (100px vs 86px) — ถ้าวันหน้าแก้ความสูง header ทั้งสองหน้าจะพังคนละแบบและต้องไล่แก้ 7+ จุด

**หลักฐาน:** card-detail.tsx:745 sticky top-14 md:top-[6.25rem] + scroll-mt-[7.75rem] md:scroll-mt-[10.5rem] ซ้ำ 5 จุด (:517,:863,:868,:890,:917) vs profile-tabs-nav.tsx:75 top-14 md:top-[86px]

**วิธีแก้ที่เสนอ:** นิยาม --chrome-h (mobile/desktop) ใน globals.css แล้วให้ sticky/scroll-margin อ่านจาก var เดียว เช่น top-[var(--chrome-h)] / scroll-mt-[calc(var(--chrome-h)+1.5rem)]

### `TOKENS-05` — ทั้งแอป (motion)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** งาน migrate motion เหลือค้าง 23 ไฟล์ตาม backlog จริง และมี vocabulary gap: แถบ progress ต้องการ 500ms แต่ token สูงสุดคือ --dur-slow 300ms เลยต้อง hardcode ต่อ · ส่วน --ease-spring (globals.css:128) นิยามไว้สำหรับ PLAY surfaces แต่การใช้ = 0 (honey ยังใช้ ease ทั่วไป)

**หลักฐาน:** duration-100..500 เหลือ 30 จุด / 23 ไฟล์ (duration-200 x14) เช่น admin-shell.tsx:250, hint-tile.tsx:61 · progress ใช้ duration-500 (want-list.tsx:116, section-subscription.tsx:131, profile-completeness.tsx:272) เกินสเกล --dur-slow 300ms

**วิธีแก้ที่เสนอ:** ปิด backlog ด้วย .motion-base/.motion-slow + เพิ่ม token หนึ่งตัว (เช่น --dur-slower 500ms หรือ .motion-progress สำหรับ fill bar) · --ease-spring ให้เลือก: เอาไปใช้จริงกับ honey/PLAY หรือถอดทิ้งกัน token ผี

### `TOKENS-06` — ทั้งแอป (radius)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** มุมโค้งของการ์ดไม่มีมาตรฐานเดียว — แม้แต่ใน Surface primitive ตัวเดียวกัน มุมยังต่างกันตาม variant (12px vs 17px) และ bare `rounded` (4px ค่า default Tailwind) 156 จุดไม่ผูกกับ --radius เลย ปรับ token แล้วพวกนี้ไม่ขยับตาม

**หลักฐาน:** surface.tsx:15-18 — variant panel ใช้ .panel (globals.css:259 radius 12px) แต่ outline/subtle/hero ใช้ rounded-xl (≈17px) · ทั้งแอป rounded-lg 467 vs rounded-xl 186 vs bare rounded 156 จุด

**วิธีแก้ที่เสนอ:** เคาะมาตรฐาน: การ์ด/panel = ค่าเดียว (แนะนำ rounded-xl ให้ทุก variant ของ Surface ตรงกัน) · chip/thumbnail เล็ก = rounded-md/sm · แบน bare `rounded` ด้วยการ codemod เป็น rounded-sm

### `TOKENS-07` — ทั้งแอป (สี status)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **L**

**ปัญหา:** Semantic status token (--success/--warning/--danger/--info + .status-*) ถูกสร้างมาเพื่องานนี้แล้วแต่ adoption ต่ำมาก — สีสถานะยังฝัง Tailwind palette ดิบ 660 จุด ซึ่งเฉด dark ไม่ตรง token (emerald-400 ≠ --success dark) ทำให้ป้ายสถานะแต่ละหน้าสีเพี้ยนกันเล็กๆ ทั่วแอป

**หลักฐาน:** raw palette (amber/emerald/green/red/blue-NNN) 660 จุดใน 66 ไฟล์ ขณะที่ .status-* ถูกใช้แค่ 15 ไฟล์ · ตัวอย่างชัด order-status-badge.tsx:13-29 ใช้ blue/emerald/green/red-500 ตรงๆ

**วิธีแก้ที่เสนอ:** ไล่ migrate เฉพาะสีที่มีความหมายเป็นสถานะ (order/alert/notification/subscription) → .status-* หรือ text-success ฯลฯ ทีละ feature · สีเชิงตกแต่ง (สีการ์ด/rarity/หน้า guide/honey tier) ปล่อยไว้ได้ ไม่ต้องฝืน

### `TOKENS-08` — /proto (sandbox)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** โฟลเดอร์ /proto (13 ไฟล์) เป็นที่เดียวที่ยังมี arbitrary text size และ shell ซ้ำกับของจริง — token ถูก promote ขึ้น globals หมดแล้ว sandbox นี้เลยเป็น dead reference ที่ยัง build เข้า production และหลอนผล grep ทุกครั้ง

**หลักฐาน:** main-chrome.tsx:20 route /proto ยัง live · proto/ios/_components/large-title.tsx:25 text-[2.125rem] ซ้ำกับ .text-large-title (globals.css:468) · proto/portfolio/d/page.tsx:308 text-[11px]

**วิธีแก้ที่เสนอ:** ลบ /proto ออก หรืออย่างน้อยกันไม่ให้เข้า production build (dev-only guard) เมื่อเบสยืนยันว่าไม่ใช้อ้างอิงแล้ว

### `TOKENS-09` — consent banner + honey toast + card detail (safe-area)
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **S**

**ปัญหา:** utility .pb-safe ถูกสร้างมาแทน pattern env() แล้ว แต่ยังมีจุดหลงเหลือ 3-4 จุดที่เขียนแบบเดิม รวมถึงระยะ bottom-nav (4rem) ที่ฝังเป็น calc ซ้ำหลายที่

**หลักฐาน:** globals.css:314-320 มี .pb-safe พร้อม comment บอกให้เลิก pb-[env(...)] แต่ consent-banner.tsx:25 และ honey-toast.tsx:50 ยังใช้ env() arbitrary · card-detail.tsx:939 ใช้ inline style bottom:calc(4rem+env(...))

**วิธีแก้ที่เสนอ:** กวาดที่เหลือมาใช้ .pb-safe และพิจารณาเพิ่ม token ความสูง bottom-nav (--bottom-nav-h) ให้ calc ทุกจุดอ่านจากตัวเดียว

### `TOKENS-10` — globals.css (dead utility)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** .status-warn เป็น alias ซ้ำของ .status-warning ที่ไม่มีใครใช้แล้ว — เป็น token ผีที่ทำให้คนเขียนใหม่ลังเลว่าใช้ตัวไหน

**หลักฐาน:** globals.css:444 .status-warn ซ้ำกับ :440 .status-warning ค่าเดียวกันเป๊ะ — grep การใช้จริง = 0 (โผล่แค่ใน comment card-detail.tsx:387)

**วิธีแก้ที่เสนอ:** ลบ .status-warn ออกจาก globals.css บรรทัดเดียวจบ

---

<a id="states"></a>
## STATES — Cross-cutting: Loading / empty / error states

**ขอบเขตที่ตรวจ:** src/app/loading.tsx (root) · src/app/error.tsx + global-error.tsx · src/app/cards/[code]/loading.tsx · src/app/orders + orders/[id] · src/app/saved · src/app/seller/* (5 หน้า) · src/app/portfolio + portfolio/[id] · src/app/sets + sets/[setCode] · src/app/marketplace + marketplace-browse · src/app/blog · src/app/settings (+settings-shell) · src/app/watchlist · src/app/honey · src/app/search · src/app/profile/(me) + u/[handle] + profile/(public) · src/components/messages/chat-layout + chat-panel · src/components/shared/empty-state.tsx + loading-state.tsx + page-skeleton.tsx · src/components/kuma/kuma-empty-state.tsx

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- loading.tsx ครอบ 30 route หลักครบ และทุกไฟล์เป็น skeleton (ไม่มี spinner ใน loading.tsx เลย) ใช้ <Skeleton/>+Surface ชุดเดียวกันทั้งหมด
- cards/[code]/loading.tsx คุณภาพสูงมาก — จำลอง layout 3 คอลัมน์ (รูป·grade rail·buy box) ของหน้าจริงเกือบเป๊ะ สมกับเป็น trust core
- shared EmptyState/LoadingState มี doc ในไฟล์ + a11y ครบ (role=status, aria-label) และ error state มีปุ่ม retry เกือบทุกจุด
- มี error.tsx + global-error.tsx ครบ โชว์ Error ID (digest) และปุ่ม Try again — ไม่ปล่อยจอขาว

### `STATES-01` — orders · saved · seller/* · messages (client pages)
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ขัด VISION กฎข้อ 6 "ศูนย์ spinner" ตรงๆ: หน้า client ที่ fetch ข้อมูลเอง (orders, saved, seller ทั้ง 5 หน้า, แชท) ผู้ใช้เห็น skeleton จาก loading.tsx แวบเดียวแล้วสลับเป็น spinner กลางจอระหว่างรอข้อมูลจริง = กระตุก 2 จังหวะ แถม LoadingState ที่สร้างมาเพื่อฆ่า spinner กลับถูกเรียกด้วย variant="spinner" ทั้ง 100% (variant skeleton ทั้ง 3 แบบเป็น dead code ไม่มีใครใช้)

**หลักฐาน:** loading-state.tsx:33 default variant="spinner" · LoadingState มี call site 7 จุด ใช้ variant="spinner" ทั้งหมด: orders/page.tsx:174, saved/page.tsx:106, seller/page.tsx:99, seller/listings/page.tsx:221, seller/listings/[id]/page.tsx:180, seller/orders/page.tsx:116, seller/reviews/page.tsx:180 · skeleton variants ทั้ง 3 (skeleton-grid/list/table) เป็น dead code ไม่มีใครใช้ · นอกจากนี้มี Loader2 ดิบเต็มจอ (ไม่ผ่าน LoadingState) อีก 3 จุดที่ต้องแก้ด้วย: chat-layout.tsx:255, orders/[id]/page.tsx:119, seller/orders/[id]/page.tsx:150 — รวมจุดที่ผู้ใช้เจอ spinner เต็มจอ 10 จุด · route เหล่านี้มี loading.tsx เป็น skeleton รูปร่างตาม content อยู่แล้ว (เช่น orders/loading.tsx) จึงเกิด skeleton→spinner→content 2 จังหวะจริง · สอดคล้อง PLAN.md:13 task ค้าง "state system: skeleton รูปร่างตาม content ทุก async · ศูนย์ spinner"

**วิธีแก้ที่เสนอ:** เปลี่ยน default ของ LoadingState เป็น skeleton-list แล้วไล่แก้ call site ทั้ง 9 จุดให้ใช้ skeleton รูปร่างตรงกับ content (orders = แถวการ์ดออเดอร์, saved = grid, chat = แถวข้อความ) — รูปแบบเดียวกับที่ loading.tsx ของ route นั้นทำไว้แล้ว

**หมายเหตุจากทีม verify:** ปัญหาจริงและคุ้มแก้: VISION.md:87 กฎข้อ 6 "ศูนย์ spinner" มีจริง · LoadingState ถูกเรียกด้วย variant="spinner" 100% จริง (skeleton variants ทั้ง 3 เป็น dead code — grep ทั้ง repo ไม่มีใครใช้) · jank 2 จังหวะเกิดจริงเพราะ route มี loading.tsx skeleton แล้วหน้า "use client" สลับเป็น spinner ระหว่าง fetch · ไม่ใช่ของตั้งใจ (PLAN.md:13 มี task ค้าง "skeleton ทุก async · ศูนย์ spinner" อยู่แล้ว) · recommendation ไม่ขัดทิศที่เคาะ — แต่ evidence นับ call site ผิด: LoadingState มี 7 จุดไม่ใช่ 9, ส่วน chat-layout.tsx:255 กับ orders/[id]/page.tsx:119 เป็น Loader2 ดิบไม่ใช่ LoadingState แถมตกหล่น seller/orders/[id]/page.tsx:150 อีกจุด — ต้องแก้ scope ให้ถูกก่อนเข้าแผน

### `STATES-02` — ทั้งแอป (404)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ไม่มีหน้า 404 ของตัวเองเลยทั้งแอป — คนพิมพ์ URL ผิดหรือกดลิงก์การ์ด/เซ็ต/บล็อกที่ถูกลบ จะเจอหน้า 404 ดีฟอลต์ของ Next.js (ขาวดำ ภาษาอังกฤษ ไม่มีเมนู ไม่มีทางกลับเข้าแอป) ทั้งที่มี preset หมีหลงทางเตรียมไว้แล้วแต่แทบไม่ได้ใช้

**หลักฐาน:** find src/app -name not-found.tsx = ว่าง ทั้งที่ 15 route เรียก notFound() เช่น src/app/sets/[setCode]/page.tsx:41

**วิธีแก้ที่เสนอ:** เพิ่ม src/app/not-found.tsx ใช้ KumaEmptyState preset="not-found" (kuma-empty-state.tsx:36 มีอยู่แล้ว: 🗺️ หมีหลงทาง) + CTA เดียว "กลับหน้าแรก" และปุ่มรองไปหน้าค้นหา

**หมายเหตุจากทีม verify:** Evidence ตรงกับโค้ดจริงทุกจุด: ไม่มี not-found.tsx ทั้งแอป (git history ยืนยันไม่เคยมี), 15 ไฟล์เรียก notFound() รวม sets/[setCode]/page.tsx:41, preset "not-found" (🗺️ หมีหลงทาง) อยู่ kuma-empty-state.tsx:36 จริงและถูกใช้แค่ที่เดียว ไม่ใช่ของตั้งใจ — ทีมทำ error.tsx/global-error.tsx แบบ custom แล้วแต่เว้น 404 ไว้ และ SPEC ยังให้ marketplace ทุก route คืน 404 ตอน flag ปิด ทำให้หน้า 404 ดีฟอลต์โผล่บ่อยขึ้น เช็ค docs Next 16 ใน node_modules แล้ว root not-found.tsx ยังเป็น convention ถูกต้อง (root layout เดียว ไม่ต้องใช้ global-not-found ที่ยัง experimental) recommendation ไม่ขัดทิศดีไซน์ใดที่เคาะไว้ และ KumaEmptyState เป็น client component ดึงภาษาเองจาก UI store — effort S สมจริง

### `STATES-03` — ระบบ empty state (ข้ามหน้า)
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** มี empty state 2 ระบบซ้อนกัน (shared EmptyState 13 ไฟล์ vs KumaEmptyState 14 ไฟล์) ทั้งคู่มี variant "dashed" เหมือนกัน แถมใช้สลับข้ามหน้าแบบไม่มีเหตุผล: orders ฝั่งผู้ซื้อใช้ shared แต่ seller/orders ใช้ Kuma, หน้า saved ใช้ทั้งสองตัวในหน้าเดียว — คนแก้โค้ดทีหลังไม่รู้ต้องหยิบตัวไหน

**หลักฐาน:** src/components/shared/empty-state.tsx:32 เคลม "single source of truth" แต่บรรทัด 40–42 carve-out ให้ใช้ KumaEmptyState สำหรับหน้า kuma-branded (ระบุชื่อ home/sets/saved/watchlist) — หน้า saved จึงใช้สองตัวตามกฎนี้ (saved:108 error→shared, saved:126 empty→Kuma) ไม่ใช่สลับมั่ว · หลักฐานความมั่วที่จริงคือ: (1) orders/page.tsx:194 (ผู้ซื้อ, empty จริง) ใช้ EmptyState variant="dashed" แต่ seller/orders/page.tsx:118 ใช้ KumaEmptyState variant="dashed" ทั้งที่เป็นสถานะเดียวกันเป๊ะ (i18n key `noOrdersYet` ตัวเดียวกัน) และ render icon-in-dashed-box หน้าตาแทบเหมือนกัน ไม่มีหมีทั้งคู่ · (2) KumaEmptyState มี variant admin/minimal/dashed (kuma-empty-state.tsx:45–87) ที่พอส่ง icon แล้วไม่แสดงหมีเลย = ทำงานทับ shared 100% แถมมี preset "error" (บรรทัด 37) ทับ shared variant="error" อีกชั้น — กฎใน doc จึงถูกละเมิด (buyer orders) และบังคับใช้ไม่ได้ (Kuma-dashed แยกไม่ออกจาก shared) · จำนวนไฟล์ shared 13 / Kuma 14 ตรงตามเคลม

**วิธีแก้ที่เสนอ:** ยุบเหลือ API เดียว: ให้ EmptyState (shared) เป็นตัวหลัก แล้วเพิ่ม prop mascot/preset ดึงหมีจาก Kuma เข้ามา จากนั้นกำหนดกฎสั้นๆ ใน AGENTS.md ว่าเมื่อไหร่ใช้หมี (empty จริง/onboarding) เมื่อไหร่ใช้ icon (error/filter ว่าง) แล้ว migrate ทีละไฟล์

**หมายเหตุจากทีม verify:** ปัญหา redundancy จริง (shared 13 ไฟล์ vs Kuma 14 ไฟล์ ทับ variant dashed/error กัน) และ recommendation สอดคล้อง VISION.md:29 ที่สงวนหมีไว้ที่ empty/onboarding อยู่แล้ว แต่ evidence หลักที่ auditor ชูผิดจุด: หน้า saved ใช้สองตัวตามกฎที่ doc comment ของ shared กำหนดไว้เอง (error→shared, empty→Kuma และระบุชื่อหน้า saved ใน comment) ไม่ใช่ "ไม่มีเหตุผล" — หลักฐานที่แข็งจริงคือคู่ orders vs seller/orders ที่ใช้ i18n key เดียวกันแต่คนละ component

### `STATES-04` — /error (root error boundary)
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า error มีทางออกเดียวคือ "Try again" — ถ้า error เกิดซ้ำ (เช่น DB ล่ม) ผู้ใช้ติดลูปกดปุ่มเดิมไม่มีทางหนี และเป็นภาษาอังกฤษล้วนบนแอปตลาดไทย พร้อมปุ่มที่ไม่ใช้ Button component ของระบบ

**หลักฐาน:** src/app/error.tsx:51–57 มีแค่ปุ่ม reset ทำมือ (raw class ไม่ใช้ <Button>) · :36 ข้อความอังกฤษล้วน

**วิธีแก้ที่เสนอ:** เพิ่มลิงก์รอง "กลับหน้าแรก" ข้างปุ่ม retry, เปลี่ยนมาใช้ <Button> + EmptyState variant="error" ให้หน้าตาเดียวกับ error state อื่นทั้งแอป

### `STATES-05` — /sets/[setCode] · /marketplace/[listingId] · /blog/[slug]
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** หน้า detail 3 route ยืม skeleton ของหน้า index มาใช้: กดเข้าเซ็ตแล้วเห็น skeleton กริดเซ็ตทั้งหน้า แทนที่จะเป็นรูปร่าง SetHero+กริดการ์ด, กดเข้า listing เห็น skeleton หน้า browse, กดเข้าบทความเห็น skeleton กริดบล็อก — ผู้ใช้รู้สึกเหมือนเด้งกลับหน้ารวมแวบหนึ่ง

**หลักฐาน:** sets/[setCode]/page.tsx:15 force-dynamic แต่ segment ไม่มี loading.tsx เอง → ใช้ sets/loading.tsx (grid เซ็ตเล็ก 3–5 คอลัมน์)

**วิธีแก้ที่เสนอ:** เพิ่ม loading.tsx ให้ 3 segment นี้ตามรูปร่างหน้าจริง (ยึดแนว cards/[code]/loading.tsx ที่ทำถูกแล้วเป็นแม่แบบ)

### `STATES-06` — /u/[handle] · /profile/[userId] · /raffle/winners
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้าโปรไฟล์สาธารณะและหน้าผู้ชนะ raffle เป็นหน้า server ที่โหลดข้อมูลจริง แต่ระหว่างรอจะโชว์ skeleton ของหน้า Home (กล่อง stat 4 ใบ + การ์ดเด่น + รายการ gainers) ซึ่งคนละรูปร่างกับหน้าจริงโดยสิ้นเชิง — ขัด VISION "skeleton รูปร่างตรงกับ layout จริง"

**หลักฐาน:** u/[handle]/page.tsx:49 เป็น async server page แต่ไม่มี loading.tsx ใน segment → fallback ไป src/app/loading.tsx:4 (HomeLoading)

**วิธีแก้ที่เสนอ:** เพิ่ม loading.tsx เฉพาะ segment: โปรไฟล์ = skeleton หัวโปรไฟล์ (avatar กลม + ชื่อ + แถว stat) · raffle/winners = skeleton list แถวผู้ชนะ

### `STATES-07` — empty state ไร้ทางไปต่อ (หลายหน้า)
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ขัด VISION "empty state ต้องมี CTA เดียว": หน้าออเดอร์ว่างจบแค่ป้าย ไม่บอกว่าไปไหนต่อ, หน้าเซ็ตกรองแล้วว่างไม่มีปุ่มล้างตัวกรอง, ฝั่งแชทว่างเป็นข้อความลอยๆ ไม่ใช้ระบบ EmptyState ด้วยซ้ำ — ผู้ใช้ใหม่เจอทางตัน

**หลักฐาน:** orders/page.tsx:194 (noOrdersYet ไม่มี action) · sets-page-client.tsx:136 (noCardsFound ไม่มีปุ่มล้าง filter) · chat-panel.tsx:67 (empty เป็น <p> เปล่าๆ)

**วิธีแก้ที่เสนอ:** เติม action ให้ครบ: orders → ปุ่มไปหน้าตลาด/หน้าแรก · sets → ปุ่ม "ล้างตัวกรอง" · chat-panel → เปลี่ยนเป็น EmptyState มาตรฐาน + คำแนะนำเริ่มแชทจาก listing

### `STATES-08` — loading.tsx หลายไฟล์ (mobile)
**🟠 MED** · ด้าน: ความสวยงาม · จอ: มือถือ · effort: **S**

**ปัญหา:** บนมือถือ breadcrumb จริงถูกซ่อน (ตั้งใจ — ใช้ปุ่มย้อนวงกลมแทน) แต่ skeleton ยังวาดแถว breadcrumb ผี ทำให้ตอนเนื้อหาจริงมาถึง แถวบนสุดหายไปแล้วทั้งหน้ากระโดดขึ้น — skeleton drift จาก layout จริงบน path มือถือ

**หลักฐาน:** breadcrumb.tsx:75 ซ่อน breadcrumb ที่ <md แต่ cards/[code]/loading.tsx:7, orders/[id]/loading.tsx และ page-skeleton.tsx:25 วาดแถบ skeleton breadcrumb โดยไม่ซ่อนบนมือถือ

**วิธีแก้ที่เสนอ:** เติม hidden md:flex ให้แถบ breadcrumb skeleton ทุกจุด (แก้ที่ PageSkeleton ตัวกลาง 1 ที่ + ไฟล์ loading ที่วาดเอง) และวาด skeleton ปุ่มย้อนวงกลมแทนบนมือถือ

### `STATES-09` — portfolio (MONEY) vs honey (PLAY)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** บุคลิก 2 ระบบตาม VISION ถูกใช้สลับข้าง: หน้า portfolio (MONEY = ต้องนิ่ง น่าเชื่อถือ) ได้หมี emoji เด้ง spring ส่วนแท็บใน honey (PLAY = ต้องมีพลัง delight) กลับได้ empty แบบจืดที่สุดในแอปและเป็นทางตัน

**หลักฐาน:** portfolio-client.tsx:151 ใช้ preset empty-portfolio = หมี motion spring (kuma-empty-state.tsx:101–104) แต่ honey/components/empty-state.tsx:5 ใช้ variant="minimal" (icon จาง 20% ไม่มี CTA)

**วิธีแก้ที่เสนอ:** สลับให้ถูกขั้ว: honey ใช้ preset หมี + CTA (เช่น "ทำภารกิจแรก") ส่วน empty ของ portfolio คงหมีได้ (VISION อนุญาตหมีที่ empty) แต่ตัด/ลด spring bounce ให้เข้า --motion-money

### `STATES-10` — /profile/(me)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** spinner ทำมือแบบ border-trick ถูก copy-paste ซ้ำ 2 ไฟล์ และเป็น vocabulary ที่ 2 คนละแบบกับ Loader2 ที่ใช้ทั้งแอป — โค้ดซ้ำ + หน้าตา loading ไม่เหมือนที่อื่น

**หลักฐาน:** profile/(me)/layout.tsx:18 กับ page.tsx:41 มี div spinner ทำมือ (border-2 border-t-transparent) ก้อนเดียวกันซ้ำ 2 ไฟล์

**วิธีแก้ที่เสนอ:** หน้านี้เป็นแค่หน้า redirect — ใช้ LoadingState ตัวกลางจุดเดียว (หรือ skeleton บางๆ) แล้วลบ div ทำมือทั้ง 2 จุด

### `STATES-11` — /watchlist
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** CTA ของ watchlist ลอยอยู่นอก panel หมี (ช่องไฟ/จัดวางต่างจากหน้า portfolio ที่ใช้ pattern เดียวกัน) — หน้าพี่น้องกันแต่ประกอบคนละแบบโดยไม่มีเหตุผล

**หลักฐาน:** watchlist-empty.tsx:15–19 วางปุ่ม "เพิ่มการ์ด" เป็น sibling นอก KumaEmptyState แทนที่จะส่งผ่าน action prop แบบ portfolio-client.tsx:153

**วิธีแก้ที่เสนอ:** ย้ายปุ่มเข้า action prop ของ KumaEmptyState ให้เหมือน portfolio แล้วลบ wrapper div ที่ครอบอยู่

### `STATES-12` — global-error.tsx
**🔵 LOW** · ด้าน: ความสวยงาม · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้า critical error ใช้สีเทาเย็นแบบ iOS ไม่ใช่ espresso อุ่นของแบรนด์ — สี drift จาก palette เก่าค้างไว้ ขัด identity ข้อแรกของ VISION

**หลักฐาน:** global-error.tsx:19 hardcode พื้นหลัง #1C1C1E ทั้งที่ comment บอก "mirror the app's CSS variables" แต่ canvas จริงคือ #100C09 (globals.css:163)

**วิธีแก้ที่เสนอ:** อัปเดตสี hardcode ให้ตรง token ปัจจุบัน (#100C09 + warm foreground) — ไฟล์นี้จำเป็นต้อง inline style อยู่แล้ว แค่แก้ค่าให้ตรง

---

<a id="responsive"></a>
## RESPONSIVE — Cross-cutting: Responsive + a11y discipline

**ขอบเขตที่ตรวจ:** grep sweep ทั้ง src/app + src/components (max-md/max-sm · overflow-x-auto · <table> · h-7/h-8/size-7/size-8 · aria-label · @keyframes/animate-in) · src/app/globals.css (motion/reduced-motion/scrollbar utilities) · ui primitives: button-variants.ts · segmented-control.tsx · dialog.tsx · sheet.tsx · input/tabs/list-row/badge (focus-visible) · layout: bottom-nav.tsx · header-mobile.tsx · header-market-ticker.tsx · ตาราง 10 จุด: market-table · sets/[setCode] · trending-tabs · pricing-client · honey rankings-tab · card-detail recent-sales/asks-rail/source-markets · profile section-billing/section-subscription · portfolio assets-table · admin tables: admin-data-table.tsx + honey missions (bonus/schedule/templates/preview) · honey-shop-manager · drop-rates set-row · portfolio: portfolio-client · portfolio-selector · portfolio-hub-card · add-card-select-step · add-card-detail-step · search-client · watchlist-toolbar · alert-form · compare-client · honey-toast · raffle-tab · seller orders/listings/reviews · hero-number

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- วินัย mobile-first เต็มร้อย — grep ทั้ง repo ไม่พบ max-md:/max-sm: แม้แต่จุดเดียว ตรงตามกฎ AGENTS 100%
- ตารางฝั่งผู้ใช้ทั้ง 10 จุดที่ตรวจ (market, sets, trending, pricing, honey rankings, card-detail sales/asks/sources, billing, subscription) มี list fallback ใต้ sm ครบทุกตัว ไม่มีตารางไหนบังคับ scroll แนวนอนบนมือถือ
- Primitive หลัก (Button/Badge/Input/Tabs/Select/ListRow/Textarea) มี focus-visible ring ครบ และ icon-button ที่ใช้ผ่าน Button API (size="icon") มี aria-label ครบทุกจุดที่ตรวจ
- Motion ที่นิยามเองใน globals.css (.rise/.motion-*/.group-lift/.tw-caret/ticker) มี prefers-reduced-motion guard ครบ · HeroNumber เช็ค reduced-motion ใน JS ด้วย · bottom-nav มี pb-safe + tap ≥44px

### `RESPONSIVE-01` — ทั่วแอป (home tabs · trending · chart range · orders · watchlist)
**🔴 HIGH · ✏️ verify ปรับแก้** · ด้าน: a11y · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** SegmentedControl เป็น primitive ที่ใช้ทุกหน้า แต่ (1) ประกาศ role="radio" โดยไม่มี arrow-key/roving tabindex ตาม ARIA pattern — comment ในไฟล์เคลมว่ารองรับแต่โค้ดไม่มีจริง (2) ไม่มี focus ring ตอนใช้คีย์บอร์ด (3) tap target 28–32px ต่ำกว่า 44px

**หลักฐาน:** src/components/ui/segmented-control.tsx (ไฟล์ยาว 161 บรรทัด): บรรทัด 90 role="radiogroup" · บรรทัด 125-157 ปุ่ม role="radio" aria-checked สูง h-7/h-8 (28-32px, บรรทัด 137-143) · ทั้งไฟล์ไม่มี onKeyDown และไม่มี tabIndex management (ทุก segment อยู่ใน tab order) · ไม่มี focus-visible:* class — เหลือแค่ browser default :focus-visible outline (globals.css:232 ตั้ง outline-ring/50) ไม่ match ring convention ใน src/components/ui/button-variants.ts:4 · comment บรรทัด 71-72 เคลม "Implemented as a radiogroup so screen readers announce arrow-key movement" แต่ arrow key ไม่ทำงานจริง · หมายเหตุ: 28-32px ผ่าน WCAG 2.2 AA (2.5.8 = 24px) และเท่าความสูง native iOS segmented control (32pt) — ข้อ 44px เป็น AAA/iOS HIG เท่านั้น

**วิธีแก้ที่เสนอ:** แก้ที่ไฟล์เดียวแล้วได้ผลทั้งแอป: เพิ่ม focus-visible:ring แบบเดียวกับ button-variants, เพิ่ม arrow-key + roving tabindex (หรือเปลี่ยนเป็น role="tablist" ถ้าไม่อยากทำ radio เต็มรูปแบบ), และขยาย hit area บน <md ให้แตะได้ ≥40–44px

**หมายเหตุจากทีม verify:** แกนปัญหาจริง: role="radio"/radiogroup ประกาศไว้ (บรรทัด 90, 128) แต่ทั้งไฟล์ไม่มี onKeyDown/roving tabindex จริง และ comment บรรทัด 71-72 เคลมว่า pattern ทำงาน — ขัด ARIA pattern และใช้ทุกหน้าตามอ้าง คุ้มแก้ไฟล์เดียว แต่ evidence ผิด 3 จุด: (1) ไฟล์มีแค่ 161 บรรทัด ไม่มีบรรทัด 185-196 (2) "ไม่มี focus ring เลย" เว่อร์ — ปุ่มไม่ได้ใส่ outline-none ดังนั้น browser default :focus-visible outline (สี outline-ring/50 จาก globals.css:232) ยังแสดง แค่ไม่มี ring แบบ styled ตาม button-variants (3) tap target 28-32px ผ่าน WCAG 2.2 AA (ขั้นต่ำ 24px) และเท่า native iOS UISegmentedControl 32pt ซึ่งตรง iOS grammar ของโปรเจค — 44px คือระดับ AAA/HIG จึงเป็น nice-to-have ไม่ใช่เหตุ severity high · severity รวมควรเป็น medium เพราะปุ่มเป็น native button ที่ Tab+Enter ใช้งานได้อยู่ · recommendation ไม่ขัดทิศที่เคาะไว้

### `RESPONSIVE-02` — ทั่วแอป (search · portfolio · honey · add-card dialog)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: a11y · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ปุ่มที่เป็นไอคอนล้วน (เขียน <button> ดิบ ไม่ผ่าน Button component) ราว 14 จุดไม่มี aria-label — screen reader อ่านเป็น "ปุ่ม" เฉยๆ และหลายตัวมีพื้นที่กดจริงแค่ 14–28px ต่ำกว่าเกณฑ์ 44px บนมือถือมาก (กดพลาดง่าย)

**หลักฐาน:** src/app/search/search-client.tsx:126 ปุ่ม clear มีแค่ <X size-4/> ไม่มี aria-label · add-card-select-step.tsx:351 ปุ่มลบ filter = p-0.5+size-2.5 ≈14px · honey-toast.tsx:58 ปุ่มปิด ≈14px

**วิธีแก้ที่เสนอ:** ไล่เติม aria-label ทุกจุด (search clear, portfolio Check/X, FilterTag X, ปุ่ม back ใน add-card-detail-step, honey-toast X, raffle lightbox X, admin-shell/mapping-row) และขยาย hit area เป็น ≥44px ด้วย p-2.5 หรือ pseudo-element โดยไม่ต้องขยายไอคอน

**หมายเหตุจากทีม verify:** เปิดโค้ดจริงแล้ว evidence ตรงทั้ง 3 จุด (search-client.tsx:126 ไม่มี aria-label จริง · FilterTag p-0.5+size-2.5=14px จริง · honey-toast:58 ปุ่มปิด 14px ไม่มี padding จริง) และไม่ใช่ของตั้งใจ — repo ใช้ aria-label เป็น convention อยู่แล้ว 185 จุด จุดที่ชี้คือหลุดจาก convention ตัวเอง (want-list.tsx:94 ปุ่มแบบเดียวกันมี label แต่ portfolio-selector/portfolio-client/add-card-detail-step ไม่มี) จำนวน ~14 จุดนับต่ำไปด้วยซ้ำ (ไล่เจอ ~18) ส่วน recommendation ≥44px สอดกับ VISION.md:132 ที่เคาะ "QtyStepper ≥44px" ไว้เองและตรง iOS HIG — ไม่ขัดทิศใดที่เคาะแล้ว เพราะเติม label+ขยาย hit area ไม่เปลี่ยน layout

### `RESPONSIVE-03` — /admin/honey/* · /admin/drop-rates
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **M**

**ปัญหา:** ตาราง admin 6+ จุด (bonus-list, schedule-list:83, templates-list:95, preview-client:66, honey-shop-manager:113, drop-rates set-row:172) เขียน <table> ดิบห่อ overflow-x-auto — ขัดกฎ AGENTS ที่ห้ามพึ่ง scroll แนวนอน และไม่ใช้ AdminDataTable ที่สร้างไว้เพื่อสิ่งนี้โดยเฉพาะ ทำให้เปิด admin บนมือถือแล้วต้องลากตารางไปมา

**หลักฐาน:** src/app/admin/honey/missions/bonus/bonus-list.tsx:94 `<div className="overflow-x-auto..."><table>` — ทั้งที่ admin-data-table.tsx:50-58 มี mobile fallback (renderMobileRow + default stacked) ให้อยู่แล้ว

**วิธีแก้ที่เสนอ:** ทยอย migrate ตารางเหล่านี้มาใช้ AdminDataTable (ได้ sort/empty/skeleton/mobile fallback ฟรี) — เริ่มจากกลุ่ม honey missions ที่โครงเหมือนกันอยู่แล้ว

### `RESPONSIVE-04` — /portfolio (client · selector · hub-card)
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** ฟอร์ม inline สร้าง/เปลี่ยนชื่อพอร์ต (input + ปุ่มติ๊กถูก/กากบาท) ถูกก๊อปวางเหมือนกัน 4 ชุดใน 3 ไฟล์ — แก้สไตล์หรือเติม aria-label ทีต้องไล่แก้ 4 ที่ และตอนนี้ทุกชุดมีปัญหา aria-label + tap target เหมือนกันหมด

**หลักฐาน:** src/app/portfolio/portfolio-client.tsx:301, src/components/portfolio/portfolio-selector.tsx:100+208, portfolio-hub-card.tsx:97 — ฟอร์ม input+ปุ่ม Check/X พร้อมคลาส `ease-chrome shrink-0 rounded-lg p-1.5...` ซ้ำกันคำต่อคำ

**วิธีแก้ที่เสนอ:** สกัดเป็น shared component ตัวเดียว (เช่น `InlinePortfolioNameForm` ใน src/components/portfolio/) แล้วแก้ a11y/tap target ที่ตัวเดียวจบ — งานนี้ทำพร้อม finding ข้อ aria-label ได้เลย

### `RESPONSIVE-05` — /watchlist · /settings/alerts · profile notifications
**🟠 MED** · ด้าน: UX · จอ: มือถือ · effort: **M**

**ปัญหา:** ปุ่ม pill filter/action บนหน้าที่ใช้บนมือถือจริงสูงแค่ 28–32px และวางชิดกันเป็นแถว — ต่ำกว่าเกณฑ์ tap target ≥44px ที่เคาะไว้ กดพลาดไปโดนตัวข้างๆ ง่าย

**หลักฐาน:** src/app/watchlist/watchlist-toolbar.tsx:424 FilterPill `h-8` · src/components/alerts/alert-form.tsx:226 ChannelPill `h-8` · section-notifications.tsx:261 ปุ่ม `h-7`

**วิธีแก้ที่เสนอ:** บน <md ยกความสูง pill เป็น h-10/h-11 หรือคง visual เดิมแต่เพิ่ม hit area ด้วย py + negative margin — ทำเป็นแนวเดียวกับที่จะแก้ SegmentedControl

### `RESPONSIVE-06` — honey · sets · trending · profile · card-detail (chip rails 9 จุด)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** คลาส `scrollbar-none` ใช้อยู่ 9 จุดแต่ไม่มีอยู่จริงในระบบ = no-op เงียบๆ ทำให้ chip rails พวกนั้นโชว์แถบ scrollbar (เห็นชัดบน Windows/Chrome) ขณะที่ rails อื่นใช้ .no-sb ของจริง — ตอนนี้มีวิธีซ่อน scrollbar ถึง 3 แบบ (no-sb · scrollbar-none ปลอม · inline arbitrary ใน header-market-ticker.tsx:68)

**หลักฐาน:** src/app/honey/components/_shared/filter-tabs.tsx:28 ใช้ `scrollbar-none` — grep ไม่พบ definition ใน globals.css (มีแต่ .no-sb บรรทัด 384) และไม่มี plugin scrollbar ใน package.json

**วิธีแก้ที่เสนอ:** replace `scrollbar-none` ทั้ง 9 จุดและ inline arbitrary ใน header-market-ticker เป็น `.no-sb` ให้เหลือ vocabulary เดียวทั้งแอป (find-replace จบใน 30 นาที)

### `RESPONSIVE-07` — ทั่วแอป (dialog · sheet · dropdown · tooltip · toast — 24 จุด)
**🟠 MED** · ด้าน: a11y · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** animation ทั้งหมดที่มาจาก tw-animate-css (animate-in/out ใน dialog, sheet, dropdown, tooltip, honey-toast ฯลฯ รวม 24 จุด) ไม่หยุดเมื่อผู้ใช้เปิด reduce-motion — ขัด VISION §4 ข้อ 7 ที่กำหนดว่าทุก animation ต้อง honor

**หลักฐาน:** src/app/honey/components/honey-toast.tsx:50 `animate-in fade-in slide-in-from-bottom-2` — globals.css ปิด reduced-motion เฉพาะ custom classes (:427-430) ส่วน node_modules/tw-animate-css ไม่มี prefers-reduced-motion เลย

**วิธีแก้ที่เสนอ:** เพิ่ม block เดียวใน globals.css: `@media (prefers-reduced-motion: reduce) { [class*="animate-"], [data-state] { animation-duration: 0.01ms !important } }` (หรือ scope แคบกว่านั้นที่ animate-in/out) — จุดเดียวครอบคลุมทั้ง 24 จุด

### `RESPONSIVE-08` — /seller/orders · /seller/listings · /seller/reviews
**🔵 LOW** · ด้าน: ความสม่ำเสมอ · จอ: มือถือ · effort: **S**

**ปัญหา:** แถบ tab สถานะในหน้า seller 3 หน้าห่อด้วย overflow-x-auto เปล่าๆ ไม่ซ่อน scrollbar และไม่ bleed ถึงขอบจอแบบ rails หน้าอื่น — เห็นแถบ scrollbar 5px ใต้ tabs และ tabs ถูกตัดขอบแข็ง

**หลักฐาน:** src/app/seller/orders/page.tsx:92 `<div className="overflow-x-auto">` ห่อ SegmentedControl — เทียบ pattern มาตรฐาน sets-page-client.tsx:105 ที่ใช้ `no-sb -mx-5 ... px-5`

**วิธีแก้ที่เสนอ:** เปลี่ยนเป็น pattern เดียวกับ sets/trending: `no-sb -mx-* px-*` (ถ้าจะให้ครบเติม scroll-fade-x ด้วย)

### `RESPONSIVE-09` — bottom-nav (ทุกหน้า mobile)
**🔵 LOW** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** screen reader ไม่รู้ว่ากำลังอยู่แท็บไหนใน 5 แท็บ เพราะสถานะ active สื่อด้วย visual ล้วน

**หลักฐาน:** src/components/layout/bottom-nav.tsx:32-38 — Link ของแท็บ active ไม่มี aria-current="page" (สื่อสถานะด้วยสี+จุดเท่านั้น)

**วิธีแก้ที่เสนอ:** เติม `aria-current={active ? "page" : undefined}` ใน TabLink บรรทัดเดียวจบ

---

<a id="ia-nav"></a>
## IA-NAV — Cross-cutting: IA + navigation ทุกทางเข้า

**ขอบเขตที่ตรวจ:** src/components/layout/header.tsx · src/components/layout/header-mobile.tsx · src/components/layout/header-constants.ts · src/components/layout/header-market-ticker.tsx · src/components/layout/header-user-menu.tsx · src/components/layout/bottom-nav.tsx · src/components/layout/footer.tsx · src/components/layout/main-chrome.tsx · src/components/layout/game-switcher.tsx · src/app/more/more-client.tsx · src/components/shared/command-search.tsx · src/middleware.ts + src/lib/game/constants.ts · src/app/decks/page.tsx · route list ทั้งหมดใน src/app (ตรวจ orphan: /market-overview /saved /compare /search /blog /deck-calculator /u)

**จุดแข็งที่ต้องรักษาไว้ (อย่าทำพังตอน refactor):**
- IA 3 แกนตาม VISION ถูกฝังในโค้ดจริง: bottom-nav 5 แท็บคงที่ ไม่สลับตาม feature flag (bottom-nav.tsx:54-61) และ Marketplace เป็นลิงก์ append ไม่แย่ง slot (header-constants.ts:21-22)
- ไม่มีหน้า orphan จริง — ตรวจครบแล้ว /market-overview /deck-calculator /compare /saved /trending /blog ทุกหน้ามีทางเข้าอย่างน้อย 1 ทาง (footer / /decks hub / /more / home) และ footer ทุกลิงก์ชี้ไป route ที่มีอยู่จริง
- main-chrome.tsx รวมกฎ chrome ต่อ route ไว้ที่เดียวแบบ declarative (CHROMELESS_ROUTES / NO_HEADER_FOOTER_ROUTES / ROUTE_WIDTH) — เพิ่มหน้าใหม่ไม่ต้อง hand-roll shell
- GameSwitcher มีวินัยตรง VISION: เป็น context switcher เฉพาะ catalog ไม่แตะ MINE list พร้อม hint สอนผู้ใช้ครั้งเดียว (game-switcher.tsx:49-72) และเกม coming-soon ไม่เขียน cookie ทับเกมที่ใช้อยู่

### `IA-NAV-01` — ทุกหน้า (nav ทั้ง desktop + bottom-nav)
**🔴 HIGH · ✅ verify ผ่าน** · ด้าน: UX · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** แท็บ active ไม่ติดเลยบนทุกหน้าที่อยู่ใน game namespace: พออยู่ /opcg/sets ทั้งแท็บ "ชุดการ์ด" (มือถือ) และ "Browse"/"Decks" (desktop) เป็นสีจางหมด ไม่มีแท็บไหนสว่าง ผู้ใช้เสีย orientation ว่าตัวเองอยู่หน้าไหน

**หลักฐาน:** header-constants.ts:30-33 + bottom-nav.tsx:11-14 เทียบ pathname ตรงๆ กับ href flat ขณะที่ middleware.ts:67-72 redirect /sets → /opcg/sets (scroll-to-top.tsx:25 ยืนยันว่า pathname จริงมี prefix)

**วิธีแก้ที่เสนอ:** แก้ isActive/isTabActive ให้ strip game prefix ออกจาก pathname ก่อนเทียบ (ใช้ isGamePrefix ที่มีอยู่แล้วใน lib/game/constants) และรวมสองฟังก์ชันนี้เป็น helper เดียวที่ใช้ร่วมกัน

**หมายเหตุจากทีม verify:** หักล้างไม่สำเร็จ — โค้ดจริงตรงตาม evidence ทุกจุด: isActive (header-constants.ts:30-33) และ isTabActive (bottom-nav.tsx:11-14) เทียบ pathname ดิบกับ href flat ขณะที่ src/middleware.ts:67-73 redirect ทุก route game-scoped ไป /opcg/... และ repo เองยืนยัน (scroll-to-top.tsx comment + PLAN.md:39) ว่า client usePathname() เห็น path มี prefix → แท็บ ชุดการ์ด/Browse/Decks ไม่ติด active บนหน้า game namespace จริง ไม่ใช่ของตั้งใจ (game-switcher.tsx strip prefix อยู่แล้ว แต่ nav ตกหล่นจาก rollout P4.3 Phase 2 ที่ยังค้าง) recommendation เสริมทิศ iOS tab grammar ไม่ขัดทิศที่เคาะ effort S ถูกต้อง · จุดจิ๋วเดียว: path จริงคือ src/middleware.ts:67-73 ไม่ใช่ middleware.ts:67-72 (ไม่กระทบสาระ)

### `IA-NAV-02` — /more
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: มือถือ · effort: **S**

**ปัญหา:** /more ใช้พื้นที่ไปกับแถวที่ซ้ำ bottom-nav (ชุดการ์ด/พอร์ต/รายการโปรด อยู่ห่างแค่ 1 นิ้วโป้ง) และมีทางเข้า /settings ซ้ำ 2 จุด แต่หน้าที่มือถือเข้าถึงยากจริง (blog, about, contact, market-overview — เหลือแค่ footer ซึ่ง /more เองก็ไม่มี footer) กลับไม่ถูกเก็บเข้ามา

**หลักฐาน:** more-client.tsx:193-241 กลุ่ม Browse/Track ซ้ำแท็บ bottom-nav 3 อัน (sets, portfolio, watchlist) และ :128 + :351-356 มี 2 แถวชี้ไป /settings ในหน้าเดียว ขณะที่ blog/about/contact/market-overview ไม่มีแถวเลย

**วิธีแก้ที่เสนอ:** ตัดแถวที่ซ้ำแท็บออกจากกลุ่ม Browse/Track แล้วเติมกลุ่มตาม VISION (PLAY/TRACK/ACCOUNT) + แถว blog/about/contact/market-overview เพื่อให้ /more เป็น directory ของ "สิ่งที่ไม่มีแท็บ" จริงๆ

### `IA-NAV-03` — /more (เปิดบน desktop)
**🟠 MED** · ด้าน: UX · จอ: desktop · effort: **S**

**ปัญหา:** บน desktop หน้า /more ไม่มี chrome อะไรเลย — ไม่มี header, ไม่มี footer, ไม่มี bottom-nav (ซ่อนที่ md ขึ้นไป) และไม่มีโลโก้ให้กดกลับ กลายเป็นหน้าลอยที่ออกได้ทางปุ่ม back ของ browser อย่างเดียว (คนเจอได้จากลิงก์ที่แชร์จากมือถือ)

**หลักฐาน:** main-chrome.tsx:30 (NO_HEADER_FOOTER_ROUTES = ["/more"]) + main-chrome.tsx:88 ซ่อน Header/Footer ทุก breakpoint ขณะที่ bottom-nav.tsx:70 เป็น md:hidden

**วิธีแก้ที่เสนอ:** การซ่อน header/footer ควรมีผลเฉพาะ <md ตามเจตนาเดิม เช่น ให้ SiteChrome บน /more render header ใน wrapper hidden md:block กลับด้าน หรือง่ายสุดคือ redirect /more → /settings บนจอ md ขึ้นไป

### `IA-NAV-04` — Command palette (Cmd+K / search มือถือ)
**🟠 MED** · ด้าน: UX · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** VISION วาง universal search เป็น "teleport ค้นการ์ด/เซ็ต/เด็ค/ฟีเจอร์" แต่ของจริงค้นได้แค่การ์ด + shortcut 9 หน้า — ไม่มีเซ็ต, drop-calculator, deck-calculator, market-overview, guide, pricing, blog ทั้งที่นี่คือกลไกหลักที่ VISION ใช้ดูดซับการโตของฟีเจอร์

**หลักฐาน:** command-search.tsx:42-52 NAV_ACTIONS มีแค่ 9 หน้า และ :139 fetchCards ค้นเฉพาะการ์ด

**วิธีแก้ที่เสนอ:** เพิ่ม NAV_ACTIONS ให้ครบทุก destination ที่มี route จริง (เครื่องมือทั้ง 3 + market-overview + guide + pricing) และเพิ่ม section ค้นเซ็ต (มี API sets อยู่แล้ว) เป็นขั้นแรกก่อนขยับไป action search

### `IA-NAV-05` — header desktop + การ์ดทุกหน้า (icon language)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** ไอคอน Star มีสองความหมายชนกัน: บน desktop header ดาว = Portfolio แต่ในแถวการ์ดทั้งแอป ดาว = เพิ่ม Watchlist ขณะที่มือถือใช้ Wallet แทน Portfolio — first-time user เดาไม่ได้ว่าดาวพาไปไหน

**หลักฐาน:** header.tsx:163-170 ใช้ Star (fill-amber) แทน Portfolio แต่ watchlist-star.tsx:4,89 ใช้ Star แทนการเพิ่ม Watchlist ส่วน bottom-nav.tsx:79 + palette ใช้ Wallet แทน Portfolio

**วิธีแก้ที่เสนอ:** ยึด Wallet = Portfolio ทุกที่ (เปลี่ยนไอคอน pill ใน header desktop และแถว /more) และสงวน Star/Bookmark ไว้ฝั่ง Watchlist ให้ตรงกับ WatchlistStar ที่ผู้ใช้กดบ่อยสุด

### `IA-NAV-06` — nav ทุกตัว (ชื่อปลายทาง)
**🟠 MED** · ด้าน: ความสม่ำเสมอ · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** หน้าเดียวกันถูกเรียกคนละชื่อข้าม platform: "/" คือ "ตลาด" บน desktop แต่ "หน้าแรก" บนมือถือ, "/sets" คือ "Browse" บน desktop แต่ "ชุดการ์ด" บนมือถือ — ผู้ใช้มือถือที่พิมพ์ชื่อแท็บที่ตัวเองเห็นลงใน palette จะหาไม่เจอ (palette ใช้ชื่อฝั่ง desktop)

**หลักฐาน:** header-constants.ts:16-17 ใช้ key "market"/"browse" สำหรับ / และ /sets แต่ bottom-nav.tsx:76-77 ใช้ "home"/"sets" — ปลายทางเดียวกันคนละชื่อ

**วิธีแก้ที่เสนอ:** เคาะชื่อเดียวต่อหนึ่งปลายทางแล้วใช้ key i18n เดียวกันทั้ง desktop nav, bottom-nav และ palette (แนะนำยึดชื่อฝั่งมือถือที่ผู้ใช้ไทยเข้าใจง่ายกว่า: หน้าแรก/ชุดการ์ด)

### `IA-NAV-07` — โครงโค้ด nav
**🟠 MED** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **S**

**ปัญหา:** มี dead code (TOOL_LINKS เหลือค้างจาก header เวอร์ชันเก่า) และ logic active-state ถูกก๊อปไว้ 2 ไฟล์ — บั๊กแท็บไม่ติด (finding แรก) จึงต้องตามแก้ 2 ที่เสมอ เสี่ยง drift ต่อในอนาคต

**หลักฐาน:** header-constants.ts:24-28 TOOL_LINKS ถูก export แต่ grep ทั้ง repo ไม่มีใคร import; bottom-nav.tsx:11-14 isTabActive ก๊อปปี้ logic เดียวกับ isActive ใน header-constants.ts:30-33

**วิธีแก้ที่เสนอ:** ลบ TOOL_LINKS ทิ้ง (เครื่องมือย้ายไปอยู่ /decks hub แล้ว) และ export ฟังก์ชัน isActive แบบ prefix-aware ตัวเดียวจาก lib/game ให้ header + bottom-nav ใช้ร่วมกัน

### `IA-NAV-08` — header มือถือ (ปุ่ม search)
**🔵 LOW** · ด้าน: a11y · จอ: มือถือ · effort: **S**

**ปัญหา:** ปุ่มแว่นขยายบน header มือถือคือทางเข้า search หลักหลังถอดแท็บ search ออกจาก bottom-nav แต่ tap target แค่ 36px ต่ำกว่าเกณฑ์ 44px ที่เจ้าของเคาะไว้สำหรับ iOS grammar

**หลักฐาน:** header-mobile.tsx:71 size="icon-sm" → button-variants.ts:27 = size-9 (36px)

**วิธีแก้ที่เสนอ:** ขยาย hit area เป็น ≥44px (เปลี่ยนเป็น size="icon" หรือเพิ่ม padding แบบ negative-margin) โดยขนาดไอคอนคงเดิมได้

### `IA-NAV-09` — โปรไฟล์สาธารณะ (/u vs /profile)
**🔵 LOW** · ด้าน: ซ้ำซ้อน · จอ: ทั้งคู่ · effort: **M**

**ปัญหา:** โปรไฟล์สาธารณะมี 2 URL ซ้อนกัน (/u/[handle] กับ /profile/[userId]) และแต่ละจุดในแอปเลือกใช้ไม่เหมือนกัน — ผู้ใช้แชร์ลิงก์แล้วได้ URL คนละแบบ, SEO แตกเป็น 2 หน้า

**หลักฐาน:** seller-lock-banner.tsx:22 เลือก /u/[handle] หรือ /profile/[id] ตามเงื่อนไข แต่ header-user-menu.tsx:230 ชี้ /profile/${userId} เสมอ — สอง route โชว์โปรไฟล์เดียวกัน

**วิธีแก้ที่เสนอ:** เคาะให้ /u/[handle] เป็น canonical (สั้น สวย แชร์ง่าย) แล้วให้ /profile/[userId] redirect ไปหา handle เมื่อผู้ใช้มี handle — ทุกลิงก์ภายในใช้ helper เดียวตัดสินใจ

### 🧩 ข้อเสนอ re-compose ของ area นี้
ไม่มีหน้าไหนต้องรื้อทั้งหน้า — แต่ /more ควรจัดกลุ่มใหม่ให้ตรง VISION §2 (mobile): (1) บล็อกผู้ใช้ (เดิม) → (2) PLAY: เด็คและเครื่องมือ · Honey → (3) TRACK: แจ้งเตือนราคา · เปรียบเทียบการ์ด · การ์ดมาแรง (ตัด sets/portfolio/watchlist ที่ซ้ำแท็บออก) → (4) ACCOUNT/TRADE: ออเดอร์ · ที่บันทึก · ข้อความ · Seller (ตาม flag) → (5) Preferences (เดิม) → (6) เพิ่มเติมของเว็บ: Settings · Pricing · Guide · Blog · เกี่ยวกับเรา · ติดต่อเรา → (7) ออกจากระบบ — ส่วน desktop ให้ /more แสดง header ปกติ (chrome เดิม) เพราะเนื้อหาเดียวกันมีครบใน header menus อยู่แล้ว
