"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  BarChart3Icon,
  BriefcaseIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GlobeIcon,
  IdCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  Plug2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { canManageMembers } from "@/constants/members";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { label: "Overview", href: ROUTES.DASHBOARD_OVERVIEW, icon: LayoutDashboardIcon },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Blogs", href: ROUTES.DASHBOARD_BLOGS, icon: FileTextIcon },
      { label: "Portfolio", href: ROUTES.DASHBOARD_PORTFOLIO, icon: BriefcaseIcon },
      { label: "Categories", href: ROUTES.DASHBOARD_CATEGORIES, icon: FolderKanbanIcon },
      { label: "Newsletter", href: ROUTES.DASHBOARD_NEWSLETTER, icon: MailIcon },
      // { label: "Employees", href: ROUTES.DASHBOARD_EMPLOYEES, icon: IdCardIcon },
      // {
      //   label: "Search Performance",
      //   href: ROUTES.DASHBOARD_SEARCH_PERFORMANCE,
      //   icon: BarChart3Icon,
      // },
    ],
  },
  {
    label: "GSC",
    items: [
      { label: "Search Performance", href: ROUTES.DASHBOARD_SEARCH_PERFORMANCE, icon: BarChart3Icon },
      // { label: "Employees", href: ROUTES.DASHBOARD_EMPLOYEES, icon: IdCardIcon },
    ],
  }
];

const SYSTEM_NAV_ITEMS: NavItem[] = [
  { label: "Activity", href: ROUTES.DASHBOARD_ACTIVITY, icon: ActivityIcon },
];

const CONNECTIONS_NAV_ITEM: NavItem = {
  label: "Connections",
  href: ROUTES.DASHBOARD_CONNECTIONS,
  icon: Plug2Icon,
};

const MEMBERS_NAV_ITEM: NavItem = {
  label: "Members",
  href: ROUTES.DASHBOARD_MEMBERS,
  icon: UsersIcon,
};

const EMPLOYEE_NAV_ITEM: NavItem = {
  label: "Employees",
  href: ROUTES.DASHBOARD_EMPLOYEES,
  icon: IdCardIcon,
};

const VISITORS_NAV_ITEM: NavItem = {
  label: "Visitors",
  href: ROUTES.DASHBOARD_VISITORS,
  icon: GlobeIcon,
};

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const canManage = canManageMembers(user?.role);

  const navGroups = [
    ...NAV_GROUPS,
    ...(canManage
      ? [{ label: "Analytics", items: [VISITORS_NAV_ITEM] }]
      : []),
    {
      label: "System",
      items: canManage
        ? [...SYSTEM_NAV_ITEMS, CONNECTIONS_NAV_ITEM]
        : SYSTEM_NAV_ITEMS,
    },
    ...(canManage ? [{ label: "Team", items: [EMPLOYEE_NAV_ITEM, MEMBERS_NAV_ITEM] }] : []),
  ];

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 border-b w-full px-4">
        <Link
          href={ROUTES.DASHBOARD_OVERVIEW}
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboardIcon className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-base font-semibold">
              Scrumfort CMS
            </span>
            <span className="text-xs text-muted-foreground">
              Admin Console
            </span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
        {navGroups.map((group, index) => (
          <div key={group.label} className={cn(index > 0 && "mt-4")}>
            <span className="block px-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {group.label}
            </span>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-md",
                        isActive && "bg-primary/15"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 rounded-lg bg-muted/50 p-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-muted-foreground">Signed in as</span>
            <span className="truncate text-sm font-semibold">
              {user?.name ?? "Loading..."}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email ?? ""}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={logout}
            aria-label="Log out"
          >
            <LogOutIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
