import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { gasMixes, calcularMOD, calcularPO2, calcularLND, calcularPEA, getSafetyStatus } from '@/lib/divingCalculations';
import StatusBanner from '@/components/StatusBanner';
import type { SafetyStatus } from '@/types';

export default function QuickPlanner() {
  const [gasIndex, setGasIndex] = useState(2); // Nitrox 32
  const [depth, setDepth] = useState(18);
  const [time, setTime] = useState(30);
  const [result, setResult] = useState<{
    mod: number; po2: number; ndl: number | null; ead: number;
    status: SafetyStatus; message: string;
  } | null>(null);

  const handleCalculate = () => {
    const gas = gasMixes[gasIndex];
    const mod = calcularMOD(gas.fO2);
    const po2 = calcularPO2(depth, gas.fO2);
    const ndl = calcularLND(depth, gas.fO2);
    const ead = calcularPEA(depth, gas.fO2);
    const safety = getSafetyStatus(depth, gas.fO2);

    setResult({ mod, po2, ndl, ead, status: safety.status, message: safety.message });
  };

  return (
    <section className="mt-6 px-4">
      <div className="bg-ocean-dark rounded-2xl shadow-card p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={22} className="text-padi-blue" />
          <h2 className="text-lg font-semibold text-text-primary">Planificador de Buceo</h2>
        </div>
        <p className="text-xs text-text-secondary mb-4">Planifica tu perfil de inmersión en segundos</p>

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Gas</label>
            <select
              value={gasIndex}
              onChange={(e) => setGasIndex(Number(e.target.value))}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-2.5 py-2.5 text-sm text-text-primary outline-none transition-colors appearance-none"
            >
              {gasMixes.map((g, i) => (
                <option key={i} value={i}>{g.label.split('(')[0].trim()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Profundidad (m)</label>
            <input
              type="number"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              min={3}
              max={60}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-2.5 py-2.5 text-sm text-text-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Tiempo (min)</label>
            <input
              type="number"
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              min={1}
              max={180}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-2.5 py-2.5 text-sm text-text-primary outline-none transition-colors"
            />
          </div>
        </div>

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-padi-blue hover:bg-padi-blue-light text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          Calcular Perfil
          <ArrowRight size={18} />
        </button>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-padi-blue">
                    <p className="text-[10px] text-text-tertiary mb-1">MOD</p>
                    <p className="text-xl font-bold font-mono text-padi-blue">{result.mod.toFixed(1)}m</p>
                  </div>
                  <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-safety-orange">
                    <p className="text-[10px] text-text-tertiary mb-1">PO2</p>
                    <p className="text-xl font-bold font-mono text-safety-orange">{result.po2.toFixed(2)} bar</p>
                  </div>
                  <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-success-green">
                    <p className="text-[10px] text-text-tertiary mb-1">LND / NDL</p>
                    <p className="text-xl font-bold font-mono text-success-green">
                      {result.ndl !== null ? `${result.ndl} min` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-alert-gold">
                    <p className="text-[10px] text-text-tertiary mb-1">EAD / PEA</p>
                    <p className="text-xl font-bold font-mono text-alert-gold">{result.ead.toFixed(1)}m</p>
                  </div>
                </div>

                <StatusBanner status={result.status} message={result.message} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
