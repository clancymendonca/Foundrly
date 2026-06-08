import { config as loadEnv } from 'dotenv'

/** Prefer .env.local over inherited shell/CI env (e.g. abc12345 placeholders). */
export function loadLocalEnv() {
  loadEnv({ path: '.env.local', override: true })
  loadEnv({ override: true })
}

loadLocalEnv()
