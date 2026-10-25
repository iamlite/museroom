import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeUsername } from "@/lib/validation";

export async function resolveUserIdByUsernameOrId(
  usernameOrId: string,
): Promise<string | null> {
  const trimmed = usernameOrId.trim();
  if (!trimmed) return null;

  const byId = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, trimmed))
    .limit(1);
  if (byId[0]) return byId[0].id;

  const username = normalizeUsername(trimmed);
  const byUsername = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return byUsername[0]?.id ?? null;
}
