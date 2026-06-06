# Docker Hosting Quick Start Guide

Quick setup instructions for hosting Foundrly with Docker.

## Steps
1. Clone repo
2. Create `.env` with required variables (see `DOCKER_SETUP_GUIDE.md`)
3. Start with production compose:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. Verify app is serving on the configured port
