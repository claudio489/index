import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/useSessionStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const isAuthenticated = useSessionStore(s => s.isAuthenticated);
  const loadSession = useSessionStore(s => s.loadSession);

  useEffect(() => {
    loadSession().finally(() => setChecking(false));
  }, [loadSession]);

  if (checking) {
    return (
      <div className="min-h-screen bg-deep-ocean flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-padi-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
