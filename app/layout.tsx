import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

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
        <div className="stars stars-sm"></div>
        <div className="stars stars-md"></div>
        <div className="stars stars-lg"></div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
