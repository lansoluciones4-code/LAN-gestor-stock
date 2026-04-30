import { useState, useRef, useEffect } from 'react';

type GlobalMessage = { type: 'error' | 'success'; text: string } | null;

export function useEntityManager<T>() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Para manejo de Server Actions Errors dentro de los forms modales
  const [serverError, setServerError] = useState<string | null>(null);

  // Para mensajes globales de éxito / fallo temporales en el panel (Top level message)
  const [globalMessage, setGlobalMessage] = useState<GlobalMessage>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openFormModal = (item?: T) => {
    setServerError(null);
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
  };

  const showGlobalMessage = (type: 'success' | 'error', text: string) => {
    // Si hay un timeout corriendo de un mensaje anterior, lo detenemos para que no borre el nuevo mensaje antes de tiempo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setGlobalMessage({ type, text });

    timeoutRef.current = setTimeout(() => {
      setGlobalMessage(null);
      timeoutRef.current = null;
    }, 4500);
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    isModalOpen,
    editingItem,
    openFormModal,
    closeFormModal,

    itemToDelete,
    setItemToDelete,

    serverError,
    setServerError,

    globalMessage,
    showGlobalMessage,

    search,
    setSearch,
  };
}
