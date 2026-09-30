import { baseApi } from "@/redux/api/baseApi";
import type { ApiEnvelope, PaginatedResult } from "@/redux/api/types";

export interface TrafficDailySummary {
  date: string;
  sessions: number;
  visitors: number;
}

export interface GeoBreakdownRow {
  country: string;
  countryCode: string | null;
  count: number;
}

export interface CityBreakdownRow {
  city: string;
  country: string | null;
  count: number;
  lat: number | null;
  lng: number | null;
}

export interface NamedCountRow {
  name: string;
  count: number;
}

export interface DeviceBreakdown {
  deviceTypes: NamedCountRow[];
  os: NamedCountRow[];
  browsers: NamedCountRow[];
}

export interface IspBreakdownRow {
  isp: string;
  count: number;
  proxyCount: number;
  hostingCount: number;
  mobileCount: number;
}

export interface ChannelCountRow {
  channel: string;
  count: number;
}

export interface CampaignCountRow {
  utmSource: string;
  utmCampaign: string | null;
  count: number;
}

export interface ChannelBreakdown {
  channels: ChannelCountRow[];
  campaigns: CampaignCountRow[];
}

export interface VisitorRow {
  id: string;
  ip: string | null;
  country: string | null;
  regionName: string | null;
  city: string | null;
  isp: string | null;
  os: string | null;
  browser: string | null;
  deviceType: string | null;
  channel: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  path: string | null;
  referrer: string | null;
  createdAt: string;
}

interface DaysParam {
  days?: number;
}

export const trafficApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTrafficSummary: builder.query<
      TrafficDailySummary[],
      { days?: number } | void
    >({
      query: (args) => ({
        url: "/traffic/summary",
        params: args?.days ? { days: args.days } : undefined,
      }),
      transformResponse: (response: ApiEnvelope<TrafficDailySummary[]>) =>
        response.data,
      providesTags: [{ type: "Traffic", id: "SUMMARY" }],
    }),
    getGeoBreakdown: builder.query<GeoBreakdownRow[], DaysParam | void>({
      query: (args) => ({
        url: "/traffic/geo-breakdown",
        params: args?.days ? { days: args.days } : undefined,
      }),
      transformResponse: (response: ApiEnvelope<GeoBreakdownRow[]>) =>
        response.data,
      providesTags: [{ type: "Traffic", id: "GEO" }],
    }),
    getCityBreakdown: builder.query<CityBreakdownRow[], DaysParam | void>({
      query: (args) => ({
        url: "/traffic/city-breakdown",
        params: args?.days ? { days: args.days } : undefined,
      }),
      transformResponse: (response: ApiEnvelope<CityBreakdownRow[]>) =>
        response.data,
      providesTags: [{ type: "Traffic", id: "CITY" }],
    }),
    getDeviceBreakdown: builder.query<DeviceBreakdown, DaysParam | void>({
      query: (args) => ({
        url: "/traffic/device-breakdown",
        params: args?.days ? { days: args.days } : undefined,
      }),
      transformResponse: (response: ApiEnvelope<DeviceBreakdown>) =>
        response.data,
      providesTags: [{ type: "Traffic", id: "DEVICE" }],
    }),
    getIspBreakdown: builder.query<IspBreakdownRow[], DaysParam | void>({
      query: (args) => ({
        url: "/traffic/isp-breakdown",
        params: args?.days ? { days: args.days } : undefined,
      }),
      transformResponse: (response: ApiEnvelope<IspBreakdownRow[]>) =>
        response.data,
      providesTags: [{ type: "Traffic", id: "ISP" }],
    }),
    getChannelBreakdown: builder.query<ChannelBreakdown, DaysParam | void>({
      query: (args) => ({
        url: "/traffic/channel-breakdown",
        params: args?.days ? { days: args.days } : undefined,
      }),
      transformResponse: (response: ApiEnvelope<ChannelBreakdown>) =>
        response.data,
      providesTags: [{ type: "Traffic", id: "CHANNEL" }],
    }),
    getVisitors: builder.query<
      PaginatedResult<VisitorRow>,
      { page?: number; limit?: number; days?: number } | void
    >({
      query: (args) => ({
        url: "/traffic/visitors",
        params: {
          ...(args?.page ? { page: args.page } : {}),
          ...(args?.limit ? { limit: args.limit } : {}),
          ...(args?.days ? { days: args.days } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<VisitorRow[]>) => ({
        items: response.data,
        meta: response.meta!,
      }),
      providesTags: [{ type: "Traffic", id: "VISITORS" }],
    }),
  }),
});

export const {
  useGetTrafficSummaryQuery,
  useGetGeoBreakdownQuery,
  useGetCityBreakdownQuery,
  useGetDeviceBreakdownQuery,
  useGetIspBreakdownQuery,
  useGetChannelBreakdownQuery,
  useGetVisitorsQuery,
} = trafficApi;
