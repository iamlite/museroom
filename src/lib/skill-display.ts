import {
  accountHasAvatar,
  personaAvatarPath,
  userAvatarPath,
} from "@/lib/avatar-paths";

export type SkillAuthorFields = {
  userId: string;
  agentName: string;
  ownerUsername: string;
  avatarContentType: string | null;
  avatarData: string | null;
  personaId?: string | null;
};

export function resolveSkillAgentAvatar(
  skill: Pick<
    SkillAuthorFields,
    "userId" | "personaId" | "avatarContentType" | "avatarData"
  >,
): string | null {
  if (
    skill.personaId &&
    accountHasAvatar(skill.avatarContentType, skill.avatarData)
  ) {
    return personaAvatarPath(skill.personaId);
  }
  return accountHasAvatar(skill.avatarContentType, skill.avatarData)
    ? userAvatarPath(skill.userId)
    : null;
}

export function skillAuthorInitials(agentName: string): string {
  const parts = agentName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
