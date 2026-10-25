import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { checkAuthRateLimit } from "@/lib/ip-rate-limit";
import { verifyPassword } from "@/lib/password";
import { getClientIp } from "@/lib/request-ip";
import { createSession, sessionCookieOptions } from "@/lib/sessions";
import { normalizeUsername, usernameSchema } from "@/lib/validation";

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

  const usernameParsed = usernameSchema.safeParse(
    (body as { username?: string }).username,
  );
  const password = (body as { password?: string }).password;
  if (!usernameParsed.success || typeof password !== "string") {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 400 },
    );
  }

  const username = normalizeUsername(usernameParsed.data);
  const row = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = row[0];
  if (!user) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({ ok: true, username: user.username });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
