import { OPCG_SETS, type SetInfo } from "../src/lib/constants/sets";

export type SetType = SetInfo["type"];

export interface SetDefinition {
  code: string;
  nameJp: string;
  nameEn: string;
  type: SetType;
}

export const SETS: SetDefinition[] = OPCG_SETS.map((s) => ({
  code: s.code,
  nameJp: s.name,
  nameEn: s.nameEn ?? s.name,
  type: s.type,
}));

export const SET_CODES = SETS.map((s) => s.code);
