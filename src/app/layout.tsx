
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/AppLayout'; // Import AppLayout here

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
// Removed geistMono if not explicitly used or defined elsewhere, ensure it is if needed.

export const metadata: Metadata = {
  title: 'Usefuls - Curated & AI-Suggested Links',
  description: 'Usefuls - Discover, manage, and export useful links with AI-powered suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} antialiased h-full bg-background text-foreground transition-colors duration-300`}>
        {/* AppLayout now wraps children directly here, or children are passed to a main page component which uses AppLayout */}
        {children}
      </body>
    </html>
  );
}
