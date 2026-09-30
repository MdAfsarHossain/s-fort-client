"use client";

import Link from "next/link";
import {
  ActivityIcon,
  CheckCircle2Icon,
  FileTextIcon,
  FolderKanbanIcon,
  type LucideIcon,
  MailIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MEMBER_ROLE_LABELS,
  MEMBER_STATUS_BADGE_CLASSES,
  MEMBER_STATUS_LABELS,
} from "@/constants/members";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import {
  ACTIVITY_ICON_PREFIXES,
  formatRelativeTime,
  getActivityColorClasses,
} from "@/lib/activity-format";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useGetMyActivityQuery } from "@/redux/api/activityApi";
import type { MemberRole, MemberStatus } from "@/redux/api/memberApi";
import {
  useGetDashboardStatsQuery,
  type DashboardStats,
} from "@/redux/api/statsApi";
import { Button } from "@base-ui/react";

interface StatCardConfig {
  label: string;
  key: keyof DashboardStats;
  href: string;
  icon: LucideIcon;
  iconClasses: string;
}

const STAT_CARDS: StatCardConfig[] = [
  {
    label: "Total blogs",
    key: "totalBlogs",
    href: ROUTES.DASHBOARD_BLOGS,
    icon: FileTextIcon,
    iconClasses: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  },
  {
    label: "Published blogs",
    key: "publishedBlogs",
    href: ROUTES.DASHBOARD_BLOGS,
    icon: CheckCircle2Icon,
    iconClasses:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
      {
    label: "Total portfolios",
    key: "totalPortfolios",
    href: ROUTES.DASHBOARD_PORTFOLIO,
    icon: FolderKanbanIcon,
    iconClasses:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  {
    label: "Total members",
    key: "totalMembers",
    href: ROUTES.DASHBOARD_MEMBERS,
    icon: UsersIcon,
    iconClasses:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
  // {
  //   label: "Total categories",
  //   key: "totalCategories",
  //   href: ROUTES.DASHBOARD_CATEGORIES,
  //   icon: FolderKanbanIcon,
  //   iconClasses:
  //     "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  // },
  {
    label: "Newsletter subscribers",
    key: "totalNewsletter",
    href: ROUTES.DASHBOARD_NEWSLETTER,
    icon: MailIcon,
    iconClasses: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  },
];

export default function OverviewPage() {
  useDocumentTitle("Overview");
  const { user } = useAuth();
  const { data, isLoading } = useGetDashboardStatsQuery();
  const { data: activityData, isLoading: isActivityLoading } =
    useGetMyActivityQuery({ page: 1, limit: 5 });
  const activities = activityData?.items;

    function handleGoogleLogin() {
      console.log("Google Login");

    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your content.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  card.iconClasses
                )}
              >
                <card.icon className="size-4.5" />
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="font-heading text-3xl font-semibold">
                {data?.[card.key] ?? 0}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 lg:col-span-2">
          <div>
            <h2 className="font-heading text-base font-semibold">
              Recent activity
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest actions taken across your workspace.
            </p>
          </div>

          <div className="flex flex-col divide-y">
            {isActivityLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 py-2.5">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}

            {!isActivityLoading && activities?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ActivityIcon className="size-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No activity yet. Actions you take will show up here.
                </p>
              </div>
            )}

            {!isActivityLoading &&
              activities?.map((activity) => {
                const iconEntry = ACTIVITY_ICON_PREFIXES.find(([prefix]) =>
                  activity.type.startsWith(prefix)
                );
                const Icon = iconEntry ? iconEntry[1] : ActivityIcon;
                return (
                  <div key={activity.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        getActivityColorClasses(activity.type)
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {activity.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          <Link
            href={ROUTES.DASHBOARD_ACTIVITY}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all activity &rarr;
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Session</h2>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">Signed in as</span>
              <span className="truncate text-sm font-medium">
                {user?.email ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">Role</span>
              <span className="text-sm font-medium">
                {user?.role
                  ? MEMBER_ROLE_LABELS[user.role as MemberRole] ?? user.role
                  : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">Status</span>
              {user?.status ? (
                <Badge
                  className={cn(
                    "w-fit",
                    MEMBER_STATUS_BADGE_CLASSES[user.status as MemberStatus]
                  )}
                >
                  {MEMBER_STATUS_LABELS[user.status as MemberStatus] ??
                    user.status}
                </Badge>
              ) : (
                <span className="text-sm font-medium">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <Button
            type="button"
            // variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg viewBox="0 0 24 24" className="size-4">
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.48-1.13 2.74-2.4 3.58v2.98h3.87c2.27-2.09 3.58-5.17 3.58-8.75Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-2.98c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.27v3.07C3.25 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.3a7.19 7.19 0 0 1 0-4.6V6.63H1.27a11.98 11.98 0 0 0 0 10.74l4-3.07Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.07C6.22 6.86 8.87 4.75 12 4.75Z"
              />
            </svg>
            Continue with Google
          </Button>
          </div> */}
    </div>
  );
}
