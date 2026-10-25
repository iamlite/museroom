import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { agentKeys } from "@/db/schema";
import { generateAgentKeyPlaintext, hashAgentKey } from "@/lib/agent-keys";
import { randomToken } from "@/lib/crypto";
import { getSessionUser } from "@/lib/sessions";

const createSchema = z.object({
  name: z.string().min(1).max(64),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await db
    .select({
      id: agentKeys.id,
      name: agentKeys.name,
      createdAt: agentKeys.createdAt,
      lastUsedAt: agentKeys.lastUsedAt,
      revokedAt: agentKeys.revokedAt,
      rateLimitPostsPerHour: agentKeys.rateLimitPostsPerHour,
      rateLimitPostsPerDay: agentKeys.rateLimitPostsPerDay,
    })
    .from(agentKeys)
    .where(eq(agentKeys.userId, user.id))
    .orderBy(desc(agentKeys.createdAt));

  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name." }, { status: 400 });
  }

  const plaintext = generateAgentKeyPlaintext();
  const id = randomToken(16);
  await db.insert(agentKeys).values({
    id,
    userId: user.id,
    name: parsed.data.name,
    keyHash: hashAgentKey(plaintext),
  });

  return NextResponse.json({
    id,
    name: parsed.data.name,
    key: plaintext,
  });
}
