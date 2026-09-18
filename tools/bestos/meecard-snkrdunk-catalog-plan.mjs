#!/usr/bin/env node
// Read-only planner: SNKRDUNK One Piece catalog (JP listings) -> MeeCard cards.
// Rebuilt 2026-09-06 (first version lived in a session scratchpad and was lost on reboot — lesson 2026-09-06).
// Reuses the supervisor's image features + Vision OCR locale gate. Never calls mutation tools.
//
// usage: node tools/bestos/meecard-snkrdunk-catalog-plan.mjs --catalog snkr.json --cards cards.json --mappings maps.json --out DIR [--no-ocr]
//   --no-ocr = ข้ามขั้น Apple Vision (เครื่องที่ไม่ใช่ Mac) · กรองฉบับต่างภาษาจากชื่อ/ป้ายในชื่ออย่างเดียว (เบสเคาะทาง ข 2026-09-19)
//   snkr.json     = { items: [...] } from https://snkrdunk.com/en/v1/brands/onepiece/streetwears?perPage=100&page=N&department=tradingCard
//   cards.json    = { cards: [...] }   from MCP card_list (all pages)
//   maps.json     = { mappings: [...] } from MCP snkrdunk_mapping_list (all statuses)
// outputs in DIR: plan.json (every listing + verdict), manifest-auto.json (approval-ready), manifest-review.json (needs eyeball)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchImageFeature, compareImageFeatures, normalizePrintedCode } from "./meecard-auto-match-supervisor.mjs";
import {
  downloadSnkrdunkSourceImage, runVisionOcrBatch, classifyJapaneseLocale, detectBlockedLocaleMarker, preferLargeSnkrdunkImageUrl,
} from "./meecard-snkrdunk-locale-ocr.mjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const log = (...a) => console.error(new Date().toISOString(), ...a);
const STRICT = /^(?:OP\d{2}-\d{3}|ST\d{2}-\d{3}|EB\d{2}-\d{3}|P-\d{3}|PRB\d{2}-\d{3})$/i;
// promo / prize / collection listings never map to a standard MeeCard card (policy 09-01/09-02: manual only)
const PROMO = /PROMOTION(?:AL)?|PROMO\b|WINNER|PRIZE|CHAMPIONSHIP|TOURNAMENT|FLAGSHIP|STANDARD BATTLE|ANNIVERSARY|COLLECTION|MAGAZINE|JUMP\b|GIFT|SOUVENIR|SUPPLEMENT|ATTENDEE|VISITOR|PARTICIPA|SERIAL|シリアル|刻印|STAMPED|MEETUP|MEET-UP|CAMPAIGN|TREASURE|ENCORE PACK|FAMILY DECK|SOUND LOADER|PLAYMAT|TROPHY|BENEFIT|PRIVILEGE|FREEBIE|APPENDIX|SET\b.*ANNIVERSARY|\[Aisa ver\.?\]|\[CHN\]|:\s*(?:TOP|BEST \d+|1ST|2ND|3RD)|:\s*ERROR\b/i;
const LOCALE = /\[(?:EN|ZH(?:[-_](?:CN|TW|HK|HANS|HANT))?|CN|KR|KO|TH|FR|DE|ES|IT|PT)\]|\b(?:ENGLISH|CHINESE|KOREAN|THAI)\s+(?:LANGUAGE|VERSION|EDITION)\b/i;
const OPENED = /\b(?:OPENED|UN[- ]?OPEN(?:ED)?|SEALED)\b|開封|未開封/i;

const norm = (s) => String(s ?? "").replace(/&/g, " and ").toLowerCase().replace(/[’'"“”\-–—.:!,]/g, " ").replace(/\s+/g, " ").trim();
const SET_DICT = [
  [/premium booster .*the best.*vol ?2/, "prb02"], [/premium booster .*the best/, "prb01"],
  [/romance dawn/, "op01"], [/final battle|paramount war/, "op02"], [/formidable enemy|pillars of strength/, "op03"],
  [/kingdom of conspiracy|kingdoms of intrigue/, "op04"], [/awakening of the new era/, "op05"], [/wings of (the )?captain/, "op06"],
  [/500 yea/, "op07"], [/two legends/, "op08"], [/emperors in the new world/, "op09"], [/royal blood/, "op10"],
  [/fist of divine speed/, "op11"], [/legacy of the master/, "op12"], [/carrying on his will/, "op13"], [/azure sea s seven/, "op14"],
  [/adventure on kami s island/, "op15"], [/time of battle/, "op16"], [/world s strongest warriors/, "op17"],
  [/extra booster.*memorial collection/, "eb01"], [/anime 25th collection/, "eb02"], [/heroines edition vol ?2/, "eb05"], [/heroines edition/, "eb03"], [/egghead crisis/, "eb04"],
  [/start deck.*(straw hat pirates|straw hat crew)/, "st01"], [/start deck.*worst generation/, "st02"], [/start deck.*seven warlords/, "st03"],
  [/start d[ae]cks?.*(animal kingdom|beasts pirates)/, "st04"], [/start deck.*film edition/, "st05"], [/start deck.*absolute justice/, "st06"],
  [/start deck.*big mom/, "st07"], [/start deck.*side monkey d luffy/, "st08"], [/start deck.*side yamato/, "st09"], [/ultimate deck.*three captains/, "st10"],
  [/start deck.*side uta/, "st11"], [/start(er)? deck.*zoro and sanji/, "st12"], [/ultimate deck.*three brothers/, "st13"], [/start deck.*3d2y/, "st14"],
  [/start deck.*red edward newgate/, "st15"], [/start deck.*green uta/, "st16"], [/start deck.*blue donquixote doflamingo/, "st17"], [/start deck.*purple monkey d luffy/, "st18"],
  [/start deck.*black smoker/, "st19"], [/start deck.*yellow charlotte katakuri/, "st20"], [/start deck ex.*gear ?5/, "st21"], [/start deck.*ace and newgate/, "st22"],
  [/start deck.*red shanks/, "st23"], [/start deck.*green jewelry bonney/, "st24"], [/start deck.*blue buggy/, "st25"], [/start deck.*purple black monkey d luffy/, "st26"],
  [/start deck.*black marshall d teach/, "st27"], [/start deck.*green yellow yamato/, "st28"], [/start deck.*egghead/, "st29"], [/start deck ex.*luffy and ace/, "st30"],
  [/start deck.*red monkey d luffy/, "st31"], [/start deck.*green roronoa zoro/, "st32"], [/start deck.*blue kuzan/, "st33"], [/start deck.*purple charlotte katakuri/, "st34"],
  [/start deck.*red black sabo/, "st35"], [/start deck.*yellow eustass/, "st36"],
];
function packTitle(name) { const m = String(name).match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/); return m ? m[1].replace(/\s+/g, " ").trim() : ""; }
function setFromTitle(title) { const t = norm(title); for (const [re, set] of SET_DICT) if (re.test(t)) return set; return null; }
const normRarity = (v) => String(v ?? "").toUpperCase().replace(/\s+/g, "").trim();
function parseRarity(name) {
  const t = String(name ?? "").toUpperCase();
  // "SR-SP (Manga Alt Art)" = MeeCard P-SR (_pN ที่ index สูงสุด) ไม่ใช่ rarity "SP" · เคส OP17 09-08: 7 ใบ manga หลุดเพราะเดิม return "SP"
  const sp = t.match(/\b(L|C|UC|R|SR|SEC)-SPC?\b/); if (sp) return `P-${sp[1]}`;
  if (/\bP-SPC\b/.test(t)) return "SP"; // Special Card ของโปรโม P-xxx (เช่น P-084/P-105) MeeCard เก็บเป็น SP
  const rp = t.match(/\b(L|C|UC|R|SR|SEC)-RP\b/); if (rp) return `P-${rp[1]}`; // OP13 Gorosei "R-RP" = พาราเรลใบแพง (_p2)
  if (/\b(?:L|C|UC|R|SR|SEC)-TR\b/.test(t)) return "TR";
  const p = t.match(/\b(L|C|UC|R|SR|SEC|SP)-P\b/); if (p) return `P-${p[1]}`;
  const d = t.match(/(?:^|[\s[(])(P-(?:L|C|UC|R|SR|SEC|SP)|SEC|SR|SP|UC|L|R|C|P)(?=[\s:,[\]()])/); return d?.[1] ?? "";
}
const family = (r) => normRarity(r).replace(/^P-/, "");
async function mapLimit(items, limit, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); } })); return out; }

const outDir = opt("--out", "."); fs.mkdirSync(outDir, { recursive: true });
const catalog = JSON.parse(fs.readFileSync(opt("--catalog"), "utf8")).items;
const cards = JSON.parse(fs.readFileSync(opt("--cards"), "utf8")).cards;
const mappings = JSON.parse(fs.readFileSync(opt("--mappings"), "utf8")).mappings;
const UNIQUE_MAX = Number(opt("--unique-max", "0.35")), REVIEW_MAX = Number(opt("--review-max", "0.50"));
const MULTI_MAX = Number(opt("--multi-max", "0.30")), MULTI_MARGIN = Number(opt("--multi-margin", "0.06"));

const known = new Set(mappings.map((m) => Number(m.snkrdunkId)));
const occupied = new Set(mappings.filter((m) => m.status === "MATCHED").map((m) => Number(m.matchedCardId)));
const byCode = new Map(); for (const c of cards) { const k = normalizePrintedCode(c.cardCode); if (!byCode.has(k)) byCode.set(k, []); byCode.get(k).push(c); }

const rows = [];
for (const x of catalog) {
  if (!x.isTradingCard || !STRICT.test(String(x.productNumber ?? "")) || known.has(Number(x.id))) continue;
  const name = String(x.name ?? "");
  const r = { snkrdunkId: Number(x.id), code: normalizePrintedCode(x.productNumber), name, thumbnailUrl: x.thumbnailUrl, minPriceFormat: x.minPriceFormat, packTitle: packTitle(name), set: null, rarity: parseRarity(name), stage: "", candidates: [], verdict: "", note: "" };
  rows.push(r);
  if (LOCALE.test(name)) { r.verdict = "explicit_locale"; continue; }
  if (OPENED.test(name)) { r.verdict = "opened_or_unopened"; continue; }
  // ชื่อชุด Extra Booster ("Memorial Collection" EB01 · "Anime 25th Collection" EB02) ติดคำว่า COLLECTION ในกฎโปรโม ทั้งที่เป็นชุดปกติที่ผูกไปแล้ว 109 ใบ
  // (เจอ 2026-09-19: ผลรอบประจำวันได้ auto 0 เพราะ EB ทั้งชุดถูกตีเป็นโปรโม) → ตัดชื่อชุด Extra Booster ออกก่อนเทียบกฎโปรโม · โปรโมจริง (Premium Card Collection / Anniversary / Serial) ยังโดนเหมือนเดิม
  const nameForPromo = name.replace(/\(Extra Booster[^)]*Collection[^)]*\)/i, "");
  if (PROMO.test(nameForPromo)) { r.verdict = "promo_manual_only"; continue; }
  r.set = setFromTitle(r.packTitle);
  if (!r.set) { r.verdict = "unmapped_pack"; continue; }
  if (!r.rarity) { r.verdict = "no_rarity"; continue; }
  const all = byCode.get(r.code) ?? [];
  let c = all.filter((k) => normRarity(k.rarity) === r.rarity); r.stage = "code+rarity";
  const inSet = c.filter((k) => k.set?.code === r.set);
  if (inSet.length) { c = inSet; r.stage = "code+rarity+set"; }
  else { const fam = all.filter((k) => k.set?.code === r.set && family(k.rarity) === family(r.rarity)); if (fam.length) { c = fam; r.stage = "code+family+set"; } else if (c.length === 1) { r.stage = "code+rarity(any-set,unique)"; } else { c = []; r.stage = "set_no_candidate"; } }
  // THE BEST reprints: plain listing -> _rN · ":Full Art" / ": Foil" / parallel wording -> _pN (same rarity in MeeCard)
  if (c.length > 1 && /^prb/.test(r.set)) {
    const wantsParallel = /FULL ART|FOIL|PARALLEL|ALT(?:ERNATE)? ART/i.test(name);
    const pick = c.filter((k) => wantsParallel ? /_p\d+$/i.test(k.cardCode) : /_r\d+$/i.test(k.cardCode));
    if (pick.length) { c = pick; r.stage += wantsParallel ? "+prb-parallel" : "+prb-plain"; }
  }
  r.candidates = c;
  if (!c.length) { r.verdict = "no_candidate"; continue; }
  const free = c.filter((k) => !occupied.has(Number(k.id)));
  if (!free.length) { r.verdict = "target_occupied"; continue; }
  r.candidates = free;
}
const eligible = rows.filter((r) => !r.verdict);
log("listings", rows.length, "eligible", eligible.length);

const urls = new Set(); for (const r of eligible) { urls.add(r.thumbnailUrl); for (const k of r.candidates) urls.add(k.imageUrl); }
const feat = new Map(); let n = 0;
await mapLimit([...urls], 10, async (u) => { feat.set(u, await fetchImageFeature(u, { retries: 2, timeoutMs: 20_000 })); if (++n % 500 === 0) log("images", n, "/", urls.size); });
log("images done", urls.size);

const used = new Map();
for (const r of eligible) {
  const src = feat.get(r.thumbnailUrl);
  if (!src?.ok) { r.verdict = src?.placeholder ? "source_placeholder" : "source_image_error"; continue; }
  const scored = r.candidates.map((k) => ({ k, v: compareImageFeatures(src, feat.get(k.imageUrl)) })).filter((s) => s.v).sort((a, b) => a.v.score - b.v.score);
  if (!scored.length) { r.verdict = "candidate_image_error"; continue; }
  const best = scored[0], second = scored[1]; const margin = second ? second.v.score - best.v.score : null;
  r.visualScore = Number(best.v.score.toFixed(6)); r.visualMargin = margin == null ? null : Number(margin.toFixed(6)); r.candidateCount = scored.length;
  let tier;
  if (scored.length === 1) tier = best.v.score <= UNIQUE_MAX ? "auto" : best.v.score <= REVIEW_MAX ? "review" : "reject";
  else tier = (best.v.score <= MULTI_MAX && margin >= MULTI_MARGIN) ? "auto" : (best.v.score <= REVIEW_MAX && margin >= 0.03) ? "review" : "reject";
  if (tier === "reject") { r.verdict = scored.length === 1 ? "unique_visual_too_high" : "multi_visual_ambiguous"; continue; }
  r.tier = tier; r.target = { id: Number(best.k.id), cardCode: best.k.cardCode, rarity: best.k.rarity, set: best.k.set?.code, imageUrl: best.k.imageUrl };
  const prev = used.get(Number(best.k.id));
  if (prev) {
    // two SNKRDUNK listings for the same MeeCard card: keep the one with a live price, else the lower visual score
    const hasPrice = (x) => !/[-–—]\s*$/.test(String(x.minPriceFormat ?? "").trim());
    const keepNew = (hasPrice(r) && !hasPrice(prev)) || (hasPrice(r) === hasPrice(prev) && r.visualScore < prev.visualScore);
    const loser = keepNew ? prev : r; const winner = keepNew ? r : prev;
    loser.verdict = `duplicate_listing_of:${winner.snkrdunkId}`; loser.tier = null;
    if (!keepNew) continue;
  }
  used.set(Number(best.k.id), r);
}
const shadow = eligible.filter((r) => r.tier && !r.verdict);
log("visual pass", shadow.length, "auto", shadow.filter((r) => r.tier === "auto").length, "review", shadow.filter((r) => r.tier === "review").length);

const NO_OCR = argv.includes("--no-ocr");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "meecard-snkr-plan-ocr-"));
try {
  const ocrRows = shadow.map((r) => ({ key: String(r.snkrdunkId), snkrdunkId: r.snkrdunkId, name: r.name, imageUrl: r.thumbnailUrl }));
  const blocked = new Map(ocrRows.map((row) => [row.key, detectBlockedLocaleMarker(row)]));
  if (NO_OCR) {
    // ไม่มี Apple Vision: เชื่อป้ายในชื่ออย่างเดียว (คู่ที่คนจับไว้ 3,893 คู่เป็นฉบับญี่ปุ่น 100% — วัด 09-19) · ใบที่ชื่อบอกว่าต่างภาษาถูกตัดไปแล้วข้างบน
    for (const r of shadow) { const b = blocked.get(String(r.snkrdunkId)); r.locale = b?.blocked ? { pass: false, reason: "explicit_non_japanese_locale" } : { pass: true, reason: "name_filter_only_no_ocr" }; }
    throw Object.assign(new Error("skip-ocr"), { skipOcr: true });
  }
  const dls = await mapLimit(ocrRows.filter((row) => !blocked.get(row.key)?.blocked), 6, (row) => downloadSnkrdunkSourceImage(row, tmp));
  const batch = await runVisionOcrBatch(dls.filter((d) => d.ok), tmp);
  const dl = new Map(dls.map((d) => [d.key, d]));
  for (const r of shadow) {
    const key = String(r.snkrdunkId);
    if (blocked.get(key)?.blocked) { r.locale = { pass: false, reason: "explicit_non_japanese_locale" }; continue; }
    const d = dl.get(key); if (!d?.ok) { r.locale = { pass: false, reason: "source_image_download_error" }; continue; }
    const o = batch.results.get(key); if (!o?.ok) { r.locale = { pass: false, reason: "vision_ocr_error" }; continue; }
    const c = classifyJapaneseLocale(o.lines); r.locale = { pass: c.pass, reason: c.reason, kanaCharacters: c.kanaCharacters, kanaLineCount: c.kanaLineCount };
  }
} catch (e) { if (!e?.skipOcr) throw e; }
finally { fs.rmSync(tmp, { recursive: true, force: true }); }
for (const r of shadow) { if (!r.locale?.pass) r.verdict = `locale:${r.locale?.reason}`; }

const toManifest = (r) => ({ snkrdunkId: r.snkrdunkId, matchedCardId: r.target.id, code: r.code, sourceImageUrl: preferLargeSnkrdunkImageUrl(r.thumbnailUrl), targetImageUrl: r.target.imageUrl, visual: { decision: "exact_metadata_and_visual", pass: true }, targetCode: r.target.cardCode, name: r.name, stage: r.stage, tier: r.tier, visualScore: r.visualScore, visualMargin: r.visualMargin });
const auto = shadow.filter((r) => !r.verdict && r.tier === "auto"), review = shadow.filter((r) => !r.verdict && r.tier === "review");
const plan = rows.map((r) => ({ ...r, candidates: r.candidates.map((k) => k.cardCode), verdict: r.verdict || `ready:${r.tier}` }));
const reasons = {}; for (const p of plan) reasons[p.verdict] = (reasons[p.verdict] ?? 0) + 1;
fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify({ generatedAt: new Date().toISOString(), thresholds: { UNIQUE_MAX, REVIEW_MAX, MULTI_MAX, MULTI_MARGIN }, reasons, plan }, null, 1));
fs.writeFileSync(path.join(outDir, "manifest-auto.json"), JSON.stringify({ rows: auto.map(toManifest) }, null, 1));
fs.writeFileSync(path.join(outDir, "manifest-review.json"), JSON.stringify({ rows: review.map(toManifest) }, null, 1));
console.log(JSON.stringify({ listings: rows.length, eligible: eligible.length, auto: auto.length, review: review.length, reasons }, null, 1));
