"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ActivityIcon,
  Loader2Icon,
  MinusIcon,
  MousePointerClickIcon,
  Plug2Icon,
  RefreshCwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/lib/use-document-title";
import { cn } from "@/lib/utils";
import {
  useSyncGscNowMutation,
  useGetGscMetricsQuery,
  type GscDailyMetric,
  type GscIndexCoverage,
  type GscIndexedPage,
  type GscKeyword,
  type GscQueryTrend,
  type PositionBracket,
} from "@/redux/api/searchConsoleApi";
import { useGetTrafficSummaryQuery } from "@/redux/api/trafficApi";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "28", label: "Last 28 days" },
  { value: "90", label: "Last 90 days" },
];

const BRACKET_LABELS: Record<PositionBracket, string> = {
  "1-3": "Position 1-3",
  "4-10": "Position 4-10",
  "11-20": "Position 11-20",
  "21+": "Position 21+",
};

const BRACKET_COLORS: Record<PositionBracket, string> = {
  "1-3": "#10b981",
  "4-10": "#f59e0b",
  "11-20": "#f97316",
  "21+": "#ef4444",
};

const BRACKET_BADGE_CLASSES: Record<PositionBracket, string> = {
  "1-3": "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  "4-10": "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  "11-20": "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400",
  "21+": "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
};

function bracketForPosition(position: number): PositionBracket {
  if (position <= 3) return "1-3";
  if (position <= 10) return "4-10";
  if (position <= 20) return "11-20";
  return "21+";
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPosition(value: number) {
  return value.toFixed(1);
}

function formatSignedPercent(value: number) {
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const STAT_CARDS = [
  {
    key: "clicks" as const,
    label: "Clicks",
    icon: MousePointerClickIcon,
    format: formatCompact,
    iconClasses: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  {
    key: "impressions" as const,
    label: "Impressions",
    icon: TrendingUpIcon,
    format: formatCompact,
    iconClasses:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
  {
    key: "ctr" as const,
    label: "Average CTR",
    icon: TrendingUpIcon,
    format: formatPercent,
    iconClasses:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  {
    key: "position" as const,
    label: "Average position",
    icon: TrendingUpIcon,
    format: formatPosition,
    iconClasses:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
];

function DailyChartTooltip({
  active,
  payload,
  label,
  valueLabel,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueLabel: string;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{formatDateShort(label)}</div>
      <div className="text-muted-foreground">
        {valueLabel}:{" "}
        <span className="font-medium text-foreground">
          {formatValue(payload[0].value)}
        </span>
      </div>
    </div>
  );
}

function TrendChart({
  data,
  dataKey,
  valueLabel,
  formatValue,
}: {
  data: GscDailyMetric[];
  dataKey: "clicks" | "impressions" | "ctr" | "position";
  valueLabel: string;
  formatValue: (value: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-55 items-center justify-center text-sm text-muted-foreground">
        No data yet — sync to fetch results.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="0"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatValue(value)}
          width={44}
        />
        <Tooltip
          content={
            <DailyChartTooltip valueLabel={valueLabel} formatValue={formatValue} />
          }
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="var(--primary)"
          strokeWidth={2}
          fill="var(--primary)"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MomentumRow({
  label,
  thisWeek,
  lastWeek,
  delta,
  format,
  lowerIsBetter = false,
}: {
  label: string;
  thisWeek: number;
  lastWeek: number;
  delta: number;
  format: (value: number) => string;
  lowerIsBetter?: boolean;
}) {
  const isFlat = Math.abs(delta) < 0.005;
  const isGrowth = lowerIsBetter ? delta < 0 : delta > 0;
  const Icon = isFlat ? MinusIcon : isGrowth ? TrendingUpIcon : TrendingDownIcon;
  const colorClass = isFlat
    ? "text-muted-foreground"
    : isGrowth
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="flex items-center justify-between border-b py-2.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">
          {format(lastWeek)} → <span className="font-medium text-foreground">{format(thisWeek)}</span>
        </span>
        <span className={cn("flex items-center gap-1 text-xs font-medium", colorClass)}>
          <Icon className="size-3.5" />
          {formatSignedPercent(delta)}
        </span>
      </div>
    </div>
  );
}

function RankingDistributionChart({
  data,
}: {
  data: Array<{ bracket: PositionBracket; count: number }>;
}) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-55 items-center justify-center text-sm text-muted-foreground">
        No keyword data yet — sync to fetch results.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data.map((row) => ({ ...row, label: BRACKET_LABELS[row.bracket] }))}
        margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as { label: string; count: number };
            return (
              <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
                <div className="font-medium">{row.label}</div>
                <div className="text-muted-foreground">
                  {row.count} keyword{row.count === 1 ? "" : "s"}
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((row) => (
            <Cell key={row.bracket} fill={BRACKET_COLORS[row.bracket]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function PositionMapChart({ keywords }: { keywords: GscKeyword[] }) {
  const points = [...keywords]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 100);

  if (points.length === 0) {
    return (
      <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
        No keyword data yet — sync to fetch results.
      </div>
    );
  }

  const byBracket = (["1-3", "4-10", "11-20", "21+"] as PositionBracket[]).map(
    (bracket) => ({
      bracket,
      points: points.filter((point) => point.bracket === bracket),
    })
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="var(--border)" />
        <XAxis
          type="number"
          dataKey="position"
          name="Position"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Position",
            position: "insideBottom",
            offset: -2,
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="impressions"
          name="Impressions"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatCompact(value)}
          width={44}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as GscKeyword;
            return (
              <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
                <div className="max-w-48 truncate font-medium">{point.query}</div>
                <div className="text-muted-foreground">
                  Position {formatPosition(point.position)} ·{" "}
                  {formatCompact(point.impressions)} impressions
                </div>
              </div>
            );
          }}
        />
        {byBracket.map(({ bracket, points: bracketPoints }) => (
          <Scatter
            key={bracket}
            name={BRACKET_LABELS[bracket]}
            data={bracketPoints}
            fill={BRACKET_COLORS[bracket]}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function OpportunityMatrixChart({
  data,
}: {
  data: Array<{
    query: string;
    position: number;
    impressions: number;
    potentialClicks: number;
  }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
        No page-1-edge opportunities right now.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="var(--border)" />
        <XAxis
          type="number"
          dataKey="position"
          name="Position"
          domain={[3, 16]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Position",
            position: "insideBottom",
            offset: -2,
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="impressions"
          name="Impressions"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatCompact(value)}
          width={44}
        />
        <ZAxis
          type="number"
          dataKey="potentialClicks"
          range={[64, 900]}
          name="Potential clicks"
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as {
              query: string;
              position: number;
              impressions: number;
              potentialClicks: number;
            };
            return (
              <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
                <div className="max-w-48 truncate font-medium">{point.query}</div>
                <div className="text-muted-foreground">
                  Position {formatPosition(point.position)} ·{" "}
                  {formatCompact(point.impressions)} impressions
                </div>
                <div className="text-muted-foreground">
                  ~{formatCompact(point.potentialClicks)} potential extra clicks
                </div>
              </div>
            );
          }}
        />
        <Scatter data={data} fill="var(--primary)" fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function TrafficChart({
  data,
}: {
  data: Array<{ date: string; sessions: number; visitors: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-55 items-center justify-center text-sm text-muted-foreground">
        No traffic recorded yet — embed the tracker script to start collecting data.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length || !label) return null;
            return (
              <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
                <div className="font-medium">{formatDateShort(String(label))}</div>
                {payload.map((entry) => (
                  <div key={entry.dataKey as string} className="text-muted-foreground">
                    {entry.name}:{" "}
                    <span className="font-medium text-foreground">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Legend
          iconType="plainline"
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
        />
        <Line
          type="monotone"
          dataKey="sessions"
          name="Sessions"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="visitors"
          name="Visitors"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function QueryTrendTable({
  rows,
  direction,
}: {
  rows: GscQueryTrend[];
  direction: "up" | "down";
}) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No {direction === "up" ? "rising" : "declining"} queries this week.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Query</TableHead>
            <TableHead className="text-right">Last week</TableHead>
            <TableHead className="text-right">This week</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.query}>
              <TableCell className="max-w-56 truncate">{row.query}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCompact(row.clicksLastWeek)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatCompact(row.clicksThisWeek)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums font-medium",
                  direction === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {direction === "up" ? "+" : ""}
                {formatCompact(row.delta)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function IndexCoverageBar({ coverage }: { coverage: GscIndexCoverage }) {
  const total = coverage.indexed + coverage.notIndexed;

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No sitemap coverage data yet — sync to fetch results.
      </p>
    );
  }

  const indexedPct = (coverage.indexed / total) * 100;

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-emerald-500"
        style={{ width: `${indexedPct}%` }}
      />
      <div
        className="h-full bg-red-500"
        style={{ width: `${100 - indexedPct}%` }}
      />
    </div>
  );
}

function IndexedPagesTable({ rows }: { rows: GscIndexedPage[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No pages in this sample.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.url}>
              <TableCell className="max-w-80 truncate">{row.url}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.coverageState}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SearchPerformancePage() {
  useDocumentTitle("Search Performance");
  const [days, setDays] = useState("28");

  // The backend now syncs Search Console data on its own every 5 minutes
  // (a cron job, with no connection to this page) — polling is what makes
  // that show up here without a manual refresh, since nothing server-side
  // can push to the client on its own.
  const { data: metrics, isLoading } = useGetGscMetricsQuery(
    { days: Number(days) },
    { pollingInterval: 60_000 }
  );
  const [syncNow, { isLoading: isSyncing }] = useSyncGscNowMutation();
  const { data: traffic, isLoading: isTrafficLoading } =
    useGetTrafficSummaryQuery({ days: 7 }, { pollingInterval: 60_000 });

  async function handleSync() {
    try {
      await syncNow({ days: Number(days) }).unwrap();
      toast.success("Search Console data synced");
    } catch {
      toast.error("Failed to sync Search Console data");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <Plug2Icon className="size-10 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">
          Search Console not connected
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Connect Google Search Console and select a property to see search
          performance data here.
        </p>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.DASHBOARD_CONNECTIONS} />}
        >
          Go to Connections
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            Search Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Search performance for {metrics.siteUrl}.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            disabled={isSyncing}
            onClick={handleSync}
          >
            {isSyncing ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <RefreshCwIcon />
            )}
            Sync now
          </Button>
        </div>
      </div>

      {metrics.lastSyncedAt && (
        <p className="text-xs text-muted-foreground">
          Last synced {new Date(metrics.lastSyncedAt).toLocaleString()}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {card.label}
              </span>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  card.iconClasses
                )}
              >
                <card.icon className="size-4.5" />
              </span>
            </div>
            <span className="font-heading text-3xl font-semibold">
              {card.format(metrics.summary[card.key])}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm font-medium">Clicks over time</span>
            <TrendChart
              data={metrics.daily}
              dataKey="clicks"
              valueLabel="Clicks"
              formatValue={formatCompact}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm font-medium">Impressions over time</span>
            <TrendChart
              data={metrics.daily}
              dataKey="impressions"
              valueLabel="Impressions"
              formatValue={formatCompact}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm font-medium">CTR over time</span>
            <TrendChart
              data={metrics.daily}
              dataKey="ctr"
              valueLabel="CTR"
              formatValue={formatPercent}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm font-medium">Position over time</span>
            <TrendChart
              data={metrics.daily}
              dataKey="position"
              valueLabel="Position"
              formatValue={formatPosition}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CTR health</span>
              <Badge
                className={
                  metrics.ctrHealth.status === "above"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : metrics.ctrHealth.status === "below"
                      ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400"
                      : "bg-muted text-muted-foreground"
                }
              >
                {metrics.ctrHealth.status === "above"
                  ? "Outperforming"
                  : metrics.ctrHealth.status === "below"
                    ? "Underperforming"
                    : "On par"}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Actual CTR</div>
                <div className="font-heading text-2xl font-semibold">
                  {formatPercent(metrics.ctrHealth.actualCtr)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Expected CTR</div>
                <div className="font-heading text-2xl font-semibold text-muted-foreground">
                  {formatPercent(metrics.ctrHealth.expectedCtr)}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Expected CTR is an estimate based on industry-average
              click-through rates for your average position (
              {formatPosition(metrics.summary.position)}) — not official
              Google data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm font-medium">Weekly momentum</span>
            <p className="mb-1 text-xs text-muted-foreground">
              This week vs last week.
            </p>
            <MomentumRow
              label="Clicks"
              thisWeek={metrics.momentum.thisWeek.clicks}
              lastWeek={metrics.momentum.lastWeek.clicks}
              delta={metrics.momentum.deltas.clicks}
              format={formatCompact}
            />
            <MomentumRow
              label="Impressions"
              thisWeek={metrics.momentum.thisWeek.impressions}
              lastWeek={metrics.momentum.lastWeek.impressions}
              delta={metrics.momentum.deltas.impressions}
              format={formatCompact}
            />
            <MomentumRow
              label="CTR"
              thisWeek={metrics.momentum.thisWeek.ctr}
              lastWeek={metrics.momentum.lastWeek.ctr}
              delta={metrics.momentum.deltas.ctr}
              format={formatPercent}
            />
            <MomentumRow
              label="Position"
              thisWeek={metrics.momentum.thisWeek.position}
              lastWeek={metrics.momentum.lastWeek.position}
              delta={metrics.momentum.deltas.position}
              format={formatPosition}
              lowerIsBetter
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="text-sm font-medium">Page indexing</span>
          <p className="text-xs text-muted-foreground">
            Submitted is your full sitemap count. Indexed / Not indexed
            reflect a sample of up to 15 sitemap URLs individually
            inspected — not necessarily your full site.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Submitted</div>
              <div className="font-heading text-2xl font-semibold">
                {formatCompact(metrics.indexCoverage.submitted)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Indexed</div>
              <div className="font-heading text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCompact(metrics.indexCoverage.indexed)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Not indexed</div>
              <div className="font-heading text-2xl font-semibold text-red-600 dark:text-red-400">
                {formatCompact(metrics.indexCoverage.notIndexed)}
              </div>
            </div>
          </div>
          <IndexCoverageBar coverage={metrics.indexCoverage} />
          <Tabs defaultValue="indexed">
            <TabsList>
              <TabsTrigger value="indexed">
                Indexed ({metrics.indexedPages.indexed.length})
              </TabsTrigger>
              <TabsTrigger value="not-indexed">
                Not indexed ({metrics.indexedPages.notIndexed.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="indexed">
              <IndexedPagesTable rows={metrics.indexedPages.indexed} />
            </TabsContent>
            <TabsContent value="not-indexed">
              <IndexedPagesTable rows={metrics.indexedPages.notIndexed} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm font-medium">Ranking distribution</span>
            <p className="text-xs text-muted-foreground">
              How your keywords spread across position brackets.
            </p>
            <RankingDistributionChart data={metrics.positionBuckets} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm font-medium">Keyword position map</span>
            <p className="text-xs text-muted-foreground">
              Top keywords by impressions — color shows ranking quality.
            </p>
            <PositionMapChart keywords={metrics.keywordMap} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="text-sm font-medium">Opportunity matrix</span>
          <p className="text-xs text-muted-foreground">
            Page-1-edge keywords (positions 4-15) with impressions left on
            the table — bubble size is estimated extra clicks if you reached
            position 3.
          </p>
          <OpportunityMatrixChart data={metrics.opportunities} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="text-sm font-medium">💸 Missed clicks</span>
          <p className="text-xs text-muted-foreground">
            Keywords leaving the most traffic on the table — fix these first.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Missed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.missedClicks.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No missed-click opportunities right now.
                    </TableCell>
                  </TableRow>
                )}
                {metrics.missedClicks.map((row) => (
                  <TableRow key={row.query}>
                    <TableCell className="max-w-56 truncate">
                      {row.query}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={cn(
                          "tabular-nums",
                          BRACKET_BADGE_CLASSES[bracketForPosition(row.position)]
                        )}
                      >
                        {formatPosition(row.position)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCompact(row.impressions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCompact(row.clicks)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCompact(row.expectedClicks)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-red-600 dark:text-red-400">
                      -{formatCompact(row.missed)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium">Queries leading to my site</span>
            <Tabs defaultValue="top">
              <TabsList>
                <TabsTrigger value="top">Top</TabsTrigger>
                <TabsTrigger value="up">Trending up</TabsTrigger>
                <TabsTrigger value="down">Trending down</TabsTrigger>
              </TabsList>
              <TabsContent value="top">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.topQueries.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-6 text-center text-muted-foreground"
                          >
                            No query data yet.
                          </TableCell>
                        </TableRow>
                      )}
                      {metrics.topQueries.map((row) => (
                        <TableRow key={row.query}>
                          <TableCell className="max-w-56 truncate">
                            {row.query}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCompact(row.clicks)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCompact(row.impressions)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPercent(row.ctr)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPosition(row.position)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="up">
                <QueryTrendTable rows={metrics.queryTrends.trendingUp} direction="up" />
              </TabsContent>
              <TabsContent value="down">
                <QueryTrendTable rows={metrics.queryTrends.trendingDown} direction="down" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium">Top pages</span>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topPages.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No page data yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {metrics.topPages.map((row) => (
                    <TableRow key={row.page}>
                      <TableCell className="max-w-56 truncate">
                        {row.page}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.impressions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(row.ctr)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium">Countries</span>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topCountries.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No country data yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {metrics.topCountries.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell className="max-w-40 truncate">
                        {row.country}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.impressions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(row.ctr)}
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
            <span className="text-sm font-medium">Devices</span>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topDevices.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No device data yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {metrics.topDevices.map((row) => (
                    <TableRow key={row.device}>
                      <TableCell>{row.device}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.impressions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(row.ctr)}
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
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Daily owned traffic</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Visits injected from Tryneth scripts, natively mapped over 7 days.
          </p>
          {isTrafficLoading ? (
            <Skeleton className="h-55 w-full" />
          ) : (
            <TrafficChart data={traffic ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
