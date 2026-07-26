# ============================================================
# Dive Tools - Fix v3 (sobreescribir archivos completos)
# Ejecutar desde: C:\Users\csilv\Downloads\IndexApp
# ============================================================

$ErrorActionPreference = "Stop"
$base = "C:\Users\csilv\Downloads\IndexApp"
Set-Location $base

Write-Host "=== Sobreescribiendo buhlmann.ts con fixes 1+2 ===" -ForegroundColor Cyan

$buhlmann = @'
/**
 * Buhlmann ZHL-16C Decompression Algorithm with Gradient Factors
 */

const PH2O = 0.0627;
const SURFACE_PRESSURE = 1.0;
const LN2 = Math.log(2);

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

function tissueCeiling(pTissue: number, a: number, b: number, gf: number): number {
  const denom = gf / b + 1.0 - gf;
  if (denom <= 0) return Infinity;
  return (pTissue - a * gf) / denom;
}

function maxCeiling(tissuesN2: number[], tissuesHe: number[], gf: number): number {
  let maxP = 0;
  for (let i = 0; i < 16; i++) {
    const pTotal = tissuesN2[i] + tissuesHe[i];
    const c = tissueCeiling(pTotal, ZHL16C_N2[i].a, ZHL16C_N2[i].b, gf);
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
  const sortedDeco = [...decoGases].sort((a, b) => (b.mod ?? 999) - (a.mod ?? 999));
  for (const gas of sortedDeco) {
    if ((gas.mod ?? 999) >= depth) return gas;
  }
  return bottomGas;
}

function fN2(gas: DecoGas): number {
  return 1.0 - gas.fO2 - (gas.fHe ?? 0);
}

const CNS_LIMITS: [number, number][] = [
  [0.5, 120], [0.6, 80], [0.7, 57], [0.8, 45], [0.9, 36],
  [1.0, 30], [1.1, 25], [1.2, 21], [1.3, 18], [1.4, 15],
  [1.5, 12], [1.6, 9],
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

export function calculateDivePlan(input: PlannerInput): DivePlan {
  const {
    depth, bottomTime, bottomGas, decoGases,
    gfLow, gfHigh, descentRate = 20, ascentRate = 10,
  } = input;

  const stops: DecoStop[] = [];
  const timeline: TimelineEntry[] = [];
  const gasSwitches: { depth: number; from: string; to: string }[] = [];
  let totalCNS = 0, totalOTU = 0, runtime = 0;

  const initN2 = alveolarPressure(0, 0.79);
  const tissuesN2: number[] = new Array(16).fill(initN2);
  const tissuesHe: number[] = new Array(16).fill(0);

  const addTimeline = (time: number, d: number, gas: DecoGas, event?: string) => {
    const pO2 = (ambientPressure(d) - PH2O) * gas.fO2;
    timeline.push({
      time: Math.round(time), depth: Math.round(d * 10) / 10,
      gasName: gas.name, pO2: Math.round(pO2 * 100) / 100, event,
    });
  };

  // ---- DESCENT ----
  const descentTime = depth / descentRate;
  const descentFN2 = fN2(bottomGas);
  totalCNS += segmentCNS(depth / 2, bottomGas.fO2, descentTime);
  totalOTU += segmentOTU(depth / 2, bottomGas.fO2, descentTime);

  for (let i = 0; i < 16; i++) {
    const k = LN2 / ZHL16C_N2[i].ht;
    const palvStart = alveolarPressure(0, descentFN2);
    const palvEnd = alveolarPressure(depth, descentFN2);
    const r = (palvEnd - palvStart) / descentTime;
    tissuesN2[i] = schreiner(tissuesN2[i], palvEnd, r, k, descentTime);
  }

  // FIX 1: Punto de superficie para que el grafico parta de 0m
  addTimeline(0, 0, bottomGas, "Superficie");
  runtime += descentTime;
  addTimeline(runtime, depth, bottomGas, "Llegada al fondo");

  // ---- BOTTOM TIME ----
  totalCNS += segmentCNS(depth, bottomGas.fO2, bottomTime);
  totalOTU += segmentOTU(depth, bottomGas.fO2, bottomTime);
  for (let i = 0; i < 16; i++) {
    const k = LN2 / ZHL16C_N2[i].ht;
    tissuesN2[i] = haldane(tissuesN2[i], alveolarPressure(depth, descentFN2), k, bottomTime);
  }
  runtime += bottomTime;

  // ---- FIND FIRST STOP ----
  const ceilingP = maxCeiling(tissuesN2, tissuesHe, gfLow);
  const ceilingD = ceilingToDepth(ceilingP);
  const firstStop = roundStopDepth(ceilingD);

  if (firstStop <= 0) {
    const surfTime = depth / ascentRate;
    runtime += surfTime;
    addTimeline(runtime, 0, bottomGas, "Superficie");
    return {
      stops: [], timeline, totalDecoTime: 0, runTime: Math.round(runtime),
      maxCeiling: 0, gfLow, gfHigh, gasSwitches: [],
      bottomGasName: bottomGas.name, cnsTotal: Math.round(totalCNS * 10) / 10,
      otuTotal: Math.round(totalOTU * 10) / 10,
    };
  }

  // ---- DECOMPRESSION STOPS ----
  // FIX 4: Gas switch DESPUES de ascender, NO desde el fondo
  let currentDepth = depth;
  let currentGas = bottomGas;
  let targetDepth = firstStop;
  let firstStopDone = false;

  while (targetDepth >= 3) {
    // Ascent to stop (con bottom gas, antes de cualquier switch)
    const ascentTime = (currentDepth - targetDepth) / ascentRate;
    const avgDepth = (currentDepth + targetDepth) / 2;
    totalCNS += segmentCNS(avgDepth, currentGas.fO2, ascentTime);
    totalOTU += segmentOTU(avgDepth, currentGas.fO2, ascentTime);

    runtime += ascentTime;
    currentDepth = targetDepth;

    // Gas switch EN la parada (despues de ascender)
    if (!firstStopDone) {
      const bestGas = selectGas(targetDepth, bottomGas, decoGases);
      if (bestGas.name !== currentGas.name) {
        gasSwitches.push({
          depth: Math.round(targetDepth * 10) / 10,
          from: currentGas.name, to: bestGas.name,
        });
        addTimeline(runtime, targetDepth, bestGas, `Cambio a ${bestGas.name}`);
        currentGas = bestGas;
      }
      firstStopDone = true;
    }

    // GF for next shallower stop
    const nextDepth = Math.max(0, targetDepth - 3);
    const gfNext = currentGF(nextDepth > 0 ? nextDepth : 0, firstStop, gfLow, gfHigh);

    // Minute-by-minute off-gassing at stop
    let stopTime = 0;
    addTimeline(runtime, currentDepth, currentGas, `Parada ${Math.round(currentDepth)}m`);
    const palv = alveolarPressure(currentDepth, fN2(currentGas));

    while (true) {
      const ceilingPN = maxCeiling(tissuesN2, tissuesHe, gfNext);
      const ceilingDN = ceilingToDepth(ceilingPN);
      if (ceilingDN <= nextDepth || stopTime > 90) break;

      for (let i = 0; i < 16; i++) {
        const k = LN2 / ZHL16C_N2[i].ht;
        tissuesN2[i] = haldane(tissuesN2[i], palv, k, 1.0);
      }
      totalCNS += segmentCNS(currentDepth, currentGas.fO2, 1);
      totalOTU += segmentOTU(currentDepth, currentGas.fO2, 1);
      stopTime++;
      runtime++;
      addTimeline(runtime, currentDepth, currentGas, `Parada ${Math.round(currentDepth)}m`);
    }

    stops.push({
      depth: Math.round(currentDepth), time: stopTime,
      gasName: currentGas.name, o2Percent: Math.round(currentGas.fO2 * 100),
    });

    targetDepth = nextDepth;
  }

  // Final ascent
  const finalAscentTime = currentDepth / ascentRate;
  totalCNS += segmentCNS(currentDepth / 2, currentGas.fO2, finalAscentTime);
  totalOTU += segmentOTU(currentDepth / 2, currentGas.fO2, finalAscentTime);
  runtime += finalAscentTime;
  addTimeline(runtime, 0, currentGas, "Superficie");

  const totalDecoTime = stops.reduce((sum, s) => sum + s.time, 0);

  return {
    stops, timeline, totalDecoTime, runTime: Math.round(runtime),
    maxCeiling: Math.round(ceilingD), gfLow, gfHigh, gasSwitches,
    bottomGasName: bottomGas.name, cnsTotal: Math.round(totalCNS * 10) / 10,
    otuTotal: Math.round(totalOTU * 10) / 10,
  };
}

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
'@

Set-Content "$base\src\lib\buhlmann.ts" $buhlmann -Encoding UTF8
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== Sobreescribiendo DecoTable.tsx con fixes 3+4 ===" -ForegroundColor Cyan

$decoTable = @'
import { Timer, ArrowDown, Anchor, Home, AlertTriangle } from 'lucide-react';
import type { DecoStop, TimelineEntry } from '../lib/buhlmann';

interface DecoTableProps {
  timeline: TimelineEntry[];
  stops: DecoStop[];
  totalDecoTime: number;
  runTime: number;
}

interface DisplayRow {
  phase: 'desc' | 'bottom' | 'stop' | 'switch' | 'surf';
  depth: number;
  time: string;
  gas: string;
  pO2: number;
  note?: string;
}

function calcPO2(depth: number, gasName: string): number {
  const fO2 = gasName === 'EAN50' ? 0.5 : gasName === 'O2 80%' ? 0.8 : gasName === 'O2 100%' ? 1.0 : 0.21;
  return Math.round(((1 + depth / 10 - 0.0627) * fO2) * 100) / 100;
}

function formatTime(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded}:00`;
}

function buildDisplayRows(timeline: TimelineEntry[], stops: DecoStop[]): DisplayRow[] {
  const rows: DisplayRow[] = [];
  if (!timeline || timeline.length < 2) return rows;

  const maxDepth = Math.max(...timeline.map(t => t.depth));
  const bottomGas = timeline[0].gasName ?? 'Aire';

  // 1. DESCENSO
  const descentEndIdx = timeline.findIndex(t => t.depth >= maxDepth * 0.95);
  if (descentEndIdx > 0) {
    const duration = timeline[descentEndIdx].time - timeline[0].time;
    rows.push({
      phase: 'desc', depth: maxDepth, time: formatTime(duration),
      gas: bottomGas, pO2: calcPO2(maxDepth, bottomGas),
      note: `\u2192 ${maxDepth}m`,
    });
  }

  // 2. FONDO
  const bottomStart = descentEndIdx > 0 ? descentEndIdx : 0;
  let bottomEnd = timeline.length - 1;
  const gasSwitchIdx = timeline.findIndex((t, i) => i > bottomStart && t.gasName !== bottomGas);
  if (gasSwitchIdx > 0) {
    bottomEnd = gasSwitchIdx;
  } else if (stops.length > 0) {
    const firstStopDepth = stops[stops.length - 1].depth;
    for (let i = bottomStart; i < timeline.length; i++) {
      if (timeline[i].depth <= firstStopDepth + 3) {
        bottomEnd = i; break;
      }
    }
  }

  const bottomDuration = timeline[bottomEnd].time - timeline[bottomStart].time;
  if (bottomDuration > 0.5) {
    rows.push({
      phase: 'bottom', depth: maxDepth, time: formatTime(bottomDuration),
      gas: bottomGas, pO2: calcPO2(maxDepth, bottomGas),
    });
  }

  // 3. GAS SWITCH (con profundidad)
  if (gasSwitchIdx > 0) {
    const switchDepth = timeline[gasSwitchIdx].depth;
    const decoGas = timeline[gasSwitchIdx].gasName ?? 'EAN50';
    rows.push({
      phase: 'switch', depth: switchDepth, time: '-',
      gas: decoGas, pO2: calcPO2(switchDepth, decoGas),
      note: `${switchDepth}m \u2192 ${decoGas}`,
    });
  }

  // 4. PARADAS (Math.ceil para tiempos enteros)
  const sortedStops = [...stops].sort((a, b) => b.depth - a.depth);
  for (const stop of sortedStops) {
    rows.push({
      phase: 'stop', depth: stop.depth,
      time: `${Math.max(1, Math.ceil(stop.time))}:00`,
      gas: stop.gasName ?? 'EAN50',
      pO2: calcPO2(stop.depth, stop.gasName ?? 'EAN50'),
    });
  }

  // 5. SUPERFICIE
  const last = timeline[timeline.length - 1];
  if (last && last.depth === 0) {
    rows.push({
      phase: 'surf', depth: 0, time: `${Math.round(last.time)} min`,
      gas: '-', pO2: 0,
    });
  }

  return rows;
}

function getPhaseIcon(phase: string) {
  switch (phase) {
    case 'desc': return <ArrowDown className="w-4 h-4 text-blue-400" />;
    case 'bottom': return <Anchor className="w-4 h-4 text-cyan-400" />;
    case 'stop': return <Timer className="w-4 h-4 text-amber-400" />;
    case 'switch': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    case 'surf': return <Home className="w-4 h-4 text-green-400" />;
    default: return null;
  }
}

function getPhaseLabel(phase: string) {
  switch (phase) {
    case 'desc': return 'DESC';
    case 'bottom': return 'FONDO';
    case 'stop': return 'PARADA';
    case 'switch': return 'SWITCH';
    case 'surf': return 'SUPERFICIE';
    default: return phase;
  }
}

function getPhaseClass(phase: string) {
  switch (phase) {
    case 'desc': return 'bg-blue-500/10 text-blue-300';
    case 'bottom': return 'bg-cyan-500/10 text-cyan-300';
    case 'stop': return 'bg-amber-500/10 text-amber-300';
    case 'switch': return 'bg-orange-500/10 text-orange-300';
    case 'surf': return 'bg-green-500/10 text-green-300';
    default: return '';
  }
}

export default function DecoTable({ timeline, stops, totalDecoTime, runTime }: DecoTableProps) {
  const rows = buildDisplayRows(timeline, stops);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-ocean-dark border border-ocean-surface/20 rounded-lg p-2">
          <div className="text-text-secondary text-xs">Runtime</div>
          <div className="text-text-primary text-lg font-bold">{runTime} min</div>
        </div>
        <div className="bg-ocean-dark border border-ocean-surface/20 rounded-lg p-2">
          <div className="text-text-secondary text-xs">Deco</div>
          <div className="text-amber-400 text-lg font-bold">{totalDecoTime} min</div>
        </div>
        <div className="bg-ocean-dark border border-ocean-surface/20 rounded-lg p-2">
          <div className="text-text-secondary text-xs">Paradas</div>
          <div className="text-text-primary text-lg font-bold">{stops.length}</div>
        </div>
      </div>

      <div className="bg-ocean-dark border border-ocean-surface/20 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ocean-surface/20 text-text-secondary text-xs">
              <th className="text-left p-2">Fase</th>
              <th className="text-right p-2">Prof</th>
              <th className="text-right p-2">Tiempo</th>
              <th className="text-left p-2">Gas</th>
              <th className="text-right p-2">pO2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-ocean-surface/10 ${getPhaseClass(row.phase)}`}>
                <td className="p-2 flex items-center gap-1.5">
                  {getPhaseIcon(row.phase)}
                  <span className="font-medium">{getPhaseLabel(row.phase)}</span>
                </td>
                <td className="text-right p-2 font-mono">
                  {row.note ?? `${row.depth}m`}
                </td>
                <td className="text-right p-2 font-mono">{row.time}</td>
                <td className="p-2">{row.gas}</td>
                <td className="text-right p-2 font-mono">
                  <span className={row.pO2 > 1.4 ? 'text-red-400 font-bold' : row.pO2 > 1.2 ? 'text-yellow-400' : ''}>
                    {row.pO2 > 0 ? row.pO2.toFixed(2) : '-'}
                  </span>
                  {row.pO2 > 1.4 && <span className="text-red-500 ml-1">!</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'@

Set-Content "$base\src\components\DecoTable.tsx" $decoTable -Encoding UTF8
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== BUILD ===" -ForegroundColor Cyan
npm run build 2>&1

Write-Host "`n=== LISTO ===" -ForegroundColor Green
