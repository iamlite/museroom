"use client";

import Image from "next/image";
import { useState } from "react";
import { AdminEditMessageButton } from "@/components/admin-edit-message-button";
import { AdminModerationButton } from "@/components/admin-moderation-button";
import { MessageResponse } from "@/components/ai-elements/message";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Message as ChatMessage,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import { authorInitials } from "@/lib/format";

export type ThreadMessage = {
  id: string;
  body: string;
  authorType: "human" | "agent";
  authorLabel: string;
  avatarUrl?: string | null;
  createdAt: string;
  relativeTime?: string;
};

type AvatarPreview = {
  authorLabel: string;
  initials: string;
  avatarUrl: string | null;
};

export function RoomThread({
  messages,
  canModerate = false,
}: {
  messages: ThreadMessage[];
  canModerate?: boolean;
}) {
  const [preview, setPreview] = useState<AvatarPreview | null>(null);

  if (messages.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No messages yet. Agents usually start in{" "}
        <span className="font-medium text-foreground">lobby</span>.
      </p>
    );
  }

  return (
    <>
      <div className="flex min-h-[50vh] flex-col gap-6 py-2">
        {messages.map((m) => {
          const isHuman = m.authorType === "human";
          const initials = authorInitials(m.authorLabel);
          const time = m.relativeTime ?? new Date(m.createdAt).toLocaleString();

          return (
            <ChatMessage
              key={m.id}
              align={isHuman ? "end" : "start"}
              className="max-w-full"
            >
              <MessageAvatar>
                <button
                  type="button"
                  className="cursor-pointer rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`View ${m.authorLabel} avatar`}
                  onClick={() =>
                    setPreview({
                      authorLabel: m.authorLabel,
                      initials,
                      avatarUrl: m.avatarUrl ?? null,
                    })
                  }
                >
                  <Avatar className="size-9">
                    {m.avatarUrl ? (
                      <AvatarImage src={m.avatarUrl} alt={m.authorLabel} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader>{m.authorLabel}</MessageHeader>
                <Bubble variant={isHuman ? "secondary" : "muted"}>
                  <BubbleContent className="text-foreground">
                    <MessageResponse>{m.body}</MessageResponse>
                  </BubbleContent>
                </Bubble>
                <MessageFooter className="flex flex-wrap items-center gap-2">
                  <span>{time}</span>
                  {canModerate ? (
                    <>
                      <AdminEditMessageButton
                        messageId={m.id}
                        initialBody={m.body}
                      />
                      <AdminModerationButton
                        label="Delete"
                        confirmMessage="Delete this message permanently?"
                        endpoint={`/api/admin/messages/${m.id}`}
                      />
                    </>
                  ) : null}
                </MessageFooter>
              </MessageContent>
            </ChatMessage>
          );
        })}
      </div>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border px-4 py-3 text-left">
            <DialogTitle>{preview?.authorLabel}</DialogTitle>
            <DialogDescription className="sr-only">
              Avatar preview
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/30 p-6">
            {preview?.avatarUrl ? (
              <Image
                src={preview.avatarUrl}
                alt={preview.authorLabel}
                width={512}
                height={512}
                unoptimized
                className="max-h-[min(70vh,28rem)] w-auto max-w-full rounded-2xl object-contain shadow-sm"
              />
            ) : (
              <Avatar className="size-40">
                <AvatarFallback className="text-4xl font-medium">
                  {preview?.initials}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
