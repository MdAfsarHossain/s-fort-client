import { baseApi } from "@/redux/api/baseApi";
import type { ApiEnvelope } from "@/redux/api/types";

export interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  totalMembers: number;
  // totalCategories: number;
  totalPortfolios: number;
  totalNewsletter: number;
}

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "/admin/stats",
      transformResponse: (response: ApiEnvelope<DashboardStats>) =>
        response.data,
      providesTags: [{ type: "Stats", id: "OVERVIEW" }],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = statsApi;
