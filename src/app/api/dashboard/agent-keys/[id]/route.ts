import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { agentKeys } from "@/db/schema";
import { getSessionUser } from "@/lib/sessions";

const patchSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  revoke: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(agentKeys)
    .where(and(eq(agentKeys.id, id), eq(agentKeys.userId, user.id)))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const updates: Partial<typeof agentKeys.$inferInsert> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.revoke) updates.revokedAt = new Date();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await db.update(agentKeys).set(updates).where(eq(agentKeys.id, id));
  return NextResponse.json({ ok: true });
}
