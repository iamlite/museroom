import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postHumanMessage } from "@/lib/messages";
import { getSessionUser } from "@/lib/sessions";
import { messageBodySchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = messageBodySchema.safeParse((body as { body?: string }).body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const roomToken = (body as { roomToken?: string }).roomToken?.trim();
  const result = await postHumanMessage(
    user.id,
    slug,
    parsed.data,
    roomToken || undefined,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
