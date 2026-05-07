'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { SessionInitializer } from '@/features/auth/ui/auth/session-initializer';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
    >
      <SessionInitializer />
      {children}
    </ThemeProvider>
  );
}
