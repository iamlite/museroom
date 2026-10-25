import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { agentKeys, personas, sharedSkills, users } from "@/db/schema";
import { randomToken } from "@/lib/crypto";
import type { AuthenticatedAgentKey } from "@/lib/messages";
import type { PersonaRecord } from "@/lib/personas";
import {
  mapSkillAuthorFields,
  type SkillAuthorRow,
} from "@/lib/skill-author-map";
import type { SkillAuthorFields } from "@/lib/skill-display";
import { getSiteOrigin } from "@/lib/site";

const MAX_SKILL_MARKDOWN_CHARS = 80_000;
const MAX_SUBMISSIONS_PER_DAY = 5;
const MAX_URL_LENGTH = 2048;

function validateOptionalHttpUrl(
  url: string | undefined | null,
  field: string,
): { ok: true; value: string | null } | { ok: false; reason: string } {
  const trimmed = url?.trim() || null;
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > MAX_URL_LENGTH) {
    return { ok: false, reason: `${field} is too long.` };
  }
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, reason: `${field} must be http or https.` };
    }
  } catch {
    return { ok: false, reason: `${field} is not a valid URL.` };
  }
  return { ok: true, value: trimmed };
}

const skillAuthorRowSelect = {
  personaId: sharedSkills.personaId,
  userId: users.id,
  agentName: agentKeys.name,
  ownerUsername: users.username,
  avatarContentType: users.avatarContentType,
  avatarData: users.avatarData,
  personaDisplayName: personas.displayName,
  personaAvatarContentType: personas.avatarContentType,
  personaAvatarData: personas.avatarData,
};

type CatalogSkillBase = {
  id: string;
  title: string;
  description: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  createdAt: Date;
} & SkillAuthorFields;

export type CatalogSkillSummary = CatalogSkillBase;

export type CatalogSkillDetail = CatalogSkillBase & {
  skillMarkdown: string;
};

function toCatalogSkillSummary(
  row: {
    id: string;
    title: string;
    description: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    createdAt: Date;
  } & SkillAuthorRow,
): CatalogSkillSummary {
  const author = mapSkillAuthorFields(row);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
    ...author,
  };
}

function toCatalogSkillDetail(
  row: {
    id: string;
    title: string;
    description: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    createdAt: Date;
    skillMarkdown: string;
  } & SkillAuthorRow,
): CatalogSkillDetail {
  return {
    ...toCatalogSkillSummary(row),
    skillMarkdown: row.skillMarkdown,
  };
}

export function formatSkillSharedBy(skill: SkillAuthorFields): string {
  if (skill.personaId) return skill.agentName;
  return `${skill.agentName} (via @${skill.ownerUsername})`;
}

export function skillCatalogUrl(origin: string, skillId: string): string {
  return `${origin}/skills/${skillId}`;
}

export function skillDownloadUrl(origin: string, skillId: string): string {
  return `${origin}/api/skills/${skillId}/download`;
}

export function skillPublicUrls(origin: string, skillId: string) {
  return {
    catalogUrl: skillCatalogUrl(origin, skillId),
    downloadUrl: skillDownloadUrl(origin, skillId),
  };
}

export async function listSharedSkills() {
  const rows = await db
    .select({
      id: sharedSkills.id,
      title: sharedSkills.title,
      description: sharedSkills.description,
      sourceUrl: sharedSkills.sourceUrl,
      imageUrl: sharedSkills.imageUrl,
      createdAt: sharedSkills.createdAt,
      ...skillAuthorRowSelect,
    })
    .from(sharedSkills)
    .innerJoin(agentKeys, eq(sharedSkills.agentKeyId, agentKeys.id))
    .innerJoin(users, eq(agentKeys.userId, users.id))
    .leftJoin(personas, eq(sharedSkills.personaId, personas.id))
    .orderBy(desc(sharedSkills.createdAt));

  return rows.map(toCatalogSkillSummary);
}

export async function getSharedSkillById(id: string) {
  const rows = await db
    .select({
      id: sharedSkills.id,
      title: sharedSkills.title,
      description: sharedSkills.description,
      skillMarkdown: sharedSkills.skillMarkdown,
      sourceUrl: sharedSkills.sourceUrl,
      imageUrl: sharedSkills.imageUrl,
      createdAt: sharedSkills.createdAt,
      ...skillAuthorRowSelect,
    })
    .from(sharedSkills)
    .innerJoin(agentKeys, eq(sharedSkills.agentKeyId, agentKeys.id))
    .innerJoin(users, eq(agentKeys.userId, users.id))
    .leftJoin(personas, eq(sharedSkills.personaId, personas.id))
    .where(eq(sharedSkills.id, id))
    .limit(1);

  const row = rows[0];
  return row ? toCatalogSkillDetail(row) : null;
}

async function validateSkillPayload(input: {
  title: string;
  description: string;
  skillMarkdown: string;
  sourceUrl?: string;
  imageUrl?: string;
}): Promise<
  | {
      ok: true;
      title: string;
      description: string;
      skillMarkdown: string;
      sourceUrl: string | null;
      imageUrl: string | null;
    }
  | { ok: false; reason: string }
> {
  const title = input.title.trim();
  const description = input.description.trim();
  const skillMarkdown = input.skillMarkdown.trim();
  const sourceCheck = validateOptionalHttpUrl(input.sourceUrl, "url");
  if (!sourceCheck.ok) return sourceCheck;
  const imageCheck = validateOptionalHttpUrl(input.imageUrl, "image_url");
  if (!imageCheck.ok) return imageCheck;

  if (!title || title.length > 120) {
    return { ok: false, reason: "Title is required (max 120 characters)." };
  }
  if (!description || description.length > 500) {
    return {
      ok: false,
      reason: "Description is required (max 500 characters).",
    };
  }
  if (!skillMarkdown || skillMarkdown.length > MAX_SKILL_MARKDOWN_CHARS) {
    return {
      ok: false,
      reason: `skill_markdown is required (max ${MAX_SKILL_MARKDOWN_CHARS} characters).`,
    };
  }
  return {
    ok: true,
    title,
    description,
    skillMarkdown,
    sourceUrl: sourceCheck.value,
    imageUrl: imageCheck.value,
  };
}

export async function submitSharedSkill(
  agent: AuthenticatedAgentKey,
  input: {
    title: string;
    description: string;
    skillMarkdown: string;
    sourceUrl?: string;
    imageUrl?: string;
  },
): Promise<
  | { ok: true; skillId: string; catalogUrl: string; downloadUrl: string }
  | { ok: false; reason: string }
> {
  const validated = await validateSkillPayload(input);
  if (!validated.ok) return validated;

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await db
    .select({ id: sharedSkills.id })
    .from(sharedSkills)
    .where(
      and(
        eq(sharedSkills.agentKeyId, agent.id),
        gte(sharedSkills.createdAt, dayAgo),
      ),
    );

  if (recent.length >= MAX_SUBMISSIONS_PER_DAY) {
    return {
      ok: false,
      reason: `Skill catalog limit: ${MAX_SUBMISSIONS_PER_DAY} submissions per day per agent key.`,
    };
  }

  const skillId = randomToken(12);
  await db.insert(sharedSkills).values({
    id: skillId,
    agentKeyId: agent.id,
    title: validated.title,
    description: validated.description,
    skillMarkdown: validated.skillMarkdown,
    sourceUrl: validated.sourceUrl,
    imageUrl: validated.imageUrl,
  });

  const origin = getSiteOrigin();
  const urls = skillPublicUrls(origin, skillId);
  return {
    ok: true,
    skillId,
    catalogUrl: urls.catalogUrl,
    downloadUrl: urls.downloadUrl,
  };
}

export async function updateSharedSkillById(
  skillId: string,
  patch: {
    title?: string;
    description?: string;
    skillMarkdown?: string;
    sourceUrl?: string | null;
    imageUrl?: string | null;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const existing = await getSharedSkillById(skillId);
  if (!existing) {
    return { ok: false, reason: "Skill not found." };
  }

  const validated = await validateSkillPayload({
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description,
    skillMarkdown: patch.skillMarkdown ?? existing.skillMarkdown,
    sourceUrl:
      patch.sourceUrl !== undefined
        ? patch.sourceUrl ?? undefined
        : existing.sourceUrl ?? undefined,
    imageUrl:
      patch.imageUrl !== undefined
        ? patch.imageUrl ?? undefined
        : existing.imageUrl ?? undefined,
  });
  if (!validated.ok) return validated;

  const result = await db
    .update(sharedSkills)
    .set({
      title: validated.title,
      description: validated.description,
      skillMarkdown: validated.skillMarkdown,
      sourceUrl: validated.sourceUrl,
      imageUrl: validated.imageUrl,
    })
    .where(eq(sharedSkills.id, skillId))
    .returning({ id: sharedSkills.id });

  if (!result[0]) {
    return { ok: false, reason: "Skill not found." };
  }
  return { ok: true };
}

export async function submitSharedSkillAsPersona(
  agent: AuthenticatedAgentKey,
  persona: PersonaRecord,
  input: {
    title: string;
    description: string;
    skillMarkdown: string;
    sourceUrl?: string;
    imageUrl?: string;
  },
): Promise<
  | { ok: true; skillId: string; catalogUrl: string; downloadUrl: string }
  | { ok: false; reason: string }
> {
  if (!agent.isAdmin) {
    return { ok: false, reason: "Forbidden." };
  }

  const validated = await validateSkillPayload(input);
  if (!validated.ok) return validated;

  const skillId = randomToken(12);
  await db.insert(sharedSkills).values({
    id: skillId,
    agentKeyId: agent.id,
    personaId: persona.id,
    title: validated.title,
    description: validated.description,
    skillMarkdown: validated.skillMarkdown,
    sourceUrl: validated.sourceUrl,
    imageUrl: validated.imageUrl,
  });

  const origin = getSiteOrigin();
  const urls = skillPublicUrls(origin, skillId);
  return {
    ok: true,
    skillId,
    catalogUrl: urls.catalogUrl,
    downloadUrl: urls.downloadUrl,
  };
}
