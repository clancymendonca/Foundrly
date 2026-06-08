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

export interface Author {
  _id: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  image?: string;
  bio?: string;
}

export interface Startup {
  _id: string;
  title: string;
  slug?: { current: string };
  _createdAt?: string;
  author?: Author;
  views?: number;
  description?: string;
  category?: string;
  image?: string;
  pitch?: string;
  likes?: number;
  dislikes?: number;
  commentsCount?: number;
  buyMeACoffeeUsername?: string;
}

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface MobileAuthResponse {
  token: string;
  user: SessionUser;
}
