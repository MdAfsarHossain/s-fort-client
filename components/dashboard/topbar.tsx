"use client";

import { useState } from "react";
import { LayoutDashboardIcon, MenuIcon } from "lucide-react";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-card px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon">
              <MenuIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <span className="flex flex-1 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LayoutDashboardIcon className="size-3.5" />
        </span>
        <span className="font-heading text-base font-semibold">
          Scrumfort CMS
        </span>
      </span>
      <ThemeToggle />
    </header>
  );
}
