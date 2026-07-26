// src/lib/accessCodeGenerator.ts
// Genera cÃ³digos de acceso en formato INDEX-WXYZ

const CODE_PREFIX = 'INDEX';
const CODE_LENGTH = 4;
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Genera un cÃ³digo aleatorio de 4 caracteres alfanumÃ©ricos
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
 * Genera un cÃ³digo de acceso completo en formato INDEX-WXYZ
 * Ejemplo: INDEX-HYM7Q4, INDEX-DEMO1
 */
export function generateAccessCode(): string {
  return `${CODE_PREFIX}-${generateRandomSuffix()}`;
}

/**
 * Valida formato de cÃ³digo INDEX-WXYZ
 */
export function isValidIndexCode(code: string): boolean {
  const pattern = /^INDEX-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Formatea un ID legacy (code-123456) a formato INDEX
 * Para migraciÃ³n de cÃ³digos antiguos
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
 * Genera cÃ³digo con nombre personalizado (ej: INDEX-DEMO1)
 */
export function generateNamedCode(name: string): string {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const suffix = cleanName.padEnd(4, '0').slice(0, 4);
  return `${CODE_PREFIX}-${suffix}`;
}
