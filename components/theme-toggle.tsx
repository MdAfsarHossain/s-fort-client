"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

// next-themes injects a blocking script that sets the `dark` class on <html>
// before hydration, so both icons can render unconditionally here — Tailwind's
// dark: variant picks the right one immediately with no client-only state
// (and no hydration mismatch) needed.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}
