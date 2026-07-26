
# =============================================================================
# DiveTools - Fix: Formato INDEX-WXYZ para Códigos de Acceso
# Fecha: 2026-06-24
# =============================================================================
# Este script:
# 1. Crea backup de archivos existentes
# 2. Modifica el generador de códigos para formato INDEX-WXYZ
# 3. Modifica la vista admin para mostrar formato INDEX
# 4. Modifica la validación para aceptar ambos formatos
# 5. Verifica que el build compila
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DiveTools - Fix INDEX-WXYZ Codes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- CONFIGURACIÓN ---
$projectRoot = Get-Location
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# --- 1. CREAR BACKUP ---
Write-Host "[1/6] Creando backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$filesToBackup = @(
    "src\lib\accessCodeGenerator.ts",
    "src\components\AdminCodesPanel.tsx",
    "src\components\AccessCodeGenerator.tsx",
    "src\stores\accessCodeStore.ts",
    "src\lib\codeValidation.ts",
    "src\pages\AdminPage.tsx"
)

foreach ($file in $filesToBackup) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-Path $fullPath) {
        $backupPath = Join-Path $backupDir $file
        $backupFolder = Split-Path $backupPath -Parent
        if (!(Test-Path $backupFolder)) {
            New-Item -ItemType Directory -Force -Path $backupFolder | Out-Null
        }
        Copy-Item $fullPath $backupPath -Force
        Write-Host "  Backup: $file" -ForegroundColor Green
    } else {
        Write-Host "  No existe (se creara): $file" -ForegroundColor DarkYellow
    }
}
Write-Host ""

# --- 2. CREAR/MODIFICAR: Generador de Códigos ---
Write-Host "[2/6] Creando generador INDEX-WXYZ..." -ForegroundColor Yellow

$generatorCode = @'
// src/lib/accessCodeGenerator.ts
// Genera códigos de acceso en formato INDEX-WXYZ

const CODE_PREFIX = 'INDEX';
const CODE_LENGTH = 4;
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Genera un código aleatorio de 4 caracteres alfanuméricos
 */
function generateRandomSuffix(): string {
  let suffix = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    suffix += CODE_CHARS[randomIndex];
  }
  return suffix;
}

/**
 * Genera un código de acceso completo en formato INDEX-WXYZ
 * Ejemplo: INDEX-HYM7Q4, INDEX-DEMO1
 */
export function generateAccessCode(): string {
  return `${CODE_PREFIX}-${generateRandomSuffix()}`;
}

/**
 * Valida formato de código INDEX-WXYZ
 */
export function isValidIndexCode(code: string): boolean {
  const pattern = /^INDEX-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Formatea un ID legacy (code-123456) a formato INDEX
 * Para migración de códigos antiguos
 */
export function formatLegacyCode(legacyId: string): string {
  // Si ya es formato INDEX, devolverlo
  if (isValidIndexCode(legacyId)) {
    return legacyId;
  }

  // Si es formato legacy code-123456, generar uno nuevo INDEX
  if (legacyId.startsWith('code-')) {
    const digits = legacyId.replace('code-', '').slice(-4);
    const suffix = digits.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const padded = suffix.padEnd(4, '0').slice(0, 4);
    return `${CODE_PREFIX}-${padded}`;
  }

  return legacyId;
}

/**
 * Genera código con nombre personalizado (ej: INDEX-DEMO1)
 */
export function generateNamedCode(name: string): string {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const suffix = cleanName.padEnd(4, '0').slice(0, 4);
  return `${CODE_PREFIX}-${suffix}`;
}
'@

New-Item -ItemType Directory -Force -Path "src\lib" | Out-Null
$generatorCode | Out-File -FilePath "src\lib\accessCodeGenerator.ts" -Encoding UTF8
Write-Host "  Creado: src\lib\accessCodeGenerator.ts" -ForegroundColor Green
Write-Host ""

# --- 3. CREAR/MODIFICAR: Store de Códigos ---
Write-Host "[3/6] Creando store de códigos..." -ForegroundColor Yellow

$storeCode = @'
// src/stores/accessCodeStore.ts
// Store Zustand para códigos de acceso con formato INDEX

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateAccessCode, formatLegacyCode } from '@/lib/accessCodeGenerator';

export interface AccessCode {
  id: string;           // ID interno (puede ser legacy code-123 o INDEX-XYZ)
  code: string;         // Código visible en formato INDEX-WXYZ
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
'@

New-Item -ItemType Directory -Force -Path "src\stores" | Out-Null
$storeCode | Out-File -FilePath "src\stores\accessCodeStore.ts" -Encoding UTF8
Write-Host "  Creado: src\stores\accessCodeStore.ts" -ForegroundColor Green
Write-Host ""

# --- 4. CREAR/MODIFICAR: Panel Admin de Códigos ---
Write-Host "[4/6] Creando panel admin..." -ForegroundColor Yellow

$adminPanelCode = @'
// src/components/AdminCodesPanel.tsx
// Vista admin de códigos en formato INDEX-WXYZ

import React, { useState } from 'react';
import { useAccessCodeStore, AccessCode } from '@/stores/accessCodeStore';
import { generateAccessCode } from '@/lib/accessCodeGenerator';
import { Copy, Trash2, User, Calendar, Shield } from 'lucide-react';

interface AdminCodesPanelProps {
  isAdmin?: boolean;
}

export const AdminCodesPanel: React.FC<AdminCodesPanelProps> = ({ isAdmin = true }) => {
  const { codes, generateNewCode, deactivateCode } = useAccessCodeStore();
  const [newName, setNewName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['diver']);
  const [daysValid, setDaysValid] = useState(30);

  const activeCodes = codes.filter((c) => c.isActive);
  const expiredCodes = codes.filter((c) => !c.isActive);

  const handleGenerate = () => {
    const code = generateNewCode(newName, selectedRoles, daysValid);
    setNewName('');
    alert(`Código generado: ${code.code}`);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL');
  };

  const availableRoles = [
    'diver',
    'instructor',
    'admin',
    'Open Water',
    'Advanced OW',
    'Rescue + EFR',
    'Dive Master',
    'Nitrox',
    'Deep Diver',
    'Wreck',
    'Sidemount Rec',
    'Tec 40',
    'Tec 45',
    'Trimix',
    'Dry Suit',
    'Foto Sub',
  ];

  const CodeCard: React.FC<{ code: AccessCode }> = ({ code }) => (
    <div className='bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-blue-500'>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          {/* CÓDIGO EN FORMATO INDEX-WXYZ - DESTACADO */}
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-2xl font-bold text-blue-600 tracking-wider'>
              {code.code}
            </span>
            <button
              onClick={() => handleCopy(code.code)}
              className='p-1 hover:bg-gray-100 rounded transition'
              title='Copiar código'
            >
              <Copy className='w-4 h-4 text-gray-500' />
            </button>
          </div>

          {/* ID interno (pequeño, opcional) */}
          <div className='text-xs text-gray-400 mb-2'>
            ID: {code.id}
          </div>

          {/* Nombre */}
          <div className='flex items-center gap-2 text-gray-700'>
            <User className='w-4 h-4' />
            <span className='font-medium'>{code.name}</span>
          </div>

          {/* Fechas */}
          <div className='flex items-center gap-2 text-sm text-gray-500 mt-1'>
            <Calendar className='w-4 h-4' />
            <span>Expira: {formatDate(code.expiresAt)}</span>
            <span className='mx-1'>|</span>
            <span>Creado: {formatDate(code.createdAt)}</span>
          </div>

          {/* Roles */}
          <div className='flex flex-wrap gap-1 mt-2'>
            <Shield className='w-4 h-4 text-gray-400' />
            {code.roles.map((role) => (
              <span
                key={role}
                className='px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full'
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className='flex flex-col gap-2'>
          <button
            onClick={() => deactivateCode(code.id)}
            className='p-2 text-red-500 hover:bg-red-50 rounded transition'
            title='Desactivar código'
          >
            <Trash2 className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className='p-4 text-center text-gray-500'>
        No tienes permisos para ver esta sección.
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <h2 className='text-2xl font-bold mb-6 text-gray-800'>
        Total Códigos: {codes.length}
      </h2>

      <div className='grid grid-cols-3 gap-4 mb-6 text-center'>
        <div className='bg-green-50 rounded-lg p-3'>
          <div className='text-2xl font-bold text-green-600'>{activeCodes.length}</div>
          <div className='text-sm text-green-700'>Activos</div>
        </div>
        <div className='bg-red-50 rounded-lg p-3'>
          <div className='text-2xl font-bold text-red-600'>{expiredCodes.length}</div>
          <div className='text-sm text-red-700'>Expirados</div>
        </div>
        <div className='bg-blue-50 rounded-lg p-3'>
          <div className='text-2xl font-bold text-blue-600'>{codes.length}</div>
          <div className='text-sm text-blue-700'>Total</div>
        </div>
      </div>

      {/* Formulario generar nuevo código */}
      <div className='bg-gray-50 rounded-lg p-4 mb-6'>
        <h3 className='font-bold mb-3'>Generar nuevo código</h3>
        <div className='flex gap-2 mb-3'>
          <input
            type='text'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='Nombre del buceador'
            className='flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <input
            type='number'
            value={daysValid}
            onChange={(e) => setDaysValid(Number(e.target.value))}
            placeholder='Días válido'
            className='w-24 px-3 py-2 border rounded-lg'
          />
          <button
            onClick={handleGenerate}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
          >
            +
          </button>
        </div>

        <div className='flex flex-wrap gap-2'>
          {availableRoles.map((role) => (
            <label key={role} className='flex items-center gap-1 cursor-pointer'>
              <input
                type='checkbox'
                checked={selectedRoles.includes(role)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRoles([...selectedRoles, role]);
                  } else {
                    setSelectedRoles(selectedRoles.filter((r) => r !== role));
                  }
                }}
                className='rounded'
              />
              <span className='text-sm'>{role}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Lista de códigos activos */}
      <h3 className='font-bold mb-3 text-gray-700'>Códigos activos</h3>
      {activeCodes.length === 0 ? (
        <p className='text-gray-500 text-center py-8'>No hay códigos activos</p>
      ) : (
        activeCodes.map((code) => <CodeCard key={code.id} code={code} />)
      )}

      {/* Lista de códigos expirados */}
      {expiredCodes.length > 0 && (
        <>
          <h3 className='font-bold mb-3 text-gray-700 mt-6'>Códigos expirados</h3>
          {expiredCodes.map((code) => (
            <div key={code.id} className='opacity-50'>
              <CodeCard code={code} />
            </div>
          ))}
        </>
      )}
    </div>
  );
};
'@

New-Item -ItemType Directory -Force -Path "src\components" | Out-Null
$adminPanelCode | Out-File -FilePath "src\components\AdminCodesPanel.tsx" -Encoding UTF8
Write-Host "  Creado: src\components\AdminCodesPanel.tsx" -ForegroundColor Green
Write-Host ""

# --- 5. CREAR: Validación de Códigos ---
Write-Host "[5/6] Creando validación de códigos..." -ForegroundColor Yellow

$validationCode = @'
// src/lib/codeValidation.ts
// Valida códigos de acceso en formato INDEX-WXYZ y legacy

import { isValidIndexCode } from './accessCodeGenerator';

/**
 * Normaliza un código de entrada (mayúsculas, trim)
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Valida si un código es válido (acepta INDEX-WXYZ y legacy code-123456)
 */
export function isValidCodeFormat(code: string): boolean {
  const normalized = normalizeCode(code);

  // Formato INDEX-WXYZ
  if (isValidIndexCode(normalized)) {
    return true;
  }

  // Formato legacy code-123456 (retrocompatibilidad)
  if (/^CODE-\d+$/.test(normalized)) {
    return true;
  }

  // Códigos especiales como INDEX-DEMO1
  if (/^INDEX-[A-Z0-9]+$/.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Extrae el código de una entrada de usuario
 */
export function extractCode(input: string): string {
  const normalized = normalizeCode(input);

  // Si contiene espacio, tomar la segunda parte
  const parts = normalized.split(/\s+/);
  if (parts.length > 1) {
    return parts.join('-');
  }

  return normalized;
}
'@

$validationCode | Out-File -FilePath "src\lib\codeValidation.ts" -Encoding UTF8
Write-Host "  Creado: src\lib\codeValidation.ts" -ForegroundColor Green
Write-Host ""

# --- 6. VERIFICAR BUILD ---
Write-Host "[6/6] Verificando build..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "  Ejecutando build..." -ForegroundColor DarkGray
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Build exitoso!" -ForegroundColor Green
    } else {
        Write-Host "  Build fallo. Revisa los errores arriba." -ForegroundColor Red
    }
} else {
    Write-Host "  No se encontro package.json en el directorio actual" -ForegroundColor Red
    Write-Host "  Asegurate de ejecutar este script desde la raiz del proyecto" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  FIX COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos creados/modificados:" -ForegroundColor Cyan
Write-Host "  - src\lib\accessCodeGenerator.ts" -ForegroundColor White
Write-Host "  - src\stores\accessCodeStore.ts" -ForegroundColor White
Write-Host "  - src\components\AdminCodesPanel.tsx" -ForegroundColor White
Write-Host "  - src\lib\codeValidation.ts" -ForegroundColor White
Write-Host ""
Write-Host "Backup guardado en: $backupDir\" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Ejecuta: npm run dev" -ForegroundColor White
Write-Host "  2. Ve a la vista admin y genera un nuevo código" -ForegroundColor White
Write-Host "  3. Verifica que aparezca en formato INDEX-WXYZ" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
