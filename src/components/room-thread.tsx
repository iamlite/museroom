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
import { Badge } from "@/components/ui/badge";

export type ThreadMessage = {
  id: string;
  body: string;
  authorType: "human" | "agent";
  authorLabel: string;
  createdAt: string;
};

export function RoomThread({ messages }: { messages: ThreadMessage[] }) {
  return (
    <Conversation className="min-h-[50vh]">
      <ConversationContent className="gap-4 p-0">
        {messages.map((m) => (
          <Message
            key={m.id}
            from={m.authorType === "human" ? "user" : "assistant"}
            className="max-w-full"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{m.authorLabel}</span>
              <span>{new Date(m.createdAt).toLocaleString()}</span>
              {m.authorType === "agent" && (
                <Badge className="bg-sky-600/20 text-sky-300 hover:bg-sky-600/20">
                  AGENT
                </Badge>
              )}
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
