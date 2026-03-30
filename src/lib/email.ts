import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { clientEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("email");

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const key = serverEnv().RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

const FROM_EMAIL = serverEnv().EMAIL_FROM ?? "Kuma Tracker <noreply@kumatracker.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const resend = getResend();
  if (!resend) {
    log.warn("RESEND_API_KEY not set, skipping email", { to });
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      log.error("send failed", error);
      return null;
    }

    return data;
  } catch (err) {
    log.error("unexpected error", err);
    return null;
  }
}

export function priceAlertEmail(
  cardName: string,
  cardCode: string,
  price: number,
  targetPrice: number,
  direction: "ABOVE" | "BELOW",
) {
  const emoji = direction === "BELOW" ? "📉" : "📈";
  const verb = direction === "BELOW" ? "dropped to" : "rose to";

  return {
    subject: `${emoji} ${cardName} ${verb} ¥${price.toLocaleString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4A9EE0;">🐻 Kuma Price Alert</h2>
        <p><strong>${cardName}</strong> (${cardCode}) has ${verb} <strong>¥${price.toLocaleString()}</strong>.</p>
        <p>Your target was ¥${targetPrice.toLocaleString()}.</p>
        <a href="${clientEnv().NEXT_PUBLIC_APP_URL}/cards/${cardCode}"
           style="display: inline-block; padding: 10px 20px; background: #4A9EE0; color: white; text-decoration: none; border-radius: 8px;">
          View Card
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          You received this because you set a price alert on Kuma Tracker.
        </p>
      </div>
    `,
  };
}

export function weeklyDigestEmail(
  userName: string,
  topGainers: { name: string; code: string; change: number }[],
  topLosers: { name: string; code: string; change: number }[],
  portfolioValue?: number,
  portfolioPnl?: number,
) {
  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  const gainersHtml = topGainers
    .slice(0, 5)
    .map((c) => `<li>🟢 <a href="${baseUrl}/cards/${c.code}">${c.name}</a> +${c.change.toFixed(1)}%</li>`)
    .join("");

  const losersHtml = topLosers
    .slice(0, 5)
    .map((c) => `<li>🔴 <a href="${baseUrl}/cards/${c.code}">${c.name}</a> ${c.change.toFixed(1)}%</li>`)
    .join("");

  const portfolioSection =
    portfolioValue != null
      ? `
        <h3>📊 Your Portfolio</h3>
        <p>Value: ¥${portfolioValue.toLocaleString()} 
        ${portfolioPnl != null ? `(${portfolioPnl >= 0 ? "+" : ""}¥${portfolioPnl.toLocaleString()})` : ""}</p>
      `
      : "";

  return {
    subject: `🐻 Kuma Weekly Report — OPCG Price Trends`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A9EE0;">🐻 Weekly Report for ${userName || "Collector"}</h2>
        
        <h3>📈 Top Gainers</h3>
        <ul>${gainersHtml || "<li>No significant gainers this week</li>"}</ul>
        
        <h3>📉 Top Losers</h3>
        <ul>${losersHtml || "<li>No significant losers this week</li>"}</ul>
        
        ${portfolioSection}
        
        <a href="${baseUrl}/trending"
           style="display: inline-block; padding: 10px 20px; background: #4A9EE0; color: white; text-decoration: none; border-radius: 8px;">
          View Trending
        </a>
        
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Unsubscribe in <a href="${baseUrl}/settings">settings</a>.
        </p>
      </div>
    `,
  };
}

export function trialReminderEmail(userName: string, daysLeft: number) {
  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  return {
    subject: `🐻 Your Pro trial ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #4A9EE0;">🐻 Trial Ending Soon</h2>
        <p>Hi ${userName || "there"},</p>
        <p>Your Kuma Tracker Pro trial ends in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>.</p>
        <p>Subscribe now to keep all your Pro features:</p>
        <ul>
          <li>Portfolio up to 200 cards</li>
          <li>Price history up to 1 year</li>
          <li>20 price alerts</li>
          <li>CSV export</li>
        </ul>
        <a href="${baseUrl}/pricing"
           style="display: inline-block; padding: 10px 20px; background: #4A9EE0; color: white; text-decoration: none; border-radius: 8px;">
          Subscribe Now
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          After trial ends you'll return to the Free plan automatically.
        </p>
      </div>
    `,
  };
}
