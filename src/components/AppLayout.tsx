import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, User, Compass } from 'lucide-react';
import BottomNav from './BottomNav';
import PWAInstallButton from './PWAInstallButton';
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const email = useDivespotAuthStore(s => s.email);
  const profile = useDivespotAuthStore(s => s.profile);
  const signOut = useDivespotAuthStore(s => s.signOut);
  const displayName = profile?.full_name || profile?.name || email || '';
  return (
    <div className="min-h-screen bg-deep-ocean flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen bg-deep-ocean relative flex flex-col shadow-2xl">
        <div className="sticky top-0 z-40 bg-deep-ocean/90 backdrop-blur-md border-b border-ocean-surface/20">
          <div className="flex items-center justify-between h-12 px-4">
            <div className="flex items-center gap-2">
              <img src="./logo-header.png" alt="Dive Tools" className="w-7 h-7 rounded-lg" />
              <span className="text-padi-blue font-bold text-sm">Dive Tools</span>
              {/* Link de vuelta a DeepSpot.cl (sitio comunitario). Se abre
                  en el navegador, ya que es un dominio externo distinto
                  a la PWA. Siempre visible, no depende de si hay sesion
                  activa. */}
              <a
                href="https://www.deepspot.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-ocean-mid/50 hover:bg-ocean-mid transition-colors ml-1"
                aria-label="Ir a DeepSpot.cl"
                title="DeepSpot.cl"
              >
                <Compass size={14} className="text-padi-blue" />
              </a>
            </div>
            {displayName && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ocean-mid/50">
                  <User size={12} className="text-padi-blue" />
                  <span className="text-[10px] text-text-secondary font-medium max-w-[100px] truncate">
                    {displayName}
                  </span>
                </div>
                <button onClick={signOut}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-alert-red/10 transition-colors"
                  aria-label="Salir">
                  <LogOut size={16} className="text-text-tertiary" />
                </button>
              </div>
            )}
          </div>
        </div>
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
