// src/providers/trpc.tsx
// Provider de tRPC (si no se usa, placeholder)
import React from 'react';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export const TRPCProvider: React.FC<TRPCProviderProps> = ({ children }) => {
  return <>{children}</>;
};
