export type SetInfo = {
  code: string;
  name: string;
  nameEn?: string;
  type: "BOOSTER" | "EXTRA_BOOSTER" | "STARTER" | "PROMO" | "OTHER";
};

export const OPCG_SETS: SetInfo[] = [
  // Boosters (OP-01 to OP-15) — names from Bandai official
  { code: "op01", name: "ROMANCE DAWN", nameEn: "Romance Dawn", type: "BOOSTER" },
  { code: "op02", name: "頂上決戦", nameEn: "Paramount War", type: "BOOSTER" },
  { code: "op03", name: "強大な敵", nameEn: "Pillars of Strength", type: "BOOSTER" },
  { code: "op04", name: "謀略の王国", nameEn: "Kingdoms of Intrigue", type: "BOOSTER" },
  { code: "op05", name: "新時代の主役", nameEn: "Awakening of the New Era", type: "BOOSTER" },
  { code: "op06", name: "双璧の覇者", nameEn: "Wings of Captain", type: "BOOSTER" },
  { code: "op07", name: "500年後の未来", nameEn: "500 Years in the Future", type: "BOOSTER" },
  { code: "op08", name: "二つの伝説", nameEn: "Two Legends", type: "BOOSTER" },
  { code: "op09", name: "四皇の覇気", nameEn: "Emperors in the New World", type: "BOOSTER" },
  { code: "op10", name: "ロイヤルブラッドライン", nameEn: "Royal Blood", type: "BOOSTER" },
  { code: "op11", name: "激闘の支配者", nameEn: "A Fist of Divine Speed", type: "BOOSTER" },
  { code: "op12", name: "烈風の支配者", nameEn: "Legacy of the Master", type: "BOOSTER" },
  { code: "op13", name: "紡がれし絆", nameEn: "Carrying on His Will", type: "BOOSTER" },
  { code: "op14", name: "蒼海の七傑", nameEn: "The Azure Sea's Seven", type: "BOOSTER" },
  { code: "op15", name: "神の島の冒険", nameEn: "Adventure on KAMI's Island", type: "BOOSTER" },
  // Extra Boosters
  { code: "eb01", name: "メモリアルコレクション", nameEn: "Memorial Collection", type: "EXTRA_BOOSTER" },
  { code: "eb02", name: "Anime 25th collection", nameEn: "Anime 25th Collection", type: "EXTRA_BOOSTER" },
  { code: "eb03", name: "ONE PIECE Heroines Edition", nameEn: "ONE PIECE Heroines Edition", type: "EXTRA_BOOSTER" },
  { code: "eb04", name: "EGGHEAD CRISIS", nameEn: "EGGHEAD CRISIS", type: "EXTRA_BOOSTER" },
  // Starters (ST-01 to ST-29) — names from Bandai official
  { code: "st01", name: "麦わらの一味", nameEn: "Straw Hat Crew", type: "STARTER" },
  { code: "st02", name: "最悪の世代", nameEn: "Worst Generation", type: "STARTER" },
  { code: "st03", name: "王下七武海", nameEn: "The Seven Warlords of the Sea", type: "STARTER" },
  { code: "st04", name: "百獣海賊団", nameEn: "Animal Kingdom Pirates", type: "STARTER" },
  { code: "st05", name: "ONE PIECE FILM edition", nameEn: "ONE PIECE FILM edition", type: "STARTER" },
  { code: "st06", name: "海軍", nameEn: "The Navy", type: "STARTER" },
  { code: "st07", name: "ビッグ・マム海賊団", nameEn: "Big Mom Pirates", type: "STARTER" },
  { code: "st08", name: "Side モンキー・D・ルフィ", nameEn: "Side Monkey.D.Luffy", type: "STARTER" },
  { code: "st09", name: "Side ヤマト", nameEn: "Side Yamato", type: "STARTER" },
  { code: "st10", name: "三船長集結", nameEn: "The Three Captains", type: "STARTER" },
  { code: "st11", name: "ウタ", nameEn: "Side Uta", type: "STARTER" },
  { code: "st12", name: "ゾロ&サンジ", nameEn: "Zoro & Sanji", type: "STARTER" },
  { code: "st13", name: "三兄弟の絆", nameEn: "The Three Brothers Bond", type: "STARTER" },
  { code: "st14", name: "3D2Y", nameEn: "3D2Y", type: "STARTER" },
  { code: "st15", name: "赤 エドワード・ニューゲート", nameEn: "Red Edward.Newgate", type: "STARTER" },
  { code: "st16", name: "緑 ウタ", nameEn: "Green Uta", type: "STARTER" },
  { code: "st17", name: "青 ドンキホーテ・ドフラミンゴ", nameEn: "Blue Donquixote Doflamingo", type: "STARTER" },
  { code: "st18", name: "紫 モンキー・D・ルフィ", nameEn: "Purple Monkey.D.Luffy", type: "STARTER" },
  { code: "st19", name: "黒 スモーカー", nameEn: "Black Smoker", type: "STARTER" },
  { code: "st20", name: "黄 シャーロット・カタクリ", nameEn: "Yellow Charlotte Katakuri", type: "STARTER" },
  { code: "st21", name: "ギア5", nameEn: "GEAR5", type: "STARTER" },
  { code: "st22", name: "エース&ニューゲート", nameEn: "Ace & Newgate", type: "STARTER" },
  { code: "st23", name: "赤 シャンクス", nameEn: "Red Shanks", type: "STARTER" },
  { code: "st24", name: "緑 ジュエリー・ボニー", nameEn: "Green Jewelry Bonney", type: "STARTER" },
  { code: "st25", name: "青 バギー", nameEn: "Blue Buggy", type: "STARTER" },
  { code: "st26", name: "紫黒 モンキー・D・ルフィ", nameEn: "Purple/Black Monkey.D.Luffy", type: "STARTER" },
  { code: "st27", name: "黒 マーシャル・D・ティーチ", nameEn: "Black Marshall.D.Teach", type: "STARTER" },
  { code: "st28", name: "緑黄 ヤマト", nameEn: "Green/Yellow Yamato", type: "STARTER" },
  { code: "st29", name: "EGGHEAD", nameEn: "EGGHEAD", type: "STARTER" },
  // Premium Boosters / Promo
  { code: "prb01", name: "ONE PIECE CARD THE BEST", nameEn: "ONE PIECE CARD THE BEST", type: "PROMO" },
  { code: "prb02", name: "ONE PIECE CARD THE BEST vol.2", nameEn: "ONE PIECE CARD THE BEST vol.2", type: "PROMO" },
];

export const SET_MAP = new Map(OPCG_SETS.map((s) => [s.code, s]));
export const SET_CODES = OPCG_SETS.map((s) => s.code);
