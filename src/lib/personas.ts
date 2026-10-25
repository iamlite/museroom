import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, personas as personasTable } from "@/db/schema";
import {
  accountHasAvatar,
  personaAvatarPath,
  parseAvatarUpload,
} from "@/lib/avatar-paths";
import { randomToken } from "@/lib/crypto";
import type { AuthenticatedAgentKey } from "@/lib/messages";
const SLUG_PATTERN = /^[a-z0-9_-]{2,32}$/;

export function normalizePersonaSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function isValidPersonaSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export type PersonaRecord = {
  id: string;
  slug: string;
  displayName: string;
  avatarContentType: string | null;
  avatarData: string | null;
  createdAt: Date;
};

export function resolvePersonaAvatarUrl(
  persona: Pick<PersonaRecord, "id" | "avatarContentType" | "avatarData">,
): string | null {
  if (!accountHasAvatar(persona.avatarContentType, persona.avatarData)) {
    return null;
  }
  return personaAvatarPath(persona.id);
}

export async function listPersonas(): Promise<PersonaRecord[]> {
  return db.select().from(personasTable).orderBy(personasTable.slug);
}

export async function getPersonaByIdOrSlug(
  idOrSlug: string,
): Promise<PersonaRecord | null> {
  const trimmed = idOrSlug.trim();
  if (!trimmed) return null;

  const byId = await db
    .select()
    .from(personasTable)
    .where(eq(personasTable.id, trimmed))
    .limit(1);
  if (byId[0]) return byId[0];

  const slug = normalizePersonaSlug(trimmed);
  const bySlug = await db
    .select()
    .from(personasTable)
    .where(eq(personasTable.slug, slug))
    .limit(1);
  return bySlug[0] ?? null;
}

export async function upsertPersona(input: {
  slug: string;
  displayName: string;
  imageBase64?: string;
  contentType?: string;
}): Promise<
  | { ok: true; persona: PersonaRecord; avatarUrl: string | null }
  | { ok: false; reason: string }
> {
  const slug = normalizePersonaSlug(input.slug);
  if (!isValidPersonaSlug(slug)) {
    return {
      ok: false,
      reason: "slug must be 2–32 chars: lowercase letters, numbers, _ or -.",
    };
  }

  const displayName = input.displayName.trim();
  if (!displayName || displayName.length > 48) {
    return {
      ok: false,
      reason: "display_name is required (max 48 characters).",
    };
  }

  let avatarContentType: string | null = null;
  let avatarData: string | null = null;

  if (input.imageBase64 && input.contentType) {
    const parsed = parseAvatarUpload(input.imageBase64, input.contentType);
    if (!parsed.ok) return parsed;
    avatarContentType = input.contentType;
    avatarData = parsed.buffer.toString("base64");
  }

  const existing = await getPersonaByIdOrSlug(slug);
  if (existing) {
    const updates: Partial<typeof personasTable.$inferInsert> = {
      displayName,
    };
    if (avatarData && avatarContentType) {
      updates.avatarContentType = avatarContentType;
      updates.avatarData = avatarData;
    }
    await db.update(personasTable).set(updates).where(eq(personasTable.id, existing.id));
    const persona = await getPersonaByIdOrSlug(existing.id);
    if (!persona) {
      return { ok: false, reason: "Persona update failed." };
    }
    return {
      ok: true,
      persona,
      avatarUrl: resolvePersonaAvatarUrl(persona),
    };
  }

  const id = randomToken(12);
  await db.insert(personasTable).values({
    id,
    slug,
    displayName,
    avatarContentType,
    avatarData,
  });
  const persona = await getPersonaByIdOrSlug(id);
  if (!persona) {
    return { ok: false, reason: "Persona create failed." };
  }
  return {
    ok: true,
    persona,
    avatarUrl: resolvePersonaAvatarUrl(persona),
  };
}

export async function postMessageAsPersona(
  agent: AuthenticatedAgentKey,
  persona: PersonaRecord,
  body: string,
  options: { roomSlug?: string; roomToken?: string },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!agent.isAdmin) {
    return { ok: false, reason: "Forbidden." };
  }

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) {
    return {
      ok: false,
      reason: "body is required (max 2000 characters).",
    };
  }

  const { resolveRoomForAgentAccess } = await import("@/lib/room-access");

  const room = await resolveRoomForAgentAccess(
    options.roomSlug,
    options.roomToken,
  );
  if (!room) {
    return { ok: false, reason: "Room not found." };
  }

  await db.insert(messages).values({
    id: randomToken(16),
    roomId: room.id,
    authorType: "agent",
    authorUserId: agent.userId,
    agentKeyId: agent.id,
    personaId: persona.id,
    agentName: persona.displayName,
    body: trimmed,
  });

  return { ok: true };
}
