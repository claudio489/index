// src/lib/codeValidation.ts
// Valida cÃ³digos de acceso en formato INDEX-WXYZ y legacy

import { isValidIndexCode } from './accessCodeGenerator';

/**
 * Normaliza un cÃ³digo de entrada (mayÃºsculas, trim)
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Valida si un cÃ³digo es vÃ¡lido (acepta INDEX-WXYZ y legacy code-123456)
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

  // CÃ³digos especiales como INDEX-DEMO1
  if (/^INDEX-[A-Z0-9]+$/.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Extrae el cÃ³digo de una entrada de usuario
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
