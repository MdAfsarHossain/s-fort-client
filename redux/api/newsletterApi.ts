import { baseApi } from "@/redux/api/baseApi";
import type {
  ApiEnvelope,
  PaginatedResult,
  PaginationParams,
} from "@/redux/api/types";

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  is_suspicious: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriberUpdateInput = Partial<
  Pick<Subscriber, "is_active" | "is_suspicious">
>;

export interface SubscriberListParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
  is_suspicious?: boolean;
}

export const newsletterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscribers: builder.query<
      PaginatedResult<Subscriber>,
      SubscriberListParams
    >({
      query: ({ page, limit, search, is_active, is_suspicious }) => ({
        url: "/newsletters",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(is_active !== undefined ? { is_active } : {}),
          ...(is_suspicious !== undefined ? { is_suspicious } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<Subscriber[]>) => ({
        items: response.data,
        meta: response.meta!,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Newsletter" as const,
                id,
              })),
              { type: "Newsletter" as const, id: "LIST" },
            ]
          : [{ type: "Newsletter" as const, id: "LIST" }],
    }),
    updateSubscriber: builder.mutation<
      Subscriber,
      { id: string; body: SubscriberUpdateInput }
    >({
      query: ({ id, body }) => ({
        url: `/newsletters/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<Subscriber>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Newsletter", id },
        { type: "Newsletter", id: "LIST" },
      ],
    }),
    deleteSubscriber: builder.mutation<void, string>({
      query: (id) => ({
        url: `/newsletters/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Newsletter", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
  }),
});

export const {
  useGetSubscribersQuery,
  useUpdateSubscriberMutation,
  useDeleteSubscriberMutation,
} = newsletterApi;
