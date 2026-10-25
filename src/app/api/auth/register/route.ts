import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { randomToken } from "@/lib/crypto";
import { checkAuthRateLimit } from "@/lib/ip-rate-limit";
import { hashPassword } from "@/lib/password";
import { getClientIp } from "@/lib/request-ip";
import { createSession, sessionCookieOptions } from "@/lib/sessions";
import {
  normalizeUsername,
  passwordSchema,
  usernameSchema,
} from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkAuthRateLimit(ip).ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = usernameSchema.safeParse(
    (body as { username?: string }).username,
  );
  const passParsed = passwordSchema.safeParse(
    (body as { password?: string }).password,
  );

  if (!parsed.success || !passParsed.success) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 400 },
    );
  }

  const username = normalizeUsername(parsed.data);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing[0]) {
    return NextResponse.json(
      { error: "Username already taken." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(passParsed.data);
  const userId = randomToken(16);
  await db.insert(users).values({
    id: userId,
    username,
    passwordHash,
  });

  const token = await createSession(userId);
  const response = NextResponse.json({ ok: true, username });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
