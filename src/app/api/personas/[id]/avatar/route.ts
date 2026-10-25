import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { personas } from "@/db/schema-personas";
import { accountHasAvatar } from "@/lib/avatar-paths";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const row = await db
    .select({
      avatarContentType: personas.avatarContentType,
      avatarData: personas.avatarData,
    })
    .from(personas)
    .where(eq(personas.id, id))
    .limit(1);
  const persona = row[0];
  if (
    !persona?.avatarContentType ||
    !persona.avatarData ||
    !accountHasAvatar(persona.avatarContentType, persona.avatarData)
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const buffer = Buffer.from(persona.avatarData, "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": persona.avatarContentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
