import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "dev_home_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export type SessionPayload = JWTPayload & {
  sub: string;
  email: string;
  name: string | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return secret;
}

function getSessionKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionKey());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string") {
      return null;
    }

    if (typeof payload.email !== "string") {
      return null;
    }

    const normalizedName =
      typeof payload.name === "string" ? payload.name : null;

    return {
      ...payload,
      sub: payload.sub,
      email: payload.email,
      name: normalizedName,
    };
  } catch {
    return null;
  }
}
