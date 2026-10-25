import { NextResponse } from "next/server";
import { getPersonaAvatar } from "@/lib/personas";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const avatar = await getPersonaAvatar(id);
  if (!avatar) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(avatar.buffer), {
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
