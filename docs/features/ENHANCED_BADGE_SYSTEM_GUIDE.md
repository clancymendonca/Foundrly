# Enhanced Badge System Guide

Advanced gamification features for Foundrly, including rarity tiers, progress tracking, and comprehensive metrics.

## Enhanced Features
- Custom icons, colors, rarity levels
- Advanced criteria: count, streak, date, quality, time
- Sophisticated timeframes: rolling, calendar, seasonal, custom
- Metrics: content creation, engagement, social, community, time, quality, special, collaboration

Implementation:
- Service: `lib/enhanced-badge-system.ts`
- Data: `sanity/schemaTypes/badge.ts` and `userBadge.ts`
- Usage: invoked on relevant user actions and via admin recalculation endpoints under `app/api/badges/*`

Progress calculation types:
- Basic, Streak, Time-based, Quality-based, Combination

Recalculation:
- System can recalculate all badges for a user against current data