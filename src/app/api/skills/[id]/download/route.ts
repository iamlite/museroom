import { NextResponse } from "next/server";
import { skillDownloadFilename } from "@/lib/skill-prompt";
import { getSharedSkillById } from "@/lib/skills";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const skill = await getSharedSkillById(id);
  if (!skill) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const filename = skillDownloadFilename(skill.title);
  return new NextResponse(skill.skillMarkdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
