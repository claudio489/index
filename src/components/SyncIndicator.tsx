import React from 'react';
import { useSync } from '../hooks/useSync';

type VisualState = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

const config: Record<VisualState, { color: string; label: string; icon: string }> = {
  synced:   { color: '#22c55e', label: 'Sincronizado', icon: '✓' },
  syncing:  { color: '#3b82f6', label: 'Sincronizando...', icon: '⟳' },
  pending:  { color: '#f59e0b', label: 'Pendiente', icon: '⏳' },
  offline:  { color: '#6b7280', label: 'Offline', icon: '⚠' },
  error:    { color: '#ef4444', label: 'Error', icon: '✕' },
};

export const SyncIndicator: React.FC = () => {
  const { visualState, isOnline, pendingCount, syncNow } = useSync();
  console.log('[SyncIndicator] Render:', visualState, 'online:', isOnline, 'pending:', pendingCount);
  const { color, label, icon } = config[visualState];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '4px', backgroundColor: color + '20', color, fontSize: '12px', fontWeight: 500 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      <span>{icon}</span>
      <span>{label}</span>
      {pendingCount > 0 && <span style={{ fontSize: '10px' }}>({pendingCount})</span>}
      <button onClick={syncNow} style={{ marginLeft: '4px', padding: '2px 6px', fontSize: '10px', border: 'none', borderRadius: '3px', background: '#333', color: '#fff', cursor: 'pointer' }}>🔄</button>
    </div>
  );
};
