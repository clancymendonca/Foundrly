/**
 * Copy NEXT_PUBLIC_FIREBASE_* from apps/web/.env.local into apps/mobile/.env
 * as EXPO_PUBLIC_FIREBASE_* (same Firebase project).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const webEnvPath = path.join(root, "web/.env.local");
const mobileEnvPath = path.join(root, "mobile/.env");

const mapping = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "EXPO_PUBLIC_FIREBASE_API_KEY",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  NEXT_PUBLIC_FIREBASE_APP_ID: "EXPO_PUBLIC_FIREBASE_APP_ID",
};

if (!fs.existsSync(webEnvPath)) {
  console.error(`Missing ${webEnvPath}`);
  process.exit(1);
}

const webEnv = fs.readFileSync(webEnvPath, "utf8");
let mobileEnv = fs.existsSync(mobileEnvPath)
  ? fs.readFileSync(mobileEnvPath, "utf8")
  : "";

for (const [webKey, mobileKey] of Object.entries(mapping)) {
  const match = webEnv.match(new RegExp(`^${webKey}=(.*)$`, "m"));
  if (!match?.[1]?.trim()) continue;
  const value = match[1].trim();
  const line = `${mobileKey}=${value}`;
  if (new RegExp(`^${mobileKey}=`, "m").test(mobileEnv)) {
    mobileEnv = mobileEnv.replace(new RegExp(`^${mobileKey}=.*$`, "m"), line);
  } else {
    mobileEnv = mobileEnv.trimEnd() + `\n${line}\n`;
  }
}

fs.writeFileSync(mobileEnvPath, mobileEnv);
console.log("Synced Firebase client env vars to apps/mobile/.env");
