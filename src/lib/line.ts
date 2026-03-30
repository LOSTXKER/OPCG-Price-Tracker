import { messagingApi } from "@line/bot-sdk";
import { serverEnv } from "@/lib/env";
import { clientEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("line");

const { MessagingApiClient } = messagingApi;

let client: messagingApi.MessagingApiClient | null = null;

function getClient(): messagingApi.MessagingApiClient | null {
  const token = serverEnv().LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return null;
  if (!client) {
    client = new MessagingApiClient({ channelAccessToken: token });
  }
  return client;
}

export async function sendLineMessage(
  lineUserId: string,
  text: string,
): Promise<boolean> {
  const c = getClient();
  if (!c) {
    log.warn("LINE_CHANNEL_ACCESS_TOKEN not set, skipping message");
    return false;
  }

  try {
    await c.pushMessage({
      to: lineUserId,
      messages: [{ type: "text", text }],
    });
    return true;
  } catch (err) {
    log.error("push message failed", err);
    return false;
  }
}

export async function sendLinePriceAlert(
  lineUserId: string,
  cardName: string,
  cardCode: string,
  price: number,
  direction: "ABOVE" | "BELOW",
): Promise<boolean> {
  const emoji = direction === "BELOW" ? "📉" : "📈";
  const verb = direction === "BELOW" ? "ลงมาถึง" : "ขึ้นไปถึง";
  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  const text = `${emoji} Kuma แจ้งข่าว!\n${cardName} (${cardCode}) ${verb} ¥${price.toLocaleString()}\n\n${baseUrl}/cards/${cardCode}`;

  return sendLineMessage(lineUserId, text);
}

export function getLineLoginUrl(state: string): string {
  const clientId = serverEnv().LINE_LOGIN_CHANNEL_ID;
  const redirectUri = `${clientEnv().NEXT_PUBLIC_APP_URL}/api/line/callback`;

  return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid&bot_prompt=aggressive`;
}
