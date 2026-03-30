import { z } from "zod/v4";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  CRON_SECRET: z.string().optional(),
  EXCHANGE_RATE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PLUS_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PLUS_YEARLY_PRICE_ID: z.string().optional(),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional(),
  LINE_LOGIN_CHANNEL_ID: z.string().optional(),
  LINE_LOGIN_CHANNEL_SECRET: z.string().optional(),
  SCRAPE_VERBOSE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://meecard.app"),
  NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

function parseServerEnv(): ServerEnv {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${formatted}`);
  }
  return result.data;
}

function parseClientEnv(): ClientEnv {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID:
      process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID,
  });
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Missing or invalid public environment variables:\n${formatted}`,
    );
  }
  return result.data;
}

let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

/** Server-only env vars. Do NOT import from client components. */
export function serverEnv(): ServerEnv {
  if (!_serverEnv) _serverEnv = parseServerEnv();
  return _serverEnv;
}

/** Public env vars safe for both server and client. */
export function clientEnv(): ClientEnv {
  if (!_clientEnv) _clientEnv = parseClientEnv();
  return _clientEnv;
}
