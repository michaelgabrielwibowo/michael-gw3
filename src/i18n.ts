// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type {Locale} from './types'; 
// Import 'locales' specifically, as 'defaultLocale' is not used here but in middleware/root page.
import {locales as appLocales} from './i18n-config'; // Relative path from src/i18n.ts to src/i18n-config.ts

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid.
  const baseLocale = locale.split('-')[0] as Locale; 
  if (!appLocales.includes(baseLocale)) {
    console.error(`[i18n.ts] Locale not found: ${baseLocale}. Available locales: ${appLocales.join(', ')}. Calling notFound().`);
    notFound();
  }

  let messages;
  try {
    // Path is relative to src/i18n.ts, so ../messages means project_root/messages
    // Ensure your messages folder is at the project root if using this path.
    // If messages folder is in src, path should be `./messages/${baseLocale}.json`
    messages = (await import(`../messages/${baseLocale}.json`)).default;
    if (messages === undefined) { // Check if messages are loaded but undefined (e.g. empty JSON or incorrect default export)
        console.error(`[i18n.ts] Messages for locale ${baseLocale} are undefined after import from ../messages/${baseLocale}.json.`);
        notFound();
    }
  } catch (error) {
    console.error(`[i18n.ts] Could not load messages for locale: ${baseLocale} from ../messages/${baseLocale}.json. Error:`, error);
    notFound();
  }

  return {
    messages
  };
});
