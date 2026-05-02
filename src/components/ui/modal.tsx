import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Modal = ({ isOpen, onClose, children, width = '2xl' }: ModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[width];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 overflow-y-auto'>
      <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full ${maxWidthClass} overflow-hidden border border-zinc-200 dark:border-zinc-800 m-auto animate-in fade-in zoom-in-95 duration-200`}>{children}</div>
    </div>
  );
};

interface ModalHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  className?: string;
  titleClassName?: string;
}

const ModalHeader = ({ title, icon, onClose, className = '', titleClassName = '' }: ModalHeaderProps) => (
  <div className={`flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 ${className}`}>
    <h3 className={`text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 ${titleClassName}`}>
      {icon}
      {title}
    </h3>
    <button
      onClick={onClose}
      className='text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors'
    >
      <X className='w-5 h-5' />
    </button>
  </div>
);

const ModalContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`p-6 sm:p-8 space-y-6 ${className}`}>{children}</div>;

const ModalFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`flex justify-center sm:justify-end px-6 sm:px-8 py-5 gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 ${className}`}>{children}</div>;

export { Modal, ModalHeader, ModalContent, ModalFooter };
