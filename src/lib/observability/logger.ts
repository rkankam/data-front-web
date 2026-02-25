type LogLevel = "info" | "warn" | "error";

const redact = (value: unknown): unknown => {
  if (!value || typeof value !== "object") {
    return value;
  }
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(input)) {
    if (/token|key|authorization|secret/i.test(key)) {
      output[key] = "[REDACTED]";
      continue;
    }
    output[key] = item;
  }
  return output;
};

export const logEvent = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    data: redact(data),
  };
  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }
  console.log(JSON.stringify(payload));
};
