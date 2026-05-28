import * as React from 'react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Trash2 } from 'lucide-react';

const Spinner = () => (
  <svg className='animate-spin h-4 w-4 text-current shrink-0' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
  </svg>
);

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  submitTestId?: string;
  cancelTestId?: string;
}

export function ResponsiveModal({ isOpen, onClose, title, icon, children, width = 'md', onSubmit, submitLabel = 'Guardar', cancelLabel = 'Cancelar', isPending, submitTestId, cancelTestId }: ResponsiveModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width={width}
    >
      <ModalHeader
        title={title}
        icon={icon}
        onClose={onClose}
      />
      {onSubmit ? (
        <form
          onSubmit={onSubmit}
          className='flex flex-col'
          noValidate
        >
          <ModalContent>{children}</ModalContent>
          <ModalFooter>
            <button
              type='button'
              onClick={onClose}
              className='px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium shadow-sm'
              data-testid={cancelTestId}
            >
              {cancelLabel}
            </button>
            <button
              type='submit'
              disabled={isPending}
              className='px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-70 font-medium shadow-sm flex items-center gap-2'
              data-testid={submitTestId}
            >
              {isPending && <Spinner />}
              {submitLabel}
            </button>
          </ModalFooter>
        </form>
      ) : (
        <ModalContent>{children}</ModalContent>
      )}
    </Modal>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  submitTestId?: string;
  cancelTestId?: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description, submitLabel = 'Eliminar', cancelLabel = 'Cancelar', isPending, submitTestId, cancelTestId }: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width='sm'
    >
      <ModalContent className='p-6'>
        <div className='flex items-center text-red-500 mb-4'>
          <div className='p-2 bg-red-100 dark:bg-red-500/10 rounded-full mr-3'>
            <Trash2 className='w-6 h-6' />
          </div>
          <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>{title}</h3>
        </div>
        <p className='text-zinc-500 dark:text-zinc-400 text-sm mb-6'>{description}</p>
        <div className='flex justify-end gap-3'>
          <button
            onClick={onClose}
            disabled={isPending}
            className='px-4 py-2 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-medium shadow-sm'
            data-testid={cancelTestId}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-70 flex items-center gap-2'
            data-testid={submitTestId}
          >
            {isPending && <Spinner />}
            {submitLabel}
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
}
