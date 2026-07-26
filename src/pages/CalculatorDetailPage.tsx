import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Ruler, Hourglass, Gauge, FlaskConical, Wind, ArrowDownToLine, ArrowLeftRight, Table, ClipboardCheck, Grid3x3, Activity, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { gasMixes, calcularMOD, calcularPO2, calcularLND, calcularPEA, calcularBestMix, getSafetyStatus, modReferenceTable } from '@/lib/divingCalculations';
// import { getCalculatorBySlug } from '@/data/calculators';
import StatusBanner from '@/components/StatusBanner';
import type { SafetyStatus } from '@/types';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MOD Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MODCalculator() {
  const [fO2, setFO2] = useState(32);
  const [pO2max, setPO2max] = useState(1.4);
  const [result, setResult] = useState<{ mod: number; status: SafetyStatus; message: string } | null>(null);

  const handleCalculate = () => {
    const mod = calcularMOD(fO2 / 100, pO2max);
    const safety = getSafetyStatus(0, fO2 / 100, pO2max);
    setResult({ mod, status: safety.status, message: `MOD @ ${pO2max} bar PO2 = ${mod.toFixed(1)}m` });
  };

  return (
    <CalcShell icon={<Ruler size={22} className="text-padi-blue" />} title="MOD" color="#0070D3"
      description="Profundidad Máxima Operativa basada en la presión parcial de O2 lí­mite.">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Fracción O2 (%)</label>
          <input type="number" value={fO2} onChange={e => setFO2(Number(e.target.value))} min={21} max={100}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">PO2 máxima (bar)</label>
          <select value={pO2max} onChange={e => setPO2max(Number(e.target.value))}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none appearance-none">
            <option value={1.4}>1.4 bar (trabajo)</option>
            <option value={1.6}>1.6 bar (contingencia)</option>
          </select>
        </div>
        <button onClick={handleCalculate}
          className="w-full bg-padi-blue text-white font-semibold py-3 rounded-full active:scale-[0.98] transition-transform">
          Calcular MOD
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-padi-blue text-center">
              <p className="text-[10px] text-text-tertiary mb-1">Profundidad Máxima Operativa</p>
              <p className="text-3xl font-bold font-mono text-padi-blue">{result.mod.toFixed(1)}m</p>
              <p className="text-xs text-text-secondary mt-1">PO2 = {pO2max} bar | O2 = {fO2}%</p>
            </div>
            <StatusBanner status={result.status} message={result.message} />
          </motion.div>
        )}

        {/* Reference table */}
        <div className="bg-ocean-mid rounded-xl p-3 mt-4">
          <p className="text-xs font-semibold text-padi-blue mb-2 text-center">Tabla MOD de referencia (PO2=1.4)</p>
          <div className="grid grid-cols-2 gap-1.5">
            {modReferenceTable.map((row, i) => (
              <div key={i} className="bg-ocean-dark rounded-lg px-2 py-1.5 text-center">
                <span className="text-[10px] text-text-secondary">{(row.fO2 * 100).toFixed(0)}% â†’ </span>
                <span className="text-xs font-mono font-semibold text-text-primary">{row.mod14.toFixed(1)}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ LND Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function LNDCalculator() {
  const [gasIndex, setGasIndex] = useState(2);
  const [depth, setDepth] = useState(18);
  const [result, setResult] = useState<{
    ndl: number | null; ead: number; po2: number; mod: number; status: SafetyStatus; message: string;
  } | null>(null);

  const handleCalculate = () => {
    const gas = gasMixes[gasIndex];
    const ndl = calcularLND(depth, gas.fO2);
    const ead = calcularPEA(depth, gas.fO2);
    const po2 = calcularPO2(depth, gas.fO2);
    const mod = calcularMOD(gas.fO2);
    const safety = getSafetyStatus(depth, gas.fO2);
    setResult({ ndl, ead, po2, mod, status: safety.status, message: safety.message });
  };

  return (
    <CalcShell icon={<Hourglass size={22} className="text-success-green" />} title="LND / NDL" color="#2E8B57"
      description="Tiempo de fondo sin descompresión usando tablas PADI RDP con Equivalent Air Depth.">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Mezcla de gas</label>
          <select value={gasIndex} onChange={e => setGasIndex(Number(e.target.value))}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none appearance-none">
            {gasMixes.filter(g => g.fO2 < 0.5).map((g, i) => (
              <option key={i} value={gasMixes.indexOf(g)}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Profundidad (m)</label>
          <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} min={3} max={60}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
        </div>
        <button onClick={handleCalculate}
          className="w-full bg-success-green text-white font-semibold py-3 rounded-full active:scale-[0.98] transition-transform">
          Calcular LND
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-success-green text-center">
                <p className="text-[10px] text-text-tertiary mb-1">LND</p>
                <p className="text-2xl font-bold font-mono text-success-green">
                  {result.ndl !== null ? `${result.ndl} min` : 'N/A'}
                </p>
              </div>
              <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-alert-gold text-center">
                <p className="text-[10px] text-text-tertiary mb-1">EAD</p>
                <p className="text-2xl font-bold font-mono text-alert-gold">{result.ead.toFixed(1)}m</p>
              </div>
              <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-safety-orange text-center">
                <p className="text-[10px] text-text-tertiary mb-1">PO2</p>
                <p className="text-2xl font-bold font-mono text-safety-orange">{result.po2.toFixed(2)} bar</p>
              </div>
              <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-padi-blue text-center">
                <p className="text-[10px] text-text-tertiary mb-1">MOD</p>
                <p className="text-2xl font-bold font-mono text-padi-blue">{result.mod.toFixed(1)}m</p>
              </div>
            </div>
            {result.ndl === null && (
              <div className="bg-alert-red/10 rounded-xl p-3 text-center border border-alert-red/20">
                <p className="text-xs text-alert-red font-medium">âš ï¸ Mezcla de descompresión â€” No aplica LND</p>
              </div>
            )}
            <StatusBanner status={result.status} message={result.message} />
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Best Mix Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BestMixCalculator() {
  const [depth, setDepth] = useState(30);
  const [pO2max, setPO2max] = useState(1.4);
  const [result, setResult] = useState<{ fO2: number; mod: number } | null>(null);

  const handleCalculate = () => {
    const fO2 = calcularBestMix(depth, pO2max);
    const mod = calcularMOD(fO2, pO2max);
    setResult({ fO2, mod });
  };

  return (
    <CalcShell icon={<Gauge size={22} className="text-alert-gold" />} title="Best Mix" color="#FFD700"
      description="Calcula la mezcla óptima de O2 para una profundidad objetivo dada.">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Profundidad objetivo (m)</label>
          <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} min={3} max={100}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">PO2 máxima (bar)</label>
          <select value={pO2max} onChange={e => setPO2max(Number(e.target.value))}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none appearance-none">
            <option value={1.4}>1.4 bar (trabajo)</option>
            <option value={1.6}>1.6 bar (contingencia)</option>
          </select>
        </div>
        <button onClick={handleCalculate}
          className="w-full font-semibold py-3 rounded-full active:scale-[0.98] transition-transform text-deep-ocean"
          style={{ backgroundColor: '#FFD700' }}>
          Calcular Best Mix
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-alert-gold text-center">
              <p className="text-[10px] text-text-tertiary mb-1">Fracción óptima de O2</p>
              <p className="text-3xl font-bold font-mono text-alert-gold">{(result.fO2 * 100).toFixed(1)}%</p>
              <p className="text-xs text-text-secondary mt-1">Mezcla recomendada: EANx{(result.fO2 * 100).toFixed(0)}</p>
            </div>
            <div className="bg-deep-ocean rounded-xl p-3 border-t-[3px] border-padi-blue text-center">
              <p className="text-[10px] text-text-tertiary mb-1">MOD verificado</p>
              <p className="text-xl font-bold font-mono text-padi-blue">{result.mod.toFixed(1)}m</p>
            </div>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Gas Blender Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function GasBlenderCalculator() {
  const [currentPressure, setCurrentPressure] = useState(50);
  const [finalPressure, setFinalPressure] = useState(200);
  const [currentFO2, setCurrentFO2] = useState(21);
  const [targetFO2, setTargetFO2] = useState(32);
  const [method, setMethod] = useState<'pp' | 'banked32' | 'banked40'>('pp');
  const [result, setResult] = useState<{
    o2ToAdd: number;
    airToAdd: number;
    bankToAdd?: number;
    error?: string;
  } | null>(null);

  const handleCalculate = () => {
    const cP = currentPressure;
    const fP = finalPressure;
    const cF = currentFO2 / 100;
    const tF = targetFO2 / 100;

    // Validaciones
    if (fP <= cP) {
      setResult({ o2ToAdd: 0, airToAdd: 0, error: 'La presión final debe ser mayor que la presión actual. Vací­a el tanque si necesitas.' });
      return;
    }
    if (tF <= cF) {
      setResult({ o2ToAdd: 0, airToAdd: 0, error: 'No puedes reducir el % de O2 agregando O2 puro. Vací­a el tanque y empieza de nuevo.' });
      return;
    }

    const totalGasToAdd = fP - cP;

    if (method === 'pp') {
      // Partial Pressure: O2 puro + aire
      const o2Needed = fP * tF - cP * cF; // presión de O2 puro (100%) a agregar
      const airNeeded = totalGasToAdd - o2Needed;

      if (o2Needed < 0) {
        setResult({ o2ToAdd: 0, airToAdd: 0, error: 'El gas actual ya tiene más O2 que el objetivo. Vací­a el tanque.' });
        return;
      }
      if (airNeeded < 0) {
        // Necesitas más O2 de lo que cabe, usa banked gas o purga más
        setResult({
          o2ToAdd: Math.round(o2Needed * 10) / 10,
          airToAdd: Math.round(airNeeded * 10) / 10,
          error: 'O2 puro excede la capacidad. Necesitas purgar el tanque más o usar gas de banco.',
        });
        return;
      }

      setResult({ o2ToAdd: Math.round(o2Needed * 10) / 10, airToAdd: Math.round(airNeeded * 10) / 10 });
    } else {
      // Banked Gas method: gas de banco (EAN32 o EAN40) + aire (o top-up con O2)
      const bankFO2 = method === 'banked32' ? 0.32 : 0.40;
      // bankToAdd = (fP*tF - cP*cF) / (bankFO2 - cF) solo si bankFO2 > cF
      if (bankFO2 <= cF) {
        setResult({ o2ToAdd: 0, airToAdd: 0, bankToAdd: 0, error: `El gas de banco EAN${(bankFO2 * 100).toFixed(0)} no tiene suficiente O2 para subir desde ${(cF * 100).toFixed(0)}%.` });
        return;
      }
      const bankToAdd = (fP * tF - cP * cF) / (bankFO2 - cF);
      const airNeeded = totalGasToAdd - bankToAdd;

      if (bankToAdd < 0 || bankToAdd > totalGasToAdd) {
        setResult({ o2ToAdd: 0, airToAdd: 0, bankToAdd: Math.round(bankToAdd * 10) / 10, error: 'Método de banco no viable para estos valores. Intenta con Partial Pressure.' });
        return;
      }

      setResult({
        o2ToAdd: 0,
        airToAdd: Math.round(airNeeded * 10) / 10,
        bankToAdd: Math.round(bankToAdd * 10) / 10,
      });
    }
  };

  return (
    <CalcShell icon={<FlaskConical size={22} className="text-safety-orange" />} title="Mezclador de Gases" color="#FF7B2E"
      description="Mezclas Nitrox por método de presión parcial o gas de banco.">
      <div className="space-y-4">
        {/* Método */}
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Método de mezcla</label>
          <select value={method} onChange={e => setMethod(e.target.value as 'pp' | 'banked32' | 'banked40')}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none appearance-none">
            <option value="pp">Presión Parcial (O2 puro + Aire)</option>
            <option value="banked32">Banked Gas EAN32 + Aire</option>
            <option value="banked40">Banked Gas EAN40 + Aire</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Presión actual (bar)</label>
            <input type="number" value={currentPressure} onChange={e => setCurrentPressure(Number(e.target.value))} min={0} max={300}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Presión final (bar)</label>
            <input type="number" value={finalPressure} onChange={e => setFinalPressure(Number(e.target.value))} min={0} max={300}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">O2 actual (%)</label>
            <input type="number" value={currentFO2} onChange={e => setCurrentFO2(Number(e.target.value))} min={21} max={100}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">O2 objetivo (%)</label>
            <input type="number" value={targetFO2} onChange={e => setTargetFO2(Number(e.target.value))} min={22} max={100}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
          </div>
        </div>

        <button onClick={handleCalculate}
          className="w-full bg-safety-orange text-white font-semibold py-3 rounded-full active:scale-[0.98] transition-transform">
          Calcular Mezcla
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Error */}
            {result.error && (
              <div className="bg-alert-red/10 rounded-xl p-3 text-center border border-alert-red/20">
                <p className="text-xs text-alert-red font-medium">{result.error}</p>
              </div>
            )}

            {/* Resultados */}
            {!result.error && (
              <div className="space-y-2">
                {method === 'pp' ? (
                  <>
                    <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-safety-orange text-center">
                      <p className="text-[10px] text-text-tertiary mb-1">O2 puro (100%) a agregar</p>
                      <p className="text-3xl font-bold font-mono text-safety-orange">{result.o2ToAdd} bar</p>
                    </div>
                    <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-padi-blue text-center">
                      <p className="text-[10px] text-text-tertiary mb-1">Aire (21% O2) a agregar después</p>
                      <p className="text-3xl font-bold font-mono text-padi-blue">{result.airToAdd} bar</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-safety-orange text-center">
                      <p className="text-[10px] text-text-tertiary mb-1">Gas de banco a agregar</p>
                      <p className="text-3xl font-bold font-mono text-safety-orange">{result.bankToAdd} bar</p>
                      <p className="text-xs text-text-secondary mt-1">{method === 'banked32' ? 'EAN32 (32% O2)' : 'EAN40 (40% O2)'}</p>
                    </div>
                    <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-padi-blue text-center">
                      <p className="text-[10px] text-text-tertiary mb-1">Aire a agregar después</p>
                      <p className="text-3xl font-bold font-mono text-padi-blue">{result.airToAdd} bar</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="bg-alert-gold/10 rounded-xl p-3 text-center border border-alert-gold/20">
              <p className="text-xs text-alert-gold font-medium">âš ï¸ Siempre analiza la mezcla final antes de usar. Esta calculadora es guí­a, no sustituye el análisis.</p>
            </div>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EAD Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function EADCalculator() {
  const [depth, setDepth] = useState(30);
  const [fO2, setFO2] = useState(32);
  const [result, setResult] = useState<{ ead: number; pa: number } | null>(null);

  const handleCalculate = () => {
    const ead = calcularPEA(depth, fO2 / 100);
    const pa = (depth / 10) + 1;
    setResult({ ead, pa });
  };

  return (
    <CalcShell icon={<ArrowDownToLine size={22} className="text-padi-blue-light" />} title="EAD / PEA" color="#4DA3FF"
      description="Profundidad Equivalente al Aire para planificación con tablas de aire.">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Profundidad real (m)</label>
          <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} min={3} max={100}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Fracción O2 (%)</label>
          <input type="number" value={fO2} onChange={e => setFO2(Number(e.target.value))} min={21} max={100}
            className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-3 text-sm text-text-primary outline-none" />
        </div>
        <button onClick={handleCalculate}
          className="w-full bg-padi-blue-light text-deep-ocean font-semibold py-3 rounded-full active:scale-[0.98] transition-transform">
          Calcular EAD
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-padi-blue-light text-center">
              <p className="text-[10px] text-text-tertiary mb-1">Profundidad Equivalente al Aire</p>
              <p className="text-3xl font-bold font-mono text-padi-blue-light">{result.ead.toFixed(1)}m</p>
              <p className="text-xs text-text-secondary mt-1">Presión absoluta: {result.pa.toFixed(1)} bar</p>
            </div>
            <p className="text-xs text-text-secondary text-center">
              Usa esta profundidad con tablas de aire para calcular tu LND.
            </p>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SAC Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SACCalculator() {
  const [startPressure, setStartPressure] = useState(200);
  const [endPressure, setEndPressure] = useState(80);
  const [tankVolume, setTankVolume] = useState(12);
  const [avgDepth, setAvgDepth] = useState(18);
  const [diveTime, setDiveTime] = useState(35);
  const [result, setResult] = useState<{
    sac: number;
    gasUsed: number;
    avgATA: number;
  } | null>(null);

  const handleCalculate = () => {
    // Gas consumido en litros a 1 ATA:
    // (presión consumida en bar) * (volumen del tanque en litros) = litros a 1 ATA
    const gasUsedLiters = (startPressure - endPressure) * tankVolume;
    const avgATA = (avgDepth / 10) + 1;
    // SAC = litros consumidos / (tiempo en min * ATA promedio)
    const sac = gasUsedLiters / (diveTime * avgATA);
    setResult({
      sac: Math.round(sac * 10) / 10,
      gasUsed: Math.round(gasUsedLiters * 10) / 10,
      avgATA: Math.round(avgATA * 100) / 100,
    });
  };

  return (
    <CalcShell icon={<Wind size={22} className="text-safety-orange" />} title="SAC" color="#FF7B2E"
      description="Surface Air Consumption â€” consumo de gas en litros/min a 1 ATA.">
      <div className="space-y-3">
        {[
          { label: 'Presión inicial (bar)', value: startPressure, set: setStartPressure, min: 0, max: 300 },
          { label: 'Presión final (bar)', value: endPressure, set: setEndPressure, min: 0, max: 300 },
          { label: 'Capacidad tanque (L)', value: tankVolume, set: setTankVolume, min: 1, max: 50 },
          { label: 'Prof. promedio (m)', value: avgDepth, set: setAvgDepth, min: 1, max: 100 },
          { label: 'Tiempo (min)', value: diveTime, set: setDiveTime, min: 1, max: 300 },
        ].map((field, i) => (
          <div key={i}>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">{field.label}</label>
            <input type="number" value={field.value} onChange={e => field.set(Number(e.target.value))}
              min={field.min} max={field.max}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
          </div>
        ))}
        <button onClick={handleCalculate}
          className="w-full bg-safety-orange text-white font-semibold py-3 rounded-full active:scale-[0.98] transition-transform">
          Calcular SAC
        </button>

        {result !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-safety-orange text-center">
              <p className="text-[10px] text-text-tertiary mb-1">Surface Air Consumption</p>
              <p className="text-3xl font-bold font-mono text-safety-orange">{result.sac} L/min</p>
              <p className="text-xs text-text-secondary mt-1">
                {result.sac < 12 ? 'Excelente' : result.sac < 16 ? 'Bueno' : result.sac < 20 ? 'Promedio' : result.sac < 25 ? 'Alto' : 'Muy alto â€” revisa técnica'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-ocean-mid rounded-xl p-3 text-center">
                <p className="text-[10px] text-text-tertiary mb-1">Gas consumido</p>
                <p className="text-lg font-bold font-mono text-text-primary">{result.gasUsed} L</p>
              </div>
              <div className="bg-ocean-mid rounded-xl p-3 text-center">
                <p className="text-[10px] text-text-tertiary mb-1">ATA promedio</p>
                <p className="text-lg font-bold font-mono text-text-primary">{result.avgATA}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Tabla RDP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TablaRDP() {
  const rdpTable = [
    [3,400],[4,350],[5,300],[6,280],[7,260],[8,240],[9,220],[10,200],[11,180],[12,160],
    [13,145],[14,130],[15,115],[16,105],[17,95],[18,85],[19,78],[20,72],[21,66],[22,60],
    [23,55],[24,50],[25,46],[26,42],[27,39],[28,36],[29,33],[30,31],[31,29],[32,27],
    [33,25],[34,23],[35,21],[36,19],[37,17],[38,15],[39,13],[40,11],[41,10],[42,9],
    [43,8],[44,7],[45,6],[46,5],[47,5],[48,4],[49,4],[50,3],[51,3],[52,3],[53,2],[54,2],
    [55,2],[56,2],[57,2],[58,1],[59,1],[60,1],
  ];
  const [selectedDepth, setSelectedDepth] = useState<number | null>(null);

  return (
    <CalcShell icon={<Table size={22} className="text-padi-blue" />} title="Tabla PADI RDP" color="#0070D3"
      description="Tabla de Lí­mites de No-Descompresión para aire.">
      <div className="space-y-3">
        <p className="text-[10px] text-text-tertiary text-center">Toca una profundidad para ver detalle</p>
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-ocean-dark z-10">
              <tr className="text-text-tertiary border-b border-ocean-mid">
                <th className="text-left px-2 py-1.5 font-medium">Prof (m)</th>
                <th className="text-center px-2 py-1.5 font-medium">LND (min)</th>
                <th className="text-center px-2 py-1.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rdpTable.map(([prof, tiempo]) => (
                <tr key={prof} onClick={() => setSelectedDepth(prof)}
                  className={`border-b border-ocean-mid/20 cursor-pointer transition-colors ${
                    selectedDepth === prof ? 'bg-padi-blue/15' : prof > 40 ? 'bg-alert-red/5' : prof > 30 ? 'bg-alert-gold/5' : 'hover:bg-ocean-mid/30'
                  }`}>
                  <td className="px-2 py-1.5 font-mono font-semibold text-text-primary">{prof}m</td>
                  <td className="text-center px-2 py-1.5 font-mono text-text-primary">{tiempo}</td>
                  <td className="text-center px-2 py-1.5">
                    {prof <= 18 ? <span className="text-success-green text-[10px]">Recreacional</span>
                      : prof <= 30 ? <span className="text-alert-gold text-[10px]">Avanzado</span>
                      : prof <= 40 ? <span className="text-safety-orange text-[10px]">Deep</span>
                      : <span className="text-alert-red text-[10px]">Técnico</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedDepth && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="bg-padi-blue/10 rounded-xl p-3 border border-padi-blue/20 text-center">
            <p className="text-xs text-text-secondary">
              A <span className="font-bold text-padi-blue">{selectedDepth}m</span> â†’ LND = <span className="font-bold font-mono text-padi-blue">{rdpTable.find(r => r[0] === selectedDepth)?.[1]} min</span>
            </p>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Checklist Tool â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ChecklistTool() {
  const categories = [
    {
      name: 'Equipo Principal',
      items: [
        'Tanque(s) con presión correcta',
        'Regulador primario y secundario (octopus)',
        'Chaleco compensador (BCD)',
        'Pesas y cinturón de lastre',
        'Traje de neopreno seco/húmedo',
        'Computadora de buceo',
        'Manómetro de profundidad',
      ],
    },
    {
      name: 'Seguridad',
      items: [
        'Cuchillo de buceo',
        'Boya de superficie (DSMB)',
        'Linterna primaria y backup',
        'Reel/ carrete de deco',
        'Silbato',
        'Espejo de señales',
      ],
    },
    {
      name: 'Técnico',
      items: [
        'Etiquetas de gas analizadas',
        'Mezclas deco configuradas',
        'Plan de deco impreso/QR',
        'Botiquí­n de O2',
        'Kit de herramientas',
      ],
    },
    {
      name: 'Pre-inmersión',
      items: [
        'Briefing con buddy',
        'Plan de emergencia acordado',
        'Señales revisadas',
        'Punto de reunión establecido',
        'Tiempo máximo acordado',
        'Estado de mar/tiempo OK',
      ],
    },
  ];

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (item: string) => {
    const next = new Set(checked);
    if (next.has(item)) next.delete(item); else next.add(item);
    setChecked(next);
  };
  const total = categories.reduce((s, c) => s + c.items.length, 0);
  const progress = Math.round((checked.size / total) * 100);

  return (
    <CalcShell icon={<ClipboardCheck size={22} className="text-success-green" />} title="Checklist" color="#2E8B57"
      description="Lista de verificación completa antes del buceo.">
      <div className="space-y-4">
        {/* Progress */}
        <div className="bg-ocean-mid rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-text-tertiary">Progreso</span>
            <span className="text-[10px] font-semibold text-success-green">{checked.size}/{total} ({progress}%)</span>
          </div>
          <div className="w-full bg-ocean-dark rounded-full h-2">
            <div className="bg-success-green h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Categories */}
        {categories.map(cat => {
          const catChecked = cat.items.filter(i => checked.has(i)).length;
          return (
            <div key={cat.name}>
              <p className="text-xs font-semibold text-padi-blue mb-2">{cat.name} ({catChecked}/{cat.items.length})</p>
              <div className="space-y-1.5">
                {cat.items.map(item => (
                  <button key={item} onClick={() => toggle(item)}
                    className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl transition-all ${
                      checked.has(item) ? 'bg-success-green/10 border border-success-green/20' : 'bg-ocean-mid border border-transparent'
                    }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      checked.has(item) ? 'bg-success-green' : 'bg-ocean-dark border border-text-tertiary'
                    }`}>
                      {checked.has(item) && <Check size={12} className="text-white" />}
                    </div>
                    <span className={`text-xs ${checked.has(item) ? 'text-success-green line-through' : 'text-text-primary'}`}>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {progress === 100 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-success-green/15 rounded-xl p-3 text-center border border-success-green/30">
            <p className="text-sm font-bold text-success-green">Checklist completo - Listo para bucear</p>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Unit Converter Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function UnitConverterCalculator() {
  const [category, setCategory] = useState<'presion' | 'peso' | 'distancia' | 'velocidad' | 'temperatura'>('presion');
  const [value, setValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('bar');
  const [toUnit, setToUnit] = useState<string>('psi');
  const [result, setResult] = useState<number | null>(null);

  const categories = {
    presion: {
      label: 'Presión',
      units: [
        { key: 'bar', label: 'bar', factor: 1 },
        { key: 'psi', label: 'PSI', factor: 14.5038 },
        { key: 'kpa', label: 'kPa', factor: 100 },
        { key: 'atm', label: 'atm', factor: 0.986923 },
        { key: 'mpa', label: 'MPa', factor: 0.1 },
      ],
    },
    peso: {
      label: 'Peso',
      units: [
        { key: 'kg', label: 'kg', factor: 1 },
        { key: 'lbs', label: 'libras (lbs)', factor: 2.20462 },
        { key: 'g', label: 'gramos', factor: 1000 },
        { key: 'oz', label: 'onzas (oz)', factor: 35.274 },
      ],
    },
    distancia: {
      label: 'Distancia',
      units: [
        { key: 'm', label: 'metros', factor: 1 },
        { key: 'ft', label: 'pies (ft)', factor: 3.28084 },
        { key: 'km', label: 'kilómetros', factor: 0.001 },
        { key: 'nm', label: 'millas náuticas (NM)', factor: 0.000539957 },
        { key: 'mi', label: 'millas terrestres', factor: 0.000621371 },
      ],
    },
    velocidad: {
      label: 'Velocidad',
      units: [
        { key: 'ms', label: 'm/s', factor: 1 },
        { key: 'kmh', label: 'km/h', factor: 3.6 },
        { key: 'knot', label: 'nudos (kn)', factor: 1.94384 },
        { key: 'mph', label: 'mph', factor: 2.23694 },
      ],
    },
    temperatura: {
      label: 'Temperatura',
      units: [
        { key: 'c', label: 'Â°Celsius', factor: 1 },
        { key: 'f', label: 'Â°Fahrenheit', factor: 1 },
        { key: 'k', label: 'Kelvin', factor: 1 },
      ],
    },
  };

  const currentUnits = categories[category].units;

  const handleConvert = () => {
    const val = parseFloat(value);
    if (isNaN(val)) { setResult(null); return; }

    if (category === 'temperatura') {
      let celsius = val;
      // Convertir a Celsius primero
      if (fromUnit === 'f') celsius = (val - 32) * 5 / 9;
      else if (fromUnit === 'k') celsius = val - 273.15;

      // De Celsius a destino
      if (toUnit === 'c') setResult(celsius);
      else if (toUnit === 'f') setResult(celsius * 9 / 5 + 32);
      else if (toUnit === 'k') setResult(celsius + 273.15);
      return;
    }

    // Conversión lineal: valor â†’ base â†’ destino
    const fromFactor = currentUnits.find(u => u.key === fromUnit)?.factor || 1;
    const toFactor = currentUnits.find(u => u.key === toUnit)?.factor || 1;
    const baseValue = val / fromFactor; // convertir a unidad base
    const finalValue = baseValue * toFactor; // convertir a destino
    setResult(finalValue);
  };

  // Auto-convertir cuando cambia valor/unidades
  useState(() => {});

  return (
    <CalcShell icon={<ArrowLeftRight size={22} className="text-purple-400" />} title="Conversor de Unidades" color="#9B59B6"
      description="Conversión completa de presión, peso, distancia, velocidad y temperatura.">
      <div className="space-y-4">
        {/* Categorí­a */}
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Categorí­a</label>
          <div className="grid grid-cols-5 gap-1.5">
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => {
                  setCategory(key as typeof category);
                  setResult(null);
                  // Set defaults
                  const defaults: Record<string, [string, string]> = {
                    presion: ['bar', 'psi'],
                    peso: ['kg', 'lbs'],
                    distancia: ['m', 'ft'],
                    velocidad: ['ms', 'knot'],
                    temperatura: ['c', 'f'],
                  };
                  setFromUnit(defaults[key][0]);
                  setToUnit(defaults[key][1]);
                }}
                className={`py-2 rounded-xl text-[10px] font-semibold transition-all ${
                  category === key
                    ? 'bg-purple-500 text-white'
                    : 'bg-ocean-mid text-text-secondary active:bg-ocean-mid/80'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Valor a convertir</label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full bg-ocean-mid border border-transparent focus:border-purple-500 rounded-xl px-3 py-3 text-sm text-text-primary outline-none"
            placeholder="Ingresa el valor"
          />
        </div>

        {/* Unidades */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">De</label>
            <select
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value)}
              className="w-full bg-ocean-mid border border-transparent focus:border-purple-500 rounded-xl px-3 py-3 text-sm text-text-primary outline-none appearance-none">
              {currentUnits.map(u => (
                <option key={u.key} value={u.key}>{u.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { const tmp = fromUnit; setFromUnit(toUnit); setToUnit(tmp); setResult(null); }}
            className="bg-ocean-mid rounded-full p-2.5 mb-0.5 active:bg-purple-500/20 transition-colors">
            <ArrowLeftRight size={16} className="text-purple-400" />
          </button>
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">A</label>
            <select
              value={toUnit}
              onChange={e => setToUnit(e.target.value)}
              className="w-full bg-ocean-mid border border-transparent focus:border-purple-500 rounded-xl px-3 py-3 text-sm text-text-primary outline-none appearance-none">
              {currentUnits.map(u => (
                <option key={u.key} value={u.key}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={handleConvert}
          className="w-full bg-purple-500 text-white font-semibold py-3 rounded-full active:scale-[0.98] transition-transform">
          Convertir
        </button>

        {result !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-purple-500 text-center">
              <p className="text-[10px] text-text-tertiary mb-1">Resultado</p>
              <p className="text-3xl font-bold font-mono text-purple-400">
                {Math.abs(result) < 0.01 ? result.toExponential(3) : result.toFixed(3).replace(/\.?0+$/, '')}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {currentUnits.find(u => u.key === fromUnit)?.label} â†’ {currentUnits.find(u => u.key === toUnit)?.label}
              </p>
            </div>

            {/* Tabla de referencia rápida */}
            <div className="bg-ocean-mid rounded-xl p-3">
              <p className="text-[10px] font-semibold text-purple-400 mb-2 text-center">
                Tabla de referencia â€” {categories[category].label}
              </p>
              <div className="space-y-1">
                {[0.5, 1, 2, 5, 10].map(mult => {
                  const baseVal = parseFloat(value) || 1;
                  const v = baseVal * mult;
                  // Convertir v desde fromUnit a cada otra unidad
                  return (
                    <div key={mult} className="grid grid-cols-4 gap-1 text-center">
                      <span className="text-[10px] text-text-tertiary py-1">{v}</span>
                      {currentUnits.filter(u => u.key !== fromUnit).slice(0, 3).map(u => {
                        let converted: number;
                        if (category === 'temperatura') {
                          let c = v;
                          if (fromUnit === 'f') c = (v - 32) * 5 / 9;
                          else if (fromUnit === 'k') c = v - 273.15;
                          if (u.key === 'c') converted = c;
                          else if (u.key === 'f') converted = c * 9 / 5 + 32;
                          else converted = c + 273.15;
                        } else {
                          const ff = currentUnits.find(x => x.key === fromUnit)?.factor || 1;
                          const tf = u.factor;
                          converted = (v / ff) * tf;
                        }
                        return (
                          <span key={u.key} className="text-[10px] text-text-primary font-mono py-1 bg-ocean-dark rounded">
                            {converted < 0.01 ? converted.toExponential(2) : converted.toFixed(2).replace(/\.?0+$/, '')} {u.label}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CalcShell({ icon, title, color, description, children }: {
  icon: React.ReactNode; title: string; color: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="px-4 pt-4 pb-6">
      <div className="bg-ocean-dark rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-t-[4px]" style={{ borderColor: color }}>
          <div className="flex items-center gap-3 mb-2">
            {icon}
            <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          </div>
          <p className="text-sm text-text-secondary mb-4">{description}</p>
          {children}
        </div>
      </div>
      <p className="text-[10px] text-text-tertiary text-center mt-3 px-4">
        âš ï¸ Verifica siempre con tablas PADI oficiales. Esta calculadora es una herramienta de apoyo.
      </p>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Tabla MOD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TablaMOD() {
  const mixes = [
    { fO2: 0.21, name: 'Aire' },
    { fO2: 0.28, name: 'EANx28' },
    { fO2: 0.30, name: 'EANx30' },
    { fO2: 0.32, name: 'EANx32' },
    { fO2: 0.34, name: 'EANx34' },
    { fO2: 0.36, name: 'EANx36' },
    { fO2: 0.38, name: 'EANx38' },
    { fO2: 0.40, name: 'EANx40' },
    { fO2: 0.50, name: 'EANx50 (Deco)' },
    { fO2: 0.80, name: 'EANx80 (Deco)' },
    { fO2: 1.00, name: 'O2 100% (Deco)' },
  ];
  const pO2Options = [1.4, 1.5, 1.6];
  const [selectedPO2, setSelectedPO2] = useState(1.4);

  return (
    <CalcShell icon={<Grid3x3 size={22} className="text-padi-blue" />} title="Tabla MOD" color="#0070D3"
      description="Profundidad Máxima Operativa para todas las mezclas.">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-text-tertiary font-medium mb-1 block">PO2 máxima (bar)</label>
          <div className="flex gap-2">
            {pO2Options.map(p => (
              <button key={p} onClick={() => setSelectedPO2(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  selectedPO2 === p ? 'bg-padi-blue text-white' : 'bg-ocean-mid text-text-secondary'
                }`}>
                {p} bar
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {mixes.map(m => {
            const mod = ((selectedPO2 / m.fO2) - 1) * 10;
            const isDeco = m.fO2 >= 0.5;
            return (
              <div key={m.fO2} className={`flex items-center justify-between bg-ocean-mid rounded-xl px-3 py-2.5 ${isDeco ? 'border border-safety-orange/20' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isDeco ? '#FF7B2E' : '#0070D3' }} />
                  <span className="text-xs text-text-primary font-medium">{m.name}</span>
                </div>
                <span className={`text-sm font-mono font-bold ${mod < 6 ? 'text-alert-red' : mod < 12 ? 'text-safety-orange' : 'text-padi-blue'}`}>
                  {mod.toFixed(1)}m
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CNS Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CNSCalculator() {
  const [exposures, setExposures] = useState([
    { po2: 1.4, time: 20 },
  ]);
  const [result, setResult] = useState<{ totalCNS: number; status: string; color: string } | null>(null);

  const cnsLimits: Record<number, number> = {
    0.5: 300, 0.6: 300, 0.7: 240, 0.8: 180, 0.9: 150,
    1.0: 120, 1.1: 90, 1.2: 60, 1.3: 45, 1.4: 45,
    1.5: 30, 1.6: 15,
  };

  function getCNSLimit(po2: number): number {
    if (po2 <= 0.5) return 300;
    const keys = Object.keys(cnsLimits).map(Number).sort((a, b) => a - b);
    for (const k of keys) {
      if (po2 <= k) return cnsLimits[k];
    }
    return 15;
  }

  const handleCalculate = () => {
    let total = 0;
    for (const e of exposures) {
      if (e.po2 <= 0.5) continue;
      const limit = getCNSLimit(e.po2);
      total += (e.time / limit) * 100;
    }
    total = Math.min(100, Math.round(total * 10) / 10);
    const status = total < 50 ? { status: 'Seguro', color: 'text-success-green' }
      : total < 80 ? { status: 'Precaución', color: 'text-alert-gold' }
      : total < 100 ? { status: 'Peligro', color: 'text-alert-red' }
      : { status: 'CRíTICO', color: 'text-alert-red' };
    setResult({ totalCNS: total, ...status });
  };

  const updateExposure = (i: number, field: 'po2' | 'time', val: number) => {
    const next = [...exposures];
    next[i] = { ...next[i], [field]: val };
    setExposures(next);
  };

  const addExposure = () => setExposures([...exposures, { po2: 1.4, time: 20 }]);
  const removeExposure = (i: number) => {
    if (exposures.length <= 1) return;
    setExposures(exposures.filter((_, idx) => idx !== i));
  };

  return (
    <CalcShell icon={<Activity size={22} className="text-alert-red" />} title="Calculadora CNS" color="#F23D4E"
      description="Toxicidad por oxí­geno acumulada (CNS%) basada en PO2 y tiempo.">
      <div className="space-y-4">
        <p className="text-[10px] text-text-tertiary">Agrega cada exposición a O2 (fondo + deco). El CNS se acumula.</p>

        {exposures.map((e, i) => (
          <div key={i} className="bg-ocean-mid rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-text-tertiary">Exposición {i + 1}</span>
              {exposures.length > 1 && (
                <button onClick={() => removeExposure(i)} className="text-[10px] text-alert-red">Eliminar</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-tertiary mb-0.5 block">PO2 (bar)</label>
                <input type="number" value={e.po2} onChange={ev => updateExposure(i, 'po2', Number(ev.target.value))}
                  min={0.5} max={1.6} step={0.1}
                  className="w-full bg-ocean-dark border border-transparent focus:border-padi-blue rounded-lg px-2 py-2 text-xs text-text-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary mb-0.5 block">Tiempo (min)</label>
                <input type="number" value={e.time} onChange={ev => updateExposure(i, 'time', Number(ev.target.value))}
                  min={1} max={300}
                  className="w-full bg-ocean-dark border border-transparent focus:border-padi-blue rounded-lg px-2 py-2 text-xs text-text-primary outline-none" />
              </div>
            </div>
          </div>
        ))}

        <button onClick={addExposure}
          className="w-full bg-ocean-mid text-padi-blue text-xs font-semibold py-2.5 rounded-full">
          + Agregar exposición
        </button>

        <button onClick={handleCalculate}
          className="w-full bg-alert-red text-white font-semibold py-3 rounded-full active:scale-[0.98] transition-transform">
          Calcular CNS Total
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-deep-ocean rounded-xl p-4 border-t-[3px] border-alert-red text-center">
              <p className="text-[10px] text-text-tertiary mb-1">CNS Total Acumulado</p>
              <p className="text-3xl font-bold font-mono text-alert-red">{result.totalCNS}%</p>
              <p className={`text-xs font-semibold mt-1 ${result.color}`}>{result.status}</p>
            </div>

            {/* Visual bar */}
            <div className="bg-ocean-mid rounded-xl p-3">
              <div className="w-full bg-ocean-dark rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, result.totalCNS)}%`,
                    backgroundColor: result.totalCNS < 50 ? '#2E8B57' : result.totalCNS < 80 ? '#FFD700' : '#F23D4E',
                  }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-text-tertiary">0%</span>
                <span className="text-[9px] text-alert-gold">50%</span>
                <span className="text-[9px] text-alert-red">80%</span>
                <span className="text-[9px] text-alert-red">100%</span>
              </div>
            </div>

            {result.totalCNS >= 80 && (
              <div className="bg-alert-red/10 rounded-xl p-3 border border-alert-red/20">
                <p className="text-xs text-alert-red font-medium text-center">
                  âš ï¸ CNS â‰¥ 80% â€” Riesgo de convulsión por O2. Reduce PO2 o tiempo.
                </p>
              </div>
            )}

            {/* Reference table */}
            <div className="bg-ocean-mid rounded-xl p-3">
              <p className="text-[10px] font-semibold text-text-secondary mb-2">Lí­mites CNS por PO2</p>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(cnsLimits).filter(([k]) => Number(k) >= 1.0).map(([po2, limit]) => (
                  <div key={po2} className="bg-ocean-dark rounded-lg px-2 py-1 text-center">
                    <span className="text-[9px] text-text-tertiary">{po2} bar</span>
                    <span className="text-[10px] font-mono font-semibold text-text-primary ml-1">{limit}m</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </CalcShell>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function CalculatorDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  switch (slug) {
    case 'mod': return <MODCalculator />;
    case 'lnd': return <LNDCalculator />;
    case 'best-mix': return <BestMixCalculator />;
    case 'gas-blender': return <GasBlenderCalculator />;
    case 'ead': return <EADCalculator />;
    case 'sac': return <SACCalculator />;
    case 'conversor': return <UnitConverterCalculator />;
    case 'tabla-rdp': return <TablaRDP />;
    case 'checklist': return <ChecklistTool />;
    case 'mod-tabla': return <TablaMOD />;
    case 'cns': return <CNSCalculator />;
    case 'log': return <Navigate to="/bitacora" replace />;
    default: return <Navigate to="/calc-tools" replace />;
  }
}

