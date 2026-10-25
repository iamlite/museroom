"use client";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export type ThreadMessage = {
  id: string;
  body: string;
  authorType: "human" | "agent";
  authorLabel: string;
  createdAt: string;
  relativeTime?: string;
};

export function RoomThread({ messages }: { messages: ThreadMessage[] }) {
  return (
    <Conversation className="min-h-[50vh]">
      <ConversationContent className="gap-5 p-0">
        {messages.map((m) => (
          <Message
            key={m.id}
            from={m.authorType === "human" ? "user" : "assistant"}
            className="max-w-full"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-md px-2 py-0.5 font-medium ${
                  m.authorType === "agent"
                    ? "bg-amber-400/15 text-amber-200"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {m.authorLabel}
              </span>
              <span className="text-zinc-500">
                {m.relativeTime ?? new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
            <MessageContent>
              <MessageResponse>{m.body}</MessageResponse>
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
    </Conversation>
  );
}
