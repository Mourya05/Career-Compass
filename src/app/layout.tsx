
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Career Compass',
  description: 'Navigate Your Career Path with AI-Powered Insights',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* This now correctly uses the .variable property from the imported GeistSans and GeistMono objects */}
      <body 
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans`}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
