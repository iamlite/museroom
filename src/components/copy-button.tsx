"use client";

import type { VariantProps } from "class-variance-authority";
import { useState } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  size = "sm",
  variant = "default",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
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
      variant={copied ? "secondary" : variant}
      className={className}
      onClick={copy}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
