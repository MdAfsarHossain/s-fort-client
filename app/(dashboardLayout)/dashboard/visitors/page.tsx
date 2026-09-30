"use client";

import { useState } from "react";
import { ShieldAlertIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { canManageMembers } from "@/constants/members";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  useGetChannelBreakdownQuery,
  useGetCityBreakdownQuery,
  useGetDeviceBreakdownQuery,
  useGetGeoBreakdownQuery,
  useGetIspBreakdownQuery,
  useGetVisitorsQuery,
  type NamedCountRow,
} from "@/redux/api/trafficApi";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value: string | null) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function RankedList({
  rows,
  emptyLabel,
}: {
  rows: NamedCountRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...rows.map((row) => row.count));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.name} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{titleCase(row.name)}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatCompact(row.count)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitorsContent() {
  const [days, setDays] = useState("30");
  const [page, setPage] = useState(1);
  const daysArg = { days: Number(days) };

  const { data: countries, isLoading: isLoadingCountries } =
    useGetGeoBreakdownQuery(daysArg);
  const { data: cities, isLoading: isLoadingCities } =
    useGetCityBreakdownQuery(daysArg);
  const { data: devices, isLoading: isLoadingDevices } =
    useGetDeviceBreakdownQuery(daysArg);
  const { data: isps, isLoading: isLoadingIsps } =
    useGetIspBreakdownQuery(daysArg);
  const { data: channels, isLoading: isLoadingChannels } =
    useGetChannelBreakdownQuery(daysArg);
  const { data: visitors, isLoading: isLoadingVisitors } = useGetVisitorsQuery(
    { page, limit: 15, days: Number(days) }
  );

  const isLoading = isLoadingCountries && isLoadingDevices && isLoadingIsps;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Visitors</h1>
          <p className="text-sm text-muted-foreground">
            Where your traffic comes from — location, network, device, and
            acquisition channel.
          </p>
        </div>
        <Select value={days} onValueChange={(value) => value && setDays(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium">Top countries</span>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoadingCountries && countries?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No geolocated visits yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {countries?.map((row) => (
                    <TableRow key={row.country}>
                      <TableCell className="max-w-40 truncate">
                        {row.country}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium">Top cities</span>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoadingCities && cities?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No geolocated visits yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {cities?.map((row) => (
                    <TableRow key={`${row.city}-${row.country}`}>
                      <TableCell className="max-w-32 truncate">
                        {row.city}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-muted-foreground">
                        {row.country ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <span className="text-sm font-medium">Device &amp; tech</span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase">
                Device type
              </span>
              <RankedList
                rows={devices?.deviceTypes ?? []}
                emptyLabel="No device data yet."
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase">
                OS
              </span>
              <RankedList
                rows={devices?.os ?? []}
                emptyLabel="No OS data yet."
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase">
                Browser
              </span>
              <RankedList
                rows={devices?.browsers ?? []}
                emptyLabel="No browser data yet."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium">ISPs &amp; network</span>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ISP</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Proxy</TableHead>
                    <TableHead className="text-right">Hosting</TableHead>
                    <TableHead className="text-right">Mobile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoadingIsps && isps?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No ISP data yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {isps?.map((row) => (
                    <TableRow key={row.isp}>
                      <TableCell className="max-w-40 truncate">
                        {row.isp}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.count)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.proxyCount || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.hostingCount || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.mobileCount || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium">Acquisition</span>
            <RankedList
              rows={
                channels?.channels.map((row) => ({
                  name: row.channel,
                  count: row.count,
                })) ?? []
              }
              emptyLabel="No traffic recorded yet."
            />
            {!isLoadingChannels && !!channels?.campaigns.length && (
              <div className="flex flex-col gap-2 border-t pt-3">
                <span className="text-xs text-muted-foreground uppercase">
                  Campaigns
                </span>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.campaigns.map((row) => (
                        <TableRow key={`${row.utmSource}-${row.utmCampaign}`}>
                          <TableCell className="max-w-28 truncate">
                            {row.utmSource}
                          </TableCell>
                          <TableCell className="max-w-28 truncate text-muted-foreground">
                            {row.utmCampaign ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCompact(row.count)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Recent visitors</span>
            <Badge variant="outline">Contains personal data</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>ISP</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingVisitors &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoadingVisitors && visitors?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No visitors recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoadingVisitors &&
                  visitors?.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">
                        {row.ip ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-36 truncate text-muted-foreground">
                        {[row.city, row.country].filter(Boolean).join(", ") ||
                          "—"}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-muted-foreground">
                        {row.isp ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {[titleCase(row.deviceType), row.os, row.browser]
                          .filter(Boolean)
                          .join(" · ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.channel ?? "Direct"}</Badge>
                      </TableCell>
                      <TableCell className="max-w-40 truncate">
                        {row.path ?? "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls meta={visitors?.meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function VisitorsPage() {
  useDocumentTitle("Visitors");
  const { user, isLoading: isAuthLoading } = useAuth();
  const canManage = canManageMembers(user?.role);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <ShieldAlertIcon className="size-10 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Only Admins and Super Admins can view visitor data.
        </p>
      </div>
    );
  }

  return <VisitorsContent />;
}
