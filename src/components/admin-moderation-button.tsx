"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  confirmMessage: string;
  endpoint: string;
  method?: "DELETE" | "POST";
  onSuccess?: () => void;
  redirectTo?: string;
  variant?: "destructive" | "outline";
  size?: "sm" | "default";
};

export function AdminModerationButton({
  label,
  confirmMessage,
  endpoint,
  method = "DELETE",
  onSuccess,
  redirectTo,
  variant = "destructive",
  size = "sm",
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run() {
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    try {
      const res = await fetch(endpoint, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? "Action failed.");
        return;
      }
      onSuccess?.();
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={run}
    >
      {pending ? "…" : label}
    </Button>
  );
}
