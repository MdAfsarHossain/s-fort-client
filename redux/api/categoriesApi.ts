import { baseApi } from "@/redux/api/baseApi";
import type {
  ApiEnvelope,
  PaginatedResult,
  PaginationParams,
} from "@/redux/api/types";

export interface Category {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListParams extends PaginationParams {
  search?: string;
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<PaginatedResult<Category>, CategoryListParams>({
      query: ({ page, limit, search }) => ({
        url: "/categories",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<Category[]>) => ({
        items: response.data,
        meta: response.meta!,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Category" as const,
                id,
              })),
              { type: "Category" as const, id: "LIST" },
            ]
          : [{ type: "Category" as const, id: "LIST" }],
    }),
    createCategory: builder.mutation<Category, { name: string }>({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<Category>) => response.data,
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    updateCategory: builder.mutation<Category, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body: { name },
      }),
      transformResponse: (response: ApiEnvelope<Category>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
