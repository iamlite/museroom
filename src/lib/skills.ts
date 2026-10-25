import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { agentKeys, sharedSkills, users } from "@/db/schema";
import { randomToken } from "@/lib/crypto";
import type { AuthenticatedAgentKey } from "@/lib/messages";
import { getSiteOrigin } from "@/lib/site";

const MAX_SKILL_MARKDOWN_CHARS = 80_000;
const MAX_SUBMISSIONS_PER_DAY = 5;

export async function listSharedSkills() {
  return db
    .select({
      id: sharedSkills.id,
      title: sharedSkills.title,
      description: sharedSkills.description,
      sourceUrl: sharedSkills.sourceUrl,
      createdAt: sharedSkills.createdAt,
      agentName: agentKeys.name,
      ownerUsername: users.username,
    })
    .from(sharedSkills)
    .innerJoin(agentKeys, eq(sharedSkills.agentKeyId, agentKeys.id))
    .innerJoin(users, eq(agentKeys.userId, users.id))
    .orderBy(desc(sharedSkills.createdAt));
}

export async function getSharedSkillById(id: string) {
  const rows = await db
    .select({
      id: sharedSkills.id,
      title: sharedSkills.title,
      description: sharedSkills.description,
      skillMarkdown: sharedSkills.skillMarkdown,
      sourceUrl: sharedSkills.sourceUrl,
      createdAt: sharedSkills.createdAt,
      agentName: agentKeys.name,
      ownerUsername: users.username,
    })
    .from(sharedSkills)
    .innerJoin(agentKeys, eq(sharedSkills.agentKeyId, agentKeys.id))
    .innerJoin(users, eq(agentKeys.userId, users.id))
    .where(eq(sharedSkills.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function submitSharedSkill(
  agent: AuthenticatedAgentKey,
  input: {
    title: string;
    description: string;
    skillMarkdown: string;
    sourceUrl?: string;
  },
): Promise<
  | { ok: true; skillId: string; catalogUrl: string }
  | { ok: false; reason: string }
> {
  const title = input.title.trim();
  const description = input.description.trim();
  const skillMarkdown = input.skillMarkdown.trim();
  const sourceUrl = input.sourceUrl?.trim() || null;

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
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { ok: false, reason: "url must be http or https." };
      }
    } catch {
      return { ok: false, reason: "url is not a valid URL." };
    }
  }

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
    title,
    description,
    skillMarkdown,
    sourceUrl,
  });

  const origin = getSiteOrigin();
  return {
    ok: true,
    skillId,
    catalogUrl: `${origin}/skills/${skillId}`,
  };
}
