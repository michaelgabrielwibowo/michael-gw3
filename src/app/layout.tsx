
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LinkSage - Curated & AI-Suggested Links',
  description: 'Discover, manage, and export useful links with AI-powered suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The 'dark' class will be dynamically added/removed here by the ThemeToggle component
    // The initial class can be set to avoid FOUC if known server-side, or handled client-side.
    // For this setup, ThemeToggle handles it client-side.
    <html lang="en" className="h-full"> 
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background text-foreground transition-colors duration-300`}>
        {children}
      </body>
    </html>
  );
}
