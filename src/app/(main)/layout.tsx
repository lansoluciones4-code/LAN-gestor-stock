'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Package,
  Users,
  Briefcase,
  MonitorSmartphone,
  ShieldAlert,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { logoutAction } from '@/server/actions/auth.actions';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Ventas', href: '/ventas', icon: Briefcase },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Proveedores', href: '/proveedores', icon: Users },
];

const adminNavigation = [
  { name: 'Equipos', href: '/equipos', icon: MonitorSmartphone },
  { name: 'Auditoría', href: '/logs', icon: ShieldAlert },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const logoutState = useAuthStore((state) => state.logoutState);

  // Prevent hydration mismatch on themes
  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await logoutAction();
    logoutState();
    window.location.href = '/login';
  };

  const navLinks = user?.role === 'admin' 
    ? [...navigation, ...adminNavigation] 
    : navigation;

  const SidebarContent = () => (
    <div className='flex h-full flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors'>
      <div className='p-6 flex items-center shrink-0'>
        <div className='w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3'>
          <Package className='text-white w-5 h-5' />
        </div>
        <span className='font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100'>
          StockApp
        </span>
      </div>

      <nav className='flex-1 space-y-1 px-4 mt-6 overflow-y-auto'>
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <item.icon
                className={`shrink-0 w-5 h-5 mr-3 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className='p-4 border-t border-zinc-200 dark:border-zinc-800'>
        <div className='flex items-center justify-between px-3 py-2'>
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
              {user?.username}
            </span>
            <span className='text-xs text-zinc-500 capitalize'>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className='p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10'
            title='Cerrar sesión'
          >
            <LogOut className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='h-screen flex overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors'>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className='fixed inset-0 bg-zinc-900/80 z-40 lg:hidden backdrop-blur-sm'
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className='fixed inset-y-0 left-0 w-72 z-50 lg:hidden'
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className='hidden lg:flex lg:shrink-0 lg:w-72'>
        <SidebarContent />
      </div>

      {/* Main Column */}
      <div className='flex flex-col flex-1 min-w-0 overflow-hidden'>
        {/* Top Header */}
        <header className='shrink-0 h-16 flex items-center justify-between px-4 lg:px-8 transition-colors bg-transparent border-none'>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className='lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'
          >
            <Menu className='w-6 h-6' />
          </button>

          <div className='flex items-center ml-auto'>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className='p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors'
                aria-label='Alternar tema'
              >
                {theme === 'dark' ? (
                  <Sun className='w-5 h-5' />
                ) : (
                  <Moon className='w-5 h-5' />
                )}
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className='flex-1 relative overflow-y-auto focus:outline-none'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className='p-4 sm:p-6 lg:p-8 h-full'
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
