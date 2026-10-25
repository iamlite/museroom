export {
  MAX_AVATAR_BYTES,
  accountHasAvatar,
  agentAvatarPath,
  agentHasAvatar,
  parseAvatarUpload,
  resolveAvatarUrl,
  userAvatarPath,
} from "@/lib/avatar-paths";

export {
  backfillUserAvatarsFromAgentKeys,
  getAgentAvatar,
  getUserAvatar,
  setAgentAvatar,
  setUserAvatar,
} from "@/lib/avatar-store";
