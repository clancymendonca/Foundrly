# Foundrly Developer Guide

This guide is for developers working on or contributing to Foundrly. It covers documentation structure, links to feature guides, CI, and key developer resources.

## Documentation hub

For a single index of all guides, see **[docs/README.md](./docs/README.md)**.

## Documentation structure

- Project Overview: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
- Getting Started: [GETTING_STARTED.md](./GETTING_STARTED.md)
- Architecture: [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)
- API Reference: [API_REFERENCE.md](./API_REFERENCE.md)
- Feature Guides: [BADGE_SYSTEM_GUIDE.md](./BADGE_SYSTEM_GUIDE.md), [ENHANCED_BADGE_SYSTEM_GUIDE.md](./ENHANCED_BADGE_SYSTEM_GUIDE.md), [NOTIFICATION_SYSTEM_GUIDE.md](./NOTIFICATION_SYSTEM_GUIDE.md), [REPORTING_SYSTEM_GUIDE.md](./REPORTING_SYSTEM_GUIDE.md), [AI_FEATURES_GUIDE.md](./AI_FEATURES_GUIDE.md), [STARTUP_ANALYTICS_GUIDE.md](./STARTUP_ANALYTICS_GUIDE.md)
- Push/Chat: [PUSH_NOTIFICATIONS_GUIDE.md](./PUSH_NOTIFICATIONS_GUIDE.md), [STREAM_CHAT_GUIDE.md](./STREAM_CHAT_GUIDE.md)
- Troubleshooting: [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
- Deployment: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md), [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md), Docker guides (see [docs/README.md](./docs/README.md))

## Pinned stack (upgrade checklist)

| Package / area | Notes |
|----------------|--------|
| **Next.js** | Pinned via `overrides` in [package.json](./package.json) (canary line). Before upgrading, run `npm run typegen`, `npm run verify:ci`, and smoke-test auth, Studio, and AI routes. |
| **next-auth** | v5 beta; watch breaking changes in release notes. |
| **eslint-config-next** | Kept in sync with the installed **Next.js** minor/canary (see `devDependencies` in [package.json](./package.json)). |
| **TypeScript** | Full-project `tsc` is not clean yet ([next.config.ts](./next.config.ts) still sets `typescript.ignoreBuildErrors`). CI runs **`npm run typecheck`**, which typechecks **Vitest tests and config** only (`tsconfig.tests.json`). Use **`npm run typecheck:all`** locally to see full-project errors while cleaning them up. |

## GitHub Actions CI

Workflow: [.github/workflows/ci.yml](./.github/workflows/ci.yml).

Steps: `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test:run` → **`npx next build`** (deliberately **not** `npm run build`, so `prebuild` / Sanity **typegen** is skipped in CI; typegen needs a real Sanity project and network).

### CI environment matrix (job `env`)

The workflow sets **non-secret placeholders** so server modules that initialize at import time (Sanity write client token, Pinecone client, Stream keys, VAPID, Gemini) do not throw during `next build`. They are **not** real credentials.

| Variable | Role in CI |
|----------|------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_WRITE_TOKEN` | Satisfy [sanity/env.ts](./sanity/env.ts) and [sanity/lib/write-client.ts](./sanity/lib/write-client.ts) during bundling. |
| `AUTH_SECRET`, `NEXTAUTH_URL` | Satisfy NextAuth expectations during build. |
| `GEMINI_API_KEY`, `PINECONE_API_KEY` | Satisfy [lib/ai-services.ts](./lib/ai-services.ts) module init. |
| `NEXT_PUBLIC_STREAM_API_KEY`, `STREAM_API_KEY`, `STREAM_API_SECRET` | Satisfy Stream-related route modules. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Satisfy [app/api/push-notifications/send/route.ts](./app/api/push-notifications/send/route.ts) (must be valid-format keys for `web-push`). |

**Sentry:** `CI=true` silences noisy Sentry webpack logs. Source map upload is optional; **`SENTRY_AUTH_TOKEN`** is not required for a green build.

**Optional stricter CI:** Add GitHub **Variables** or **Secrets** with your real `NEXT_PUBLIC_SANITY_*` and run **`npm run typegen`** in CI before `next build` if you want schema extract to run on every PR (requires a real Sanity project).

## ESLint

The repo uses **legacy** [.eslintrc.json](./.eslintrc.json) (not flat `eslint.config.*`) so `next lint` stays compatible with ESLint 8.57’s `loadESLint` / flat-config behavior.

Several rules are set to **warn** so existing code can pass CI while remaining visible in the editor; tighten them back to **error** as files are fixed.

## Tests

- **Vitest:** `npm test` (watch) / `npm run test:run` (CI).
- **Path stub:** [vitest-shims/auth-stub.ts](./vitest-shims/auth-stub.ts) is mapped from `@/auth` only in [tsconfig.tests.json](./tsconfig.tests.json) so `npm run typecheck` does not typecheck the full NextAuth module graph.

## Contribution

- Fork, branch, pull request
- See contributing guidelines in [README.md](./README.md)

## License

MIT
