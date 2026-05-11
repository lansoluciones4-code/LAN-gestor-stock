import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ArgenStock',
  description: 'Manage technology store stock effectively',
  icons: {
    icon: '/icon.svg',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='es'
      className={`${inter.variable} antialiased h-full`}
      suppressHydrationWarning
    >
      <body className='font-sans min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
