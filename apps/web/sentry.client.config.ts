import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d3d7383538d996ee51bf23728e852cb3@o4507560740388864.ingest.us.sentry.io/4509524326481920",

  // Add optional integrations for additional features
  integrations: [
    Sentry.feedbackIntegration({
      colorScheme: "system",
      // Disable floating button; we will open programmatically from the sidebar
      autoInject: false,
      // Show and require user fields
      showName: true,
      showEmail: true,
      isNameRequired: true,
      isEmailRequired: true,
      // Allow screenshots
      enableScreenshot: true,
      // Map Sentry user fields to feedback form
      useSentryUser: { email: 'email', name: 'username' },
    }),
  ],

  tracesSampleRate: 1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  debug: false,
});

export const onRouterTransitionStart = Sentry.browserTracingIntegration();
