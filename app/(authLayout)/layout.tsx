import Link from "next/link";
import { LayoutDashboardIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4 sm:p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LayoutDashboardIcon className="size-4" />
        </span>
        <span className="font-heading text-base font-semibold">
          Scrumfort CMS
        </span>
      </Link>
      {children}
    </div>
  );
}
