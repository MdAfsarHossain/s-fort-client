"use client";

import { useState } from "react";
import { ActivityIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACTIVITY_ICON_PREFIXES,
  formatAbsoluteTime,
  formatActivityType,
  formatRelativeTime,
  getActivityColorClasses,
} from "@/lib/activity-format";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useGetMyActivityQuery, type Activity } from "@/redux/api/activityApi";

const PAGE_SIZE = 10;

function ActivityCard({
  activity,
  isLast,
}: {
  activity: Activity;
  isLast: boolean;
}) {
  const iconEntry = ACTIVITY_ICON_PREFIXES.find(([prefix]) =>
    activity.type.startsWith(prefix)
  );
  const Icon = iconEntry ? iconEntry[1] : ActivityIcon;
  const colorClasses = getActivityColorClasses(activity.type);

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full sm:size-11",
            colorClasses
          )}
        >
          <Icon className="size-4 sm:size-5" />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 rounded-xl border bg-card p-3.5 pb-5 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold sm:text-base">
            {activity.title}
          </h3>
          <Badge className={colorClasses}>
            {formatActivityType(activity.type)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <span
          className="text-xs text-muted-foreground"
          title={formatAbsoluteTime(activity.createdAt)}
        >
          {formatRelativeTime(activity.createdAt)}
        </span>
      </div>
    </div>
  );
}

function ActivityCardSkeleton({ isLast }: { isLast: boolean }) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center">
        <Skeleton className="size-9 shrink-0 rounded-full sm:size-11" />
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 rounded-xl border bg-card p-3.5 pb-5 sm:p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export default function ActivityPage() {
  useDocumentTitle("Activity");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyActivityQuery({
    page,
    limit: PAGE_SIZE,
  });
  const activities = data?.items;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          A log of everything that&apos;s happened on your account.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <ActivityCardSkeleton key={index} isLast={index === 3} />
          ))}

        {!isLoading && activities?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-16 text-center">
            <ActivityIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Actions you take will show up here.
            </p>
          </div>
        )}

        {!isLoading &&
          activities?.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
      </div>

      <PaginationControls meta={data?.meta} onPageChange={setPage} />
    </div>
  );
}
