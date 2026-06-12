import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import BottomNav from './BottomNav';
import PWAInstallButton from './PWAInstallButton';
import { useSessionStore } from '@/stores/useSessionStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const token = useSessionStore(s => s.token);
  const logout = useSessionStore(s => s.logout);

  return (
    <div className="min-h-screen bg-deep-ocean flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen bg-deep-ocean relative flex flex-col shadow-2xl">
        {/* Top bar with user info */}
        <div className="sticky top-0 z-40 bg-deep-ocean/90 backdrop-blur-md border-b border-ocean-surface/20">
          <div className="flex items-center justify-between h-12 px-4">
            <div className="flex items-center gap-2">
              <img src="./icon-crab.png" alt="INDEX" className="w-7 h-7 rounded-lg" />
              <span className="text-padi-blue font-bold text-sm">INDEX</span>
            </div>

            {token && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-mid/50">
                  <User size={12} className="text-padi-blue" />
                  <span className="text-[10px] text-text-secondary font-medium max-w-[100px] truncate">
                    {token.name}
                  </span>
                </div>
                <button onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-alert-red/10 transition-colors"
                  aria-label="Salir">
                  <LogOut size={16} className="text-text-tertiary" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 pb-20 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <PWAInstallButton />
        <BottomNav />
      </div>
    </div>
  );
}
