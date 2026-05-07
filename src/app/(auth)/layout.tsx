export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className='flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8'>{children}</div>;
}
