import { useEffect, useRef, useState } from 'react';

interface UseAutoSyncOptions {
  /** Si el store ya tenía datos cargados de una visita anterior en esta sesión. */
  isLoaded: boolean;
  /** Pide los datos frescos y los guarda en el store correspondiente. */
  sync: () => Promise<unknown>;
}

/** No repetir la sincronización por volver a la pestaña si la última fue hace menos de esto. */
const FOCUS_REFRESH_THROTTLE_MS = 15_000;

/**
 * Mantiene un panel sincronizado sin depender de que el usuario sincronice a mano:
 * sincroniza al montar (con skeleton solo si no había nada en caché) y, mientras el panel
 * sigue montado, al volver a la pestaña del navegador (silencioso, con un límite de frecuencia).
 */
export function useAutoSync({ isLoaded, sync }: UseAutoSyncOptions) {
  const [initialLoading, setInitialLoading] = useState(!isLoaded);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const silent = isLoaded;
    if (!silent) setInitialLoading(true);

    sync().finally(() => {
      if (cancelled) return;
      lastSyncRef.current = Date.now();
      if (!silent) setInitialLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastSyncRef.current < FOCUS_REFRESH_THROTTLE_MS) return;
      sync().then(() => {
        lastSyncRef.current = Date.now();
      });
    };
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleVisible);
    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { initialLoading };
}
