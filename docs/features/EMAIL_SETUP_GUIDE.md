# Email Setup Guide

Instructions for configuring email notifications in Foundrly.

## Setup
- Configure SMTP settings
- Set environment variables
- Test email delivery

Environment variables:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Optional sender: `SMTP_FROM` (default used if not set)

Server utilities:
- `lib/email.ts` and `lib/emailNotifications.ts`