'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Package, Users, Briefcase, MonitorSmartphone, ShieldAlert, Menu, Sun, Moon, LogOut, UserCog, X } from 'lucide-react';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { logoutAction } from '@/features/auth/actions/auth.actions';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Productos', href: '/productos', icon: Package, roles: ['admin', 'vendedor'] },
  { name: 'Ventas', href: '/ventas', icon: Briefcase, roles: ['admin', 'vendedor'] },
  { name: 'Clientes', href: '/clientes', icon: Users, roles: ['admin', 'vendedor'] },
  { name: 'Proveedores', href: '/proveedores', icon: Users, roles: ['admin'] },
];

const adminNavigation = [
  { name: 'Categorias', href: '/categorias', icon: MonitorSmartphone, roles: ['admin'] },
  { name: 'Usuarios', href: '/usuarios', icon: UserCog, roles: ['admin'] },
  { name: 'Auditoría', href: '/logs', icon: ShieldAlert, roles: ['admin'] },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logoutState = useAuthStore((state) => state.logoutState);

  // Prevent hydration mismatch on themes
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && user?.role === 'vendedor' && pathname === '/') {
      router.push('/productos');
    }
  }, [mounted, user, pathname, router]);

  const handleLogout = async () => {
    await logoutAction();
    logoutState();
    window.location.href = '/login';
  };

  const navLinks = [...navigation, ...adminNavigation].filter((item) => item.roles.includes(user?.role || 'vendedor'));

  const SidebarContent = () => (
    <div className='flex h-full w-full flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors relative'>
      <div className='p-6 flex items-center justify-between shrink-0'>
        <div className='flex items-center'>
          <div className='w-12 h-12 bg-white border border-zinc-200 shadow-sm rounded-lg flex items-center justify-center mr-3 overflow-hidden'>
            <img
              src='/icon.svg'
              alt='ArgenStock'
              className='w-10 h-10 object-contain'
            />
          </div>
          <span className='font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100'>ArgenStock</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className='xl:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        >
          <X className='w-6 h-6' />
        </button>
      </div>

      <nav className='flex-1 space-y-1 px-4 mt-6 overflow-y-auto custom-scrollbar'>
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2.5 text-md font-medium rounded-lg transition-all focus:outline-none ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'}`}
            >
              <item.icon className={`shrink-0 w-5 h-5 mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className='p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0'>
        <button
          onClick={() => setShowLogoutModal(true)}
          className='w-full flex items-center justify-between px-3 py-2 text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:text-zinc-400 dark:hover:bg-red-500/10 transition-colors rounded-lg group'
        >
          <div className='flex flex-col text-left'>
            <span className='text-md font-medium group-hover:text-red-600 dark:group-hover:text-red-400'>Cerrar sesión</span>
            <span className='text-sm opacity-70'>
              {user?.username} ({user?.role})
            </span>
          </div>
          <LogOut className='w-5 h-5' />
        </button>
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
              className='fixed inset-0 bg-zinc-900/80 z-40 xl:hidden backdrop-blur-sm'
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className='fixed inset-y-0 left-0 w-[320px] z-50 xl:hidden'
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className='hidden xl:flex xl:shrink-0 xl:w-80 no-print'>
        <SidebarContent />
      </div>

      {/* Main Column */}
      <div
        className='flex flex-col flex-1 min-w-0 overflow-hidden outline-none'
        tabIndex={-1}
      >
        {/* Top Header */}
        <header className='shrink-0 h-16 flex items-center justify-between px-4 lg:px-8 transition-colors bg-transparent border-none no-print'>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className='xl:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'
          >
            <Menu className='w-6 h-6' />
          </button>

          <div className='flex items-center ml-auto'>
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className='p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors'
                aria-label='Alternar tema'
              >
                {resolvedTheme === 'dark' ? <Sun className='w-5 h-5' /> : <Moon className='w-5 h-5' />}
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main
          className='flex-1 relative overflow-hidden outline-none ring-0 focus:ring-0 focus-visible:ring-0 flex flex-col'
          tabIndex={-1}
        >
          <div className='flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 flex flex-col outline-none ring-0 focus:ring-0 focus-visible:ring-0'>{children}</div>
        </main>
      </div>

      {/* Confirm Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 p-6'
            >
              <div className='flex items-center text-amber-500 mb-4'>
                <div className='p-2 bg-amber-100 dark:bg-amber-500/10 rounded-full mr-3'>
                  <ShieldAlert className='w-6 h-6' />
                </div>
                <h3 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Cerrar sesión</h3>
              </div>
              <p className='text-zinc-500 dark:text-zinc-400 text-md mb-6'>¿Estás seguro de que deseas salir del panel de control? Tendrás que volver a ingresar tus credenciales.</p>
              <div className='flex justify-end gap-3'>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className='px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium'
                >
                  Sí, Cerrar sesión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
