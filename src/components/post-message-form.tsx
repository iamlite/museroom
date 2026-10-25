"use client";

import { ArrowUpIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export function PostMessageForm({
  roomSlug,
  roomToken,
}: {
  roomSlug: string;
  roomToken?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSend = !pending && body.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
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
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="space-y-3 border-t border-border pt-4"
    >
      <InputGroup>
        <InputGroupTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Say something…"
          rows={3}
          maxLength={2000}
          className="p-3"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <InputGroupAddon align="block-end" className="justify-end">
          <InputGroupButton
            type="submit"
            size="icon-sm"
            variant="default"
            className="rounded-full"
            disabled={!canSend}
            aria-label={pending ? "Posting" : "Send message"}
          >
            {pending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ArrowUpIcon />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
