import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Bot, Home, Info } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MoatScore CI | Strategic SaaS Defensibility',
  description: 'AI-native CI for auditing product moats, trust signals, and monetization power using Gemini 3 Vision.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col uppercase-none`}>
        <header className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-brand-500/20 p-2 rounded-lg group-hover:bg-brand-500/30 transition-colors">
              <Bot className="w-6 h-6 text-brand-500" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">
              MoatScore CI
            </span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
              <Home className="w-4 h-4" /> Dashboard
            </Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors flex items-center gap-2">
              <Info className="w-4 h-4" /> How it Works
            </Link>
            <Link href="/demo?variant=strong" className="hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              Try Demo
            </Link>
          </nav>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-12">
          {children}
        </main>

        <footer className="border-t border-white/10 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by Next.js, Playwright, and Gemini 3 Vision.</p>
        </footer>
      </body>
    </html>
  );
}
