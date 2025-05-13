// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css'; 
import type { Locale } from '@/types';
import { AppLayout } from '@/components/AppLayout';
import { locales as appLocales } from '@/i18n-config'; // Use alias for clarity

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export async function generateStaticParams() {
  return appLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  // const messages = await getMessages(); // messages for metadata would require locale context
  // const pageTitle = (messages.Metadata as any)?.title || 'LinkSage'; // Example
  return {
    title: 'LinkSage - Curated & AI-Suggested Links', 
    description: 'Discover, manage, and export useful links with AI-powered suggestions.',
  };
}

export default async function LocaleLayout({
  children,
  params: { locale } 
}: LocaleLayoutProps) {
  
  const currentLocale = locale as Locale;

  if (!appLocales.includes(currentLocale)) {
    // This should ideally trigger a notFound from middleware or i18n.ts,
    // but as a safeguard in layout:
    console.warn(`[LocaleLayout] Invalid locale detected: ${locale}. Supported: ${appLocales.join(', ')}`);
    // Depending on behavior, you might redirect or render a custom error.
    // For now, relying on i18n.ts to handle notFound().
  }

  // Enable static rendering for this locale.
  // Must be called before any Server Components that use `useLocale` or `getMessages`.
  unstable_setRequestLocale(currentLocale);

  let messages;
  try {
    // getMessages() will use the locale set by unstable_setRequestLocale.
    messages = await getMessages();
  } catch (error) {
    console.error(`Failed to load messages for locale "${currentLocale}" in LocaleLayout. Error:`, error);
    // Provide empty messages as a fallback to prevent NextIntlClientProvider from crashing.
    // This indicates an issue with your messages/`i18n.ts` setup for this locale.
    messages = {}; 
  }

  return (
    <html lang={currentLocale} className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background text-foreground transition-colors duration-300`}>
        <NextIntlClientProvider locale={currentLocale} messages={messages}>
          <AppLayout>{children}</AppLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
