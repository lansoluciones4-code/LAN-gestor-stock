'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { logSessionRestoredAction } from '@/features/auth/actions/auth.actions';

/**
 * Componente que se encarga de registrar el acceso cuando el usuario
 * vuelve a la App y ya tiene una sesión iniciada por la Cookie.
 */
export function SessionInitializer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Usamos ref para evitar ejecuciones duplicadas en StrictMode (desarrollo)
  const hasLoggedThisVisit = useRef(false);

  useEffect(() => {
    // Si el usuario está autenticado en el Store (Zustand persistió el estado)
    if (isAuthenticated && user && !hasLoggedThisVisit.current) {
      // Verificamos sessionStorage para no spamear logs al recargar la misma pestaña
      const sessionKey = `logged-${user.id}`;
      const isAlreadyLogged = sessionStorage.getItem(sessionKey);

      if (!isAlreadyLogged) {
        hasLoggedThisVisit.current = true;

        // Llamamos al Server Action silenciosamente
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
