#!/usr/bin/env node
// Read-only re-audit of every MATCHED SNKRDUNK mapping on MeeCard (2026-09-07, after the 4-pass catalog linking).
// Independent of how rows were matched: (1) structural rules that use no images, (2) fresh image score with the large
// source image, (3) buckets for eyeballing. Never calls mutation tools.
//
// usage: node tools/companion/meecard-snkrdunk-matched-audit.mjs --mappings maps.json --cards cards.json --out DIR
//   maps.json  = { mappings: [...] } (all statuses; only MATCHED are audited)   cards.json = { cards: [...] }
import fs from "node:fs";
import path from "node:path";
import { fetchImageFeature, compareImageFeatures, normalizePrintedCode } from "./meecard-auto-match-supervisor.mjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const log = (...a) => console.error(new Date().toISOString(), ...a);
const outDir = opt("--out", "."); fs.mkdirSync(outDir, { recursive: true });
const mappings = JSON.parse(fs.readFileSync(opt("--mappings"), "utf8")).mappings.filter((m) => m.status === "MATCHED");
const cards = new Map(JSON.parse(fs.readFileSync(opt("--cards"), "utf8")).cards.map((c) => [Number(c.id), c]));

const LOCALE = /\[(?:EN|ZH(?:[-_](?:CN|TW|HK|HANS|HANT))?|CN|KR|KO|TH|FR|DE|ES|IT|PT)\]|\b(?:ENGLISH|CHINESE|KOREAN|THAI)\s+(?:LANGUAGE|VERSION|EDITION)\b/i;
const PROMO = /PROMOTION(?:AL)?|PROMO\b|WINNER|PRIZE|CHAMPIONSHIP|TOURNAMENT|FLAGSHIP|STANDARD BATTLE|ANNIVERSARY|COLLECTION|MAGAZINE|JUMP\b|GIFT|SOUVENIR|SUPPLEMENT|ATTENDEE|VISITOR|PARTICIPA|SERIAL|シリアル|刻印|STAMPED|MEETUP|MEET-UP|CAMPAIGN|TREASURE|ENCORE PACK|FAMILY DECK|SOUND LOADER|PLAYMAT|TROPHY|BENEFIT|PRIVILEGE|FREEBIE|APPENDIX|\[Aisa ver\.?\]|\[CHN\]|:\s*(?:TOP|BEST \d+|1ST|2ND|3RD)|:\s*ERROR\b/i;
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
const packTitle = (name) => { const m = String(name).match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/); return m ? m[1].replace(/\s+/g, " ").trim() : ""; };
const setFromTitle = (t) => { const n = norm(t); for (const [re, s] of SET_DICT) if (re.test(n)) return s; return null; };
const normRarity = (v) => String(v ?? "").toUpperCase().replace(/\s+/g, "").trim();
function parseRarity(name) {
  const t = String(name ?? "").toUpperCase();
  if (/\b(?:L|C|UC|R|SR|SEC)-SPC?\b/.test(t)) return "SP";
  if (/\b(?:L|C|UC|R|SR|SEC)-TR\b/.test(t)) return "TR";
  const p = t.match(/\b(L|C|UC|R|SR|SEC|SP)-P\b/); if (p) return `P-${p[1]}`;
  const d = t.match(/(?:^|[\s[(])(P-(?:L|C|UC|R|SR|SEC|SP)|SEC|SR|SP|UC|L|R|C|P)(?=[\s:,[\]()])/); return d?.[1] ?? "";
}
const isParallelCard = (c) => Boolean(c.isParallel || c.parallelIndex != null || /_p\d+$/i.test(c.cardCode) || /^P-/.test(normRarity(c.rarity)));
async function mapLimit(items, limit, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); } })); return out; }

// ---- 1) structural rules (no images)
const byTarget = new Map();
for (const m of mappings) { const t = Number(m.matchedCardId); if (!byTarget.has(t)) byTarget.set(t, []); byTarget.get(t).push(m.id); }
const rows = mappings.map((m) => {
  const card = cards.get(Number(m.matchedCardId)); const name = m.scrapedName ?? "";
  const flags = [];
  if (!card) { flags.push("target_card_missing"); return { mappingId: m.id, snkrdunkId: m.snkrdunkId, name, flags }; }
  const code = normalizePrintedCode(m.productNumber), cardCode = normalizePrintedCode(card.cardCode);
  if (code !== cardCode) flags.push(`code_mismatch:${code}!=${cardCode}`);
  const r = parseRarity(name), cr = normRarity(card.rarity);
  if (r && cr && r !== cr) {
    // tolerate known equivalences: listing "X-P" vs card "P-X" already normalized; prb Full Art/Foil parallels keep base rarity in MeeCard
    const prbParallel = /^prb/.test(card.set?.code ?? "") && /_p\d+$/i.test(card.cardCode) && r === cr.replace(/^P-/, "");
    if (!prbParallel) flags.push(`rarity_mismatch:${r}!=${cr}`);
  }
  const listingParallel = /\b(?:L|C|UC|R|SR|SEC|SP)-(?:P|SPC?)\b|FULL ART|FOIL|PARALLEL|ALT(?:ERNATE)? ART|MANGA/i.test(name);
  const cardParallel = isParallelCard(card);
  if (listingParallel !== cardParallel) flags.push(listingParallel ? "listing_parallel_card_plain" : "listing_plain_card_parallel");
  const set = setFromTitle(packTitle(name));
  if (set && card.set?.code && set !== card.set.code) flags.push(`set_mismatch:${set}!=${card.set.code}`);
  if (LOCALE.test(name)) flags.push("non_japanese_listing");
  if (PROMO.test(name)) flags.push("promo_listing");
  if ((byTarget.get(Number(m.matchedCardId)) ?? []).length > 1) flags.push("duplicate_target");
  const nameOnly = (/^prb/.test(card.set?.code ?? "") && /_(?:p|r)\d+$/i.test(card.cardCode)) || (/_p\d+$/i.test(card.cardCode) && Number(card.parallelIndex) >= 2);
  return { mappingId: m.id, snkrdunkId: m.snkrdunkId, code, name, thumbnailUrl: m.thumbnailUrl, matchedCardId: Number(m.matchedCardId), targetCode: card.cardCode, targetRarity: card.rarity, targetSet: card.set?.code, targetImageUrl: card.imageUrl, matchMethod: m.matchMethod, actionAt: m.actionAt, flags, nameOnly };
});
log("matched rows", rows.length, "with structural flags", rows.filter((r) => r.flags.length).length);

// ---- 2) fresh image score (large source image)
const large = (u) => { try { const x = new URL(u); x.searchParams.set("size", "l"); return x.toString(); } catch { return u; } };
const urls = new Set(); for (const r of rows) { if (r.thumbnailUrl) urls.add(large(r.thumbnailUrl)); if (r.targetImageUrl) urls.add(r.targetImageUrl); }
const feat = new Map(); let n = 0;
await mapLimit([...urls], 10, async (u) => { feat.set(u, await fetchImageFeature(u, { retries: 2, timeoutMs: 25_000 })); if (++n % 1000 === 0) log("images", n, "/", urls.size); });
for (const r of rows) {
  const a = feat.get(large(r.thumbnailUrl)), b = feat.get(r.targetImageUrl);
  const v = a?.ok && b?.ok ? compareImageFeatures(a, b) : null;
  r.visualScore = v ? Number(v.score.toFixed(6)) : null; r.visualError = v ? null : (a?.reason ?? b?.reason ?? "image_missing");
}

// ---- 3) buckets
const scored = rows.filter((r) => r.visualScore != null).sort((a, b) => b.visualScore - a.visualScore);
const worstN = Math.ceil(scored.length * 0.05);
const bucket = { structural: rows.filter((r) => r.flags.length), worst5pct: scored.slice(0, worstN), imageError: rows.filter((r) => r.visualScore == null), nameOnly: rows.filter((r) => r.nameOnly && !r.flags.length) };
const summary = { matched: rows.length, structuralFlags: bucket.structural.length, flagKinds: Object.entries(bucket.structural.flatMap((r) => r.flags.map((f) => f.split(":")[0])).reduce((m, k) => (m[k] = (m[k] ?? 0) + 1, m), {})), worst5pct: { count: worstN, minScore: scored[worstN - 1]?.visualScore, maxScore: scored[0]?.visualScore }, imageError: bucket.imageError.length, nameOnly: bucket.nameOnly.length, scoreHistogram: scored.reduce((m, r) => { const k = (Math.floor(r.visualScore * 20) / 20).toFixed(2); m[k] = (m[k] ?? 0) + 1; return m; }, {}) };
const toSheet = (r, tier) => ({ snkrdunkId: r.snkrdunkId, name: `${r.name} [m${r.mappingId}${r.flags.length ? " " + r.flags.join(";") : ""}]`, sourceImageUrl: large(r.thumbnailUrl), targetImageUrl: r.targetImageUrl, targetCode: r.targetCode, visualScore: r.visualScore, tier });
fs.writeFileSync(path.join(outDir, "audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 1));
for (const [k, v] of Object.entries(bucket)) fs.writeFileSync(path.join(outDir, `review-${k}.json`), JSON.stringify({ rows: v.map((r) => toSheet(r, k)) }, null, 1));
console.log(JSON.stringify(summary, null, 1));
