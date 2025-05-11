import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} LinkSage. All rights reserved.
      </footer>
      <Toaster />
    </div>
  );
}
