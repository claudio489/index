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
  return ${CODE_PREFIX}-;
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
  // (o mapear a un formato consistente)
  if (legacyId.startsWith('code-')) {
    // Extraer últimos 4 dígitos del timestamp como base
    const digits = legacyId.replace('code-', '').slice(-4);
    const suffix = digits.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const padded = suffix.padEnd(4, '0').slice(0, 4);
    return ${CODE_PREFIX}-;
  }
  
  return legacyId;
}

/**
 * Genera código con nombre personalizado (ej: INDEX-DEMO1)
 */
export function generateNamedCode(name: string): string {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const suffix = cleanName.padEnd(4, '0').slice(0, 4);
  return ${CODE_PREFIX}-;
}