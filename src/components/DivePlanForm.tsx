import React, { useState } from 'react';
import { Calculator, Droplets, Gauge, Wind, ArrowDownToLine } from 'lucide-react';

export interface DivePlanInput {
  depth: number;
  bottomTime: number;
  gasType: 'air' | 'ean32' | 'ean36' | 'custom';
  fO2: number;
  decoGases: { fO2: number; fHe: number; name: string; mod: number }[];
  gfLow: number;
  gfHigh: number;
  descentRate: number;
  ascentRate: number;
  lastStopDepth: number;
}

interface DecoGasOption {
  name: string;
  fO2: number;
  mod: number;
}

const DECO_GAS_OPTIONS: DecoGasOption[] = [
  { name: 'EAN50', fO2: 0.50, mod: 22 },
  { name: 'O2 80%', fO2: 0.80, mod: 8 },
  { name: 'O2 100%', fO2: 1.00, mod: 6 },
];

interface DivePlanFormProps {
  onCalculate: (input: DivePlanInput) => void;
  loading: boolean;
}

export default function DivePlanForm({ onCalculate, loading }: DivePlanFormProps) {
  const [depth, setDepth] = useState(30);
  const [bottomTime, setBottomTime] = useState(20);
  const [gasType, setGasType] = useState<'air' | 'ean32' | 'ean36' | 'custom'>('air');
  const [fO2, setFO2] = useState(21);
  const [gfLow, setGfLow] = useState(30);
  const [gfHigh, setGfHigh] = useState(70);
  const [ascentRate, setAscentRate] = useState(9);
  const [lastStopDepth, setLastStopDepth] = useState<3 | 6>(3);
  const [selectedDecoGases, setSelectedDecoGases] = useState<string[]>(['EAN50']);

  const toggleDecoGas = (name: string) => {
    setSelectedDecoGases(prev =>
      prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const decoGases = selectedDecoGases
      .map(name => DECO_GAS_OPTIONS.find(g => g.name === name))
      .filter((g): g is DecoGasOption => g !== undefined)
      .sort((a, b) => b.mod - a.mod);

    onCalculate({
      depth,
      bottomTime,
      gasType,
      fO2: gasType === 'custom' ? fO2 : gasType === 'ean32' ? 32 : gasType === 'ean36' ? 36 : 21,
      gfLow,
      gfHigh,
      descentRate: 18,
      ascentRate,
      lastStopDepth,
      decoGases: decoGases.length > 0
        ? decoGases.map(g => ({ fO2: g.fO2, fHe: 0, name: g.name, mod: g.mod }))
        : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 space-y-4">
      <h2 className="text-text-primary text-lg font-bold flex items-center gap-2">
        <Calculator className="w-5 h-5 text-padi-blue" />
        Planificar Buceo
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-1">Profundidad (m)</label>
          <input
            type="number"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            min={6}
            max={300}
            className="w-full bg-deep-ocean border border-ocean-surface/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:border-padi-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-1">Tiempo fondo (min)</label>
          <input
            type="number"
            value={bottomTime}
            onChange={(e) => setBottomTime(Number(e.target.value))}
            min={1}
            max={180}
            className="w-full bg-deep-ocean border border-ocean-surface/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:border-padi-blue focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-text-secondary text-xs font-medium block mb-1">Gas de fondo</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'air', label: 'Aire', icon: Droplets },
            { value: 'ean32', label: 'EAN32', icon: Droplets },
            { value: 'ean36', label: 'EAN36', icon: Droplets },
            { value: 'custom', label: 'Custom', icon: Gauge },
          ].map((gas) => (
            <button
              key={gas.value}
              type="button"
              onClick={() => setGasType(gas.value as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                gasType === gas.value
                  ? 'bg-padi-blue/20 border-padi-blue/50 text-padi-blue'
                  : 'bg-deep-ocean border-ocean-surface/30 text-text-secondary hover:border-ocean-surface'
              }`}
            >
              <gas.icon className="w-4 h-4" />
              {gas.label}
            </button>
          ))}
        </div>
        {gasType === 'custom' && (
          <input
            type="number"
            value={fO2}
            onChange={(e) => setFO2(Number(e.target.value))}
            min={21}
            max={100}
            placeholder="% O2"
            className="w-full mt-2 bg-deep-ocean border border-ocean-surface/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:border-padi-blue focus:outline-none"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-1">GF Low (%)</label>
          <input
            type="number"
            value={gfLow}
            onChange={(e) => setGfLow(Number(e.target.value))}
            min={10}
            max={100}
            className="w-full bg-deep-ocean border border-ocean-surface/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:border-padi-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-1">GF High (%)</label>
          <input
            type="number"
            value={gfHigh}
            onChange={(e) => setGfHigh(Number(e.target.value))}
            min={10}
            max={100}
            className="w-full bg-deep-ocean border border-ocean-surface/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:border-padi-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-1">Vel. ascenso (m/min)</label>
          <input
            type="number"
            value={ascentRate}
            onChange={(e) => setAscentRate(Number(e.target.value))}
            min={3}
            max={18}
            className="w-full bg-deep-ocean border border-ocean-surface/30 rounded-lg px-3 py-2 text-text-primary text-sm focus:border-padi-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="text-text-secondary text-xs font-medium block mb-1 flex items-center gap-1">
            <ArrowDownToLine className="w-3 h-3" />
            Ultima parada
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([3, 6] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setLastStopDepth(d)}
                className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                  lastStopDepth === d
                    ? 'bg-padi-blue/20 border-padi-blue/50 text-padi-blue'
                    : 'bg-deep-ocean border-ocean-surface/30 text-text-secondary hover:border-ocean-surface'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-text-secondary text-xs font-medium block mb-1 flex items-center gap-1">
          <Wind className="w-3 h-3" />
          Gases de Deco
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DECO_GAS_OPTIONS.map((gas) => {
            const selected = selectedDecoGases.includes(gas.name);
            return (
              <button
                key={gas.name}
                type="button"
                onClick={() => toggleDecoGas(gas.name)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? 'bg-padi-blue/20 border-padi-blue/50 text-padi-blue'
                    : 'bg-deep-ocean border-ocean-surface/30 text-text-secondary hover:border-ocean-surface'
                }`}
              >
                <Droplets className="w-4 h-4" />
                <span>{gas.name}</span>
                <span className="text-[10px] opacity-60">MOD {gas.mod}m</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-padi-blue hover:bg-padi-blue-light text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Calculando...
          </>
        ) : (
          <>
            <Calculator className="w-4 h-4" />
            Calcular Plan
          </>
        )}
      </button>
    </form>
  );
}