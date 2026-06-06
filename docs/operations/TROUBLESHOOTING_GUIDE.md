# Foundrly Troubleshooting Guide

Common issues and solutions for developing, deploying, or using Foundrly.

## Quick Fixes
- App won't start: clear cache, reinstall dependencies, check ports
- Build failures: check TypeScript errors, clear Next.js cache
- Database issues: test Sanity connection, check env vars
 - Auth callback issues: ensure `NEXTAUTH_URL` and provider secrets are set
 - Upload failures: set `BLOB_READ_WRITE_TOKEN` (prod) or verify `public/uploads` (dev)

## Development Issues
- Hot reload not working: check file watching limits, restart dev server
 - Type generation: run `npm run typegen` (runs on predev/prebuild)
 - Node version mismatch: use Node 18.17+ or 20+
