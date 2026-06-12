// PADI RDP Table (air dives - no deco limits)
const tablaRDP = [
  { prof: 3, t: 400 }, { prof: 4, t: 350 }, { prof: 5, t: 300 }, { prof: 6, t: 280 },
  { prof: 7, t: 260 }, { prof: 8, t: 240 }, { prof: 9, t: 220 }, { prof: 10, t: 200 },
  { prof: 11, t: 180 }, { prof: 12, t: 160 }, { prof: 13, t: 145 }, { prof: 14, t: 130 },
  { prof: 15, t: 115 }, { prof: 16, t: 105 }, { prof: 17, t: 95 }, { prof: 18, t: 85 },
  { prof: 19, t: 78 }, { prof: 20, t: 72 }, { prof: 21, t: 66 }, { prof: 22, t: 60 },
  { prof: 23, t: 55 }, { prof: 24, t: 50 }, { prof: 25, t: 46 }, { prof: 26, t: 42 },
  { prof: 27, t: 39 }, { prof: 28, t: 36 }, { prof: 29, t: 33 }, { prof: 30, t: 31 },
  { prof: 31, t: 29 }, { prof: 32, t: 27 }, { prof: 33, t: 25 }, { prof: 34, t: 23 },
  { prof: 35, t: 21 }, { prof: 36, t: 19 }, { prof: 37, t: 17 }, { prof: 38, t: 15 },
  { prof: 39, t: 13 }, { prof: 40, t: 11 }, { prof: 41, t: 10 }, { prof: 42, t: 9 },
  { prof: 43, t: 8 }, { prof: 44, t: 7 }, { prof: 45, t: 6 }, { prof: 46, t: 5 },
  { prof: 47, t: 5 }, { prof: 48, t: 4 }, { prof: 49, t: 4 }, { prof: 50, t: 3 },
  { prof: 51, t: 3 }, { prof: 52, t: 3 }, { prof: 53, t: 2 }, { prof: 54, t: 2 },
  { prof: 55, t: 2 }, { prof: 56, t: 2 }, { prof: 57, t: 2 }, { prof: 58, t: 1 },
  { prof: 59, t: 1 }, { prof: 60, t: 1 },
];

export function getTiempoAire(profundidad: number): number {
  for (let i = 0; i < tablaRDP.length; i++) {
    if (tablaRDP[i].prof >= profundidad) return tablaRDP[i].t;
  }
  return 1;
}

// Calculate Equivalent Air Depth (EAD) / Profundidad Equivalente al Aire (PEA)
export function calcularPEA(profundidadReal: number, fraccionOxigeno: number): number {
  if (fraccionOxigeno >= 0.79) return profundidadReal;
  const presionAbs = (profundidadReal / 10) + 1;
  const fraccionNitrogeno = 1 - fraccionOxigeno;
  const peaAbs = presionAbs * (fraccionNitrogeno / 0.79);
  return Math.max(0, (peaAbs - 1) * 10);
}

// Maximum Operating Depth (MOD)
export function calcularMOD(fO2: number, pO2Max: number = 1.4): number {
  if (fO2 <= 0) return 0;
  return Math.max(0, ((pO2Max / fO2) - 1) * 10);
}

// Calculate partial pressure of O2 at depth
export function calcularPO2(profundidad: number, fO2: number): number {
  const presionAbs = (profundidad / 10) + 1;
  return presionAbs * fO2;
}

// Best Mix - optimal O2 fraction for a given depth and max PO2
export function calcularBestMix(profundidad: number, pO2Max: number = 1.4): number {
  const presionAbs = (profundidad / 10) + 1;
  return Math.min(1.0, pO2Max / presionAbs);
}

// No Deco Limit (LND) using PADI RDP with EAD
export function calcularLND(profundidad: number, fO2: number): number | null {
  // Deco stage mixes don't have NDL
  if (fO2 >= 0.5) return null;
  const pea = calcularPEA(profundidad, fO2);
  return getTiempoAire(pea);
}

// Safety status check
export function getSafetyStatus(
  profundidad: number,
  fO2: number,
  pO2Max: number = 1.4
): { status: 'safe' | 'caution' | 'danger'; message: string } {
  const mod = calcularMOD(fO2, pO2Max);

  if (profundidad > mod) {
    return {
      status: 'danger',
      message: '⚠️ ALERTA: La profundidad EXCEDE la MOD. Riesgo de toxicidad por O2.',
    };
  }
  if (mod - profundidad < 3) {
    return {
      status: 'caution',
      message: '⚡ Precaución: Estás muy cerca de la MOD. Mantén margen de seguridad.',
    };
  }
  return {
    status: 'safe',
    message: '✅ Profundidad segura. Respeta siempre la MOD.',
  };
}

// MOD reference table for common mixes
export const modReferenceTable = [
  { fO2: 0.21, mod14: 56.7, mod16: 66.2 },
  { fO2: 0.28, mod14: 40.0, mod16: 47.1 },
  { fO2: 0.32, mod14: 33.7, mod16: 40.0 },
  { fO2: 0.36, mod14: 28.9, mod16: 34.4 },
  { fO2: 0.40, mod14: 25.0, mod16: 30.0 },
  { fO2: 0.50, mod14: 18.0, mod16: 22.0 },
  { fO2: 0.80, mod14: 7.5, mod16: 10.0 },
  { fO2: 1.00, mod14: 4.0, mod16: 6.0 },
];

// Common gas mixes
export const gasMixes = [
  { label: 'Aire (21% O2)', fO2: 0.21 },
  { label: 'Nitrox 28 (28% O2)', fO2: 0.28 },
  { label: 'Nitrox 32 (32% O2)', fO2: 0.32 },
  { label: 'Nitrox 36 (36% O2)', fO2: 0.36 },
  { label: 'Nitrox 40 (40% O2)', fO2: 0.40 },
  { label: 'Nitrox 50 (50% O2) - Deco', fO2: 0.50 },
  { label: 'Nitrox 80 (80% O2) - Deco', fO2: 0.80 },
  { label: 'Oxígeno 100% (Deco)', fO2: 1.00 },
];

// Daily safety tips
export const safetyTips = [
  'Siempre analiza tu gas antes de cada inmersión. Si no analizaste, el gas no existe.',
  'Nunca excedas la MOD de tu mezcla. Conocer tus límites es parte del buceo técnico.',
  'Planifica el buceo y bucea el plan. Las improvisaciones bajo el agua pueden ser fatales.',
  'Revisa tu equipo antes de cada inmersión. El checklist puede salvar tu vida.',
  'Mantén un buddy siempre. El buceo solo es para profesionales con entrenamiento específico.',
  'Controla tu ascenso. Nunca superes 10m/min en ascenso libre.',
  'La regla de los tercios: 1/3 del gas para ir, 1/3 para volver, 1/3 de reserva.',
];

export function getDailyTip(): string {
  const dayOfYear = Math.floor(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return safetyTips[dayOfYear % safetyTips.length];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días, Buzo';
  if (hour < 18) return 'Buenas tardes, Buzo';
  return 'Buenas noches, Buzo';
}
