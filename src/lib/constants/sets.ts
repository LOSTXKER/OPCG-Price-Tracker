export type SetInfo = {
  code: string;
  name: string;
  nameEn?: string;
  type: "BOOSTER" | "EXTRA_BOOSTER" | "STARTER" | "PROMO" | "OTHER";
};

export const OPCG_SETS: SetInfo[] = [
  { code: "op01", name: "ROMANCE DAWN", nameEn: "Romance Dawn", type: "BOOSTER" },
  { code: "op02", name: "頂上決戦", nameEn: "Paramount War", type: "BOOSTER" },
  { code: "op03", name: "強大な敵", nameEn: "Pillars of Strength", type: "BOOSTER" },
  { code: "op04", name: "謀略の王国", nameEn: "Kingdoms of Intrigue", type: "BOOSTER" },
  { code: "op05", name: "新時代の主役", nameEn: "Awakening of the New Era", type: "BOOSTER" },
  { code: "op06", name: "双璧の覇者", nameEn: "Wings of the Captain", type: "BOOSTER" },
  { code: "op07", name: "500年後の未来", nameEn: "500 Years in the Future", type: "BOOSTER" },
  { code: "op08", name: "二つの伝説", nameEn: "Two Legends", type: "BOOSTER" },
  { code: "op09", name: "四皇の覇気", nameEn: "Emperors in the New World", type: "BOOSTER" },
  { code: "op10", name: "ロイヤルブラッドライン", nameEn: "Royal Bloodlines", type: "BOOSTER" },
  { code: "op11", name: "激闘の支配者", type: "BOOSTER" },
  { code: "op12", name: "烈風の支配者", type: "BOOSTER" },
  { code: "op13", name: "紡がれし絆", type: "BOOSTER" },
  { code: "op14", name: "Unknown", type: "BOOSTER" },
  { code: "op15", name: "神の島の冒険", type: "BOOSTER" },
  { code: "eb01", name: "Memorial Collection", nameEn: "Memorial Collection", type: "EXTRA_BOOSTER" },
  { code: "eb02", name: "Extra Booster 02", type: "EXTRA_BOOSTER" },
  { code: "eb03", name: "Extra Booster 03", type: "EXTRA_BOOSTER" },
  { code: "eb04", name: "Extra Booster 04", type: "EXTRA_BOOSTER" },
  { code: "st01", name: "麦わらの一味", nameEn: "Straw Hat Crew", type: "STARTER" },
  { code: "st02", name: "最悪の世代", nameEn: "Worst Generation", type: "STARTER" },
  { code: "st03", name: "王下七武海", nameEn: "The Seven Warlords of the Sea", type: "STARTER" },
  { code: "st04", name: "百獣海賊団", nameEn: "Animal Kingdom Pirates", type: "STARTER" },
  { code: "st05", name: "ONE PIECE FILM edition", type: "STARTER" },
  { code: "st06", name: "海軍絶対正義", type: "STARTER" },
  { code: "st07", name: "BIG MOMの海賊団", type: "STARTER" },
  { code: "st08", name: "Side-モンキー・D・ルフィ", type: "STARTER" },
  { code: "st09", name: "Side-ヤマト", type: "STARTER" },
  { code: "st10", name: "ウルトラデッキ 三兄弟の絆", type: "STARTER" },
  { code: "st11", name: "ウタ", type: "STARTER" },
  { code: "st12", name: "ゾロ&サンジ", type: "STARTER" },
  { code: "st13", name: "ウルトラデッキ 三船長集結", type: "STARTER" },
  { code: "st14", name: "3D2Y", type: "STARTER" },
  { code: "st15", name: "RED Edward.Newgate", type: "STARTER" },
  { code: "st16", name: "GREEN Uta", type: "STARTER" },
  { code: "st17", name: "BLUE Donquixote Doflamingo", type: "STARTER" },
  { code: "st18", name: "PURPLE Monkey.D.Luffy", type: "STARTER" },
  { code: "st19", name: "BLACK Smoker", type: "STARTER" },
  { code: "st20", name: "YELLOW Charlotte Katakuri", type: "STARTER" },
  { code: "st21", name: "Starter Deck 21", type: "STARTER" },
  { code: "prb01", name: "Premium Booster 01", type: "PROMO" },
];

export const SET_MAP = new Map(OPCG_SETS.map((s) => [s.code, s]));
export const SET_CODES = OPCG_SETS.map((s) => s.code);
