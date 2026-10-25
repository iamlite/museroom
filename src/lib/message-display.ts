import { resolveAvatarUrl } from "@/lib/avatar-paths";
import { resolvePersonaAvatarUrl } from "@/lib/personas";

export function resolveMessageAvatarUrl(row: {
  authorType: "human" | "agent";
  personaId: string | null;
  personaAvatarContentType: string | null;
  personaAvatarData: string | null;
  authorUserId: string | null;
  userAvatarContentType: string | null;
  userAvatarData: string | null;
}): string | null {
  if (row.personaId) {
    return resolvePersonaAvatarUrl({
      id: row.personaId,
      avatarContentType: row.personaAvatarContentType,
      avatarData: row.personaAvatarData,
    });
  }
  if (row.authorType === "agent") {
    return resolveAvatarUrl(
      row.authorUserId,
      row.userAvatarContentType,
      row.userAvatarData,
    );
  }
  return null;
}
