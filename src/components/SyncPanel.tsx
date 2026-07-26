import { useState, useEffect } from 'react';
import { Cloud, CloudOff, ArrowUp, CheckCircle } from 'lucide-react';
import { syncLogbook, syncEquipment, isOnline, isAuthenticated } from '../lib/divespotApi';

export function SyncPanel() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'syncing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [pendingLogbook, setPendingLogbook] = useState(0);
  const [pendingEquipment, setPendingEquipment] = useState(0);

  useEffect(() => {
    checkPending();
  }, []);

  async function checkPending() {
    const logbook = JSON.parse(localStorage.getItem('Dive Tools_logbook') || '[]');
    const equipment = JSON.parse(localStorage.getItem('Dive Tools_equipment') || '[]');
    setPendingLogbook(logbook.length);
    setPendingEquipment(equipment.length);
  }

  async function handleSync() {
    if (!isOnline()) {
      setStatus('error');
      setMessage('Sin conexion a internet');
      return;
    }

    const auth = await isAuthenticated();
    if (!auth) {
      setStatus('error');
      setMessage('Inicia sesion en Dive Tools.cl para sincronizar');
      return;
    }

    setStatus('syncing');
    setMessage('Sincronizando...');

    try {
      const logbook = JSON.parse(localStorage.getItem('Dive Tools_logbook') || '[]');
      const equipment = JSON.parse(localStorage.getItem('Dive Tools_equipment') || '[]');

      let logbookResult = null;
      let equipmentResult = null;

      if (logbook.length > 0) {
        logbookResult = await syncLogbook(logbook);
      }
      if (equipment.length > 0) {
        equipmentResult = await syncEquipment(equipment);
      }

      setStatus('done');
      setMessage(
        'Sincronizado: ' + (logbookResult?.created || 0) + ' inmersiones nuevas, ' + (equipmentResult?.synced || 0) + ' equipos'
      );
      checkPending();
    } catch (err: any) {
      setStatus('error');
      setMessage('Error: ' + err.message);
    }
  }

  const totalPending = pendingLogbook + pendingEquipment;

  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
      <div className="flex items-center gap-2 text-white font-semibold">
        {status === 'error' ? <CloudOff className="w-5 h-5 text-red-400" /> : <Cloud className="w-5 h-5 text-cyan-400" />}
        Sincronizacion con Dive Tools.cl
      </div>

      <p className="text-sm text-slate-400">
        {totalPending > 0 
          ? pendingLogbook + ' inmersiones y ' + pendingEquipment + ' equipos pendientes' 
          : 'No hay datos pendientes'}
      </p>

      {totalPending > 0 && (
        <button
          onClick={handleSync}
          disabled={status === 'syncing'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
          {status === 'syncing' ? 'Subiendo...' : 'Sincronizar ahora'}
        </button>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      {status === 'error' && (
        <div className="text-sm text-red-400">{message}</div>
      )}
    </div>
  );
}

