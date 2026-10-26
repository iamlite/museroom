"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminEditMessageButton } from "@/components/admin-edit-message-button";
import { AdminModerationButton } from "@/components/admin-moderation-button";
import { AnimatedMessageScrollerItem } from "@/components/animated-message-scroller-item";
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
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { authorInitials } from "@/lib/format";
import type { ThreadMessage } from "@/lib/room-thread-messages";

export type { ThreadMessage } from "@/lib/room-thread-messages";

const POLL_INTERVAL_MS = 5_000;

type AvatarPreview = {
  authorLabel: string;
  initials: string;
  avatarUrl: string | null;
};

function messagesFingerprint(list: ThreadMessage[]) {
  if (list.length === 0) return "";
  const last = list[list.length - 1];
  return `${list.length}:${last.id}:${last.body.length}`;
}

export function RoomThread({
  messages: initialMessages,
  canModerate = false,
  roomSlug,
  roomToken,
}: {
  messages: ThreadMessage[];
  canModerate?: boolean;
  roomSlug: string;
  roomToken?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [preview, setPreview] = useState<AvatarPreview | null>(null);
  const knownMessageIdsRef = useRef(new Set(initialMessages.map((m) => m.id)));
  const roomKey = roomToken ?? roomSlug;

  useEffect(() => {
    knownMessageIdsRef.current = new Set(initialMessages.map((m) => m.id));
    setMessages(initialMessages);
  }, [initialMessages, roomKey]);

  const animateEntranceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of messages) {
      if (!knownMessageIdsRef.current.has(m.id)) {
        ids.add(m.id);
      }
    }
    knownMessageIdsRef.current = new Set(messages.map((m) => m.id));
    return ids;
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (roomToken) params.set("roomToken", roomToken);
    const query = params.toString();
    const url = `/api/rooms/${encodeURIComponent(roomSlug)}/messages${query ? `?${query}` : ""}`;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { messages?: ThreadMessage[] };
        const next = data.messages;
        if (!next || cancelled) return;
        setMessages((current) => {
          if (messagesFingerprint(current) === messagesFingerprint(next)) {
            return current;
          }
          return next;
        });
      } catch {
        // ignore transient network errors
      }
    }

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomSlug, roomToken]);

  return (
    <>
      <MessageScrollerProvider
        autoScroll
        defaultScrollPosition="last-anchor"
        scrollPreviousItemPeek={64}
      >
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport aria-label={`${roomSlug} messages`}>
            <MessageScrollerContent className="py-2">
              {messages.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No messages yet. Agents usually start in{" "}
                  <span className="font-medium text-foreground">lobby</span>.
                </p>
              ) : (
                messages.map((m) => {
                  const isHuman = m.authorType === "human";
                  const initials = authorInitials(m.authorLabel);
                  const time =
                    m.relativeTime ?? new Date(m.createdAt).toLocaleString();

                  return (
                    <AnimatedMessageScrollerItem
                      key={m.id}
                      messageId={m.id}
                      scrollAnchor={isHuman}
                      animateEntrance={animateEntranceIds.has(m.id)}
                    >
                      <ChatMessage
                        align={isHuman ? "end" : "start"}
                        className="max-w-full"
                      >
                        <MessageAvatar>
                          <button
                            type="button"
                            className="cursor-pointer rounded-full outline-none transition-[transform,opacity,box-shadow] duration-200 ease-out hover:scale-105 hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
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
                                <AvatarImage
                                  src={m.avatarUrl}
                                  alt={m.authorLabel}
                                />
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
                    </AnimatedMessageScrollerItem>
                  );
                })
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" />
        </MessageScroller>
      </MessageScrollerProvider>

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
