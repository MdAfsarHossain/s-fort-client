import type { ErrorResponse } from "@/redux/api/types";

// RTK Query's `.unwrap()` rejects with the raw FetchBaseQueryError, whose
// `data` is whatever JSON body the backend sent (see ErrorResponse). Surface
// that message when present — e.g. "Your account has been disposed." is far
// more useful than a generic fallback — and only fall back for cases with no
// parseable body (network failure, CORS, etc).
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return fallback;
  }

  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) {
    return fallback;
  }

  const message = (data as Partial<ErrorResponse>).message;
  return typeof message === "string" && message.trim() ? message : fallback;
}
