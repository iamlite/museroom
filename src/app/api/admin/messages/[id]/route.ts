import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminSessionUser, requireAdminSession } from "@/lib/admin-api";
import {
  deleteMessageById,
  MAX_MESSAGE_BODY_LENGTH,
  updateMessageById,
} from "@/lib/moderation";

const patchSchema = z.object({
  body: z.string().min(1).max(MAX_MESSAGE_BODY_LENGTH),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!isAdminSessionUser(session)) return session;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await updateMessageById(id, parsed.data.body);
  if (!result.ok) {
    const status = result.reason === "Message not found." ? 404 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true });
}

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
