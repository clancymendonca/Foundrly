import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env.local") });

const lanIp = process.argv[2] || "192.168.0.201";
const mobileEnv = `EXPO_PUBLIC_API_URL=http://${lanIp}:3000
EXPO_PUBLIC_STREAM_API_KEY=${process.env.NEXT_PUBLIC_STREAM_API_KEY || ""}
EXPO_PUBLIC_SANITY_PROJECT_ID=${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ""}
EXPO_PUBLIC_SANITY_DATASET=${process.env.NEXT_PUBLIC_SANITY_DATASET || "production"}
EXPO_PUBLIC_SANITY_API_VERSION=${process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-02"}
EXPO_PUBLIC_GITHUB_CLIENT_ID=${process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || ""}
`;

const webEnvLocal = path.join(root, "apps", "web", ".env.local");
if (!fs.existsSync(webEnvLocal) && fs.existsSync(path.join(root, ".env.local"))) {
  fs.copyFileSync(path.join(root, ".env.local"), webEnvLocal);
}

fs.writeFileSync(path.join(root, "apps", "mobile", ".env"), mobileEnv);
console.log(`Mobile .env written with API URL http://${lanIp}:3000`);
