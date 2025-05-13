// src/app/page.tsx
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n-config'; // Ensure this path is correct

// This page will redirect to the default locale.
// All content should be served under /[locale]/...
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
