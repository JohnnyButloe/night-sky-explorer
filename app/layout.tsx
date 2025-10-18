import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { DateTimeProvider } from '@/app/providers/date-time';
import { ReactQueryProvider } from '@/app/providers/react-query'; // client wrapper for QueryClientProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Night Sky Explorer',
  description: 'Explore the night sky and celestial objects',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} cosmic-bg`}>
        {/* React Query root (client) */}
        <ReactQueryProvider>
          {/* Existing app-level date/time context (client) */}
          <DateTimeProvider>
            {/* Your starfield layers */}
            <div className="stars stars-sm"></div>
            <div className="stars stars-md"></div>
            <div className="stars stars-lg"></div>

            {/* App content */}
            <div className="relative z-10">{children}</div>
          </DateTimeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
