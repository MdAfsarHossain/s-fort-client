import { baseApi } from "@/redux/api/baseApi";
import type { ApiEnvelope } from "@/redux/api/types";

export type SocialPlatform = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN";

export interface SocialConnection {
  id: string;
  platform: SocialPlatform;
  user_id: string;
  external_account_id: string | null;
  external_account_name: string | null;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export type SocialConnections = Record<SocialPlatform, SocialConnection | null>;

export interface SocialTarget {
  id: string;
  name: string;
  type: string;
}

export interface SocialPost {
  id: string;
  blog_id: string;
  platform: SocialPlatform;
  message: string;
  status: "PENDING" | "PUBLISHED" | "FAILED";
  external_post_id: string | null;
  external_post_url: string | null;
  error_message: string | null;
  createdAt: string;
}

export const socialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSocialConnections: builder.query<SocialConnections, void>({
      query: () => "/social/connections",
      transformResponse: (response: ApiEnvelope<SocialConnections>) =>
        response.data,
      providesTags: [{ type: "SocialConnection", id: "LIST" }],
    }),
    getSocialConnectUrl: builder.query<
      { url: string },
      { platform: "FACEBOOK" | "LINKEDIN" }
    >({
      query: ({ platform }) =>
        `/social/${platform.toLowerCase()}/connect-url`,
      transformResponse: (response: ApiEnvelope<{ url: string }>) =>
        response.data,
    }),
    connectInstagram: builder.mutation<SocialConnection, void>({
      query: () => ({
        url: "/social/instagram/connect",
        method: "POST",
      }),
      invalidatesTags: [{ type: "SocialConnection", id: "LIST" }],
    }),
    getSocialTargets: builder.query<
      SocialTarget[],
      { platform: SocialPlatform }
    >({
      query: ({ platform }) => `/social/${platform.toLowerCase()}/targets`,
      transformResponse: (response: ApiEnvelope<SocialTarget[]>) =>
        response.data,
    }),
    selectSocialTarget: builder.mutation<
      SocialConnection,
      { platform: SocialPlatform; targetId: string }
    >({
      query: ({ platform, targetId }) => ({
        url: `/social/${platform.toLowerCase()}/select-target`,
        method: "POST",
        body: { targetId },
      }),
      invalidatesTags: [{ type: "SocialConnection", id: "LIST" }],
    }),
    disconnectSocial: builder.mutation<void, { platform: SocialPlatform }>({
      query: ({ platform }) => ({
        url: `/social/${platform.toLowerCase()}/disconnect`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "SocialConnection", id: "LIST" }],
    }),
    publishToSocial: builder.mutation<
      SocialPost[],
      { blogId: string; platforms: SocialPlatform[]; message: string }
    >({
      query: (body) => ({
        url: "/social/publish",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<SocialPost[]>) =>
        response.data,
      invalidatesTags: (_result, _error, { blogId }) => [
        { type: "SocialPost", id: blogId },
      ],
    }),
    getSocialPosts: builder.query<SocialPost[], { blogId: string }>({
      query: ({ blogId }) => ({
        url: "/social/posts",
        params: { blogId },
      }),
      transformResponse: (response: ApiEnvelope<SocialPost[]>) =>
        response.data,
      providesTags: (_result, _error, { blogId }) => [
        { type: "SocialPost", id: blogId },
      ],
    }),
  }),
});

export const {
  useGetSocialConnectionsQuery,
  useLazyGetSocialConnectUrlQuery,
  useConnectInstagramMutation,
  useLazyGetSocialTargetsQuery,
  useSelectSocialTargetMutation,
  useDisconnectSocialMutation,
  usePublishToSocialMutation,
  useGetSocialPostsQuery,
} = socialApi;
