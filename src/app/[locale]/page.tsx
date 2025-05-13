// src/app/[locale]/page.tsx
import HomePageClient from '@/components/HomePageClient';
import type { Locale } from '@/types';
import { unstable_setRequestLocale, getMessages } from 'next-intl/server';
import { locales } from '@/i18n-config';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Messages are now provided by the Layout, so no need to fetch them here if HomePageClient relies on context.
// However, if HomePageClient needs messages directly, pass them.
// For this setup, LocaleLayout provides NextIntlClientProvider with messages.
// HomePageClient can use useTranslations() directly if it's a client component,
// or we pass messages if it needs to initialize another provider (less common for direct children).
export default async function LocalePage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale); // Important for static rendering with dynamic locale segments
  
  // Messages are fetched in LocaleLayout and provided via NextIntlClientProvider.
  // HomePageClient will consume this context.
  // If HomePageClient itself were to instantiate a new NextIntlClientProvider (e.g. for testing/isolation),
  // then you'd fetch and pass messages here.
  // const messages = await getMessages(); // Not strictly needed if relying on layout's provider

  return <HomePageClient locale={locale as Locale} /* messages={messages} */ />;
}
