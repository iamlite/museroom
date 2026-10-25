import { randomBytes } from "node:crypto";
import { sha256Hex } from "@/lib/crypto";

export const AGENT_KEY_PREFIX = "mr_";

export function generateAgentKeyPlaintext(): string {
  return `${AGENT_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashAgentKey(plaintext: string): string {
  return sha256Hex(plaintext);
}

export type AgentKeyLookup = {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export function isAgentKeyActive(key: AgentKeyLookup): boolean {
  return key.revokedAt === null;
}
