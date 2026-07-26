/**
 * Buhlmann ZHL-16C with Gradient Factors
 * Technical dive decompression algorithm
 */

const ZHL16C_TISSUES = [
  { ht: 4.0,   a: 1.2599,  b: 0.5050 },
  { ht: 5.0,   a: 1.0000,  b: 0.4344 },
  { ht: 8.0,   a: 0.6128,  b: 0.3047 },
  { ht: 12.5,  a: 0.4556,  b: 0.2335 },
  { ht: 18.5,  a: 0.3717,  b: 0.1919 },
  { ht: 27.0,  a: 0.3198,  b: 0.1663 },
  { ht: 38.3,  a: 0.2852,  b: 0.1485 },
  { ht: 54.3,  a: 0.2594,  b: 0.1353 },
  { ht: 77.0,  a: 0.2392,  b: 0.1248 },
  { ht: 109.0, a: 0.2231,  b: 0.1165 },
  { ht: 146.0, a: 0.2110,  b: 0.1102 },
  { ht: 187.0, a: 0.2015,  b: 0.1054 },
  { ht: 239.0, a: 0.1932,  b: 0.1011 },
  { ht: 305.0, a: 0.1858,  b: 0.0973 },
  { ht: 390.0, a: 0.1791,  b: 0.0937 },
  { ht: 498.0, a: 0.1731,  b: 0.0905 },
  { ht: 635.0, a: 0.1676,  b: 0.0876 },
];

export interface TimelineEntry {
  runTime: number;
  depth: number;
  phase: 'surface' | 'descent' | 'bottom' | 'ascent' | 'deco' | 'safety' | 'gas-switch';
  notes: string;
  gas?: string;
  po2?: number;
}

export interface DecoStop {
  depth: number;
  time: number;
  gas: string;
  runTime: number;
  po2: number;
  cnsPercent: number;
}

export interface DecoGas {
  fO2: number;
  fHe: number;
  name: string;
  mod: number;
}

export interface DivePlan {
  stops: DecoStop[];
  timeline: TimelineEntry[];
  totalDecoTime: number;
  runTime: number;
  maxCeiling: number;
  gfLow: number;
  gfHigh: number;
  gasSwitches: { runTime: number; depth: number; from: string; to: string }[];
  bottomGasName: string;
}

interface TissueState { pN2: number; }

function depthToPressure(depth: number): number { return depth / 10 + 1; }
function pressureToDepth(pressure: number): number { return Math.max(0, (pressure - 1) * 10); }

function schreinerLoad(pInitial: number, pAlveolar: number, halfTime: number, time: number, descentRate: number): number {
  const k = Math.LN2 / halfTime;
  const rate = descentRate / 10;
  return pAlveolar + rate * (time - 1 / k) - (pAlveolar - pInitial - rate / k) * Math.exp(-k * time);
}

function haldaneLoad(pInitial: number, pAlveolar: number, halfTime: number, time: number): number {
  const k = Math.LN2 / halfTime;
  return pInitial + (pAlveolar - pInitial) * (1 - Math.exp(-k * time));
}

function tissueCeiling(pN2: number, a: number, b: number, gf: number): number {
  return (pN2 - a * gf) / (gf / b + 1 - gf);
}

function calculateCeiling(tissues: TissueState[], gf: number): number {
  let maxP = 0;
  for (let i = 0; i < tissues.length; i++) {
    const p = tissueCeiling(tissues[i].pN2, ZHL16C_TISSUES[i].a, ZHL16C_TISSUES[i].b, gf);
    maxP = Math.max(maxP, p);
  }
  return maxP;
}

function gfAtDepth(currentDepth: number, firstStopDepth: number, gfLow: number, gfHigh: number): number {
  if (firstStopDepth <= 0) return gfHigh;
  const sp = 1;
  const cp = depthToPressure(currentDepth);
  const fp = depthToPressure(firstStopDepth);
  const ratio = Math.max(0, Math.min(1, (fp - cp) / (fp - sp)));
  return gfLow + (gfHigh - gfLow) * ratio;
}

function initializeTissues(): TissueState[] {
  return ZHL16C_TISSUES.map(() => ({ pN2: 0.79 }));
}

function getFN2(fO2: number, fHe: number = 0): number { return 1 - fO2 - fHe; }

function getGasName(fO2: number, fHe?: number): string {
  if (fHe && fHe > 0) return `TMX ${Math.round(fO2 * 100)}/${Math.round(fHe * 100)}`;
  if (fO2 >= 0.99) return 'O2 100%';
  if (fO2 === 0.21) return 'Aire';
  return `EANx${Math.round(fO2 * 100)}`;
}

function calcCNS(po2: number, time: number): number {
  if (po2 <= 0.5) return 0;
  const limits = [
    { max: 0.6, lim: 300 }, { max: 0.7, lim: 240 }, { max: 0.8, lim: 180 },
    { max: 0.9, lim: 150 }, { max: 1.0, lim: 120 }, { max: 1.1, lim: 90 },
    { max: 1.2, lim: 60 },  { max: 1.3, lim: 45 },  { max: 1.4, lim: 45 },
    { max: 1.5, lim: 30 },  { max: 1.6, lim: 15 },
  ];
  for (const e of limits) if (po2 <= e.max) return (time / e.lim) * 100;
  return (time / 15) * 100;
}

export interface PlannerInput {
  depth: number;
  bottomTime: number;
  bottomGas: { fO2: number; fHe: number };
  decoGases: DecoGas[];
  gfLow: number;
  gfHigh: number;
  descentRate: number;
  ascentRate: number;
}

/**
 * Calculate a full decompression plan with deco gases
 */
export function calculateDivePlan(input: PlannerInput): DivePlan {
  return _calculatePlan(input, true);
}

/**
 * Calculate a No 50% contingency plan - no deco gases, back gas only
 */
export function calculateNo50Plan(input: PlannerInput): DivePlan {
  return _calculatePlan({ ...input, decoGases: [] }, false);
}

function _calculatePlan(input: PlannerInput, useDecoGases: boolean): DivePlan {
  const { depth, bottomTime, bottomGas, decoGases, gfLow, gfHigh, descentRate, ascentRate } = input;
  let tissues = initializeTissues();
  let runTime = 0;
  const timeline: TimelineEntry[] = [];
  const stops: DecoStop[] = [];
  let totalCNS = 0;
  const bottomGasName = getGasName(bottomGas.fO2, bottomGas.fHe);

  // Minute 0: Surface
  timeline.push({
    runTime: 0, depth: 0, phase: 'surface', notes: 'Inicio - Superficie',
    gas: bottomGasName, po2: 0.21,
  });

  // Descent
  const descentTime = depth / descentRate;
  const dtRounded = Math.max(1, Math.round(descentTime));
  const bottomPA = depthToPressure(depth);
  const bottomFN2 = getFN2(bottomGas.fO2, bottomGas.fHe);
  const bottomPAlv = bottomPA * bottomFN2;

  for (let i = 0; i < tissues.length; i++) {
    tissues[i].pN2 = schreinerLoad(tissues[i].pN2, bottomPAlv, ZHL16C_TISSUES[i].ht, descentTime, descentRate);
  }

  for (let m = 1; m <= dtRounded; m++) {
    const d = Math.round((m / dtRounded) * depth);
    const pa = depthToPressure(d);
    timeline.push({
      runTime: m, depth: d, phase: 'descent', notes: `Descenso`,
      gas: bottomGasName, po2: Math.round(pa * bottomGas.fO2 * 100) / 100,
    });
  }
  runTime = dtRounded;

  // Bottom time
  for (let i = 0; i < tissues.length; i++) {
    tissues[i].pN2 = haldaneLoad(tissues[i].pN2, bottomPAlv, ZHL16C_TISSUES[i].ht, bottomTime);
  }

  // Log each minute of bottom
  for (let m = 0; m <= bottomTime; m++) {
    const t = m === 0 ? runTime : runTime + m;
    const note = m === 0 ? `Fondo ${depth}m - inicio` : (m === bottomTime ? `Fondo - final` : `Fondo`);
    timeline.push({
      runTime: t, depth, phase: 'bottom', notes: note,
      gas: bottomGasName, po2: Math.round(bottomPA * bottomGas.fO2 * 100) / 100,
    });
  }
  runTime += bottomTime;

  // Calculate first stop with GF Low
  const fsp = calculateCeiling(tissues, gfLow / 100);
  const firstStopDepth = Math.max(3, Math.ceil(pressureToDepth(fsp) / 3) * 3);

  // Available deco gases (only if useDecoGases is true)
  const sortedDecoGases = useDecoGases ? [...decoGases].sort((a, b) => b.mod - a.mod) : [];
  const currentGas = { ...bottomGas };
  let currentGasName = bottomGasName;
  const gasSwitches: DivePlan['gasSwitches'] = [];

  // Ascent to first stop
  if (firstStopDepth < depth) {
    const ascTime = (depth - firstStopDepth) / ascentRate;
    const ascRounded = Math.max(1, Math.round(ascTime));
    const midDepth = (depth + firstStopDepth) / 2;
    const midPA = depthToPressure(midDepth);

    for (let i = 0; i < tissues.length; i++) {
      tissues[i].pN2 = haldaneLoad(tissues[i].pN2, midPA * bottomFN2, ZHL16C_TISSUES[i].ht, ascTime);
    }

    const switchGas = sortedDecoGases.find(g => firstStopDepth <= g.mod);
    if (switchGas) {
      const newName = getGasName(switchGas.fO2, switchGas.fHe);
      if (newName !== currentGasName) {
        gasSwitches.push({ runTime, depth: firstStopDepth, from: currentGasName, to: newName });
        currentGas.fO2 = switchGas.fO2;
        currentGas.fHe = switchGas.fHe;
        currentGasName = newName;
        const idx = sortedDecoGases.indexOf(switchGas);
        if (idx >= 0) sortedDecoGases.splice(idx, 1);
      }
    }

    timeline.push({
      runTime: runTime + ascRounded, depth: firstStopDepth, phase: 'ascent',
      notes: `Ascenso a ${firstStopDepth}m`, gas: currentGasName,
      po2: Math.round(depthToPressure(firstStopDepth) * currentGas.fO2 * 100) / 100,
    });
    runTime += ascRounded;
  }

  // Deco stops - 3m increments
  let currentDepth = firstStopDepth;

  while (currentDepth > 0) {
    const nextDepth = Math.max(0, currentDepth - 3);
    const nextPA = depthToPressure(nextDepth);

    const canAscend = () => {
      const testGF = nextDepth > 0 ? gfAtDepth(nextDepth, firstStopDepth, gfLow / 100, gfHigh / 100) : gfHigh / 100;
      for (let i = 0; i < tissues.length; i++) {
        if (tissueCeiling(tissues[i].pN2, ZHL16C_TISSUES[i].a, ZHL16C_TISSUES[i].b, testGF) > nextPA) return false;
      }
      return true;
    };

    const currentFN2 = getFN2(currentGas.fO2, currentGas.fHe || 0);
    const currentPA = depthToPressure(currentDepth);
    const pAlv = currentPA * currentFN2;
    let stopTime = 0;
    const step = 0.5;

    while (!canAscend() && stopTime < 60) {
      stopTime += step;
      for (let i = 0; i < tissues.length; i++) {
        tissues[i].pN2 = haldaneLoad(tissues[i].pN2, pAlv, ZHL16C_TISSUES[i].ht, step);
      }
    }

    stopTime = Math.max(1, Math.ceil(stopTime));
    const po2 = currentPA * currentGas.fO2;
    const cns = calcCNS(po2, stopTime);
    totalCNS += cns;

    const phase = currentDepth === 5 ? 'safety' : 'deco';

    stops.push({
      depth: currentDepth, time: stopTime, gas: currentGasName,
      runTime, po2: Math.round(po2 * 100) / 100,
      cnsPercent: Math.min(100, Math.round(totalCNS * 10) / 10),
    });

    // Log each minute of the stop
    for (let m = 0; m <= stopTime; m++) {
      const note = m === 0 ? `Parada ${currentDepth}m - inicio (${stopTime}m)` : (m === stopTime ? `Parada ${currentDepth}m - fin` : `Parada ${currentDepth}m`);
      timeline.push({
        runTime: runTime + m, depth: currentDepth, phase, notes: note,
        gas: currentGasName, po2: Math.round(po2 * 100) / 100,
      });
    }
    runTime += stopTime;

    // FIX: Tissues already updated in the while (!canAscend()) loop above
    // The while loop increments stopTime and calls haldaneLoad for each 0.5min step
    // Calling haldaneLoad again here would double-count off-gassing (BUG)
    // This caused shorter deco times than safe - DANGEROUS

    // Ascent to next stop
    if (currentDepth > 0) {
      const ascSeg = Math.min(3, currentDepth);
      const ascTime = ascSeg / ascentRate;
      const prevDepth = currentDepth;
      currentDepth = Math.max(0, currentDepth - 3);

      const fromPA = depthToPressure(prevDepth);
      const toPA = depthToPressure(currentDepth);
      const avgPA = (fromPA + toPA) / 2;

      for (let i = 0; i < tissues.length; i++) {
        tissues[i].pN2 = haldaneLoad(tissues[i].pN2, avgPA * currentFN2, ZHL16C_TISSUES[i].ht, ascTime);
      }

      if (currentDepth > 0) {
        const nextGas = sortedDecoGases.find(g => currentDepth <= g.mod);
        if (nextGas) {
          const newName = getGasName(nextGas.fO2, nextGas.fHe);
          if (newName !== currentGasName) {
            gasSwitches.push({ runTime, depth: currentDepth, from: currentGasName, to: newName });
            currentGas.fO2 = nextGas.fO2;
            currentGas.fHe = nextGas.fHe;
            currentGasName = newName;
            const idx = sortedDecoGases.indexOf(nextGas);
            if (idx >= 0) sortedDecoGases.splice(idx, 1);

            timeline.push({
              runTime, depth: currentDepth, phase: 'gas-switch',
              notes: `Cambio gas: ${newName}`, gas: newName,
              po2: Math.round(depthToPressure(currentDepth) * currentGas.fO2 * 100) / 100,
            });
          }
        }
      }

      const ascRounded = Math.max(1, Math.round(ascTime));
      if (currentDepth > 0) {
        timeline.push({
          runTime: runTime + ascRounded, depth: currentDepth, phase: 'ascent',
          notes: `Ascenso a ${currentDepth}m`, gas: currentGasName,
          po2: Math.round(depthToPressure(currentDepth) * currentGas.fO2 * 100) / 100,
        });
        runTime += ascRounded;
      }
    }

    if (currentDepth <= 0) break;
  }

  // Surface end
  timeline.push({
    runTime, depth: 0, phase: 'surface', notes: 'Fin - Superficie',
    gas: currentGasName, po2: Math.round(currentGas.fO2 * 100) / 100,
  });

  const totalDecoTime = stops.reduce((s, st) => s + st.time, 0);

  return {
    stops, timeline, totalDecoTime, runTime: Math.round(runTime),
    maxCeiling: firstStopDepth, gfLow, gfHigh, gasSwitches, bottomGasName,
  };
}

/**
 * Generate smooth profile chart data points
 * Creates a continuous depth curve by linearly interpolating between timeline entries.
 * Outputs one point every 0.5 minutes for a smooth line chart.
 */
export function generateSmoothProfile(plan: DivePlan): { time: number; depth: number; phase: string }[] {
  if (!plan.timeline || plan.timeline.length === 0) return [{ time: 0, depth: 0, phase: 'surface' }];

  const points: { time: number; depth: number; phase: string }[] = [];
  const sorted = [...plan.timeline].sort((a, b) => a.runTime - b.runTime);
  const maxTime = sorted[sorted.length - 1].runTime;

  // Generate a point every 0.5 minutes
  const step = 0.5;
  for (let t = 0; t <= maxTime + step; t += step) {
    const time = Math.round(t * 10) / 10;
    if (time > maxTime) break;

    // Find the two timeline entries that bracket this time
    let before = sorted[0];
    let after = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (time >= sorted[i].runTime && time <= sorted[i + 1].runTime) {
        before = sorted[i];
        after = sorted[i + 1];
        break;
      }
    }

    if (before.runTime === after.runTime || after.runTime - before.runTime === 0) {
      // Exact match on a timeline point
      points.push({ time, depth: before.depth, phase: before.phase });
    } else {
      // Linear interpolation of depth between the two bracketing points
      const ratio = (time - before.runTime) / (after.runTime - before.runTime);
      const interpolatedDepth = before.depth + (after.depth - before.depth) * ratio;
      // Use the phase of the "before" point, except for surface at the end
      let phase = before.phase;
      if (interpolatedDepth < 0.5 && time > maxTime * 0.8) phase = 'surface';
      points.push({ time, depth: Math.round(interpolatedDepth * 10) / 10, phase });
    }
  }

  // Ensure surface end point
  const lastPoint = points[points.length - 1];
  if (lastPoint && lastPoint.depth > 0.5) {
    points.push({ time: maxTime, depth: 0, phase: 'surface' });
  }

  return points;
}

/**
 * Generate timeline table text for QR code / sharing
 */
export function generatePlanText(plan: DivePlan, diverName: string, depth: number, bottomTime: number): string {
  let text = `Dive Tools\n${diverName || 'Plan de Buceo'}\n`;
  text += `Prof:${depth}m Fondo:${bottomTime}min\n`;
  text += `GF:${plan.gfLow}/${plan.gfHigh} Runtime:${plan.runTime}m\n`;
  text += `Deco:${plan.totalDecoTime}m Gas:${plan.bottomGasName}\n\n`;

  // Timeline
  const uniqueEntries = plan.timeline.filter((t, i, arr) => {
    if (i === 0) return true;
    const prev = arr[i - 1];
    return t.phase !== prev.phase || t.depth !== prev.depth || t.gas !== prev.gas || t.phase === 'gas-switch';
  });

  for (const entry of uniqueEntries) {
    const phaseChar = entry.phase === 'surface' ? 'S' : entry.phase === 'descent' ? '>' : entry.phase === 'bottom' ? 'B' : entry.phase === 'ascent' ? '^' : entry.phase === 'gas-switch' ? 'G' : entry.phase === 'safety' ? '!' : 'D';
    text += `R${entry.runTime}m ${entry.depth}m [${phaseChar}] ${entry.gas || ''} PO2:${entry.po2?.toFixed(2) || '-'}\n`;
  }

  text += `\nBuhlmann ZHL-16C GF `;
  return text;
}


