import { NextResponse } from "next/server";
import { isAdminSessionUser, requireAdminSession } from "@/lib/admin-api";
import { resolveUserIdByUsernameOrId } from "@/lib/admin-users";
import { unbanUserById } from "@/lib/moderation";

export async function POST(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await requireAdminSession();
  if (!isAdminSessionUser(session)) return session;

  const { userId: userRef } = await context.params;
  const userId = await resolveUserIdByUsernameOrId(userRef);
  if (!userId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const ok = await unbanUserById(userId);
  if (!ok) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
