# Foundrly Badge System Guide

A guide to the badge system, including badge categories, criteria, and how badges are awarded.

## Overview
- Gamification for engagement, creativity, and community
- Automatic tracking of user actions
- Visual rewards and progress indicators

Implementation details:
- Core logic in `lib/enhanced-badge-system.ts`
- User badge data stored in Sanity (`badge` and `userBadge` types)
- API routes under `app/api/badges/*` for recalculation and queries

## Badge Categories
- Creator, Community, Engagement, Social

## Earning Badges
- Actions tracked: pitch creation, comments, likes, follows
- Progress and rarity tiers

How it works:
- Actions trigger checks via the enhanced badge system
- Progress calculated per badge criteria (basic, streak, time, quality, combination)
- Earned badges are recorded as `userBadge` documents in Sanity

## Leaderboards
- Compete with other users

Related UI:
- `app/(root)/leaderboard/page.tsx`
- Badge labels/components under `components/ui/badge` and related feature components
