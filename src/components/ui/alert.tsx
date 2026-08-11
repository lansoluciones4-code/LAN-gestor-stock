import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ErrorAlertProps {
  error: string | null | undefined;
  className?: string;
}

export function ErrorAlert({ error, className = '' }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div className={`p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 mb-6 flex items-start gap-2 font-medium dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/40 ${className}`}>
      <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
      <span>{error}</span>
    </div>
  );
}

interface GlobalMessageProps {
  message: { type: 'success' | 'error'; text: string } | null;
  className?: string;
}

export function GlobalMessage({ message, className = '' }: GlobalMessageProps) {
  if (!message) return null;

  const isError = message.type === 'error';

  return (
    <div
      className={`shrink-0 mb-4 p-4 rounded-lg flex items-center gap-2 shadow-sm text-sm border ${
        isError ? 'bg-red-50 text-red-700 border-red-200 font-semibold dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/40'
      } ${className}`}
    >
      {isError ? <AlertTriangle className='w-4 h-4 shrink-0' /> : <CheckCircle2 className='w-4 h-4 shrink-0' />}
      {message.text}
    </div>
  );
}
