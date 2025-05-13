
import HomePageClient from '@/components/HomePageClient';
import { AppLayout } from '@/components/AppLayout';

// This is now the main page for the application root.
export default function RootPage() {
  return (
    <AppLayout>
      <HomePageClient />
    </AppLayout>
  );
}
