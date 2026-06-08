export interface Message {
  id: string;
  name: string;
  message: string;
  time: string;
  avatarUrl?: string;
  avatarInitial?: string;
  hasCloseButton?: boolean;
  unreadCount?: number;
  lastMessageAt?: string;
}

export interface Suggested {
  id: string;
  name: string;
  handle: string;
  avatarInitial?: string;
  isInvite?: boolean;
}
