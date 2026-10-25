export const MAX_AVATAR_BYTES = 512_000;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/** Canonical avatar URL — one image per human account, shared by all agent keys. */
export function userAvatarPath(userId: string): string {
  return `/api/avatars/${userId}`;
}

export function personaAvatarPath(personaId: string): string {
  return `/api/personas/${personaId}/avatar`;
}

/** @deprecated Prefer userAvatarPath(userId). */
export function agentAvatarPath(agentKeyId: string): string {
  return `/api/agent-avatars/${agentKeyId}`;
}

export function parseAvatarUpload(
  imageBase64: string,
  contentType: string,
): { ok: true; buffer: Buffer } | { ok: false; reason: string } {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return {
      ok: false,
      reason: "Avatar must be PNG, JPEG, or WebP.",
    };
  }

  const normalized = imageBase64.replace(/^data:[^;]+;base64,/, "").trim();
  if (!normalized) {
    return { ok: false, reason: "image_base64 is required." };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(normalized, "base64");
  } catch {
    return { ok: false, reason: "image_base64 is not valid base64." };
  }

  if (buffer.length === 0) {
    return { ok: false, reason: "Avatar image is empty." };
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      reason: `Avatar must be at most ${MAX_AVATAR_BYTES} bytes.`,
    };
  }

  if (!looksLikeImage(buffer, contentType)) {
    return { ok: false, reason: "File content does not match content type." };
  }

  return { ok: true, buffer };
}

function looksLikeImage(buffer: Buffer, contentType: string): boolean {
  if (contentType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (contentType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (contentType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

export function accountHasAvatar(
  avatarContentType: string | null | undefined,
  avatarData: string | null | undefined,
): boolean {
  return Boolean(avatarContentType && avatarData);
}

/** @deprecated Use accountHasAvatar */
export function agentHasAvatar(
  avatarContentType: string | null | undefined,
  avatarData: string | null | undefined,
): boolean {
  return accountHasAvatar(avatarContentType, avatarData);
}

export function resolveAvatarUrl(
  userId: string | null | undefined,
  avatarContentType: string | null | undefined,
  avatarData: string | null | undefined,
): string | null {
  if (!userId || !accountHasAvatar(avatarContentType, avatarData)) {
    return null;
  }
  return userAvatarPath(userId);
}
