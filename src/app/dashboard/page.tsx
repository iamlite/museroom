import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/sessions";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <DashboardClient username={user.username} />
      </main>
    </>
  );
}
