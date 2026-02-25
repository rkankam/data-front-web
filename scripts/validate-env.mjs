import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = ["B2_KEY_ID", "B2_APPLICATION_KEY", "B2_BUCKET_ID", "B2_BUCKET_NAME"];

const loadFile = (path) => {
  if (!existsSync(path)) {
    return;
  }
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim();
    }
  }
};

loadFile(resolve(process.cwd(), ".env.local"));
loadFile(resolve(process.cwd(), "../.env.local"));

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Environment validation passed");
