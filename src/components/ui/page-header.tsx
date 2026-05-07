interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className='flex justify-between items-center mb-6 shrink-0'>
      <div>
        <h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight'>{title}</h1>
        {description && <p className='text-zinc-500 dark:text-zinc-400 mt-1'>{description}</p>}
      </div>
    </div>
  );
}
