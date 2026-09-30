import { baseApi } from "@/redux/api/baseApi";
import type { ApiEnvelope } from "@/redux/api/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  status: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<LoginResponse>) =>
        response.data,
    }),
    getMyProfile: builder.query<AuthUser, void>({
      query: () => "/user/my-profile",
      transformResponse: (response: ApiEnvelope<AuthUser>) => response.data,
    }),
  }),
});

export const { useLoginMutation, useLazyGetMyProfileQuery } = authApi;
