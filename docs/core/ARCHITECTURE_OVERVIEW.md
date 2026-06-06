# Foundrly Architecture Overview

A summary of the system architecture, technology stack, and design principles for Foundrly.

## System Overview
- Monolithic Next.js app with microservices-inspired structure
- Performance, scalability, security, real-time updates

## Tech Stack
- Next.js 15 (canary), React 18, TypeScript
- Tailwind CSS, Radix UI, Lucide React
- Sanity v3 CMS, NextAuth.js v5 (beta)
- Vercel Blob (prod) / Local filesystem (dev)
- Sentry for monitoring, Docker for containerization

## Project Structure
- Frontend, backend, infrastructure
  - `app/` Next.js App Router, API routes under `app/api`
  - `components/` shared UI and feature components
  - `lib/` server utilities (email, storage, notifications, AI services)
  - `sanity/` Sanity schema, config, and tools (typegen)
  - `public/` static assets and service workers
