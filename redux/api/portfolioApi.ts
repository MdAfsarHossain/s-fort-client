import { baseApi } from "@/redux/api/baseApi";
import type {
  ApiEnvelope,
  PaginatedResult,
  PaginationParams,
} from "@/redux/api/types";

export type PortfolioStatus = "DRAFT" | "PUBLISHED";
export type PortfolioVisibility = "PUBLIC" | "PRIVATE";
export type PortfolioType = "PORTFOLIO" | "CASE_STUDY";

export interface PortfolioAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

// Field names mirror the backend's DB columns (snake_case) exactly, since the
// API passes rows through largely as-is rather than transforming casing.
export interface Portfolio {
  id: string;
  title: string;
  description: string;
  type: PortfolioType;
  client: string | null;
  industry: string | null;
  duration: string | null;
  technologies: string[];
  featured_image: string[] | null;
  author: PortfolioAuthor;
  content: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  visibility: PortfolioVisibility;
  status: PortfolioStatus;
  view_count: number;
  like_count: number;
}

// The writable JSON fields, sent as a stringified "bodyData" form field.
// author is server-derived; featured_image is uploaded separately as files.
export interface PortfolioFormFields {
  title: string;
  description: string;
  type: PortfolioType;
  client: string;
  industry: string;
  duration: string;
  technologies: string[];
  content: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  visibility: PortfolioVisibility;
  status: PortfolioStatus;
}

interface PortfolioMutationArgs {
  // urlsToSave is update-only: the subset of existing featured_image URLs to
  // keep. Anything not listed is dropped; new uploads are appended via `images`.
  fields: Partial<PortfolioFormFields> & { urlsToSave?: string[] };
  images?: File[];
}

function toPortfolioFormData({ fields, images }: PortfolioMutationArgs) {
  const formData = new FormData();
  formData.append("bodyData", JSON.stringify(fields));
  images?.forEach((file) => formData.append("featured_image", file));
  return formData;
}

export interface PortfolioListParams extends PaginationParams {
  search?: string;
  status?: PortfolioStatus;
  visibility?: PortfolioVisibility;
  type?: PortfolioType;
}

export const portfolioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPortfolios: builder.query<
      PaginatedResult<Portfolio>,
      PortfolioListParams
    >({
      query: ({ page, limit, search, status, visibility, type }) => ({
        url: "/portfolio",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(visibility ? { visibility } : {}),
          ...(type ? { type } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<Portfolio[]>) => ({
        items: response.data,
        meta: response.meta!,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Portfolio" as const,
                id,
              })),
              { type: "Portfolio" as const, id: "LIST" },
            ]
          : [{ type: "Portfolio" as const, id: "LIST" }],
    }),
    getPortfolio: builder.query<Portfolio, string>({
      query: (id) => `/portfolio/${id}`,
      transformResponse: (response: ApiEnvelope<Portfolio>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Portfolio", id }],
    }),
    createPortfolio: builder.mutation<Portfolio, PortfolioMutationArgs>({
      query: (args) => ({
        url: "/portfolio",
        method: "POST",
        body: toPortfolioFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Portfolio>) => response.data,
      invalidatesTags: [
        { type: "Portfolio", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    updatePortfolio: builder.mutation<
      Portfolio,
      PortfolioMutationArgs & { id: string }
    >({
      query: ({ id, ...args }) => ({
        url: `/portfolio/${id}`,
        method: "PATCH",
        body: toPortfolioFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Portfolio>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Portfolio", id },
        { type: "Portfolio", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    deletePortfolio: builder.mutation<void, string>({
      query: (id) => ({
        url: `/portfolio/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Portfolio", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    // For images embedded in rich content — distinct from the portfolio
    // item's own `featured_image` uploads (sent inline with create/update).
    // Returns the uploaded image's public URL directly.
    uploadPortfolioImage: builder.mutation<string, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: "/portfolio/upload-image",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: ApiEnvelope<string>) => response.data,
    }),
  }),
});

export const {
  useGetPortfoliosQuery,
  useGetPortfolioQuery,
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  useDeletePortfolioMutation,
  useUploadPortfolioImageMutation,
} = portfolioApi;
