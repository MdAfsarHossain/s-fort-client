import Link from "next/link";
import {
  ArrowRightIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROUTES } from "@/constants/routes";

const FEATURES = [
  {
    icon: FileTextIcon,
    title: "Blogs & categories",
    description:
      "Draft, publish, and tag posts without fighting a bloated CMS.",
  },
  {
    icon: MailIcon,
    title: "Newsletter audience",
    description:
      "See every subscriber and how your sends are performing, at a glance.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Role-based access",
    description:
      "Admins, managers, and editors each get exactly the access they need.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboardIcon className="size-4" />
          </span>
          <span className="font-heading text-base font-semibold">
            Scrumfort CMS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button nativeButton={false} render={<Link href={ROUTES.LOGIN} />}>
            Sign in
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Content management, simplified
          </span>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            One dashboard for your blog, newsletter, and team.
          </h1>
          <p className="text-balance text-muted-foreground sm:text-lg">
            Sign in to publish posts, manage your newsletter audience, and
            keep everyone on the same page — in a workspace that stays out of
            your way.
          </p>
          
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={ROUTES.LOGIN} />}
            >
              Sign in
              <ArrowRightIcon />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href={ROUTES.DASHBOARD} />}
            >
              Open dashboard
            </Button>
          </div>
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-xl border bg-card p-5"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-4.5" />
              </span>
              <h2 className="font-heading text-base font-semibold">
                {feature.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        &copy; {new Date().getFullYear()} Scrumfort CMS. All rights reserved.
      </footer>
    </div>
  );
}
