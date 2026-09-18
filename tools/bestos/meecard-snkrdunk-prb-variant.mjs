// ชุดรีปรินต์ PRB ("ONE PIECE CARD THE BEST") — รหัสเดียวมีได้ 3 แบบ เลือกแถวให้ถูกแบบ
//
// อ่านจากของจริง 244 คู่ที่จับไปแล้ว + ส่องตราท้ายการ์ด (ST06-014 · ST03-013) เมื่อ 2026-09-19:
//   ใบธรรมดา            ตราไม่มีดาว  → MeeCard เก็บเป็น `_rN` ความหายากธรรมดา (เช่น C)
//   ": Pirate Flag Foil" ตราไม่มีดาว  → `_pN` ความหายากธรรมดา   (ฟอยล์ลายธงโจรสลัด ไม่ใช่พาราเรล)
//   ":Full Art"          ตรา★มีดาว   → ความหายาก `P-x`          (เป็นพาราเรล)
//   "C-P" / "-SP" / "-SPC" ตรา★มีดาว → ความหายาก `P-x`
// จุดที่เคยพลาด: กฎเดิมเหมารวม FOIL กับ FULL ART เป็น "พาราเรล" เหมือนกัน และกรองความหายากแบบตรงตัวก่อน
// ทำให้แถว `P-x` ที่ถูกต้องถูกตัดทิ้งตั้งแต่ต้น เหลือแต่แถวที่มีเจ้าของแล้ว → ตีเป็น target_occupied 73 ใบ

const norm = (v) => String(v ?? "").toUpperCase().replace(/\s+/g, "").trim();
/** ความหายากตระกูลเดียวกัน: P-UC กับ UC = UC */
export const family = (r) => norm(r).replace(/^P-/, "");
const isParallelRarity = (r) => /^P-/.test(norm(r));

/** ใบนี้เป็นแบบไหนของชุด PRB — ดูจากชื่อรายการ + ความหายากที่อ่านได้จากชื่อ */
export function prbTreatment(name, rarity) {
  const n = String(name ?? "");
  if (/FULL ART|ALT(?:ERNATE)? ART|PARALLEL/i.test(n) || isParallelRarity(rarity)) return "star";
  if (/\bFOIL\b/i.test(n)) return "foil";
  return "plain";
}

/**
 * เลือกแถวการ์ดของเราที่ตรงกับแบบนั้น
 * @param rows แถวของรหัสนี้ที่อยู่ในชุด PRB เดียวกับรายการ (กรอง set มาแล้ว)
 * @returns แถวที่เข้าข่าย · [] = ไม่มี ให้ผู้เรียกไปใช้กติกาทั่วไปต่อ
 */
export function pickPrbRows(rows, treatment, wantFamily) {
  const same = (rows ?? []).filter((k) => family(k.rarity) === family(wantFamily));
  if (!same.length) return [];
  if (treatment === "star") return same.filter((k) => isParallelRarity(k.rarity));
  const plainRarity = same.filter((k) => !isParallelRarity(k.rarity));
  if (treatment === "foil") return plainRarity.filter((k) => /_p\d+$/i.test(String(k.cardCode)));
  const reprint = plainRarity.filter((k) => /_r\d+$/i.test(String(k.cardCode)));
  return reprint.length ? reprint : plainRarity.filter((k) => !/_[pr]\d+$/i.test(String(k.cardCode)));
}
