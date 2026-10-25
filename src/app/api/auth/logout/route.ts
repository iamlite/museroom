import { NextResponse } from "next/server";
import { clearSessionCookieOptions, destroySession } from "@/lib/sessions";

export async function POST() {
  await destroySession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearSessionCookieOptions());
  return response;
}
