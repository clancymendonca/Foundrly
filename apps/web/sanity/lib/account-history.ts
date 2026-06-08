import { writeClient } from './write-client';

export interface AccountHistoryEntry {
  userId: string;
  userName: string;
  changeType: string;
  oldValue?: string;
  newValue?: string;
  startupId?: string;
  startupTitle?: string;
  changeDetails?: {
    field: string;
    oldData?: string;
    newData?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export async function logAccountHistory(entry: AccountHistoryEntry) {
  try {
    await writeClient.create({
      _type: 'accountHistory',
      userId: entry.userId,
      userName: entry.userName,
      changeType: entry.changeType,
      timestamp: new Date().toISOString(),
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      startupId: entry.startupId,
      startupTitle: entry.startupTitle,
      changeDetails: entry.changeDetails,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      sessionId: entry.sessionId,
    });
  } catch (error) {
    console.error('Error logging account history:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}

export async function logProfileChange(
  userId: string,
  userName: string,
  changeType: 'name_change' | 'bio_change' | 'image_change' | 'email_change' | 'username_change',
  oldValue: string,
  newValue: string,
  requestInfo?: { ipAddress?: string; userAgent?: string; sessionId?: string }
) {
  await logAccountHistory({
    userId,
    userName,
    changeType,
    oldValue,
    newValue,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
    sessionId: requestInfo?.sessionId,
  });
}

export async function logStartupChange(
  userId: string,
  userName: string,
  changeType: 'startup_created' | 'startup_updated' | 'startup_deleted',
  startupId: string,
  startupTitle: string,
  oldValue?: string,
  newValue?: string,
  changeDetails?: { field: string; oldData?: string; newData?: string },
  requestInfo?: { ipAddress?: string; userAgent?: string; sessionId?: string }
) {
  await logAccountHistory({
    userId,
    userName,
    changeType,
    oldValue,
    newValue,
    startupId,
    startupTitle,
    changeDetails,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
    sessionId: requestInfo?.sessionId,
  });
}

export async function logAccountCreation(
  userId: string,
  userName: string,
  requestInfo?: { ipAddress?: string; userAgent?: string; sessionId?: string }
) {
  await logAccountHistory({
    userId,
    userName,
    changeType: 'account_created',
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
    sessionId: requestInfo?.sessionId,
  });
}

export async function logPrivacyChange(
  userId: string,
  userName: string,
  oldValue: string,
  newValue: string,
  requestInfo?: { ipAddress?: string; userAgent?: string; sessionId?: string }
) {
  await logAccountHistory({
    userId,
    userName,
    changeType: 'privacy_change',
    oldValue,
    newValue,
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
    sessionId: requestInfo?.sessionId,
  });
}
