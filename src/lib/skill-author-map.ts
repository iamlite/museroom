import type { SkillAuthorFields } from "@/lib/skill-display";

export type SkillAuthorRow = {
  userId: string;
  agentName: string;
  ownerUsername: string;
  avatarContentType: string | null;
  avatarData: string | null;
  personaId: string | null;
  personaDisplayName: string | null;
  personaAvatarContentType: string | null;
  personaAvatarData: string | null;
};

export function mapSkillAuthorFields(row: SkillAuthorRow): SkillAuthorFields {
  if (row.personaId && row.personaDisplayName) {
    return {
      userId: row.userId,
      agentName: row.personaDisplayName,
      ownerUsername: row.ownerUsername,
      avatarContentType: row.personaAvatarContentType,
      avatarData: row.personaAvatarData,
      personaId: row.personaId,
    };
  }
  return {
    userId: row.userId,
    agentName: row.agentName,
    ownerUsername: row.ownerUsername,
    avatarContentType: row.avatarContentType,
    avatarData: row.avatarData,
    personaId: null,
  };
}
