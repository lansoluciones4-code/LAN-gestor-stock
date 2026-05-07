interface ErrorAlertProps {
  error: string | null | undefined;
  className?: string;
}

export function ErrorAlert({ error, className = '' }: ErrorAlertProps) {
  if (!error) return null;

  return <div className={`p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 mb-6 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 ${className}`}>{error}</div>;
}

interface GlobalMessageProps {
  message: { type: 'success' | 'error'; text: string } | null;
  className?: string;
}

export function GlobalMessage({ message, className = '' }: GlobalMessageProps) {
  if (!message) return null;

  const isError = message.type === 'error';

  return <div className={`shrink-0 mb-4 p-4 rounded-lg flex items-center shadow-sm text-sm border ${isError ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'} ${className}`}>{message.text}</div>;
}
