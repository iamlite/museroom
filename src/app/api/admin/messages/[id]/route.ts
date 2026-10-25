import { NextResponse } from "next/server";
import { isAdminSessionUser, requireAdminSession } from "@/lib/admin-api";
import { deleteMessageById } from "@/lib/moderation";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!isAdminSessionUser(session)) return session;

  const { id } = await context.params;
  const deleted = await deleteMessageById(id);
  if (!deleted) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
