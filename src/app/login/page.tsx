import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { MarketingHeader } from "@/components/marketing-header";
import { getSessionUser } from "@/lib/sessions";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <MarketingHeader user={null} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-16">
        <AuthForm mode="login" />
      </main>
    </>
  );
}
