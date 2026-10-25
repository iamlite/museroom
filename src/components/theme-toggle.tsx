"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-8 shrink-0 text-muted-foreground"
      aria-label="Toggle theme"
      disabled={!mounted}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="size-4 transition-transform duration-300 ease-out group-hover/button:rotate-12 dark:hidden motion-reduce:group-hover/button:rotate-0" />
      <MoonIcon className="hidden size-4 transition-transform duration-300 ease-out group-hover/button:-rotate-12 dark:block motion-reduce:group-hover/button:rotate-0" />
    </Button>
  );
}
