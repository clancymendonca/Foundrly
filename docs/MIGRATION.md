# Documentation migration redirect table

Guides were moved from the repo root into `docs/` subfolders. Use this table to update bookmarks and external links.

| Old path | New path |
|----------|----------|
| `/GETTING_STARTED.md` | `/docs/core/GETTING_STARTED.md` |
| `/DEVELOPER_GUIDE.md` | `/docs/core/DEVELOPER_GUIDE.md` |
| `/PROJECT_OVERVIEW.md` | `/docs/core/PROJECT_OVERVIEW.md` |
| `/ARCHITECTURE_OVERVIEW.md` | `/docs/core/ARCHITECTURE_OVERVIEW.md` |
| `/API_REFERENCE.md` | `/docs/core/API_REFERENCE.md` |
| `/DEPLOYMENT_GUIDE.md` | `/docs/deployment/DEPLOYMENT_GUIDE.md` |
| `/VERCEL_DEPLOYMENT_GUIDE.md` | `/docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md` |
| `/DOCKER_SETUP_GUIDE.md` | `/docs/deployment/DOCKER_SETUP_GUIDE.md` |
| `/DOCKER_HOSTING_GUIDE.md` | `/docs/deployment/DOCKER_HOSTING_GUIDE.md` |
| `/DOCKER_HOSTING_QUICK_START_GUIDE.md` | `/docs/deployment/DOCKER_HOSTING_QUICK_START_GUIDE.md` |
| `/BADGE_SYSTEM_GUIDE.md` | `/docs/features/BADGE_SYSTEM_GUIDE.md` |
| `/ENHANCED_BADGE_SYSTEM_GUIDE.md` | `/docs/features/ENHANCED_BADGE_SYSTEM_GUIDE.md` |
| `/NOTIFICATION_SYSTEM_GUIDE.md` | `/docs/features/NOTIFICATION_SYSTEM_GUIDE.md` |
| `/NOTIFICATION_INTEGRATION_GUIDE.md` | `/docs/features/NOTIFICATION_INTEGRATION_GUIDE.md` |
| `/PUSH_NOTIFICATIONS_GUIDE.md` | `/docs/features/PUSH_NOTIFICATIONS_GUIDE.md` |
| `/STREAM_CHAT_GUIDE.md` | `/docs/features/STREAM_CHAT_GUIDE.md` |
| `/REPORTING_SYSTEM_GUIDE.md` | `/docs/features/REPORTING_SYSTEM_GUIDE.md` |
| `/STARTUP_ANALYTICS_GUIDE.md` | `/docs/features/STARTUP_ANALYTICS_GUIDE.md` |
| `/AI_FEATURES_GUIDE.md` | `/docs/features/AI_FEATURES_GUIDE.md` |
| `/COMPREHENSIVE_VECTOR_SYNC_GUIDE.md` | `/docs/features/COMPREHENSIVE_VECTOR_SYNC_GUIDE.md` |
| `/INTERESTED_FORM_NOTIFICATION_GUIDE.md` | `/docs/features/INTERESTED_FORM_NOTIFICATION_GUIDE.md` |
| `/BUY_ME_A_COFFEE_GUIDE.md` | `/docs/features/BUY_ME_A_COFFEE_GUIDE.md` |
| `/EMAIL_SETUP_GUIDE.md` | `/docs/features/EMAIL_SETUP_GUIDE.md` |
| `/GROK_API_SETUP.md` | `/docs/apis/GROK_API_SETUP.md` |
| `/GROQ_API_SETUP.md` | `/docs/apis/GROQ_API_SETUP.md` |
| `/TROUBLESHOOTING_GUIDE.md` | `/docs/operations/TROUBLESHOOTING_GUIDE.md` |
| `/FOUNDLY_FULL_GUIDE.md` | `/docs/operations/FOUNDLY_FULL_GUIDE.md` |

GitHub may redirect some moved files automatically within the repository.

## Code import paths (cleanup pass)

Legacy flat import paths were removed. Use these canonical paths:

| Old import | New import |
|------------|------------|
| `@/lib/badge-system` | `@/lib/badges/badge-system` |
| `@/lib/enhanced-badge-system` | `@/lib/badges/enhanced-badge-system` |
| `@/lib/pushNotifications` etc. | `@/lib/notifications/pushNotifications` (and siblings) |
| `@/hooks/useNotifications` etc. | `@/hooks/notifications/useNotifications` (and siblings) |
| `@/hooks/use-ban-status` | `@/hooks/moderation/use-ban-status` |
| `@/components/StartupCard` | `@/components/startup/StartupCard` |
| `@/components/CommentsSection` | `@/components/comments/CommentsSection` |
| `@/components/types` | `@/types/chat` |
