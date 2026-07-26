import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle } from 'lucide-react';
import { calculateDivePlan, calculateNo50Plan } from '../lib/buhlmann';
import type { DivePlan } from '../lib/buhlmann';
import DivePlanForm from '../components/DivePlanForm';
import type { DivePlanInput } from '../components/DivePlanForm';
import DecoTable from '../components/DecoTable';
import DiveProfileChart from '../components/DiveProfileChart';
import GasConsumptionPanel from '../components/GasConsumptionPanel';

export default function PlannerPage() {
  const [plan, setPlan] = useState<DivePlan | null>(null);
  const [contingencyPlan, setContingencyPlan] = useState<DivePlan | null>(null);
  const [lastInput, setLastInput] = useState<{ depth: number; bottomTime: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = (input: DivePlanInput) => {
    setLoading(true);
    setError('');
    try {
      const bottomGasName = input.gasType === 'air' ? 'Aire' :
                            input.gasType === 'ean32' ? 'EAN32' :
                            input.gasType === 'ean36' ? 'EAN36' :
                            `Custom ${input.fO2}%`;

      const result = calculateDivePlan({
        depth: input.depth,
        bottomTime: input.bottomTime,
        bottomGas: { fO2: input.fO2 / 100, fHe: 0, name: bottomGasName },
        decoGases: input.decoGases,
        ascentRate: input.ascentRate,
        descentRate: input.descentRate || 18,
        gfLow: input.gfLow / 100,
        gfHigh: input.gfHigh / 100,
        lastStopDepth: input.lastStopDepth,
      });
      setPlan(result);
      setLastInput({ depth: input.depth, bottomTime: input.bottomTime });

      const no50Result = calculateNo50Plan({
        depth: input.depth,
        bottomTime: input.bottomTime,
        bottomGas: { fO2: input.fO2 / 100, fHe: 0, name: bottomGasName },
        decoGases: [],
        gfLow: input.gfLow / 100,
        gfHigh: input.gfHigh / 100,
        descentRate: input.descentRate,
        ascentRate: input.ascentRate,
        lastStopDepth: input.lastStopDepth,
      });
      setContingencyPlan(no50Result);
    } catch (err: any) {
      setError(err.message || 'Error al calcular el plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="relative w-full h-[180px] overflow-hidden mb-6">
        <img src="./hero-bg.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-ocean via-deep-ocean/60 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h1 className="text-text-primary text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-padi-blue" />
            Planificador Deco
          </h1>
          <p className="text-text-secondary text-sm mt-1">Buhlmann ZHL-16C + Gradient Factors</p>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto space-y-6">
        <DivePlanForm onCalculate={handleCalculate} loading={loading} />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-alert-red/10 border border-alert-red/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-alert-red flex-shrink-0" />
            <p className="text-alert-red text-sm">{error}</p>
          </motion.div>
        )}

        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-padi-blue">{plan.runTime}</div>
                <div className="text-text-secondary text-xs">Runtime (min)</div>
              </div>
              <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-alert-gold">{plan.totalDecoTime}</div>
                <div className="text-text-secondary text-xs">Deco (min)</div>
              </div>
              <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-alert-red">{plan.cnsTotal}%</div>
                <div className="text-text-secondary text-xs">CNS</div>
              </div>
              <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-success-green">{plan.otuTotal}</div>
                <div className="text-text-secondary text-xs">OTU</div>
              </div>
            </div>

            <DecoTable
              timeline={plan.timeline}
              stops={plan.stops}
              totalDecoTime={plan.totalDecoTime}
              runTime={plan.runTime}
              gasSwitches={plan.gasSwitches}
            />

            <DiveProfileChart timeline={plan.timeline} />

            {lastInput && (
              <GasConsumptionPanel
                bottomDepth={lastInput.depth}
                bottomTime={lastInput.bottomTime}
                bottomGasName={plan.bottomGasName}
                stops={plan.stops}
              />
            )}

            {contingencyPlan && (
              <div className="mt-6 pt-6 border-t border-ocean-surface/20">
                <h3 className="text-alert-red font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Plan Contingencia (Sin Deco Gases)
                </h3>
                <DecoTable
                  timeline={contingencyPlan.timeline}
                  stops={contingencyPlan.stops}
                  totalDecoTime={contingencyPlan.totalDecoTime}
                  runTime={contingencyPlan.runTime}
                  gasSwitches={contingencyPlan.gasSwitches}
                />
                <div className="mt-4">
                  <DiveProfileChart timeline={contingencyPlan.timeline} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}