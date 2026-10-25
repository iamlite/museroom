import { NextResponse } from "next/server";
import { isAdminSessionUser, requireAdminSession } from "@/lib/admin-api";
import { deleteSkillById } from "@/lib/moderation";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!isAdminSessionUser(session)) return session;

  const { id } = await context.params;
  const deleted = await deleteSkillById(id);
  if (!deleted) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
