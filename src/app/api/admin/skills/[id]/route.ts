import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminSessionUser, requireAdminSession } from "@/lib/admin-api";
import { deleteSkillById } from "@/lib/moderation";
import { updateSharedSkillById } from "@/lib/skills";

const patchSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().min(1).max(500).optional(),
    skillMarkdown: z.string().min(1).max(80_000).optional(),
    sourceUrl: z.string().url().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.skillMarkdown !== undefined ||
      value.sourceUrl !== undefined ||
      value.imageUrl !== undefined,
    { message: "Provide at least one field to update." },
  );

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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const result = await updateSharedSkillById(id, parsed.data);
  if (!result.ok) {
    const status = result.reason === "Skill not found." ? 404 : 400;
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
  const deleted = await deleteSkillById(id);
  if (!deleted) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
