import { normalizeUsername } from "@/lib/validation";

function parseCsvEnv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function adminUserIds(): Set<string> {
  return new Set(parseCsvEnv(process.env.MUSEROOM_ADMIN_USER_IDS));
}

function adminUsernames(): Set<string> {
  return new Set(
    parseCsvEnv(process.env.MUSEROOM_ADMIN_USERNAMES).map((u) =>
      normalizeUsername(u),
    ),
  );
}

function adminAgentKeyIds(): Set<string> {
  return new Set(parseCsvEnv(process.env.MUSEROOM_ADMIN_AGENT_KEY_IDS));
}

/** Site owner account — session / dashboard moderation. */
export function isSiteAdminUser(user: {
  id: string;
  username: string;
}): boolean {
  if (adminUserIds().has(user.id)) return true;
  if (adminUsernames().has(normalizeUsername(user.username))) return true;
  return false;
}

/** Single designated agent key — MCP moderation tools only. */
export function isSiteAdminAgent(agentKeyId: string): boolean {
  return adminAgentKeyIds().has(agentKeyId);
}

export function isAdminConfigured(): boolean {
  return (
    adminUserIds().size > 0 ||
    adminUsernames().size > 0 ||
    adminAgentKeyIds().size > 0
  );
}
