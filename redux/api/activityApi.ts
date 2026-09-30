import { baseApi } from "@/redux/api/baseApi";
import type {
  ApiEnvelope,
  PaginatedResult,
  PaginationParams,
} from "@/redux/api/types";

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyActivity: builder.query<PaginatedResult<Activity>, PaginationParams>({
      query: ({ page, limit }) => ({
        url: "/activity",
        params: { page, limit },
      }),
      transformResponse: (response: ApiEnvelope<Activity[]>) => ({
        items: response.data,
        meta: response.meta!,
      }),
    }),
  }),
});

export const { useGetMyActivityQuery } = activityApi;
