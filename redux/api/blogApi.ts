import { baseApi } from "@/redux/api/baseApi";
import type {
  ApiEnvelope,
  PaginatedResult,
  PaginationParams,
} from "@/redux/api/types";

export type BlogStatus = "DRAFT" | "PUBLISHED";
export type BlogVisibility = "PUBLIC" | "PRIVATE";

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

// Field names mirror the backend's DB columns (snake_case) exactly, since the
// API passes rows through largely as-is rather than transforming casing.
export interface Blog {
  id: string;
  title: string;
  slug: string;
  category: string[];
  excerpt: string;
  featured_image: string[] | null;
  is_featured: boolean;
  author: BlogAuthor;
  content: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  visibility: BlogVisibility;
  status: BlogStatus;
  view_count: number;
  like_count: number;
}

// The writable JSON fields, sent as a stringified "bodyData" form field.
// slug/author are server-derived; featured_image is uploaded separately as files.
export interface BlogFormFields {
  title: string;
  slug: string;
  category: string[];
  excerpt: string;
  is_featured: boolean;
  content: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  visibility: BlogVisibility;
  status: BlogStatus;
}

interface BlogMutationArgs {
  // urlsToSave is update-only: the subset of existing featured_image URLs to
  // keep. Anything not listed is dropped; new uploads are appended via `images`.
  fields: Partial<BlogFormFields> & { urlsToSave?: string[] };
  images?: File[];
}

function toBlogFormData({ fields, images }: BlogMutationArgs) {
  const formData = new FormData();
  formData.append("bodyData", JSON.stringify(fields));
  images?.forEach((file) => formData.append("featured_image", file));
  return formData;
}

export interface BlogListParams extends PaginationParams {
  search?: string;
  status?: BlogStatus;
  visibility?: BlogVisibility;
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBlogs: builder.query<PaginatedResult<Blog>, BlogListParams>({
      query: ({ page, limit, search, status, visibility }) => ({
        url: "/blogs",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(visibility ? { visibility } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<Blog[]>) => ({
        items: response.data,
        meta: response.meta!,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Blog" as const, id })),
              { type: "Blog" as const, id: "LIST" },
            ]
          : [{ type: "Blog" as const, id: "LIST" }],
    }),
    getBlog: builder.query<Blog, string>({
      query: (id) => `/blogs/${id}`,
      transformResponse: (response: ApiEnvelope<Blog>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Blog", id }],
    }),
    createBlog: builder.mutation<Blog, BlogMutationArgs>({
      query: (args) => ({
        url: "/blogs",
        method: "POST",
        body: toBlogFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Blog>) => response.data,
      invalidatesTags: [
        { type: "Blog", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    updateBlog: builder.mutation<Blog, BlogMutationArgs & { id: string }>({
      query: ({ id, ...args }) => ({
        url: `/blogs/${id}`,
        method: "PATCH",
        body: toBlogFormData(args),
      }),
      transformResponse: (response: ApiEnvelope<Blog>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Blog", id },
        { type: "Blog", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    deleteBlog: builder.mutation<void, string>({
      query: (id) => ({
        url: `/blogs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Blog", id: "LIST" },
        { type: "Stats", id: "OVERVIEW" },
      ],
    }),
    // For images embedded in Drag/Drop content blocks — distinct from the
    // blog's own `featured_image` uploads (sent inline with create/update).
    // Returns the uploaded image's public URL directly.
    uploadBlogImage: builder.mutation<string, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: "/blogs/upload-image",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: ApiEnvelope<string>) => response.data,
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
  useUploadBlogImageMutation,
} = blogApi;
