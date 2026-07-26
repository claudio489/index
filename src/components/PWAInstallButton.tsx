import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallButton() {
  const { install, isInstalled, canInstall, isIOS } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = () => {
    if (isIOS) {
      setShowIOSHelp(true);
    } else {
      install();
    }
  };

  return (
    <>
      {/* Install Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[448px]"
      >
        <div className="bg-ocean-dark border border-ocean-surface/40 rounded-2xl shadow-elevated p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-padi-blue/15 flex items-center justify-center flex-shrink-0">
            <img src="./logo-header.png" alt="Dive Tools" className="w-8 h-8 rounded-lg object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Instalar Dive Tools</p>
            <p className="text-[10px] text-text-secondary leading-snug">
              {isIOS ? 'Agrega INDEX a tu pantalla de inicio' : 'Acceso rápido desde tu pantalla de inicio'}
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-padi-blue hover:bg-padi-blue-light text-white text-xs font-semibold px-3.5 py-2 rounded-full active:scale-95 transition-all flex-shrink-0"
          >
            <Download size={14} />
            Instalar
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ocean-mid transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={14} className="text-text-tertiary" />
          </button>
        </div>
      </motion.div>

      {/* iOS Install Help Modal */}
      <AnimatePresence>
        {showIOSHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowIOSHelp(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-ocean-dark rounded-t-3xl p-6 w-full max-w-[480px]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-ocean-surface rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-bold text-text-primary text-center mb-4">Agregar a pantalla de inicio</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-ocean-mid/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-padi-blue/15 flex items-center justify-center flex-shrink-0">
                    <Share size={16} className="text-padi-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Paso 1</p>
                    <p className="text-xs text-text-secondary">Toca el botón <strong>Compartir</strong> en la barra de Safari</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-ocean-mid/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-success-green/15 flex items-center justify-center flex-shrink-0">
                    <PlusSquare size={16} className="text-success-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Paso 2</p>
                    <p className="text-xs text-text-secondary">Selecciona <strong>"Agregar a pantalla de inicio"</strong></p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-ocean-mid/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-alert-gold/15 flex items-center justify-center flex-shrink-0">
                    <img src="./logo-header.png" alt="" className="w-5 h-5 rounded" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Paso 3</p>
                    <p className="text-xs text-text-secondary">Toca <strong>Agregar</strong> y listo. INDEX estará en tu pantalla de inicio.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowIOSHelp(false)}
                className="w-full mt-5 bg-ocean-mid text-text-primary font-semibold py-3 rounded-full active:scale-[0.98] transition-transform"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

