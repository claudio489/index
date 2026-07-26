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
  
  // Si contiene espacio, tomar la segunda parte (ej: ""INDEX HYM7Q4"")
  const parts = normalized.split(/\s+/);
  if (parts.length > 1) {
    return parts.join('-');
  }
  
  return normalized;
}