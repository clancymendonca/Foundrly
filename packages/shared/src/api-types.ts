import type { SessionUser, Startup } from "./types";

export interface ApiError {
  error: string;
  details?: string;
}

export interface StartupsListResponse {
  startups: Startup[];
  filter: string;
}

export interface StartupCreateBody {
  title: string;
  description: string;
  category: string;
  link?: string;
  pitch: string;
  buyMeACoffeeUsername?: string;
}

export interface MobileFirebaseAuthBody {
  idToken: string;
}

export interface MobileFirebaseAuthResponse {
  token: string;
  user: SessionUser;
}
