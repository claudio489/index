import { Clock, ArrowDown, ArrowUp, Anchor, Shield } from 'lucide-react';
import type { TimelineEntry } from '../lib/buhlmann';

interface DecoTableProps {
  timeline: TimelineEntry[];
  totalDecoTime: number;
  runTime: number;
}

export default function DecoTable({ timeline, totalDecoTime, runTime }: DecoTableProps) {
  // Agrupar por fases consecutivas
  const phases: { phase: string; start: number; end: number; depth: number; gas: string; notes: string }[] = [];
  
  let currentPhase = timeline[0];
  let phaseStart = 0;
  
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].phase !== currentPhase.phase || timeline[i].depth !== currentPhase.depth) {
      phases.push({
        phase: currentPhase.phase,
        start: phaseStart,
        end: timeline[i-1].runTime,
        depth: currentPhase.depth,
        gas: currentPhase.gas || '',
        notes: currentPhase.notes || '',
      });
      currentPhase = timeline[i];
      phaseStart = timeline[i].runTime;
    }
  }
  
  // Agregar última fase
  if (timeline.length > 0) {
    phases.push({
      phase: currentPhase.phase,
      start: phaseStart,
      end: timeline[timeline.length - 1].runTime,
      depth: currentPhase.depth,
      gas: currentPhase.gas || '',
      notes: currentPhase.notes || '',
    });
  }

  const phaseIcons: Record<string, React.ReactNode> = {
    'surface': <Anchor className="w-4 h-4" />,
    'descent': <ArrowDown className="w-4 h-4 text-alert-red" />,
    'bottom': <Anchor className="w-4 h-4 text-padi-blue" />,
    'ascent': <ArrowUp className="w-4 h-4 text-success-green" />,
    'deco': <Shield className="w-4 h-4 text-alert-gold" />,
    'safety': <Shield className="w-4 h-4 text-success-green" />,
    'gas-switch': <ArrowUp className="w-4 h-4 text-safety-orange" />,
  };

  const phaseColors: Record<string, string> = {
    'surface': 'text-text-secondary',
    'descent': 'text-alert-red',
    'bottom': 'text-padi-blue',
    'ascent': 'text-success-green',
    'deco': 'text-alert-gold',
    'safety': 'text-success-green',
    'gas-switch': 'text-safety-orange',
  };

  return (
    <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-ocean-surface/20">
        <h3 className="text-text-primary font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-padi-blue" />
          Plan de Inmersión
        </h3>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          <span>Runtime: <span className="text-padi-blue font-bold">{runTime} min</span></span>
          <span>Deco: <span className="text-alert-gold font-bold">{totalDecoTime} min</span></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ocean-surface/20 text-text-tertiary text-xs">
              <th className="text-left p-3">Fase</th>
              <th className="text-center p-3">Profundidad</th>
              <th className="text-center p-3">Inicio</th>
              <th className="text-center p-3">Fin</th>
              <th className="text-center p-3">Duración</th>
              <th className="text-center p-3">Gas</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase, index) => (
              <tr key={index} className="border-b border-ocean-surface/10 hover:bg-ocean-mid/30 transition-colors">
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1.5 font-medium ${phaseColors[phase.phase] || 'text-text-primary'}`}>
                    {phaseIcons[phase.phase] || <Anchor className="w-4 h-4" />}
                    <span className="capitalize">{phase.phase.replace('-', ' ')}</span>
                  </span>
                </td>
                <td className="text-center p-3 text-text-primary font-bold">{phase.depth}m</td>
                <td className="text-center p-3 text-text-secondary">{phase.start} min</td>
                <td className="text-center p-3 text-text-secondary">{phase.end} min</td>
                <td className="text-center p-3 text-alert-gold font-bold">{phase.end - phase.start} min</td>
                <td className="text-center p-3 text-padi-blue">{phase.gas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
