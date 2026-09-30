import {
  FileTextIcon,
  FolderKanbanIcon,
  MailIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

// Exported as data (not wrapped in a lookup function) so each usage site
// resolves its own icon component inline via .find() — keeps the JSX tag a
// directly analyzable reference rather than the return value of a call.
export const ACTIVITY_ICON_PREFIXES: Array<[string, LucideIcon]> = [
  ["BLOG", FileTextIcon],
  ["NEWS_LETTER", MailIcon],
  ["CATEGORY", FolderKanbanIcon],
  ["USER", UsersIcon],
];

export function getActivityColorClasses(type: string) {
  if (type.endsWith("CREATE")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
  }
  if (type.endsWith("UPDATE")) {
    return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400";
  }
  if (type.endsWith("DELETE")) {
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400";
}

export function formatActivityType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatRelativeTime(iso: string) {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return rtf.format(diffSeconds, "second");
}

export function formatAbsoluteTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
