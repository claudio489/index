import React, { useState } from 'react';
import { Calculator, Droplets, Gauge } from 'lucide-react';

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
}

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({
      decoGases: [{ fO2: 0.5, fHe: 0, name: 'EAN50', mod: 22 }],
      depth,
      bottomTime,
      gasType,
      fO2: gasType === 'custom' ? fO2 : gasType === 'ean32' ? 32 : gasType === 'ean36' ? 36 : 21,
      gfLow,
      gfHigh,
      descentRate: 18,
      ascentRate,
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




