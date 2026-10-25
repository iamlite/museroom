import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/sessions";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <SiteHeader user={null} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        <AuthForm mode="register" />
      </main>
    </>
  );
}
