# Getting Started with Foundrly

Step-by-step instructions for setting up Foundrly locally.

## Prerequisites
- Node.js 18.17+ (or Node 20+)
- npm (recommended) or yarn
- Sanity account (for CMS)

Recommended local services:
- Docker Desktop (optional, for local Postgres or running app via Docker)

## Installation
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/foundrly.git
   cd foundrly
   npm install
   ```

2. Generate Sanity types (also runs automatically before dev/build):
   ```bash
   npm run typegen
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in `.env.local` values:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your_api_token
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   BLOB_READ_WRITE_TOKEN=your_blob_token
   ```

5. Start the development server:
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

Notes:
- In development, file uploads are stored under `public/uploads/`.
- In production (e.g., Vercel), uploads use Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.

## Checks before opening a PR

Run the same sequence as GitHub Actions (lint, scoped typecheck, unit tests, production build). With a populated `.env.local`, from the repo root:

```bash
npm run verify:ci
```

`verify:ci` runs `npx next build` (not `npm run build`), so Sanity **typegen** is not executed in that script path; use `npm run dev` or `npm run build` locally when you change Sanity schemas. CI placeholders for a green fork build are documented in [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).
