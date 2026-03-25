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
  { code: "op06", nameJp: "双璧の覇者", nameEn: "Wings of the Captain", type: "BOOSTER" },
  { code: "op07", nameJp: "500年後の未来", nameEn: "500 Years in the Future", type: "BOOSTER" },
  { code: "op08", nameJp: "二つの伝説", nameEn: "Two Legends", type: "BOOSTER" },
  { code: "op09", nameJp: "四皇の覇気", nameEn: "The Four Emperors", type: "BOOSTER" },
  { code: "op10", nameJp: "ロイヤルブラッドライン", nameEn: "Royal Bloodlines", type: "BOOSTER" },
  { code: "op11", nameJp: "激闘の支配者", nameEn: "Rulers of the Fierce Battle", type: "BOOSTER" },
  { code: "op12", nameJp: "烈風の支配者", nameEn: "Rulers of the Gale", type: "BOOSTER" },
  { code: "op13", nameJp: "紡がれし絆", nameEn: "The Bonds Woven Together", type: "BOOSTER" },
  { code: "op14", nameJp: "蒼海の七星", nameEn: "Seven Stars of the Blue Sea", type: "BOOSTER" },
  { code: "op15", nameJp: "誓いの絆", nameEn: "Bonds of the Oath", type: "BOOSTER" },
  // Extra Boosters
  { code: "eb01", nameJp: "Memorial Collection", nameEn: "Memorial Collection", type: "EXTRA_BOOSTER" },
  { code: "eb02", nameJp: "Extra Booster 02", nameEn: "Anime 25th Collection Vol.1", type: "EXTRA_BOOSTER" },
  { code: "eb03", nameJp: "ONE PIECE HEROINES Edition", nameEn: "ONE PIECE HEROINES Edition", type: "EXTRA_BOOSTER" },
  { code: "eb04", nameJp: "Extra Booster 04", nameEn: "Extra Booster 04", type: "EXTRA_BOOSTER" },
  // Starters
  { code: "st01", nameJp: "麦わらの一味", nameEn: "Straw Hat Crew", type: "STARTER" },
  { code: "st02", nameJp: "最悪の世代", nameEn: "Worst Generation", type: "STARTER" },
  { code: "st03", nameJp: "王下七武海", nameEn: "The Seven Warlords of the Sea", type: "STARTER" },
  { code: "st04", nameJp: "百獣海賊団", nameEn: "Animal Kingdom Pirates", type: "STARTER" },
  { code: "st05", nameJp: "ONE PIECE FILM edition", nameEn: "ONE PIECE FILM edition", type: "STARTER" },
  { code: "st06", nameJp: "海軍絶対正義", nameEn: "Navy", type: "STARTER" },
  { code: "st07", nameJp: "BIG MOMの海賊団", nameEn: "Big Mom Pirates", type: "STARTER" },
  { code: "st08", nameJp: "Side-モンキー・D・ルフィ", nameEn: "Side Monkey.D.Luffy", type: "STARTER" },
  { code: "st09", nameJp: "Side-ヤマト", nameEn: "Side Yamato", type: "STARTER" },
  { code: "st10", nameJp: "ウルトラデッキ 三兄弟の絆", nameEn: "Ultra Deck: The Three Brothers' Bond", type: "STARTER" },
  { code: "st11", nameJp: "ウタ", nameEn: "Uta", type: "STARTER" },
  { code: "st12", nameJp: "ゾロ&サンジ", nameEn: "Zoro and Sanji", type: "STARTER" },
  { code: "st13", nameJp: "ウルトラデッキ 三船長集結", nameEn: "Ultra Deck: The Three Captains", type: "STARTER" },
  { code: "st14", nameJp: "3D2Y", nameEn: "3D2Y", type: "STARTER" },
  { code: "st15", nameJp: "RED Edward.Newgate", nameEn: "RED Edward.Newgate", type: "STARTER" },
  { code: "st16", nameJp: "GREEN Uta", nameEn: "GREEN Uta", type: "STARTER" },
  { code: "st17", nameJp: "BLUE Donquixote Doflamingo", nameEn: "BLUE Donquixote Doflamingo", type: "STARTER" },
  { code: "st18", nameJp: "PURPLE Monkey.D.Luffy", nameEn: "PURPLE Monkey.D.Luffy", type: "STARTER" },
  { code: "st19", nameJp: "BLACK Smoker", nameEn: "BLACK Smoker", type: "STARTER" },
  { code: "st20", nameJp: "YELLOW Charlotte Katakuri", nameEn: "YELLOW Charlotte Katakuri", type: "STARTER" },
  { code: "st21", nameJp: "Starter Deck 21", nameEn: "Starter Deck 21", type: "STARTER" },
  // Premium / Promo
  { code: "prb01", nameJp: "Premium Booster 01", nameEn: "Premium Booster 01", type: "PROMO" },
  { code: "prb02", nameJp: "Premium Booster 02", nameEn: "Premium Booster 02", type: "PROMO" },
  { code: "don", nameJp: "DON!! Card Collection", nameEn: "DON!! Card Collection", type: "PROMO" },
];

export const SET_CODES = SETS.map((s) => s.code);
