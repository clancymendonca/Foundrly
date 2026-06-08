import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@foundrly/shared";

const JWT_ISSUER = "foundrly-mobile";
const JWT_AUDIENCE = "foundrly-api";
const EXPIRY = "30d";

function getSecret() {
  const secret = process.env.MOBILE_JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("MOBILE_JWT_SECRET or AUTH_SECRET must be set");
  }
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyMobileToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (!payload.id || typeof payload.id !== "string") {
      return null;
    }

    return {
      id: payload.id,
      name: (payload.name as string) ?? null,
      email: (payload.email as string) ?? null,
      image: (payload.image as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getMobileSessionFromRequest(
  request: Request,
): Promise<{ user: SessionUser } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const user = await verifyMobileToken(authHeader.slice(7));
  if (!user) {
    return null;
  }

  return { user };
}
