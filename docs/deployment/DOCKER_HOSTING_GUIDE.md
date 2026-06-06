# Docker Hosting Guide

How to host Foundrly using Docker in production.

## Setup
### Production configuration
Use the production compose file and a reverse proxy (e.g., Nginx or Traefik).
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Environment variables
Provide all required app secrets and URLs (see `DOCKER_SETUP_GUIDE.md`).

### Scaling and monitoring
- Scale replicas: `docker compose -f docker-compose.prod.yml up -d --scale web=3`
- Monitor with container metrics and Sentry for app-level monitoring
