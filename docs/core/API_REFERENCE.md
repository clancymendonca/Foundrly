# Foundrly API Reference

A summary of all API endpoints, authentication, data types, and usage examples for Foundrly.

## Authentication
- NextAuth.js v5 (beta) with GitHub OAuth
- Server-side sessions via cookies

## Endpoints
- Startups: create, list, update, delete (`app/api/startups/*`)
- Users: profile, search, follow, ban (`app/api/users/*`)
- Comments: create, like, dislike, reply (`app/api/comments/*`)
- Notifications: get, mark as read (`app/api/notifications/*`)
- Badges: get, recalculate (`app/api/badges/*`)
- Moderation: report, ban (`app/api/moderation/*`)
- File upload (`app/api/upload`)
- Analytics (`app/api/analytics/*`)

## Data Types
- Startup, User, Comment, Notification, Badge

## Error Handling & Rate Limiting
- Standard HTTP codes
- Rate limits per endpoint

## Example Usage
- See inline `app/api/*` handlers for examples in this repository
