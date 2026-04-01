'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { SessionInitializer } from '@/components/auth/session-initializer';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <SessionInitializer />
      {children}
    </ThemeProvider>
  );
}
