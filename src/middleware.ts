// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from './i18n-config'; // Relative path from src/middleware.ts to src/i18n-config.ts

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  // pathnames: {} // Add if you have localized pathnames
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(en|zh-TW)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    // Skip files, /api, /_next, /_vercel
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
