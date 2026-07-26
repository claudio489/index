/**
 * Buhlmann ZHL-16C Decompression Algorithm with Gradient Factors
 * 
 * Implementation based on:
 * - Buhlmann ZHL-16C model (1986)
 * - Erik Baker's Gradient Factors extension
 * - Verified against MultiDeco reference implementation
 * 
 * Formula: P_tol = (P_tissue - a*gf) / (gf/b + 1 - gf)
 * Reference: decotengu documentation, ApexDeco (verified against MultiDeco)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const PH2O = 0.0627; // Water vapor pressure at 37°C (bar)
const SURFACE_PRESSURE = 1.0; // bar
const LN2 = Math.log(2);

/** ZHL-16C tissue compartments for Nitrogen */
const ZHL16C_N2 = [
  { ht: 4.0,   a: 1.2599, b: 0.5050 },
  { ht: 8.0,   a: 1.0000, b: 0.6514 },
  { ht: 12.5,  a: 0.8618, b: 0.7222 },
  { ht: 18.5,  a: 0.7562, b: 0.7825 },
  { ht: 27.0,  a: 0.6200, b: 0.8126 },
  { ht: 38.3,  a: 0.5043, b: 0.8434 },
  { ht: 54.3,  a: 0.4410, b: 0.8693 },
  { ht: 77.0,  a: 0.4000, b: 0.8910 },
  { ht: 109.0, a: 0.3750, b: 0.9092 },
  { ht: 146.0, a: 0.3500, b: 0.9222 },
  { ht: 187.0, a: 0.3295, b: 0.9319 },
  { ht: 239.0, a: 0.3065, b: 0.9403 },
  { ht: 305.0, a: 0.2835, b: 0.9477 },
  { ht: 390.0, a: 0.2610, b: 0.9544 },
  { ht: 498.0, a: 0.2480, b: 0.9602 },
  { ht: 635.0, a: 0.2327, b: 0.9653 },
];

/** ZHL-16C tissue compartments for Helium */
const ZHL16C_He = [
  { ht: 1.51,  a: 1.6189, b: 0.4770 },
  { ht: 3.02,  a: 1.3830, b: 0.5747 },
  { ht: 4.72,  a: 1.1919, b: 0.6527 },
  { ht: 6.99,  a: 1.0458, b: 0.7223 },
  { ht: 10.21, a: 0.9220, b: 0.7582 },
  { ht: 14.48, a: 0.8205, b: 0.7957 },
  { ht: 20.53, a: 0.7305, b: 0.8279 },
  { ht: 29.11, a: 0.6502, b: 0.8553 },
  { ht: 41.20, a: 0.5950, b: 0.8757 },
  { ht: 55.19, a: 0.5545, b: 0.8903 },
  { ht: 70.69, a: 0.5333, b: 0.8997 },
  { ht: 90.34, a: 0.5189, b: 0.9073 },
  { ht: 115.29, a: 0.5181, b: 0.9122 },
  { ht: 147.42, a: 0.5176, b: 0.9171 },
  { ht: 188.24, a: 0.5172, b: 0.9217 },
  { ht: 240.03, a: 0.5119, b: 0.9267 },
];

// ============================================================================
// INTERFACES
// ============================================================================

export interface DecoStop {
  depth: number;
  time: number;
  gasName: string;
  o2Percent: number;
}

export interface TimelineEntry {
  time: number;
  depth: number;
  gasName: string;
  pO2: number;
  event?: string;
}

export interface DecoGas {
  fO2: number;
  fHe?: number;
  name: string;
  mod?: number;
}

export interface PlannerInput {
  depth: number;
  bottomTime: number;
  bottomGas: DecoGas;
  decoGases: DecoGas[];
  gfLow: number;
  gfHigh: number;
  descentRate?: number;
  ascentRate?: number;
  lastStopDepth?: number; // 3 (recreativo, default) o 6 (tec, sin parada de 3m)
}

export interface DivePlan {
  stops: DecoStop[];
  timeline: TimelineEntry[];
  totalDecoTime: number;
  runTime: number;
  maxCeiling: number;
  gfLow: number;
  gfHigh: number;
  gasSwitches: { depth: number; from: string; to: string }[];
  bottomGasName: string;
  cnsTotal: number;
  otuTotal: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function ambientPressure(depth: number): number {
  return SURFACE_PRESSURE + depth / 10.0;
}

function alveolarPressure(depth: number, fInert: number): number {
  return Math.max(0, (ambientPressure(depth) - PH2O) * fInert);
}

function schreiner(pi: number, palv: number, r: number, k: number, t: number): number {
  if (k * t > 100) return palv;
  return palv + r * (t - 1.0 / k) - (palv - pi - r / k) * Math.exp(-k * t);
}

function haldane(pi: number, palv: number, k: number, t: number): number {
  if (k * t > 100) return palv;
  return palv + (pi - palv) * Math.exp(-k * t);
}

/**
 * Calculate tissue ceiling using Buhlmann equation with Gradient Factors
 * Formula: P_tol = (P_tissue - a*gf) / (gf/b + 1 - gf)
 * Reference: decotengu documentation, Erik Baker's GF extension
 */
function tissueCeiling(pTissue: number, a: number, b: number, gf: number): number {
  const denom = gf / b + 1.0 - gf;
  if (denom <= 0) return Infinity;
  return (pTissue - a * gf) / denom;
}

function maxCeiling(tissuesN2: number[], tissuesHe: number[], gf: number): number {
  let maxP = 0;
  for (let i = 0; i < 16; i++) {
    const pTotal = tissuesN2[i] + tissuesHe[i];
    const a = ZHL16C_N2[i].a;
    const b = ZHL16C_N2[i].b;
    const c = tissueCeiling(pTotal, a, b, gf);
    if (c > maxP) maxP = c;
  }
  return maxP;
}

function ceilingToDepth(ceilingPressure: number): number {
  if (ceilingPressure <= SURFACE_PRESSURE) return 0;
  return (ceilingPressure - SURFACE_PRESSURE) * 10.0;
}

function roundStopDepth(depth: number, interval: number = 3): number {
  if (depth <= 0) return 0;
  return Math.ceil(depth / interval) * interval;
}

function currentGF(depth: number, firstStop: number, gfLow: number, gfHigh: number): number {
  if (firstStop <= 0) return gfHigh;
  if (depth >= firstStop) return gfLow;
  const fraction = (firstStop - depth) / firstStop;
  return gfLow + (gfHigh - gfLow) * fraction;
}

function selectGas(depth: number, bottomGas: DecoGas, decoGases: DecoGas[]): DecoGas {
  // Select the best gas for current depth
  // Use deco gas if within its MOD, otherwise use bottom gas
  const sortedDeco = [...decoGases].sort((a, b) => (b.mod ?? 999) - (a.mod ?? 999));
  for (const gas of sortedDeco) {
    if ((gas.mod ?? 999) >= depth) return gas;
  }
  return bottomGas;
}

function fN2(gas: DecoGas): number {
  return 1.0 - gas.fO2 - (gas.fHe ?? 0);
}

// ============================================================================
// CNS / OTU CALCULATIONS
// ============================================================================

/**
 * NOAA CNS limits (minutes) at various pO2 levels
 */
const CNS_LIMITS: [number, number][] = [
  [0.5, 1440], [0.6, 720], [0.7, 570], [0.8, 450], [0.9, 360],
  [1.0, 300], [1.1, 240], [1.2, 210], [1.3, 180], [1.4, 150],
  [1.5, 120], [1.6, 45],
];

function cnsLimit(pO2: number): number {
  if (pO2 <= 0.5) return Infinity;
  if (pO2 >= 1.6) return 9;
  for (let i = 0; i < CNS_LIMITS.length - 1; i++) {
    const [pLow, lLow] = CNS_LIMITS[i];
    const [pHigh, lHigh] = CNS_LIMITS[i + 1];
    if (pLow <= pO2 && pO2 <= pHigh) {
      return lLow + (lHigh - lLow) * (pO2 - pLow) / (pHigh - pLow);
    }
  }
  return 9;
}

function segmentCNS(depth: number, fO2: number, minutes: number): number {
  const pO2 = (ambientPressure(depth) - PH2O) * fO2;
  if (pO2 <= 0.5) return 0;
  const limit = cnsLimit(pO2);
  return (minutes / limit) * 100;
}

function segmentOTU(depth: number, fO2: number, minutes: number): number {
  const pO2 = (ambientPressure(depth) - PH2O) * fO2;
  if (pO2 <= 0.5) return 0;
  return minutes * Math.pow((pO2 - 0.5) / 0.5, 0.83);
}

// ============================================================================
// MAIN ALGORITHM
// ============================================================================

export function calculateDivePlan(input: PlannerInput): DivePlan {
  const {
    depth,
    bottomTime,
    bottomGas,
    decoGases,
    gfLow,
    gfHigh,
    descentRate = 20,
    ascentRate = 10,
    lastStopDepth = 3,
  } = input;

  const stops: DecoStop[] = [];
  const timeline: TimelineEntry[] = [];
  const gasSwitches: { depth: number; from: string; to: string }[] = [];

  let totalCNS = 0;
  let totalOTU = 0;
  let runtime = 0;

  // Initialize tissues with surface pressure (air saturation)
  const initN2 = alveolarPressure(0, 0.79);
  const tissuesN2: number[] = new Array(16).fill(initN2);
  const tissuesHe: number[] = new Array(16).fill(0);

  // Helper to add timeline entry
  const addTimeline = (time: number, d: number, gas: DecoGas, event?: string) => {
    const pO2 = (ambientPressure(d) - PH2O) * gas.fO2;
    timeline.push({
      time: Math.round(time),
      depth: Math.round(d * 10) / 10,
      gasName: gas.name,
      pO2: Math.round(pO2 * 100) / 100,
      event,
    });
  };

  // Punto inicial: inicio del buceo en superficie (para que el grafico arranque en 0m/0min)
  addTimeline(0, 0, bottomGas, "Inicio");

  // ---- DESCENT ----
  const descentTime = depth / descentRate;
  const descentFN2 = fN2(bottomGas);

  // CNS/OTU during descent (average depth)
  totalCNS += segmentCNS(depth / 2, bottomGas.fO2, descentTime);
  totalOTU += segmentOTU(depth / 2, bottomGas.fO2, descentTime);

  // Load tissues during descent using Schreiner equation
  for (let i = 0; i < 16; i++) {
    const k = LN2 / ZHL16C_N2[i].ht;
    const pi = tissuesN2[i];
    const palvStart = alveolarPressure(0, descentFN2);
    const palvEnd = alveolarPressure(depth, descentFN2);
    const r = (palvEnd - palvStart) / descentTime;
    tissuesN2[i] = schreiner(pi, palvEnd, r, k, descentTime);
  }

  runtime += descentTime;
  addTimeline(runtime, depth, bottomGas, "Llegada al fondo");

  // ---- BOTTOM TIME ----
  // Convencion estandar: "tiempo de fondo" se cuenta desde que se sale de superficie
  // hasta que se empieza a ascender (INCLUYE el descenso, no se suma aparte).
  // Tiempo real a profundidad maxima = bottomTime (input) - descentTime.
  const timeAtDepth = Math.max(0, bottomTime - descentTime);

  totalCNS += segmentCNS(depth, bottomGas.fO2, timeAtDepth);
  totalOTU += segmentOTU(depth, bottomGas.fO2, timeAtDepth);

  for (let i = 0; i < 16; i++) {
    const k = LN2 / ZHL16C_N2[i].ht;
    const palv = alveolarPressure(depth, descentFN2);
    tissuesN2[i] = haldane(tissuesN2[i], palv, k, timeAtDepth);
  }

  runtime += timeAtDepth;

  // ---- FIND FIRST STOP ----
  const ceilingP = maxCeiling(tissuesN2, tissuesHe, gfLow);
  const ceilingD = ceilingToDepth(ceilingP);
  const firstStop = roundStopDepth(ceilingD);

  if (firstStop <= 0) {
    // No decompression required
    const surfTime = depth / ascentRate;
    runtime += surfTime;
    addTimeline(runtime, 0, bottomGas, "Superficie");

    return {
      stops: [],
      timeline,
      totalDecoTime: 0,
      runTime: Math.round(runtime),
      maxCeiling: 0,
      gfLow,
      gfHigh,
      gasSwitches: [],
      bottomGasName: bottomGas.name,
      cnsTotal: Math.round(totalCNS * 10) / 10,
      otuTotal: Math.round(totalOTU * 10) / 10,
    };
  }

  // ---- DECOMPRESSION STOPS ----
  // Paradas cada 3m desde firstStop hasta 3m (Buhlmann standard)
  let currentDepth = depth;
  let currentGas = bottomGas;
  let targetDepth = firstStop;
  let firstStopDone = false;

  // Punto de fin de fondo (todavia a profundidad maxima, antes de ascender)
  addTimeline(runtime, currentDepth, currentGas, "Fin de fondo");

  while (targetDepth >= lastStopDepth) {
    // Ascent to stop (con el gas actual, todavia sin cambiar)
    const ascentTime = (currentDepth - targetDepth) / ascentRate;
    const avgDepth = (currentDepth + targetDepth) / 2;
    totalCNS += segmentCNS(avgDepth, currentGas.fO2, ascentTime);
    totalOTU += segmentOTU(avgDepth, currentGas.fO2, ascentTime);

    runtime += ascentTime;
    currentDepth = targetDepth;

    // Cambio de gas EN la parada (profundidad segura, no desde el fondo)
    if (!firstStopDone) {
      const bestGas = selectGas(currentDepth, bottomGas, decoGases);
      if (bestGas.name !== currentGas.name) {
        gasSwitches.push({
          depth: Math.round(currentDepth * 10) / 10,
          from: currentGas.name,
          to: bestGas.name,
        });
        addTimeline(runtime, currentDepth, bestGas, `Cambio a ${bestGas.name}`);
        currentGas = bestGas;
      }
      firstStopDone = true;
    }

    // GF for next shallower stop (3m up), o superficie si esta es la ultima parada configurada
    const nextDepth = currentDepth <= lastStopDepth ? 0 : currentDepth - 3;
    const gfNext = currentGF(nextDepth > 0 ? nextDepth : 0, firstStop, gfLow, gfHigh);

    // Off-gassing en pasos finos (0.1 min = 6seg) para no sobreestimar por redondeo
    let stopTime = 0;
    const dt = 0.1;

    // Punto de inicio de parada (para linea horizontal en grafico)
    addTimeline(runtime, currentDepth, currentGas, `Parada ${Math.round(currentDepth)}m`);
    const palv = alveolarPressure(currentDepth, fN2(currentGas));

    while (true) {
      const ceilingPN = maxCeiling(tissuesN2, tissuesHe, gfNext);
      const ceilingDN = ceilingToDepth(ceilingPN);

      // Can ascend to next stop?
      if (ceilingDN <= nextDepth || stopTime > 90) {
        break;
      }

      // Off-gas for dt minutes using Haldane
      for (let i = 0; i < 16; i++) {
        const k = LN2 / ZHL16C_N2[i].ht;
        tissuesN2[i] = haldane(tissuesN2[i], palv, k, dt);
      }

      // CNS/OTU for this step
      totalCNS += segmentCNS(currentDepth, currentGas.fO2, dt);
      totalOTU += segmentOTU(currentDepth, currentGas.fO2, dt);

      stopTime += dt;
      runtime += dt;
    }

    // Redondear al minuto mas cercano (no siempre hacia arriba) para mostrar en la tabla
    const stopTimeRounded = Math.round(stopTime);

    // Punto de fin de parada (cierra la linea horizontal en el grafico, con el tiempo real preciso)
    addTimeline(runtime, currentDepth, currentGas, `Parada ${Math.round(currentDepth)}m`);

    stops.push({
      depth: Math.round(currentDepth),
      time: stopTimeRounded,
      gasName: currentGas.name,
      o2Percent: Math.round(currentGas.fO2 * 100),
    });

    targetDepth = nextDepth;
  }

  // Final ascent to surface
  const finalAscentTime = currentDepth / ascentRate;
  totalCNS += segmentCNS(currentDepth / 2, currentGas.fO2, finalAscentTime);
  totalOTU += segmentOTU(currentDepth / 2, currentGas.fO2, finalAscentTime);
  runtime += finalAscentTime;
  addTimeline(runtime, 0, currentGas, "Superficie");

  const totalDecoTime = stops.reduce((sum, s) => sum + s.time, 0);

  return {
    stops,
    timeline,
    totalDecoTime,
    runTime: Math.round(runtime),
    maxCeiling: Math.round(ceilingD),
    gfLow,
    gfHigh,
    gasSwitches,
    bottomGasName: bottomGas.name,
    cnsTotal: Math.round(totalCNS * 10) / 10,
    otuTotal: Math.round(totalOTU * 10) / 10,
  };
}

/**
 * Plan de contingencia: mismo algoritmo que calculateDivePlan pero forzando
 * decoGases vacio (sin EAN50/O2), para el escenario "se me perdio el gas de deco".
 */
export function calculateNo50Plan(input: PlannerInput): DivePlan {
  return calculateDivePlan({ ...input, decoGases: [] });
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export function calculateMOD(fO2: number, maxPO2: number = 1.4): number {
  return Math.floor((maxPO2 / fO2 - 1) * 10);
}

export function calculateEAD(depth: number, fO2: number): number {
  const fN2 = 1 - fO2;
  return Math.round(((fN2 / 0.79) * (depth + 10) - 10) * 10) / 10;
}

export function calculateBestMix(depth: number, maxPO2: number = 1.4): number {
  return Math.round((maxPO2 / (1 + depth / 10)) * 100);
}

export function calculatePPN2(depth: number, fO2: number): number {
  const fN2 = 1 - fO2;
  return Math.round(fN2 * (1 + depth / 10) * 100) / 100;
}

export { ZHL16C_N2, ZHL16C_He };