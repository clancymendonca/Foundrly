# Docker Setup Guide

Instructions for setting up Foundrly with Docker.

## Setup
### Development
Use the development compose file. This mounts source for live reload.
```bash
docker compose -f docker-compose.dev.yml up --build
```

### Production
Use the production compose file with environment variables set.
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Environment Variables
Ensure these are provided to the containers:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_TOKEN`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `BLOB_READ_WRITE_TOKEN`
