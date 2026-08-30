export type SetInfo = {
  code: string;
  name: string;
  nameEn?: string;
  type: "BOOSTER" | "EXTRA_BOOSTER" | "STARTER" | "PROMO" | "OTHER";
  /** Official Japanese release date (YYYY-MM-DD). */
  releaseDate?: string;
};

/**
 * Release dates are the Japanese street dates published by Bandai on the
 * official product list (https://www.onepiece-cardgame.com/products/ —
 * read 2026-08-30), i.e. the day the product actually went on sale in Japan,
 * not the announcement date. `don` is deliberately undated: our "DON!! Card
 * Collection" is a bucket we assembled for DON!! cards, not a Bandai product
 * with a street date, so inventing one would put a fake fact on the page.
 */
export const OPCG_SETS: SetInfo[] = [
  // Boosters (OP-01 to OP-15) — names from Bandai official
  { code: "op01", name: "ROMANCE DAWN", nameEn: "Romance Dawn", type: "BOOSTER", releaseDate: "2022-07-22" },
  { code: "op02", name: "頂上決戦", nameEn: "Paramount War", type: "BOOSTER", releaseDate: "2022-11-04" },
  { code: "op03", name: "強大な敵", nameEn: "Pillars of Strength", type: "BOOSTER", releaseDate: "2023-02-11" },
  { code: "op04", name: "謀略の王国", nameEn: "Kingdoms of Intrigue", type: "BOOSTER", releaseDate: "2023-05-27" },
  { code: "op05", name: "新時代の主役", nameEn: "Awakening of the New Era", type: "BOOSTER", releaseDate: "2023-08-26" },
  { code: "op06", name: "双璧の覇者", nameEn: "Wings of Captain", type: "BOOSTER", releaseDate: "2023-11-25" },
  { code: "op07", name: "500年後の未来", nameEn: "500 Years in the Future", type: "BOOSTER", releaseDate: "2024-02-24" },
  { code: "op08", name: "二つの伝説", nameEn: "Two Legends", type: "BOOSTER", releaseDate: "2024-05-25" },
  { code: "op09", name: "四皇の覇気", nameEn: "Emperors in the New World", type: "BOOSTER", releaseDate: "2024-08-31" },
  { code: "op10", name: "ロイヤルブラッドライン", nameEn: "Royal Blood", type: "BOOSTER", releaseDate: "2024-11-30" },
  { code: "op11", name: "激闘の支配者", nameEn: "A Fist of Divine Speed", type: "BOOSTER", releaseDate: "2025-03-01" },
  { code: "op12", name: "烈風の支配者", nameEn: "Legacy of the Master", type: "BOOSTER", releaseDate: "2025-05-31" },
  { code: "op13", name: "紡がれし絆", nameEn: "Carrying on His Will", type: "BOOSTER", releaseDate: "2025-08-23" },
  { code: "op14", name: "蒼海の七傑", nameEn: "The Azure Sea's Seven", type: "BOOSTER", releaseDate: "2025-11-22" },
  { code: "op15", name: "神の島の冒険", nameEn: "Adventure on KAMI's Island", type: "BOOSTER", releaseDate: "2026-02-28" },
  // Extra Boosters
  { code: "eb01", name: "メモリアルコレクション", nameEn: "Memorial Collection", type: "EXTRA_BOOSTER", releaseDate: "2024-01-27" },
  { code: "eb02", name: "Anime 25th collection", nameEn: "Anime 25th Collection", type: "EXTRA_BOOSTER", releaseDate: "2025-01-25" },
  { code: "eb03", name: "ONE PIECE Heroines Edition", nameEn: "ONE PIECE Heroines Edition", type: "EXTRA_BOOSTER", releaseDate: "2025-10-25" },
  { code: "eb04", name: "EGGHEAD CRISIS", nameEn: "EGGHEAD CRISIS", type: "EXTRA_BOOSTER", releaseDate: "2026-01-31" },
  // Starters (ST-01 to ST-29) — names from Bandai official
  { code: "st01", name: "麦わらの一味", nameEn: "Straw Hat Crew", type: "STARTER", releaseDate: "2022-07-08" },
  { code: "st02", name: "最悪の世代", nameEn: "Worst Generation", type: "STARTER", releaseDate: "2022-07-08" },
  { code: "st03", name: "王下七武海", nameEn: "The Seven Warlords of the Sea", type: "STARTER", releaseDate: "2022-07-08" },
  { code: "st04", name: "百獣海賊団", nameEn: "Animal Kingdom Pirates", type: "STARTER", releaseDate: "2022-07-08" },
  { code: "st05", name: "ONE PIECE FILM edition", nameEn: "ONE PIECE FILM edition", type: "STARTER", releaseDate: "2022-08-06" },
  { code: "st06", name: "海軍", nameEn: "The Navy", type: "STARTER", releaseDate: "2022-09-30" },
  { code: "st07", name: "ビッグ・マム海賊団", nameEn: "Big Mom Pirates", type: "STARTER", releaseDate: "2023-01-21" },
  { code: "st08", name: "Side モンキー・D・ルフィ", nameEn: "Side Monkey.D.Luffy", type: "STARTER", releaseDate: "2023-03-25" },
  { code: "st09", name: "Side ヤマト", nameEn: "Side Yamato", type: "STARTER", releaseDate: "2023-03-25" },
  { code: "st10", name: "三船長集結", nameEn: "The Three Captains", type: "STARTER", releaseDate: "2023-07-29" },
  { code: "st11", name: "ウタ", nameEn: "Side Uta", type: "STARTER", releaseDate: "2023-10-07" },
  { code: "st12", name: "ゾロ&サンジ", nameEn: "Zoro & Sanji", type: "STARTER", releaseDate: "2023-10-28" },
  { code: "st13", name: "三兄弟の絆", nameEn: "The Three Brothers Bond", type: "STARTER", releaseDate: "2023-12-23" },
  { code: "st14", name: "3D2Y", nameEn: "3D2Y", type: "STARTER", releaseDate: "2024-04-27" },
  { code: "st15", name: "赤 エドワード・ニューゲート", nameEn: "Red Edward.Newgate", type: "STARTER", releaseDate: "2024-07-13" },
  { code: "st16", name: "緑 ウタ", nameEn: "Green Uta", type: "STARTER", releaseDate: "2024-07-13" },
  { code: "st17", name: "青 ドンキホーテ・ドフラミンゴ", nameEn: "Blue Donquixote Doflamingo", type: "STARTER", releaseDate: "2024-07-13" },
  { code: "st18", name: "紫 モンキー・D・ルフィ", nameEn: "Purple Monkey.D.Luffy", type: "STARTER", releaseDate: "2024-07-13" },
  { code: "st19", name: "黒 スモーカー", nameEn: "Black Smoker", type: "STARTER", releaseDate: "2024-07-13" },
  { code: "st20", name: "黄 シャーロット・カタクリ", nameEn: "Yellow Charlotte Katakuri", type: "STARTER", releaseDate: "2024-07-13" },
  { code: "st21", name: "ギア5", nameEn: "GEAR5", type: "STARTER", releaseDate: "2024-12-21" },
  { code: "st22", name: "エース&ニューゲート", nameEn: "Ace & Newgate", type: "STARTER", releaseDate: "2025-04-26" },
  { code: "st23", name: "赤 シャンクス", nameEn: "Red Shanks", type: "STARTER", releaseDate: "2025-06-28" },
  { code: "st24", name: "緑 ジュエリー・ボニー", nameEn: "Green Jewelry Bonney", type: "STARTER", releaseDate: "2025-06-28" },
  { code: "st25", name: "青 バギー", nameEn: "Blue Buggy", type: "STARTER", releaseDate: "2025-06-28" },
  { code: "st26", name: "紫黒 モンキー・D・ルフィ", nameEn: "Purple/Black Monkey.D.Luffy", type: "STARTER", releaseDate: "2025-06-28" },
  { code: "st27", name: "黒 マーシャル・D・ティーチ", nameEn: "Black Marshall.D.Teach", type: "STARTER", releaseDate: "2025-06-28" },
  { code: "st28", name: "緑黄 ヤマト", nameEn: "Green/Yellow Yamato", type: "STARTER", releaseDate: "2025-06-28" },
  { code: "st29", name: "EGGHEAD", nameEn: "EGGHEAD", type: "STARTER", releaseDate: "2025-12-20" },
  // Premium Boosters / Promo
  { code: "prb01", name: "ONE PIECE CARD THE BEST", nameEn: "ONE PIECE CARD THE BEST", type: "PROMO", releaseDate: "2024-07-27" },
  { code: "prb02", name: "ONE PIECE CARD THE BEST vol.2", nameEn: "ONE PIECE CARD THE BEST vol.2", type: "PROMO", releaseDate: "2025-07-26" },
  { code: "don", name: "DON!! Card Collection", nameEn: "DON!! Card Collection", type: "PROMO" },
];

export const SET_CODES = OPCG_SETS.map((s) => s.code);

/**
 * The verified Japanese street date for a set code, or null when Bandai never
 * published one (see the catalog note above — `don` is our own bucket).
 */
export function getJapaneseSetReleaseDate(code: string): string | null {
  return (
    OPCG_SETS.find((set) => set.code === code.toLowerCase())?.releaseDate ?? null
  );
}

/** Prefer a scraped database date; otherwise fall back to the verified
 * catalog above — which today is the only source, since no `CardSet` row has
 * been backfilled with a release date yet. */
export function resolveSetReleaseDate(
  code: string,
  databaseReleaseDate: Date | null,
): Date | null {
  if (databaseReleaseDate) return databaseReleaseDate;

  const catalogReleaseDate = getJapaneseSetReleaseDate(code);
  return catalogReleaseDate
    ? new Date(`${catalogReleaseDate}T00:00:00.000Z`)
    : null;
}

/** "Starter Deck EX" display boxes — their packaging is landscape, so the
 *  portrait crop that only eats transparent margin on the other 47 sets would
 *  clip real product here. Renderers switch these to `object-contain`. */
const WIDE_BOX_ART_CODES = new Set(["st10", "st13", "st21"]);

export function hasWideBoxArt(code: string): boolean {
  return WIDE_BOX_ART_CODES.has(code.toLowerCase());
}
