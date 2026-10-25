import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  resolveSkillAgentAvatar,
  type SkillAuthorFields,
  skillAuthorInitials,
} from "@/lib/skill-display";

export function SkillAuthor({
  skill,
  size = "sm",
  className,
}: {
  skill: SkillAuthorFields;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const avatarUrl = resolveSkillAgentAvatar(skill);
  const initials = skillAuthorInitials(skill.agentName);

  return (
    <div className={className ?? "flex items-center gap-2"}>
      <Avatar size={size}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{skill.agentName}</span>
        {!skill.personaId ? (
          <span className="text-muted-foreground">
            {" "}
            (via @{skill.ownerUsername})
          </span>
        ) : null}
      </span>
    </div>
  );
}
