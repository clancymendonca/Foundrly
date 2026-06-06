# Foundly Full Guide

> **Note:** This guide uses the legacy product name "Foundly". The current product name is **Foundrly**.

This guide provides a complete overview of the Foundrly platform, including setup, features, architecture, API, and troubleshooting. It consolidates all major documentation and guides for easy reference.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Tech Stack](#tech-stack)
4. [Core Features](#core-features)
5. [Feature Guides](#feature-guides)
6. [Architecture](#architecture)
7. [API Reference](#api-reference)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Other Setup Guides](#other-setup-guides)
11. [Contributing & License](#contributing--license)

---

## 1. Project Overview
Foundrly is a full-stack web application for creating, sharing, and discovering startup pitches. It features real-time notifications, gamified badges, advanced moderation, and AI-powered pitch generation.

## 2. Getting Started
- Clone the repo, install dependencies, and set up environment variables.
- See [GETTING_STARTED.md](../core/GETTING_STARTED.md) for step-by-step instructions.

## 3. Tech Stack
- Next.js 15 (canary), React 18, TypeScript
- Tailwind CSS, Radix UI, Lucide React
- Sanity v3 CMS, NextAuth.js v5 (beta)
- Vercel Blob (prod) / Local filesystem (dev)
- Sentry

## 4. Core Features
- **Pitch Generator**: Instantly generate full startup pitches from your idea or description
- **Real-time Notifications**: Follows, likes, comments, badge earned, etc.
- **Badge System**: Earn badges for engagement, creation, and social actions
- **Moderation**: Reporting, bans, admin dashboard
- **Messaging**: Direct messages between users
- **Advanced Search**: Semantic and category-based
- **User Profiles**: Dynamic profiles with startup listings
- **AI Features**: Pitch analysis, recommendations, content moderation

## 5. Feature Guides
- [BADGE_SYSTEM_GUIDE.md](../features/BADGE_SYSTEM_GUIDE.md)
- [ENHANCED_BADGE_SYSTEM_GUIDE.md](../features/ENHANCED_BADGE_SYSTEM_GUIDE.md)
- [NOTIFICATION_SYSTEM_GUIDE.md](../features/NOTIFICATION_SYSTEM_GUIDE.md)
- [REPORTING_SYSTEM_GUIDE.md](../features/REPORTING_SYSTEM_GUIDE.md)
- [AI_FEATURES_GUIDE.md](../features/AI_FEATURES_GUIDE.md)
- [STARTUP_ANALYTICS_GUIDE.md](../features/STARTUP_ANALYTICS_GUIDE.md)

## 6. Architecture
- See [ARCHITECTURE_OVERVIEW.md](../core/ARCHITECTURE_OVERVIEW.md) for system design, data flow, and tech stack details.

## 7. API Reference
- See [API_REFERENCE.md](../core/API_REFERENCE.md) for endpoint documentation, authentication, and usage examples.

## 8. Deployment
- See [DEPLOYMENT_GUIDE.md](../deployment/DEPLOYMENT_GUIDE.md) and [VERCEL_DEPLOYMENT_GUIDE.md](../deployment/VERCEL_DEPLOYMENT_GUIDE.md) for production setup.
- Docker setup: [DOCKER_SETUP_GUIDE.md](../deployment/DOCKER_SETUP_GUIDE.md), [DOCKER_HOSTING_GUIDE.md](../deployment/DOCKER_HOSTING_GUIDE.md), [DOCKER_HOSTING_QUICK_START_GUIDE.md](../deployment/DOCKER_HOSTING_QUICK_START_GUIDE.md)

## 9. Troubleshooting
- See [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) for common problems and solutions.

## 10. Other Setup Guides
- Email: [EMAIL_SETUP_GUIDE.md](../features/EMAIL_SETUP_GUIDE.md)
- Push Notifications: [PUSH_NOTIFICATIONS_GUIDE.md](../features/PUSH_NOTIFICATIONS_GUIDE.md)
- Stream Chat: [STREAM_CHAT_GUIDE.md](../features/STREAM_CHAT_GUIDE.md)
- Buy Me a Coffee: [BUY_ME_A_COFFEE_GUIDE.md](../features/BUY_ME_A_COFFEE_GUIDE.md)

## 11. Contributing & License
- See [DEVELOPER_GUIDE.md](../core/DEVELOPER_GUIDE.md) for contributing guidelines.
- MIT License.

---

For the most up-to-date details, always refer to the individual guides and documentation files listed above.
