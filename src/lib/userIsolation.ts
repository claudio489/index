// src/lib/userIsolation.ts
// Utilidad para aislar datos por usuario (deviceId/codeId)

const USER_KEY_PREFIX = 'dds_user_';

export function getCurrentUserId(): string | null {
  // Intentar obtener del session store
  const session = localStorage.getItem('index_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      return parsed.deviceId || parsed.codeId || parsed.userId || null;
    } catch {}
  }
  // Fallback: del access code activo
  const activeCode = localStorage.getItem('index_active_code');
  if (activeCode) return activeCode;
  return null;
}

export function getUserStorageKey(baseKey: string): string {
  const userId = getCurrentUserId();
  if (userId) {
    return `${USER_KEY_PREFIX}${userId}_${baseKey}`;
  }
  return baseKey;
}

export function clearUserData(userId: string) {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${USER_KEY_PREFIX}${userId}_`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
