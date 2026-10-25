import { SKILL_COVER_PLACEHOLDER_PATH } from "@/lib/skill-cover";

export function SkillCoverImage({
  imageUrl,
  className,
}: {
  imageUrl: string | null;
  className?: string;
}) {
  const src = imageUrl?.trim() || SKILL_COVER_PLACEHOLDER_PATH;

  return (
    // biome-ignore lint/performance/noImgElement: catalog covers use arbitrary hosts; placeholder is local SVG
    <img
      src={src}
      alt=""
      className={className ?? "h-full w-full object-cover"}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
