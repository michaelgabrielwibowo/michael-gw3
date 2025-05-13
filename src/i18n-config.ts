// src/i18n-config.ts
import type { Locale } from './types'; // Assumes types/index.ts is in src/types/

export const locales: Locale[] = ['en', 'zh-TW'];
export const defaultLocale: Locale = 'en';
export const localePrefix = 'as-needed'; // Strategy for prefixing locale in URL: 'as-needed', 'always', or 'never'

// Optional: Define localized pathnames if needed.
// export const pathnames = {
//   '/': '/',
//   '/about': {
//     en: '/about',
//     'zh-TW': '/guanyu-women' // Example for 'about' page in Traditional Chinese
//   }
//   // Add other pathnames here if you use localized routing beyond the locale prefix.
// };

// export type AppPathnames = keyof typeof pathnames;

// Ensure that the Locale type in src/types/index.ts includes all locales defined here.
// e.g., export type Locale = 'en' | 'zh-TW';
