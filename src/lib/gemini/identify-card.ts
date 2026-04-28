import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("gemini:identify-card");
const MODEL = "gemini-2.0-flash";

export interface IdentifiedCard {
  /** True if the image actually shows a One Piece TCG card. */
  isCardImage: boolean;
  /** Card number printed on the card, e.g. "OP01-001", "ST01-001", "P-001". */
  cardCode: string | null;
  /** Set code only (without the dash + index), e.g. "OP01". */
  setHint: string | null;
  nameJp: string | null;
  nameEn: string | null;
  /** Rarity letters: C / UC / R / SR / SEC / L / P / SP, etc. */
  rarity: string | null;
  /** Main color or "Red/Green" style for multicolor. */
  color: string | null;
  /** Free-form notes (parallel art, manga style, condition, ...). */
  notes: string | null;
}

const PROMPT = `You are an expert at identifying One Piece Trading Card Game (OPCG) cards.
Look at the image and identify the card.

The card code is printed at the bottom of the card and looks like:
  OP01-001, OP10-118, ST01-001, EB01-001, P-001, PRB01-001
(Set prefix + dash + 3-digit number.) Read it carefully — this is the most reliable identifier.

Return ONLY valid JSON. No markdown fences, no commentary. Match exactly this schema:
{
  "isCardImage": boolean,        // true only if this is a One Piece TCG card photo
  "cardCode": string | null,     // exact card number, uppercase, e.g. "OP01-001". null if not legible
  "setHint": string | null,      // set code only, e.g. "OP01". null if unknown
  "nameJp": string | null,       // Japanese card name as printed
  "nameEn": string | null,       // English card name if you know it
  "rarity": string | null,       // "C" | "UC" | "R" | "SR" | "SEC" | "L" | "P" | "SP" | etc
  "color": string | null,        // "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow" or "Red/Green" for multicolor
  "notes": string | null         // free text: parallel art, manga art, alt art, damage, etc
}

If the image does not show a One Piece card, return:
  { "isCardImage": false, "cardCode": null, "setHint": null, "nameJp": null, "nameEn": null, "rarity": null, "color": null, "notes": null }`;

export async function identifyCardFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<IdentifiedCard> {
  const apiKey = serverEnv().GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { data: imageBase64, mimeType } },
        ],
      },
    ],
    config: {
      temperature: 0,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    },
  });

  const text = response.text?.trim() ?? "";
  const json = text.replace(/```json\s*|\s*```/g, "").trim();

  try {
    const parsed = JSON.parse(json) as Partial<IdentifiedCard>;
    return {
      isCardImage: Boolean(parsed.isCardImage),
      cardCode: normalizeCode(parsed.cardCode),
      setHint: normalizeCode(parsed.setHint),
      nameJp: nullableString(parsed.nameJp),
      nameEn: nullableString(parsed.nameEn),
      rarity: nullableString(parsed.rarity)?.toUpperCase() ?? null,
      color: nullableString(parsed.color),
      notes: nullableString(parsed.notes),
    };
  } catch (e) {
    log.error("Failed to parse Gemini response", { text, e });
    throw new Error("Failed to parse card identification result");
  }
}

function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
