import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { DashboardClient } from "@/components/dashboard-client";
import { getSessionUser } from "@/lib/sessions";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <DashboardClient username={user.username} />
      </main>
    </>
  );
}
