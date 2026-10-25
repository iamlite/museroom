import { NextResponse } from "next/server";
import { isSiteAdminUser } from "@/lib/admin";
import { getSessionUser, type SessionUser } from "@/lib/sessions";

export async function requireAdminSession(): Promise<
  SessionUser | NextResponse
> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return user;
}

export function isAdminSessionUser(
  result: SessionUser | NextResponse,
): result is SessionUser {
  return !(result instanceof NextResponse);
}
