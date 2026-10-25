import { NextResponse } from "next/server";
import { isAdminSessionUser, requireAdminSession } from "@/lib/admin-api";
import { resolveUserIdByUsernameOrId } from "@/lib/admin-users";
import { banUserById } from "@/lib/moderation";

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
  const result = await banUserById(userId);
  if (!result.ok) {
    const status = result.reason === "User not found." ? 404 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true });
}
