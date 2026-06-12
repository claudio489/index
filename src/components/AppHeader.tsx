import { Menu, CloudOff } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export default function AppHeader() {
  const isOffline = useAppStore(s => s.isOffline);

  return (
    <header className="sticky top-0 z-40 h-14 bg-deep-ocean/90 backdrop-blur-md flex items-center justify-between px-4 border-b border-ocean-surface/20">
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg active:bg-ocean-dark transition-colors"
          aria-label="Menú"
        >
          <Menu size={22} className="text-text-secondary" />
        </button>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-padi-blue tracking-tight">INDEX</span>
          <span className="text-[10px] text-text-tertiary font-medium">by DiveSpot</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isOffline && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-safety-orange/10">
            <CloudOff size={14} className="text-safety-orange" />
            <span className="text-[10px] text-safety-orange font-medium">Offline</span>
          </div>
        )}
      </div>
    </header>
  );
}
