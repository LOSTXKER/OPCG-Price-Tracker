/**
 * ทะเบียน "ลายศิลป์พิเศษ" ของการ์ด OPTCG — ข้อมูลที่ Bandai ไม่ได้พิมพ์เป็นรหัส
 * และร้านญี่ปุ่นที่เราขูดราคาก็ไม่ได้บอก (ป้ายที่ได้มามีแค่ SP / SEC / P-SEC)
 *
 * ที่มาของรายชื่อ: ไล่ดูรูปการ์ด SP + SEC + P-SEC ทั้ง 233 ใบด้วยตา (2026-08-30)
 * แล้วแยกตามสิ่งที่เห็นในภาพ ไม่ใช่ตามชื่อหรือรหัส:
 *   manga    — พื้นหลังเป็นแผงการ์ตูนจากมังงะต้นฉบับ (ลายเส้นหมึก ขาวดำ)
 *   mangaRed — แบบเดียวกันแต่พิมพ์ด้วยหมึกแดงทั้งใบ
 *   wanted   — ลายใบประกาศจับ DEAD OR ALIVE (ไม่ใช่แผงมังงะ แต่เป็นอีกลายที่คนแยกเรียก)
 *
 * เพิ่มใบใหม่ = เติมบรรทัดที่นี่ที่เดียว (คีย์คือ cardCode เต็ม รวมท้าย _pN/_rN
 * เพราะลายพิเศษผูกกับ "งานพิมพ์" ใบนั้น ไม่ใช่กับหมายเลขการ์ด)
 */

export type CardArtStyle = "manga" | "mangaRed" | "wanted"

export const CARD_ART_STYLE: Record<string, CardArtStyle> = {
  "OP05-119_p2": "manga", // P-SEC · Monkey.D.Luffy (Parallel)
  "OP09-118_p2": "manga", // P-SEC · Gol.D.Roger
  "EB02-061_p2": "manga", // P-SEC · Monkey.D.Luffy
  "OP13-118_p2": "manga", // P-SEC · Monkey.D.Luffy
  "OP06-118_p2": "manga", // P-SEC · Roronoa Zoro (Parallel)
  "OP01-120_p2": "manga", // P-SEC · Shanks (Parallel)
  "OP15-118_p2": "manga", // P-SEC · Enel
  "OP13-119_p2": "manga", // P-SEC · Portgas.D.Ace
  "EB03-061_p2": "manga", // P-SEC · Uta
  "OP11-118_p2": "manga", // P-SEC · Monkey.D.Luffy
  "OP14-119_p2": "manga", // P-SEC · Dracule Mihawk
  "OP09-093_p5": "manga", // SP · Marshall.D.Teach
  "OP13-120_p2": "manga", // P-SEC · Sabo
  "OP03-122_p2": "manga", // P-SEC · Sogeking (Parallel)
  "OP12-118_p2": "manga", // P-SEC · Jewelry Bonney
  "OP08-118_p2": "manga", // P-SEC · Silvers Rayleigh (Parallel)
  "OP10-119_p2": "manga", // P-SEC · Trafalgar Law
  "OP15-118": "manga", // SEC · Enel
  "OP06-119_p3": "manga", // P-SEC · Sanji
  "OP12-118": "manga", // SEC · Jewelry Bonney
  "OP14-119": "manga", // SEC · Dracule Mihawk
  "OP05-119_r2": "manga", // SEC · Monkey.D.Luffy
  "OP11-118": "manga", // SEC · Monkey.D.Luffy
  "EB03-061": "manga", // SEC · Uta
  "OP06-118_r1": "manga", // SEC · Roronoa Zoro
  "OP06-118": "manga", // SEC · Roronoa Zoro
  "OP06-119": "manga", // SEC · Sanji
  "OP03-122_r1": "manga", // SEC · Sogeking
  "OP03-122": "manga", // SEC · Sogeking
  "OP08-118": "manga", // SEC · Silvers Rayleigh
  "OP01-120_r2": "manga", // SEC · Shanks
  "OP09-057_p2": "manga", // SP · Cross Guild
  "OP09-078_p2": "manga", // SP · Gum-Gum Giant
  "OP09-096_p1": "manga", // SP · My Era...Begins!!
  "OP09-119_p2": "manga", // P-SEC · Monkey.D.Luffy
  "OP13-118_p3": "mangaRed", // P-SEC · Monkey.D.Luffy
  "OP13-119_p3": "mangaRed", // P-SEC · Portgas.D.Ace
  "OP13-120_p3": "mangaRed", // P-SEC · Sabo
  "OP01-120_p5": "mangaRed", // P-SEC · Shanks
  "OP09-020_p2": "mangaRed", // SP · Come On!! We'll Fight You!!
  "OP13-118_p4": "wanted", // P-SEC · Monkey.D.Luffy
  "ST01-012_p1": "wanted", // SP · Monkey.D.Luffy (Parallel)
  "OP05-119_p5": "wanted", // SP · Monkey.D.Luffy
  "OP09-004_p3": "wanted", // SP · Shanks
  "OP13-120_p4": "wanted", // P-SEC · Sabo
  "OP09-118_p3": "wanted", // SP · Gol.D.Roger
  "OP13-119_p4": "wanted", // P-SEC · Portgas.D.Ace
  "OP09-051_p3": "wanted", // SP · Buggy
  "OP09-093_p3": "wanted", // SP · Marshall.D.Teach
  "OP01-051_p2": "wanted", // SP · Eustass'Captain'Kid (Parallel)
  "ST04-003_p1": "wanted", // SP · Kaido (Parallel)
  "ST03-009_p1": "wanted", // SP · Donquixote Doflamingo (Parallel)
  "OP13-118": "wanted", // SP · Monkey.D.Luffy
  "OP09-118": "wanted", // SEC · Gol.D.Roger
  "OP13-120": "wanted", // SP · Sabo
  "OP13-119": "wanted", // SP · Portgas.D.Ace
}

/** ลายพิเศษของการ์ดใบนี้ — คืน null เมื่อเป็นลายปกติ */
export function cardArtStyle(cardCode: string): CardArtStyle | null {
  return CARD_ART_STYLE[cardCode] ?? null
}
