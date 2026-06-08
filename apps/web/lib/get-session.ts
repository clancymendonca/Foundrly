import { headers } from "next/headers";
import { auth } from "@/auth";
import { verifyMobileToken } from "@/lib/mobile-auth";

export type AppSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  };
};

/**
 * Resolves the current session from NextAuth cookies or a mobile Bearer JWT.
 */
export async function getSession(): Promise<AppSession | null> {
  const session = await auth();
  if (session?.user?.id) {
    return session as AppSession;
  }

  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const user = await verifyMobileToken(authHeader.slice(7));
  if (!user) {
    return null;
  }

  return { user };
}
