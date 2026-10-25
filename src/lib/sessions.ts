import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { isSiteAdminUser } from "@/lib/admin";
import { randomToken, sha256Hex } from "@/lib/crypto";

export const SESSION_COOKIE = "museroom_session";
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  username: string;
  isAdmin: boolean;
};

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (message.includes("fetch failed") || message.includes("connect timeout")) {
    return true;
  }
  const cause = error.cause;
  if (cause && typeof cause === "object" && "code" in cause) {
    const code = String((cause as { code?: string }).code);
    return code === "UND_ERR_CONNECT_TIMEOUT" || code === "ETIMEDOUT";
  }
  return false;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const id = randomToken(16);
  const expiresAt = new Date(Date.now() + SESSION_MS);

  await db.insert(sessions).values({
    id,
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = sha256Hex(token);
  const now = new Date();

  try {
    const row = await db
      .select({
        id: users.id,
        username: users.username,
        bannedAt: users.bannedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
      .limit(1);

    const user = row[0];
    if (!user) return null;
    if (user.bannedAt) {
      await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      isAdmin: isSiteAdminUser(user),
    };
  } catch (error) {
    if (isTransientDbError(error)) {
      console.error(
        "[sessions] Turso unreachable during session lookup; page will render as logged out",
        error,
      );
      return null;
    }
    throw error;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const tokenHash = sha256Hex(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
