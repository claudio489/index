import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ExpeditionList } from '@/components/ExpeditionList';
import { MyExpeditionsList } from '@/components/MyExpeditionsList';
import { CreateExpeditionForm } from '@/components/CreateExpeditionForm';
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';
import { useExpeditionStore } from '@/stores/expeditionStore';

type Tab = 'todas' | 'mias';

export default function ExpeditionToolPage() {
  const isInstructor = useDivespotAuthStore(s => s.profile?.is_instructor);
  const isAuthenticated = useDivespotAuthStore(s => s.isAuthenticated);
  const fetchExpeditions = useExpeditionStore(s => s.fetchExpeditions);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<Tab>('todas');

  return (
    <div className="pt-4 pb-6">
      <div className="px-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-text-primary">Expediciones</h1>
          {isInstructor && (
            <button
              onClick={() => setShowForm(true)}
              className="w-9 h-9 bg-padi-blue rounded-full flex items-center justify-center active:scale-95"
            >
              <Plus size={20} className="text-white" />
            </button>
          )}
        </div>
        <p className="text-sm text-text-secondary mb-4">Salidas organizadas de buceo</p>

        {isAuthenticated && (
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab('todas')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'todas'
                  ? 'bg-padi-blue/20 text-padi-blue border border-padi-blue/30'
                  : 'bg-ocean-dark text-text-secondary border border-ocean-surface/30'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setTab('mias')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'mias'
                  ? 'bg-padi-blue/20 text-padi-blue border border-padi-blue/30'
                  : 'bg-ocean-dark text-text-secondary border border-ocean-surface/30'
              }`}
            >
              Mis Expediciones
            </button>
          </div>
        )}
      </div>

      {tab === 'todas' ? <ExpeditionList /> : <MyExpeditionsList />}

      <AnimatePresence>
        {showForm && (
          <CreateExpeditionForm
            onClose={() => setShowForm(false)}
            onCreated={() => {
              setShowForm(false);
              fetchExpeditions();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}