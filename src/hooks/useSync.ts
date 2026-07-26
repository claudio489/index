import { useState, useEffect, useCallback } from 'react';
import { syncEngine, type SyncEngineState } from '../lib/syncEngine';

export type VisualSyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

function getVisualState(state: SyncEngineState, browserOnline: boolean): VisualSyncState {
  if (!browserOnline) return 'offline';
  if (state.isSyncing) return 'syncing';
  if (state.conflicts.length > 0) return 'error';
  if (state.pendingCount > 0) return 'pending';
  return 'synced';
}

export function useSync() {
  const [engineState, setEngineState] = useState<SyncEngineState>(() => syncEngine.getState());
  const [browserOnline, setBrowserOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    console.log('[useSync] Mounting, navigator.onLine:', navigator.onLine);
    
    const unsubscribe = syncEngine.subscribe((newState) => {
      console.log('[useSync] syncEngine update:', newState);
      setEngineState(newState);
    });

    const handleOnline = () => {
      console.log('[useSync] Browser ONLINE event');
      setBrowserOnline(true);
      setEngineState(syncEngine.getState());
    };
    const handleOffline = () => {
      console.log('[useSync] Browser OFFLINE event');
      setBrowserOnline(false);
      setEngineState(syncEngine.getState());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Forzar actualización inicial
    setBrowserOnline(navigator.onLine);
    setEngineState(syncEngine.getState());

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncNow = useCallback(() => {
    console.log('[useSync] Manual sync');
    syncEngine.forceSync();
  }, []);

  const visualState = getVisualState(engineState, browserOnline);

  return {
    visualState,
    engineState,
    syncNow,
    isOnline: browserOnline,
    isSyncing: engineState.isSyncing,
    pendingCount: engineState.pendingCount,
    hasConflicts: engineState.conflicts.length > 0,
    lastSync: engineState.lastSync
  };
}
