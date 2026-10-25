"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  size = "sm",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={copied ? "secondary" : "default"}
      className={className}
      onClick={copy}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
