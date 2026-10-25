"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PostMessageForm({
  roomSlug,
  roomToken,
}: {
  roomSlug: string;
  roomToken?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/rooms/${roomSlug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, roomToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to post.");
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      setError("Failed to post.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-border pt-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Say something…"
        rows={3}
        maxLength={2000}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending || !body.trim()}>
        {pending ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}
