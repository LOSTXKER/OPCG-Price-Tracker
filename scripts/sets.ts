export type SetType = "BOOSTER" | "EXTRA_BOOSTER" | "STARTER" | "PROMO";

export interface SetDefinition {
  code: string;
  nameJp: string;
  nameEn: string;
  type: SetType;
}

export const SETS: SetDefinition[] = [
  // Boosters
  { code: "op01", nameJp: "ROMANCE DAWN", nameEn: "Romance Dawn", type: "BOOSTER" },
  { code: "op02", nameJp: "頂上決戦", nameEn: "Paramount War", type: "BOOSTER" },
  { code: "op03", nameJp: "強大な敵", nameEn: "Pillars of Strength", type: "BOOSTER" },
  { code: "op04", nameJp: "謀略の王国", nameEn: "Kingdoms of Intrigue", type: "BOOSTER" },
  { code: "op05", nameJp: "新時代の主役", nameEn: "Awakening of the New Era", type: "BOOSTER" },
  { code: "op06", nameJp: "双璧の覇者", nameEn: "Wings of Captain", type: "BOOSTER" },
  { code: "op07", nameJp: "500年後の未来", nameEn: "500 Years in the Future", type: "BOOSTER" },
  { code: "op08", nameJp: "二つの伝説", nameEn: "Two Legends", type: "BOOSTER" },
  { code: "op09", nameJp: "四皇の覇気", nameEn: "Emperors in the New World", type: "BOOSTER" },
  { code: "op10", nameJp: "ロイヤルブラッドライン", nameEn: "Royal Blood", type: "BOOSTER" },
  { code: "op11", nameJp: "激闘の支配者", nameEn: "A Fist of Divine Speed", type: "BOOSTER" },
  { code: "op12", nameJp: "烈風の支配者", nameEn: "Legacy of the Master", type: "BOOSTER" },
  { code: "op13", nameJp: "紡がれし絆", nameEn: "Carrying on His Will", type: "BOOSTER" },
  { code: "op14", nameJp: "蒼海の七傑", nameEn: "The Azure Sea's Seven", type: "BOOSTER" },
  { code: "op15", nameJp: "神の島の冒険", nameEn: "Adventure on KAMI's Island", type: "BOOSTER" },
  // Extra Boosters
  { code: "eb01", nameJp: "メモリアルコレクション", nameEn: "Memorial Collection", type: "EXTRA_BOOSTER" },
  { code: "eb02", nameJp: "Anime 25th collection", nameEn: "Anime 25th Collection", type: "EXTRA_BOOSTER" },
  { code: "eb03", nameJp: "ONE PIECE Heroines Edition", nameEn: "ONE PIECE Heroines Edition", type: "EXTRA_BOOSTER" },
  { code: "eb04", nameJp: "EGGHEAD CRISIS", nameEn: "EGGHEAD CRISIS", type: "EXTRA_BOOSTER" },
  // Starters
  { code: "st01", nameJp: "麦わらの一味", nameEn: "Straw Hat Crew", type: "STARTER" },
  { code: "st02", nameJp: "最悪の世代", nameEn: "Worst Generation", type: "STARTER" },
  { code: "st03", nameJp: "王下七武海", nameEn: "The Seven Warlords of the Sea", type: "STARTER" },
  { code: "st04", nameJp: "百獣海賊団", nameEn: "Animal Kingdom Pirates", type: "STARTER" },
  { code: "st05", nameJp: "ONE PIECE FILM edition", nameEn: "ONE PIECE FILM edition", type: "STARTER" },
  { code: "st06", nameJp: "海軍", nameEn: "The Navy", type: "STARTER" },
  { code: "st07", nameJp: "ビッグ・マム海賊団", nameEn: "Big Mom Pirates", type: "STARTER" },
  { code: "st08", nameJp: "Side モンキー・D・ルフィ", nameEn: "Side Monkey.D.Luffy", type: "STARTER" },
  { code: "st09", nameJp: "Side ヤマト", nameEn: "Side Yamato", type: "STARTER" },
  { code: "st10", nameJp: "三船長集結", nameEn: "The Three Captains", type: "STARTER" },
  { code: "st11", nameJp: "ウタ", nameEn: "Side Uta", type: "STARTER" },
  { code: "st12", nameJp: "ゾロ&サンジ", nameEn: "Zoro & Sanji", type: "STARTER" },
  { code: "st13", nameJp: "三兄弟の絆", nameEn: "The Three Brothers Bond", type: "STARTER" },
  { code: "st14", nameJp: "3D2Y", nameEn: "3D2Y", type: "STARTER" },
  { code: "st15", nameJp: "赤 エドワード・ニューゲート", nameEn: "Red Edward.Newgate", type: "STARTER" },
  { code: "st16", nameJp: "緑 ウタ", nameEn: "Green Uta", type: "STARTER" },
  { code: "st17", nameJp: "青 ドンキホーテ・ドフラミンゴ", nameEn: "Blue Donquixote Doflamingo", type: "STARTER" },
  { code: "st18", nameJp: "紫 モンキー・D・ルフィ", nameEn: "Purple Monkey.D.Luffy", type: "STARTER" },
  { code: "st19", nameJp: "黒 スモーカー", nameEn: "Black Smoker", type: "STARTER" },
  { code: "st20", nameJp: "黄 シャーロット・カタクリ", nameEn: "Yellow Charlotte Katakuri", type: "STARTER" },
  { code: "st21", nameJp: "ギア5", nameEn: "GEAR5", type: "STARTER" },
  { code: "st22", nameJp: "エース&ニューゲート", nameEn: "Ace & Newgate", type: "STARTER" },
  { code: "st23", nameJp: "赤 シャンクス", nameEn: "Red Shanks", type: "STARTER" },
  { code: "st24", nameJp: "緑 ジュエリー・ボニー", nameEn: "Green Jewelry Bonney", type: "STARTER" },
  { code: "st25", nameJp: "青 バギー", nameEn: "Blue Buggy", type: "STARTER" },
  { code: "st26", nameJp: "紫黒 モンキー・D・ルフィ", nameEn: "Purple/Black Monkey.D.Luffy", type: "STARTER" },
  { code: "st27", nameJp: "黒 マーシャル・D・ティーチ", nameEn: "Black Marshall.D.Teach", type: "STARTER" },
  { code: "st28", nameJp: "緑黄 ヤマト", nameEn: "Green/Yellow Yamato", type: "STARTER" },
  { code: "st29", nameJp: "EGGHEAD", nameEn: "EGGHEAD", type: "STARTER" },
  // Premium Boosters / Promo
  { code: "prb01", nameJp: "ONE PIECE CARD THE BEST", nameEn: "ONE PIECE CARD THE BEST", type: "PROMO" },
  { code: "prb02", nameJp: "ONE PIECE CARD THE BEST vol.2", nameEn: "ONE PIECE CARD THE BEST vol.2", type: "PROMO" },
  { code: "don", nameJp: "DON!! Card Collection", nameEn: "DON!! Card Collection", type: "PROMO" },
];

export const SET_CODES = SETS.map((s) => s.code);
