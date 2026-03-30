type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatMessage(
  level: LogLevel,
  context: string,
  message: string,
  meta?: unknown,
): string {
  const prefix = `[${context}]`;
  if (meta !== undefined) {
    const serialized =
      meta instanceof Error
        ? meta.stack ?? meta.message
        : typeof meta === "string"
          ? meta
          : JSON.stringify(meta);
    return `${prefix} ${message} ${serialized}`;
  }
  return `${prefix} ${message}`;
}

function createLogger(context: string) {
  return {
    debug(message: string, meta?: unknown) {
      if (shouldLog("debug")) console.debug(formatMessage("debug", context, message, meta));
    },
    info(message: string, meta?: unknown) {
      if (shouldLog("info")) console.info(formatMessage("info", context, message, meta));
    },
    warn(message: string, meta?: unknown) {
      if (shouldLog("warn")) console.warn(formatMessage("warn", context, message, meta));
    },
    error(message: string, meta?: unknown) {
      if (shouldLog("error")) console.error(formatMessage("error", context, message, meta));
    },
  };
}

export const log = createLogger("app");

export function createLog(context: string) {
  return createLogger(context);
}
