import { baseApi } from "@/redux/api/baseApi";
import type { ApiEnvelope } from "@/redux/api/types";

export interface GscConnection {
  id: string;
  user_id: string;
  google_id: string;
  email: string;
  site_url: string | null;
  status: "ACTIVE" | "INACTIVE";
  last_synced_at: string | null;
  top_queries: GscQueryRow[];
  top_pages: GscPageRow[];
  createdAt: string;
  updatedAt: string;
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export const connectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGscConnectUrl: builder.query<{ url: string }, void>({
      query: () => "/auth/gsc/connect-url",
      transformResponse: (response: ApiEnvelope<{ url: string }>) =>
        response.data,
    }),
    getGscStatus: builder.query<GscConnection | null, void>({
      query: () => "/auth/gsc/status",
      transformResponse: (response: ApiEnvelope<GscConnection | null>) =>
        response.data,
      providesTags: [{ type: "GscConnection", id: "STATUS" }],
    }),
    disconnectGsc: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/gsc/disconnect",
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "GscConnection", id: "STATUS" },
        { type: "GscMetrics", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useLazyGetGscConnectUrlQuery,
  useGetGscStatusQuery,
  useDisconnectGscMutation,
} = connectionsApi;
