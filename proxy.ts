import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/constants/routes";

const ACCESS_TOKEN_COOKIE = "accessToken";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const isProtectedRoute = pathname.startsWith(ROUTES.DASHBOARD);
  const isLoginRoute = pathname.startsWith(ROUTES.LOGIN);

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  if (isLoginRoute && token) {
    return NextResponse.redirect(
      new URL(ROUTES.DASHBOARD_OVERVIEW, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
