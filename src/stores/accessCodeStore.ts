// src/stores/accessCodeStore.ts
// Store Zustand para cÃ³digos de acceso con formato INDEX

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateAccessCode, formatLegacyCode } from '@/lib/accessCodeGenerator';

export interface AccessCode {
  id: string;           // ID interno (puede ser legacy code-123 o INDEX-XYZ)
  code: string;         // CÃ³digo visible en formato INDEX-WXYZ
  name: string;
  roles: string[];
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  deviceId?: string;
}

interface AccessCodeState {
  codes: AccessCode[];
  generateNewCode: (name: string, roles: string[], daysValid: number) => AccessCode;
  deactivateCode: (id: string) => void;
  getActiveCodes: () => AccessCode[];
  getCodeById: (id: string) => AccessCode | undefined;
  formatAllCodes: () => void;
}

export const useAccessCodeStore = create<AccessCodeState>()(
  persist(
    (set, get) => ({
      codes: [],

      generateNewCode: (name, roles, daysValid) => {
        const newCode = generateAccessCode();
        const now = new Date();
        const expires = new Date();
        expires.setDate(now.getDate() + daysValid);

        const codeEntry: AccessCode = {
          id: newCode,
          code: newCode,
          name: name || 'Sin nombre',
          roles,
          createdAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          isActive: true,
        };

        set((state) => ({
          codes: [...state.codes, codeEntry],
        }));

        return codeEntry;
      },

      deactivateCode: (id) => {
        set((state) => ({
          codes: state.codes.map((c) =>
            c.id === id ? { ...c, isActive: false } : c
          ),
        }));
      },

      getActiveCodes: () => {
        return get().codes.filter((c) => c.isActive);
      },

      getCodeById: (id) => {
        return get().codes.find((c) => c.id === id || c.code === id);
      },

      formatAllCodes: () => {
        set((state) => ({
          codes: state.codes.map((c) => ({
            ...c,
            code: formatLegacyCode(c.id),
          })),
        }));
      },
    }),
    {
      name: 'dds_access_codes',
      version: 2,
      migrate: (persistedState: any, version) => {
        if (version === 1) {
          persistedState.codes = persistedState.codes.map((c: any) => ({
            ...c,
            code: formatLegacyCode(c.id),
          }));
        }
        return persistedState;
      },
    }
  )
);
