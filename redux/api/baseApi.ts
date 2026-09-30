import {
  createApi,
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import {
  getAccessToken,
  getRefreshToken,
  removeAccessToken,
  removeRefreshToken,
  setAccessToken,
} from "@/lib/cookies";
import { setAccountBlocked } from "@/redux/features/accessSlice";
import type { ApiEnvelope, ErrorResponse } from "@/redux/api/types";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

function getRequestUrl(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

// Multiple requests can fail with an expired access token at the same time
// (a page firing several parallel queries) — share a single in-flight
// refresh attempt instead of hitting the refresh endpoint once per request.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(
  api: BaseQueryApi,
  extraOptions: object
): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;

      const result = await rawBaseQuery(
        {
          url: "/auth/generate-access-token",
          method: "POST",
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      const newAccessToken = (
        result.data as ApiEnvelope<{ accessToken: string }> | undefined
      )?.data.accessToken;
      if (!newAccessToken) return null;

      setAccessToken(newAccessToken);
      return newAccessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// The backend's auth middleware rejects every request from a blocked account
// (or a DISPOSE-role account) with a 403, regardless of which endpoint was
// called. Catch that centrally here instead of in each component, so any
// dashboard page immediately surfaces the "access removed" dialog.
//
// A 401 means the access token itself has expired — transparently refresh it
// via the refresh token and retry the original request once. If the refresh
// token has also expired, clear both tokens and force the user back to login.
const baseQueryWithAccessCheck: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = getRequestUrl(args);
  const isAuthEndpoint =
    url.includes("/auth/login") || url.includes("/auth/generate-access-token");

  if (result.error?.status === 401 && !isAuthEndpoint) {
    const newAccessToken = await refreshAccessToken(api, extraOptions);

    if (newAccessToken) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      removeAccessToken();
      removeRefreshToken();
      api.dispatch(
        setAccountBlocked("Your session has expired. Please log in again.")
      );
    }
  }

  if (result.error?.status === 403) {
    const data = result.error.data as ErrorResponse | undefined;
    api.dispatch(
      setAccountBlocked(data?.message ?? "Your access has been removed.")
    );
  }

  return result;
};

// This backend wraps every response in { success, statusCode, message, meta?, data }.
// Endpoints unwrap it themselves via transformResponse (see redux/api/types.ts's
// ApiEnvelope), since list endpoints need to keep `meta` for pagination while
// single-record endpoints only care about `data`.
export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithAccessCheck,
  tagTypes: [
    "Blog",
    "Newsletter",
    "Member",
    "Category",
    "Stats",
    "Portfolio",
    "Employee",
    "GscConnection",
    "GscMetrics",
    "Traffic",
    "SocialConnection",
    "SocialPost",
  ],
  endpoints: () => ({}),
});
