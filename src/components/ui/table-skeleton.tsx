export function TableSkeleton() {
  return (
    <div className='flex flex-col flex-1 animate-pulse space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 mb-2'>
        <div className='h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex-1' />
        <div className='h-10 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg' />
      </div>

      <div className='flex-1 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden'>
        <div className='h-12 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700' />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='h-16 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-6 gap-4'
          >
            <div className='flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3' />
            <div className='h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-16' />
            <div className='h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-20' />
            <div className='h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-24' />
          </div>
        ))}
      </div>
    </div>
  );
}
