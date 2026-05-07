'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { logSessionRestoredAction } from '@/features/auth/actions/auth.actions';

export function SessionInitializer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const hasLoggedThisVisit = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasLoggedThisVisit.current) {
      const sessionKey = `logged-${user.id}`;
      const isAlreadyLogged = sessionStorage.getItem(sessionKey);

      if (!isAlreadyLogged) {
        hasLoggedThisVisit.current = true;

        logSessionRestoredAction().then((res) => {
          if (res.success) {
            sessionStorage.setItem(sessionKey, 'true');
            console.log('[Auth] Sesión restaurada y registrada en auditoría.');
          }
        });
      }
    }
  }, [isAuthenticated, user]);

  return null;
}
