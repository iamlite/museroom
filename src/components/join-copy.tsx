"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function JoinCopy({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" size="lg" onClick={copy}>
      {copied ? "Copied!" : "Copy full setup for your agent"}
    </Button>
  );
}
