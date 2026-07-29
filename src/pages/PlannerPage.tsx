import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle, Lock, CheckCircle2, Smartphone } from 'lucide-react';
import { calculateDivePlan, calculateNo50Plan } from '../lib/buhlmann';
import type { DivePlan } from '../lib/buhlmann';
import DivePlanForm from '../components/DivePlanForm';
import type { DivePlanInput } from '../components/DivePlanForm';
import DecoTable from '../components/DecoTable';
import DiveProfileChart from '../components/DiveProfileChart';
import GasConsumptionPanel from '../components/GasConsumptionPanel';
import { useDivespotAuthStore } from '../stores/useDivespotAuthStore';
import { supabaseDivespot } from '../lib/supabaseDivespot';

const DEVICE_ID_KEY = 'deepspot_tech_device_id';

function getOrCreateLocalDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function TechAccessLocked() {
  const userId = useDivespotAuthStore((s) => s.userId);
  const email = useDivespotAuthStore((s) => s.email);
  const fullName = useDivespotAuthStore((s) => s.profile?.full_name);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequest = async () => {
    if (!userId || !email) return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const { data: sessionData } = await supabaseDivespot.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('No hay sesion activa, intenta cerrar sesion e iniciar de nuevo');
      }

      const res = await fetch('/.netlify/functions/request-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, fullName, accessToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo enviar la solicitud');
      }

      setStatus('sent');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '');
      setStatus('error');
    }
  };

  return (
    <div className="px-4 max-w-2xl mx-auto">
      <div className="bg-ocean-dark border border-alert-gold/30 rounded-2xl p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-alert-gold/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-alert-gold" />
        </div>
        <h2 className="text-text-primary text-lg font-bold">
          Modulo tecnico restringido
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          El Planificador Deco requiere certificaciones verificadas (Nitrox, Gas Blender y Tec 40).
          Si ya las tienes, solicita la activacion de tu cuenta.
        </p>

        {status === 'sent' ? (
          <div className="flex items-center justify-center gap-2 text-success-green font-semibold py-3">
            <CheckCircle2 className="w-5 h-5" />
            Solicitud enviada. Te avisaremos cuando este activo.
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={status === 'sending'}
            className="inline-block bg-padi-blue hover:bg-padi-blue-light text-white font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-50"
          >
            {status === 'sending' ? 'Enviando...' : 'Solicitar activacion / informacion'}
          </button>
        )}

        {status === 'error' && (
          <p className="text-alert-red text-xs">
            No se pudo enviar la solicitud{errorMsg ? `: ${errorMsg}` : ''}. Intenta de nuevo o escribinos a claudio@deepspot.cl
          </p>
        )}
      </div>
    </div>
  );
}

function DeviceLocked({ limit }: { limit: number }) {
  return (
    <div className="px-4 max-w-2xl mx-auto">
      <div className="bg-ocean-dark border border-alert-red/30 rounded-2xl p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-alert-red/10 flex items-center justify-center">
          <Smartphone className="w-7 h-7 text-alert-red" />
        </div>
        <h2 className="text-text-primary text-lg font-bold">
          Limite de dispositivos alcanzado
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          El Planificador Deco de esta cuenta ya esta activo en {limit} dispositivo{limit === 1 ? '' : 's'}.
          Si necesitas usarlo en uno adicional, contactanos.
        </p>
        <a
          href="mailto:claudio@deepspot.cl?subject=Agregar%20dispositivo%20-%20Modulo%20tecnico"
          className="inline-block bg-padi-blue hover:bg-padi-blue-light text-white font-semibold px-6 py-3 rounded-full transition-all"
        >
          Contactar
        </a>
      </div>
    </div>
  );
}

function useDeviceCheck(techAccessVerified: boolean | undefined) {
  const userId = useDivespotAuthStore((s) => s.userId);
  const [deviceStatus, setDeviceStatus] = useState<'checking' | 'ok' | 'blocked'>('checking');
  const [limit, setLimit] = useState(1);

  useEffect(() => {
    if (!techAccessVerified || !userId) {
      setDeviceStatus('checking');
      return;
    }

    let active = true;
    const localId = getOrCreateLocalDeviceId();

    supabaseDivespot
      .from('profiles')
      .select('tech_device_ids, tech_device_limit')
      .eq('id', userId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return;
        const deviceIds: string[] = data?.tech_device_ids || [];
        const deviceLimit: number = data?.tech_device_limit ?? 1;
        setLimit(deviceLimit);

        if (deviceIds.includes(localId)) {
          setDeviceStatus('ok');
          return;
        }

        if (deviceIds.length < deviceLimit) {
          // Hay espacio: este dispositivo se agrega automaticamente a la lista
          const updated = [...deviceIds, localId];
          await supabaseDivespot
            .from('profiles')
            .update({ tech_device_ids: updated })
            .eq('id', userId);
          if (active) setDeviceStatus('ok');
        } else {
          setDeviceStatus('blocked');
        }
      });

    return () => { active = false; };
  }, [techAccessVerified, userId]);

  return { deviceStatus, limit };
}

export default function PlannerPage() {
  const techAccessVerified = useDivespotAuthStore((s) => s.profile?.tech_access_verified);
  const { deviceStatus, limit } = useDeviceCheck(techAccessVerified);
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

  if (!techAccessVerified) {
    return (
      <div className="min-h-screen pb-20 pt-10">
        <TechAccessLocked />
      </div>
    );
  }

  if (deviceStatus === 'checking') {
    return (
      <div className="min-h-screen pb-20 pt-10 flex items-center justify-center">
        <p className="text-text-secondary text-sm">Verificando dispositivo...</p>
      </div>
    );
  }

  if (deviceStatus === 'blocked') {
    return (
      <div className="min-h-screen pb-20 pt-10">
        <DeviceLocked limit={limit} />
      </div>
    );
  }

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


