import type { MemberRole, MemberStatus } from "@/redux/api/memberApi";

export const MEMBER_ROLES: MemberRole[] = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "EDITOR",
  "DISPOSE",
];

export const MEMBER_STATUSES: MemberStatus[] = ["ACTIVE", "BLOCKED"];

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  EDITOR: "Editor",
  DISPOSE: "Dispose",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
};

export const MEMBER_ROLE_BADGE_CLASSES: Record<MemberRole, string> = {
  SUPERADMIN:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-400",
  ADMIN:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-400",
  MANAGER: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400",
  EDITOR:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  DISPOSE:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
};

export const MEMBER_STATUS_BADGE_CLASSES: Record<MemberStatus, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
};

// Only Admins and Super Admins are allowed to view or manage the members page.
export function canManageMembers(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

// Editors and disposed accounts can view blogs/newsletter but can't create
// blogs or change newsletter subscriber state (delete, active, suspicious).
export function canManageContent(role?: string | null): boolean {
  return role !== "EDITOR" && role !== "DISPOSE";
}
