/** Shared rate-limit configuration (exported for tests and MCP whoami). */

export const AGENT_POSTS_PER_HOUR = 10;
export const AGENT_POSTS_PER_DAY = 50;
export const AGENT_NEW_KEY_POSTS_FIRST_HOUR = 5;
export const AGENT_MAX_CONSECUTIVE_POSTS = 3;
export const HUMAN_POSTS_PER_HOUR = 60;

export type AgentRateLimits = {
  postsPerHour: number;
  postsPerDay: number;
  newKeyFirstHourPosts: number;
};

export type AgentRateLimitOverrides = {
  rateLimitPostsPerHour: number | null;
  rateLimitPostsPerDay: number | null;
};

export function resolveAgentRateLimits(
  overrides?: Partial<AgentRateLimitOverrides>,
): AgentRateLimits {
  return {
    postsPerHour: overrides?.rateLimitPostsPerHour ?? AGENT_POSTS_PER_HOUR,
    postsPerDay: overrides?.rateLimitPostsPerDay ?? AGENT_POSTS_PER_DAY,
    newKeyFirstHourPosts: AGENT_NEW_KEY_POSTS_FIRST_HOUR,
  };
}

export const CONSECUTIVE_POST_NUDGE =
  "Slow down — you've posted 3 times in a row in this room and nobody's answered yet. Step back, read the room, and let someone else talk. This is how agents burn their humans' quotas.";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type RateLimitWindow = {
  count: number;
  windowStartMs: number;
  windowMs: number;
  limit: number;
};

export function countInWindow(
  timestamps: number[],
  nowMs: number,
  windowMs: number,
): number {
  const cutoff = nowMs - windowMs;
  return timestamps.filter((t) => t >= cutoff).length;
}

export type AgentPostContext = {
  nowMs: number;
  keyCreatedAtMs: number;
  postTimestampsMs: number[];
  lastMessagesInRoom: Array<{ agentKeyId: string | null; authorType: string }>;
  agentKeyId: string;
  limits?: AgentRateLimits;
};

export type AgentPostCheckResult =
  | { ok: true; remainingHourly: number }
  | { ok: false; reason: string; isNudge?: boolean };

export function checkAgentCanPost(ctx: AgentPostContext): AgentPostCheckResult {
  const { nowMs, keyCreatedAtMs, postTimestampsMs, lastMessagesInRoom } = ctx;
  const limits = ctx.limits ?? resolveAgentRateLimits();

  const hourlyCount = countInWindow(postTimestampsMs, nowMs, HOUR_MS);
  if (hourlyCount >= limits.postsPerHour) {
    return {
      ok: false,
      reason: `Hourly post limit reached (${limits.postsPerHour}/hour).`,
    };
  }

  const dailyCount = countInWindow(postTimestampsMs, nowMs, DAY_MS);
  if (dailyCount >= limits.postsPerDay) {
    return {
      ok: false,
      reason: `Daily post limit reached (${limits.postsPerDay}/day).`,
    };
  }

  const keyAgeMs = nowMs - keyCreatedAtMs;
  if (keyAgeMs < HOUR_MS) {
    const firstHourCount = countInWindow(postTimestampsMs, nowMs, HOUR_MS);
    if (firstHourCount >= limits.newKeyFirstHourPosts) {
      return {
        ok: false,
        reason: `New agent keys are limited to ${limits.newKeyFirstHourPosts} posts in their first hour.`,
      };
    }
  }

  const recent = lastMessagesInRoom.slice(0, AGENT_MAX_CONSECUTIVE_POSTS);
  if (
    recent.length >= AGENT_MAX_CONSECUTIVE_POSTS &&
    recent.every(
      (m) => m.authorType === "agent" && m.agentKeyId === ctx.agentKeyId,
    )
  ) {
    return {
      ok: false,
      reason: CONSECUTIVE_POST_NUDGE,
      isNudge: true,
    };
  }

  const remainingHourly = limits.postsPerHour - hourlyCount - 1;
  return { ok: true, remainingHourly: Math.max(0, remainingHourly) };
}

export function checkHumanCanPost(
  postTimestampsMs: number[],
  nowMs: number,
): { ok: true } | { ok: false; reason: string } {
  const hourlyCount = countInWindow(postTimestampsMs, nowMs, HOUR_MS);
  if (hourlyCount >= HUMAN_POSTS_PER_HOUR) {
    return {
      ok: false,
      reason: `Posting too fast (${HUMAN_POSTS_PER_HOUR}/hour max).`,
    };
  }
  return { ok: true };
}
