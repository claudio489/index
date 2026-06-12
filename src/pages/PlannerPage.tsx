import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ArrowRight, Settings2, ChevronDown, ChevronUp, TrendingDown, Share2, Camera, User, AlertTriangle } from 'lucide-react';
import { toPng } from 'html-to-image';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { gasMixes } from '@/lib/divingCalculations';
import { calculateDivePlan, calculateNo50Plan, generateSmoothProfile } from '@/lib/buhlmann';
import type { PlannerInput, DecoGas, DivePlan } from '@/lib/buhlmann';
import StatusBanner from '@/components/StatusBanner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const defaultDecoGases: DecoGas[] = [
  { fO2: 0.50, fHe: 0, name: 'EANx50', mod: 18 },
  { fO2: 1.00, fHe: 0, name: 'O2 100%', mod: 6 },
];

const phaseColors: Record<string, string> = {
  surface: '#5A8299', descent: '#0070D3', bottom: '#FF7B2E',
  ascent: '#4DA3FF', deco: '#FFD700', safety: '#2E8B57', 'gas-switch': '#F23D4E',
};
const phaseLabels: Record<string, string> = {
  surface: 'SUP', descent: 'DES', bottom: 'FON', ascent: 'ASC',
  deco: 'DEC', safety: 'SEG', 'gas-switch': 'GAS',
};

export default function PlannerPage() {
  const [diverName, setDiverName] = useState('');
  const [gasIndex, setGasIndex] = useState(2);
  const [depth, setDepth] = useState(30);
  const [bottomTime, setBottomTime] = useState(20);
  const [gfLow, setGfLow] = useState(30);
  const [gfHigh, setGfHigh] = useState(70);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [decoGases, setDecoGases] = useState<DecoGas[]>(defaultDecoGases);
  const [result, setResult] = useState<{ primary: DivePlan; no50: DivePlan } | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'no50'>('primary');
  const planRef = useRef<HTMLDivElement>(null);
  const backGas = gasMixes[gasIndex];

  const handleCalculate = () => {
    const input: PlannerInput = {
      depth, bottomTime,
      bottomGas: { fO2: backGas.fO2, fHe: 0 },
      decoGases, gfLow, gfHigh,
      descentRate: 15, ascentRate: 10,
    };
    setResult({
      primary: calculateDivePlan(input),
      no50: calculateNo50Plan(input),
    });
  };

  const activePlan = result ? (activeTab === 'primary' ? result.primary : result.no50) : null;

  // Chart data - smooth continuous profile
  const chartData = useMemo(() => {
    if (!activePlan) return null;
    const profile = generateSmoothProfile(activePlan);
    return {
      datasets: [{
        label: 'Profundidad',
        data: profile.map(d => ({ x: d.time, y: d.depth })),
        fill: true,
        backgroundColor: 'rgba(0,112,211,0.15)',
        borderColor: '#0070D3',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#FF7B2E',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.35,
        stepped: false,
      }],
    };
  }, [activePlan]);

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false, axis: 'x' },
    scales: {
      x: {
        type: 'linear',
        grid: { color: 'rgba(27,91,125,0.2)' },
        ticks: { color: '#5A8299', font: { size: 9 }, maxTicksLimit: 12, stepSize: 5 },
        title: { display: true, text: 'Runtime (min)', color: '#5A8299', font: { size: 10 } },
      },
      y: {
        reverse: true,
        grid: { color: 'rgba(27,91,125,0.2)' },
        ticks: { color: '#5A8299', font: { size: 9 }, callback: (v: any) => `${v}m` },
        title: { display: true, text: 'Profundidad (m)', color: '#5A8299', font: { size: 10 } },
        suggestedMax: depth + 5,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11,29,46,0.95)',
        titleColor: '#94B8C9',
        bodyColor: '#FFFFFF',
        borderColor: '#1B5B7D',
        borderWidth: 1,
        callbacks: {
          title: (items: any[]) => `Run ${items[0].parsed.x} min`,
          label: (ctx: any) => `Profundidad: ${ctx.parsed.y}m`,
        },
      },
    },
  };

  // Export plan as PNG
  const exportPlan = useCallback(async () => {
    if (!planRef.current) return;
    try {
      const dataUrl = await toPng(planRef.current, { quality: 0.95, pixelRatio: 2, backgroundColor: '#0B1D2E' });
      const link = document.createElement('a');
      link.download = `INDEX-plan-${diverName || 'buceo'}-${depth}m-${activeTab === 'no50' ? 'No50' : ''}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error('Export error:', e); }
  }, [diverName, depth, activeTab]);

  // Share as PNG (download the image, or copy if possible)
  const handleShare = useCallback(async () => {
    if (!planRef.current) return;
    try {
      const dataUrl = await toPng(planRef.current, { quality: 0.95, pixelRatio: 2, backgroundColor: '#0B1D2E' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `INDEX-plan-${diverName || 'buceo'}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Plan de Buceo - ${diverName || 'INDEX'}`,
          files: [file],
        });
      } else {
        // Fallback: download
        const link = document.createElement('a');
        link.download = `INDEX-plan-${diverName || 'buceo'}-${depth}m.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error('Share error:', e);
      exportPlan();
    }
  }, [planRef, diverName, depth, exportPlan]);

  // Timeline: show only KEY actions with accumulated runtime (one line per action, not per minute)
  const timelineDisplay = useMemo(() => {
    if (!activePlan) return [];
    const keyEntries: typeof activePlan.timeline = [];
    const tl = activePlan.timeline;

    // Always show start (surface at t=0)
    keyEntries.push(tl[0]);

    // Find key transitions: end of descent, start/end of bottom, each deco stop, gas switches, surface
    for (let i = 1; i < tl.length; i++) {
      const curr = tl[i];
      const prev = tl[i - 1];

      // Gas switch - always show
      if (curr.phase === 'gas-switch') {
        keyEntries.push(curr);
        continue;
      }

      // Phase changes (descent→bottom, bottom→ascent, ascent→deco, deco→ascent, etc.)
      if (curr.phase !== prev.phase) {
        // Show the transition point
        keyEntries.push(curr);
        continue;
      }

      // Depth changes during ascent/deco (moving between stops)
      if (curr.depth !== prev.depth && (curr.phase === 'ascent' || curr.phase === 'deco' || curr.phase === 'safety')) {
        keyEntries.push(curr);
        continue;
      }

      // For deco stops: only show start (duration info comes from the stop summary)
      // Skip intermediate minutes of deco stops
      if (curr.phase === 'deco' || curr.phase === 'safety') {
        // Only if depth changed (new stop)
        if (curr.depth !== prev.depth) {
          keyEntries.push(curr);
        }
        continue;
      }

      // Surface end - always show
      if (curr.phase === 'surface' && curr.runTime > 0) {
        keyEntries.push(curr);
        continue;
      }
    }

    // Now add duration annotations for deco stops
    const withDurations: typeof keyEntries = [];
    for (let i = 0; i < keyEntries.length; i++) {
      withDurations.push(keyEntries[i]);

      // After a deco/safety entry, find how long that stop lasted
      if (keyEntries[i].phase === 'deco' || keyEntries[i].phase === 'safety') {
        const startTime = keyEntries[i].runTime;
        const startDepth = keyEntries[i].depth;
        // Find when we left this depth
        let endTime = startTime;
        for (let j = i + 1; j < keyEntries.length; j++) {
          if (keyEntries[j].depth !== startDepth || keyEntries[j].phase === 'gas-switch') {
            endTime = keyEntries[j].runTime;
            break;
          }
        }
        const duration = endTime - startTime;
        if (duration > 0) {
          // Replace the last added entry with one that has duration info
          withDurations[withDurations.length - 1] = {
            ...keyEntries[i],
            notes: `Parada ${startDepth}m — ${duration} min`,
          };
        }
      }
    }

    return withDurations;
  }, [activePlan]);

  return (
    <div className="px-4 pt-4 pb-6">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays size={24} className="text-padi-blue" />
        <h1 className="text-2xl font-bold text-text-primary">Planificador Técnico</h1>
      </div>
      <p className="text-sm text-text-secondary mb-4">Buhlmann ZHL-16C con Gradient Factors</p>

      {/* Legend */}
      <div className="bg-ocean-dark/50 border border-ocean-surface/20 rounded-xl p-2.5 mb-4 text-center">
        <p className="text-[10px] text-text-tertiary leading-relaxed">
          Modelo matematico basado en algoritmo Buhlmann ZHL-16C con GF by <span className="text-padi-blue font-semibold">DiveSpot</span>
        </p>
      </div>

      <div className="bg-ocean-dark rounded-2xl shadow-card p-4 space-y-4">
        {/* Diver Name */}
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block flex items-center gap-1">
            <User size={10} /> Nombre del buzo
          </label>
          <input type="text" value={diverName} onChange={e => setDiverName(e.target.value)}
            placeholder="Nombre del buzo o equipo"
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary" />
        </div>

        {/* Basic Inputs */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Gas fondo</label>
            <select value={gasIndex} onChange={e => setGasIndex(Number(e.target.value))}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-2.5 py-2.5 text-xs text-text-primary outline-none appearance-none">
              {gasMixes.filter(g => g.fO2 < 0.5).map((g, i) => (
                <option key={i} value={gasMixes.indexOf(g)}>{g.label.split('(')[0].trim()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Prof. (m)</label>
            <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} min={10} max={100}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-2.5 py-2.5 text-xs text-text-primary outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">T. fondo</label>
            <input type="number" value={bottomTime} onChange={e => setBottomTime(Number(e.target.value))} min={1} max={120}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-2.5 py-2.5 text-xs text-text-primary outline-none" />
          </div>
        </div>

        {/* GF Controls */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">GF Low ({gfLow}%)</label>
            <input type="range" value={gfLow} onChange={e => setGfLow(Number(e.target.value))} min={10} max={100} className="w-full accent-padi-blue" />
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">GF High ({gfHigh}%)</label>
            <input type="range" value={gfHigh} onChange={e => setGfHigh(Number(e.target.value))} min={10} max={100} className="w-full accent-success-green" />
          </div>
        </div>

        {/* Deco Gases toggle */}
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-padi-blue font-medium">
          <Settings2 size={14} /> Gases de deco {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-2">
                {decoGases.map((gas, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 bg-ocean-mid/50 rounded-xl p-2.5">
                    <div>
                      <label className="text-[9px] text-text-tertiary mb-0.5 block">Gas</label>
                      <input type="text" value={gas.name} onChange={e => { const g = [...decoGases]; g[i] = { ...g[i], name: e.target.value }; setDecoGases(g); }}
                        className="w-full bg-ocean-dark border border-transparent focus:border-padi-blue rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-text-tertiary mb-0.5 block">O2 %</label>
                      <input type="number" value={Math.round(gas.fO2 * 100)} onChange={e => { const g = [...decoGases]; g[i] = { ...g[i], fO2: Number(e.target.value) / 100 }; setDecoGases(g); }}
                        min={21} max={100} className="w-full bg-ocean-dark border border-transparent focus:border-padi-blue rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-text-tertiary mb-0.5 block">Switch (m)</label>
                      <input type="number" value={gas.mod} onChange={e => { const g = [...decoGases]; g[i] = { ...g[i], mod: Number(e.target.value) }; setDecoGases(g); }}
                        min={3} max={40} className="w-full bg-ocean-dark border border-transparent focus:border-padi-blue rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setDecoGases([...decoGases, { fO2: 0.5, fHe: 0, name: 'Deco', mod: 12 }])}
                  className="text-xs text-padi-blue font-medium py-1">+ Agregar gas de deco</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={handleCalculate}
          className="w-full bg-padi-blue hover:bg-padi-blue-light text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Calcular Plan de Deco <ArrowRight size={18} />
        </button>

        {/* Results */}
        <AnimatePresence>
          {result && activePlan && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
              <div className="mt-4 space-y-4">

                {/* Plan / No50 Tabs */}
                <div className="flex rounded-xl overflow-hidden border border-ocean-surface/30">
                  <button onClick={() => setActiveTab('primary')}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'primary' ? 'bg-padi-blue text-white' : 'bg-ocean-dark text-text-secondary'}`}>
                    Plan Principal
                  </button>
                  <button onClick={() => setActiveTab('no50')}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${activeTab === 'no50' ? 'bg-alert-red text-white' : 'bg-ocean-dark text-alert-red'}`}>
                    <AlertTriangle size={12} /> No 50% (Contingencia)
                  </button>
                </div>

                {/* No 50% warning */}
                {activeTab === 'no50' && (
                  <div className="bg-alert-red/10 border border-alert-red/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-alert-red font-semibold flex items-center justify-center gap-1.5">
                      <AlertTriangle size={14} /> Plan de contingencia: Sin deco gas
                    </p>
                    <p className="text-[10px] text-text-secondary mt-1">
                      Simula perder el EANx50. Todo el deco se hace con back gas ({backGas.label.split('(')[0].trim()}).
                      Deco extra: +{result.no50.totalDecoTime - result.primary.totalDecoTime}min
                    </p>
                  </div>
                )}

                {/* Share & Export buttons */}
                <div className="flex gap-2">
                  <button onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-success-green/20 border border-success-green/30 text-success-green text-xs font-semibold py-2.5 rounded-full active:scale-[0.98]">
                    <Share2 size={14} /> Compartir PNG
                  </button>
                  <button onClick={exportPlan}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-padi-blue/20 border border-padi-blue/30 text-padi-blue text-xs font-semibold py-2.5 rounded-full active:scale-[0.98]">
                    <Camera size={14} /> Guardar PNG
                  </button>
                </div>

                {/* Exportable Plan Card */}
                <div ref={planRef} className="bg-deep-ocean rounded-2xl p-4 space-y-4 border border-ocean-surface/30">
                  {/* Header */}
                  <div className="text-center border-b border-ocean-surface/30 pb-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <img src="./icon-crab.png" alt="" className="w-7 h-7 rounded-lg" />
                      <span className="text-padi-blue font-bold text-sm">INDEX by DiveSpot</span>
                    </div>
                    <h2 className="text-base font-bold text-text-primary">
                      {activeTab === 'no50' ? '⚠️ CONTINGENCIA NO 50%' : (diverName || 'Plan de Buceo')}
                    </h2>
                    {activeTab === 'no50' && (
                      <p className="text-xs text-alert-red font-medium mt-0.5">Sin deco gas - Back gas only</p>
                    )}
                    <p className="text-[10px] text-text-tertiary mt-0.5">
                      Modelo matematico basado en algoritmo Buhlmann ZHL-16C con GF by DiveSpot
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-5 gap-2">
                    <div className="bg-ocean-dark rounded-lg p-2 text-center border border-ocean-surface/20">
                      <p className="text-[9px] text-text-tertiary">Prof</p>
                      <p className="text-sm font-bold font-mono text-padi-blue">{depth}m</p>
                    </div>
                    <div className="bg-ocean-dark rounded-lg p-2 text-center border border-ocean-surface/20">
                      <p className="text-[9px] text-text-tertiary">Fondo</p>
                      <p className="text-sm font-bold font-mono text-safety-orange">{bottomTime}m</p>
                    </div>
                    <div className="bg-ocean-dark rounded-lg p-2 text-center border border-ocean-surface/20">
                      <p className="text-[9px] text-text-tertiary">Deco</p>
                      <p className="text-sm font-bold font-mono text-alert-gold">{activePlan.totalDecoTime}m</p>
                    </div>
                    <div className="bg-ocean-dark rounded-lg p-2 text-center border border-ocean-surface/20">
                      <p className="text-[9px] text-text-tertiary">Runtime</p>
                      <p className="text-sm font-bold font-mono text-success-green">{activePlan.runTime}m</p>
                    </div>
                    <div className="bg-ocean-dark rounded-lg p-2 text-center border border-ocean-surface/20">
                      <p className="text-[9px] text-text-tertiary">GF</p>
                      <p className="text-sm font-bold font-mono text-text-primary">{activePlan.gfLow}/{activePlan.gfHigh}</p>
                    </div>
                  </div>

                  {/* Chart */}
                  {chartData && (
                    <div className="bg-ocean-dark/50 rounded-xl p-2 border border-ocean-surface/20">
                      <p className="text-[10px] text-text-tertiary text-center mb-1">
                        {activeTab === 'no50' ? '⚠️ Perfil CONTINGENCIA (sin deco gas)' : 'Perfil de inmersion'}
                      </p>
                      <div className="h-48">
                        <Line data={chartData} options={chartOptions} />
                      </div>
                    </div>
                  )}

                  {/* FULL TIMELINE - the main and only table */}
                  <div className="bg-ocean-dark/50 rounded-xl overflow-hidden border border-ocean-surface/20">
                    <div className="bg-ocean-mid/40 px-3 py-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-text-primary">
                        {activeTab === 'no50' ? 'Timeline Contingencia No 50%' : 'Timeline Completo'}
                      </p>
                      <span className="text-[9px] text-text-tertiary">Min 0 → {activePlan.runTime}m</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto no-scrollbar">
                      <table className="w-full text-[10px]">
                        <thead className="sticky top-0 bg-ocean-dark z-10">
                          <tr className="text-text-tertiary border-b border-ocean-mid">
                            <th className="text-left px-2 py-1.5 font-medium w-12">Run</th>
                            <th className="text-center px-1 py-1.5 font-medium w-10">Prof</th>
                            <th className="text-left px-1 py-1.5 font-medium w-10">Fase</th>
                            <th className="text-left px-1 py-1.5 font-medium">Nota</th>
                            <th className="text-center px-1 py-1.5 font-medium w-14">Gas</th>
                            <th className="text-center px-1 py-1.5 font-medium w-10">PO2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timelineDisplay.map((entry, i) => (
                            <tr key={i} className={`border-b border-ocean-mid/20 ${entry.phase === 'gas-switch' ? 'bg-alert-red/5' : entry.phase === 'surface' && entry.runTime === 0 ? 'bg-padi-blue/5' : entry.phase === 'surface' ? 'bg-success-green/5' : ''}`}>
                              <td className="px-2 py-1.5 font-mono text-text-primary font-semibold">{entry.runTime}m</td>
                              <td className="text-center px-1 py-1.5 font-mono text-text-secondary">{entry.depth}m</td>
                              <td className="px-1 py-1.5">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: phaseColors[entry.phase] }} />
                                  <span style={{ color: phaseColors[entry.phase] }} className="font-medium">{phaseLabels[entry.phase]}</span>
                                </span>
                              </td>
                              <td className="px-1 py-1.5 text-text-secondary truncate max-w-[100px]">{entry.notes}</td>
                              <td className="text-center px-1 py-1.5">
                                <span className="text-[9px]" style={{
                                  color: entry.gas?.includes('100') ? '#F23D4E' : entry.gas?.includes('50') ? '#FF7B2E' : '#4DA3FF',
                                }}>{entry.gas}</span>
                              </td>
                              <td className="text-center px-1 py-1.5 font-mono text-text-tertiary">{entry.po2?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Gas Switches (primary plan only) */}
                  {activeTab === 'primary' && activePlan.gasSwitches.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                        <TrendingDown size={12} /> Cambios de gas programados
                      </p>
                      {activePlan.gasSwitches.map((sw, i) => (
                        <div key={i} className="flex items-center gap-2 bg-ocean-mid/30 rounded-lg px-3 py-1.5 text-xs">
                          <span className="text-text-tertiary">@{sw.depth}m (run {sw.runTime}m):</span>
                          <span className="text-text-secondary">{sw.from}</span>
                          <span className="text-text-tertiary">→</span>
                          <span className="text-padi-blue font-medium">{sw.to}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-center border-t border-ocean-surface/30 pt-3">
                    <p className="text-[9px] text-text-tertiary">
                      Modelo matematico basado en algoritmo Buhlmann ZHL-16C con GF by DiveSpot
                    </p>
                    {activeTab === 'no50' && (
                      <p className="text-[9px] text-alert-red mt-0.5 font-medium">⚠️ CONTINGENCIA - Sin deco gas disponible</p>
                    )}
                  </div>
                </div>

                <StatusBanner status="safe" message={`Plan ${activeTab === 'no50' ? 'de contingencia ' : ''}calculado con GF ${activePlan.gfLow}/${activePlan.gfHigh}. Verifica con software certificado antes de bucear.`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-text-tertiary text-center mt-3 leading-relaxed">
        ⚠️ Algoritmo Buhlmann ZHL-16C con Gradient Factors. Uso educativo.
      </p>
    </div>
  );
}
