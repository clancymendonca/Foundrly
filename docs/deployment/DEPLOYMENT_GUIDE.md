# Foundrly Deployment Guide

Instructions for deploying Foundrly to production, including Vercel and Docker setup.

## Vercel Deployment
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `SANITY_API_TOKEN`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `BLOB_READ_WRITE_TOKEN`
4. Redeploy

## Docker Setup
See `DOCKER_SETUP_GUIDE.md`, `DOCKER_HOSTING_GUIDE.md`, `DOCKER_HOSTING_QUICK_START_GUIDE.md`.

Quick start (development):
```bash
docker compose -f docker-compose.dev.yml up --build
```

Production compose:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Ensure the same environment variables are provided to the container(s).
