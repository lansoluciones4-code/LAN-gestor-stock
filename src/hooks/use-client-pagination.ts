import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

export function useClientPagination<T>(data: T[], itemsPerPage: number = 20) {
  const [limit, setLimit] = useState(itemsPerPage);
  
  // Reseteamos el límite si la data cambia (ej: cuando el usuario busca o filtra)
  useEffect(() => {
    setLimit(itemsPerPage);
  }, [data, itemsPerPage]);

  const paginatedData = useMemo(() => {
    return data.slice(0, limit);
  }, [data, limit]);

  const hasMore = limit < data.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setLimit(prev => prev + itemsPerPage);
    }
  }, [hasMore, itemsPerPage]);

  const elementRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 } // 0.1 para que se dispare cuando asome un 10% del div
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return {
    paginatedData,
    hasMore,
    elementRef // Este ref se attachea al último elemento o un <div> centinela
  };
}
