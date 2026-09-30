import { baseApi } from "@/redux/api/baseApi";
import type { ApiEnvelope } from "@/redux/api/types";
import type { GscPageRow, GscQueryRow } from "@/redux/api/connectionsApi";

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscDailyMetric {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscMetricsSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export type PositionBracket = "1-3" | "4-10" | "11-20" | "21+";

export interface GscKeyword {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  bracket: PositionBracket;
}

export interface GscCtrHealth {
  actualCtr: number;
  expectedCtr: number;
  delta: number;
  status: "above" | "on-par" | "below";
}

export interface GscPositionBucket {
  bracket: PositionBracket;
  count: number;
}

export interface GscOpportunity {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  potentialClicks: number;
}

export interface GscMissedClick {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  expectedClicks: number;
  missed: number;
}

export interface GscMomentumSnapshot {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscMomentum {
  thisWeek: GscMomentumSnapshot;
  lastWeek: GscMomentumSnapshot;
  deltas: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

export interface GscCountryRow {
  country: string;
  code: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscDeviceRow {
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryTrend {
  query: string;
  clicksThisWeek: number;
  clicksLastWeek: number;
  impressionsThisWeek: number;
  impressionsLastWeek: number;
  delta: number;
}

export interface GscQueryTrends {
  trendingUp: GscQueryTrend[];
  trendingDown: GscQueryTrend[];
}

export interface GscIndexCoverage {
  submitted: number;
  indexed: number;
  notIndexed: number;
}

export interface GscIndexedPage {
  url: string;
  status: "indexed" | "not_indexed";
  coverageState: string;
}

export interface GscIndexedPages {
  indexed: GscIndexedPage[];
  notIndexed: GscIndexedPage[];
}

export interface GscMetrics {
  siteUrl: string;
  lastSyncedAt: string | null;
  summary: GscMetricsSummary;
  daily: GscDailyMetric[];
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
  topCountries: GscCountryRow[];
  topDevices: GscDeviceRow[];
  queryTrends: GscQueryTrends;
  indexCoverage: GscIndexCoverage;
  indexedPages: GscIndexedPages;
  keywordMap: GscKeyword[];
  ctrHealth: GscCtrHealth;
  positionBuckets: GscPositionBucket[];
  opportunities: GscOpportunity[];
  missedClicks: GscMissedClick[];
  momentum: GscMomentum;
}

export const searchConsoleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGscSites: builder.query<GscSite[], void>({
      query: () => "/search-console/sites",
      transformResponse: (response: ApiEnvelope<GscSite[]>) => response.data,
    }),
    setGscActiveSite: builder.mutation<void, { siteUrl: string }>({
      query: (body) => ({
        url: "/search-console/active-site",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "GscConnection", id: "STATUS" },
        { type: "GscMetrics", id: "LIST" },
      ],
    }),
    syncGscNow: builder.mutation<void, { days?: number } | void>({
      query: (args) => ({
        url: "/search-console/sync",
        method: "POST",
        params: args?.days ? { days: args.days } : undefined,
      }),
      invalidatesTags: [
        { type: "GscConnection", id: "STATUS" },
        { type: "GscMetrics", id: "LIST" },
      ],
    }),
    getGscMetrics: builder.query<GscMetrics | null, { days?: number } | void>(
      {
        query: (args) => ({
          url: "/search-console/metrics",
          params: args?.days ? { days: args.days } : undefined,
        }),
        transformResponse: (response: ApiEnvelope<GscMetrics | null>) =>
          response.data,
        providesTags: [{ type: "GscMetrics", id: "LIST" }],
      }
    ),
  }),
});

export const {
  useLazyGetGscSitesQuery,
  useSetGscActiveSiteMutation,
  useSyncGscNowMutation,
  useGetGscMetricsQuery,
} = searchConsoleApi;
