const ACCESS_TOKEN_COOKIE = "accessToken";
const ACCESS_TOKEN_MAX_AGE_DAYS = 7;
const REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_TOKEN_MAX_AGE_DAYS = 7;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function setCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === "undefined") return;

  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function setAccessToken(token: string) {
  setCookie(ACCESS_TOKEN_COOKIE, token, ACCESS_TOKEN_MAX_AGE_DAYS);
}

export function removeAccessToken() {
  removeCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE);
}

export function setRefreshToken(token: string) {
  setCookie(REFRESH_TOKEN_COOKIE, token, REFRESH_TOKEN_MAX_AGE_DAYS);
}

export function removeRefreshToken() {
  removeCookie(REFRESH_TOKEN_COOKIE);
}
