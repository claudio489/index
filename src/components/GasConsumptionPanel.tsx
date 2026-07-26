import { useState, useMemo } from 'react';
import { Droplets, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DecoStop } from '../lib/buhlmann';

interface GasConsumptionPanelProps {
  bottomDepth: number;
  bottomTime: number;
  bottomGasName: string;
  stops: DecoStop[];
}

interface TankConfig {
  volume: number;
  pressure: number;
}

function ambientPressure(depth: number): number {
  return 1 + depth / 10;
}

export default function GasConsumptionPanel({ bottomDepth, bottomTime, bottomGasName, stops }: GasConsumptionPanelProps) {
  const [sacRate, setSacRate] = useState(20);
  const [safetyMargin, setSafetyMargin] = useState(1.5);

  const consumptionByGas = useMemo(() => {
    const totals: Record<string, number> = {};

    totals[bottomGasName] = (totals[bottomGasName] || 0) + sacRate * ambientPressure(bottomDepth) * bottomTime;

    for (const stop of stops) {
      totals[stop.gasName] = (totals[stop.gasName] || 0) + sacRate * ambientPressure(stop.depth) * stop.time;
    }

    Object.keys(totals).forEach((gas) => {
      totals[gas] = totals[gas] * safetyMargin;
    });

    return totals;
  }, [sacRate, safetyMargin, bottomDepth, bottomTime, bottomGasName, stops]);

  const gasNames = Object.keys(consumptionByGas);

  const [tankConfigs, setTankConfigs] = useState<Record<string, TankConfig>>(() => {
    const initial: Record<string, TankConfig> = {};
    gasNames.forEach((name) => {
      initial[name] = name === bottomGasName
        ? { volume: 24, pressure: 200 }
        : { volume: 6, pressure: 200 };
    });
    return initial;
  });

  const updateTank = (gasName: string, field: keyof TankConfig, value: number) => {
    setTankConfigs((prev) => ({
      ...prev,
      [gasName]: { ...(prev[gasName] || { volume: 12, pressure: 200 }), [field]: value },
    }));
  };

  return (
    <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-bold flex items-center gap-2">
          <Droplets className="w-5 h-5 text-padi-blue" />
          Consumo de Gas
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-tertiary">SAC (L/min)</label>
            <input
              type="number"
              value={sacRate}
              onChange={(e) => setSacRate(Number(e.target.value) || 0)}
              className="w-16 bg-ocean-mid border border-ocean-surface/30 rounded-lg px-2 py-1 text-sm text-text-primary text-center"
              min={10}
              max={40}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-tertiary">Margen</label>
            <input
              type="number"
              value={safetyMargin}
              onChange={(e) => setSafetyMargin(Number(e.target.value) || 1)}
              className="w-14 bg-ocean-mid border border-ocean-surface/30 rounded-lg px-2 py-1 text-sm text-text-primary text-center"
              step={0.1}
              min={1}
              max={3}
            />
            <span className="text-xs text-text-tertiary">x</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-tertiary mb-4">
        Estimacion teorica con SAC constante, litros ya incluyen el margen de seguridad configurado. No reemplaza tu propio consumo medido — ajusta los valores arriba segun tu criterio.
      </p>

      <div className="space-y-3">
        {gasNames.map((gasName) => {
          const litersNeeded = Math.ceil(consumptionByGas[gasName]);
          const tank = tankConfigs[gasName] || { volume: 12, pressure: 200 };
          const litersAvailable = tank.volume * tank.pressure;
          const litersRemaining = litersAvailable - litersNeeded;
          const barRemaining = tank.volume > 0 ? Math.round(litersRemaining / tank.volume) : 0;
          const isEnough = litersRemaining >= 0;
          const isTight = isEnough && barRemaining < 30;

          return (
            <div key={gasName} className={`rounded-xl p-3 border ${
              !isEnough ? 'bg-alert-red/10 border-alert-red/30' :
              isTight ? 'bg-alert-gold/10 border-alert-gold/30' :
              'bg-success-green/5 border-success-green/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-primary">{gasName}</span>
                <span className="text-xs text-text-secondary">{litersNeeded} L necesarios (c/margen)</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <label className="text-[10px] text-text-tertiary">Cilindro</label>
                <input
                  type="number"
                  value={tank.volume}
                  onChange={(e) => updateTank(gasName, 'volume', Number(e.target.value) || 0)}
                  className="w-14 bg-ocean-mid border border-ocean-surface/30 rounded-lg px-1.5 py-1 text-xs text-text-primary text-center"
                />
                <span className="text-[10px] text-text-tertiary">L @</span>
                <input
                  type="number"
                  value={tank.pressure}
                  onChange={(e) => updateTank(gasName, 'pressure', Number(e.target.value) || 0)}
                  className="w-16 bg-ocean-mid border border-ocean-surface/30 rounded-lg px-1.5 py-1 text-xs text-text-primary text-center"
                />
                <span className="text-[10px] text-text-tertiary">bar = {litersAvailable} L</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {isEnough ? (
                  <CheckCircle className={`w-3.5 h-3.5 ${isTight ? 'text-alert-gold' : 'text-success-green'}`} />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-alert-red" />
                )}
                <span className={!isEnough ? 'text-alert-red font-medium' : isTight ? 'text-alert-gold font-medium' : 'text-success-green'}>
                  {isEnough
                    ? `Alcanza — quedarian ~${barRemaining} bar de reserva`
                    : `No alcanza — faltan ${Math.abs(litersRemaining)} L (~${Math.abs(barRemaining)} bar)`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}