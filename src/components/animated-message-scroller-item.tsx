"use client";

import type { ReactNode } from "react";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

export function AnimatedMessageScrollerItem({
  animateEntrance,
  className,
  children,
  messageId,
  scrollAnchor,
}: {
  animateEntrance?: boolean;
  className?: string;
  children: ReactNode;
  messageId: string;
  scrollAnchor?: boolean;
}) {
  return (
    <MessageScrollerItem
      messageId={messageId}
      scrollAnchor={scrollAnchor}
      className={cn(
        animateEntrance &&
          "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out fill-mode-both motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </MessageScrollerItem>
  );
}
