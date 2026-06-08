import { client } from './client';
import { writeClient } from './write-client';

export type EmailPreferenceTypes = {
  like?: boolean;
  dislike?: boolean;
  comment?: boolean;
  reply?: boolean;
  follow?: boolean;
  interested?: boolean;
  comment_like?: boolean;
  report?: boolean;
  system?: boolean;
};

export interface UserEmailPreferences {
  enabled: boolean;
  types: EmailPreferenceTypes;
}

const DEFAULT_EMAIL_PREFS: UserEmailPreferences = {
  enabled: true,
  types: {
    like: true,
    dislike: true,
    comment: true,
    reply: true,
    follow: true,
    interested: true,
    comment_like: true,
    report: true,
    system: true,
  },
};

export async function getUserEmailPreferences(userId: string): Promise<UserEmailPreferences> {
  try {
    if (!userId) return DEFAULT_EMAIL_PREFS;
    const result = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{
        emailNotificationsEnabled,
        emailNotificationTypesEnabled
      }`,
      { userId }
    );

    const enabled = typeof result?.emailNotificationsEnabled === 'boolean' ? result.emailNotificationsEnabled : DEFAULT_EMAIL_PREFS.enabled;
    const types: EmailPreferenceTypes = { ...DEFAULT_EMAIL_PREFS.types, ...(result?.emailNotificationTypesEnabled || {}) };
    return { enabled, types };
  } catch {
    return DEFAULT_EMAIL_PREFS;
  }
}

export async function setUserEmailPreferences(userId: string, prefs: Partial<UserEmailPreferences>): Promise<UserEmailPreferences> {
  if (!userId) throw new Error('userId is required');
  const current = await getUserEmailPreferences(userId);
  const next: UserEmailPreferences = {
    enabled: typeof prefs.enabled === 'boolean' ? prefs.enabled : current.enabled,
    types: { ...current.types, ...(prefs.types || {}) },
  };

  await writeClient
    .patch(userId)
    .set({
      emailNotificationsEnabled: next.enabled,
      emailNotificationTypesEnabled: next.types,
    })
    .commit();

  return next;
}



