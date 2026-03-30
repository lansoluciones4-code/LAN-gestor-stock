import { useState } from 'react';

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

  const openFormModal = (item?: T) => {
    setServerError(null);
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    // Note: No reseteamos editingItem aquí de inmediato para evitar flashes 
    // en la UI mientras la ventana se esconde (fadeout). 
    // El desarrollador resetea el form mediante hook-form de todos modos.
  };
  
  const showGlobalMessage = (type: 'success' | 'error', text: string) => {
    setGlobalMessage({ type, text });
    setTimeout(() => setGlobalMessage(null), 3500);
  };

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
