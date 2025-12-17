import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["es", "en", "fr"];
const defaultLocale = "es";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Exclude static files, api routes, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // files with extensions (images, etc)
  ) {
    return;
  }

  if (pathnameIsMissingLocale) {
    const locale = defaultLocale;

    // Redirect to the default locale
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, request.url)
    );
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/)
    // '/'
  ],
};
