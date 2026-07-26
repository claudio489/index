import { Clock, ArrowDown, Anchor, Shield, Home, Repeat, MoveVertical } from 'lucide-react';
import type { TimelineEntry, DecoStop } from '../lib/buhlmann';

interface GasSwitch {
  depth: number;
  from: string;
  to: string;
}

interface DecoTableProps {
  timeline: TimelineEntry[];
  stops: DecoStop[];
  totalDecoTime: number;
  runTime: number;
  gasSwitches?: GasSwitch[];
}

function classifyPhase(event: string | undefined): { phase: string; isTransit: boolean } {
  if (!event) return { phase: 'transit', isTransit: true };
  if (event.includes('Inicio')) return { phase: 'descent', isTransit: false };
  if (event.includes('Llegada al fondo')) return { phase: 'bottom', isTransit: false };
  if (event.includes('Fin de fondo')) return { phase: 'bottom', isTransit: false };
  if (event.includes('Cambio a')) return { phase: 'switch', isTransit: false };
  if (event.includes('Parada')) return { phase: 'deco', isTransit: false };
  if (event.includes('Superficie')) return { phase: 'surface', isTransit: false };
  return { phase: 'transit', isTransit: true };
}

export default function DecoTable({ timeline, totalDecoTime, runTime }: DecoTableProps) {
  if (!timeline || timeline.length === 0) return null;

  const dedupedTimeline: TimelineEntry[] = [];
  for (const pt of timeline) {
    const prev = dedupedTimeline[dedupedTimeline.length - 1];
    if (prev && prev.time === pt.time && prev.depth === pt.depth) {
      dedupedTimeline[dedupedTimeline.length - 1] = pt;
    } else {
      dedupedTimeline.push(pt);
    }
  }

  const seenParadaCount: Record<string, number> = {};

  const rows = dedupedTimeline.map((pt, index) => {
    const prevPt = dedupedTimeline[index - 1];
    const paraMin = prevPt ? Math.round((pt.time - prevPt.time) * 10) / 10 : 0;
    const classified = classifyPhase(pt.event);
    let phase = classified.phase;
    const isTransit = classified.isTransit;

    let label = pt.event || '';
    if (isTransit) {
      label = pt.depth > (prevPt?.depth ?? 0) ? 'Descenso' : 'Ascenso';
    } else if (pt.event?.includes('Parada')) {
      const key = pt.event;
      seenParadaCount[key] = (seenParadaCount[key] || 0) + 1;
      if (seenParadaCount[key] === 1) {
        label = `Ascenso a ${pt.depth}m`;
        phase = 'transit';
      } else {
        label = `Fin parada ${pt.depth}m`;
      }
    }

    return {
      prof: pt.depth,
      para: index === 0 ? '-' : `${paraMin}`,
      total: pt.time,
      gas: pt.gasName?.replace('EANx', '') || '-',
      po2: pt.pO2 ? pt.pO2.toFixed(2) : '-',
      phase,
      label,
    };
  });

  const phaseIcons: Record<string, React.ReactNode> = {
    'descent': <ArrowDown className="w-4 h-4 text-padi-blue" />,
    'bottom': <Anchor className="w-4 h-4 text-padi-blue" />,
    'deco': <Shield className="w-4 h-4 text-alert-gold" />,
    'surface': <Home className="w-4 h-4 text-success-green" />,
    'switch': <Repeat className="w-4 h-4 text-alert-gold" />,
    'transit': <MoveVertical className="w-4 h-4 text-text-tertiary" />,
  };

  return (
    <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-ocean-surface/20">
        <h3 className="text-text-primary font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-padi-blue" />
          Perfil de Inmersion
        </h3>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          <span>Runtime: <span className="text-padi-blue font-bold">{runTime} min</span></span>
          <span>Deco: <span className="text-alert-gold font-bold">{totalDecoTime} min</span></span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ocean-surface/20 text-text-tertiary text-xs bg-ocean-mid/30">
              <th className="p-3 w-8"></th>
              <th className="text-center p-3">Prof</th>
              <th className="text-center p-3">Evento</th>
              <th className="text-center p-3">Para</th>
              <th className="text-center p-3">Total</th>
              <th className="text-center p-3">Gas</th>
              <th className="text-center p-3">pO2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pt, index) => (
              <tr key={index} className={`border-b border-ocean-surface/10 hover:bg-ocean-mid/20 transition-colors ${pt.phase === 'transit' ? 'opacity-60' : ''}`}>
                <td className="p-3 text-center">
                  {phaseIcons[pt.phase] || <Anchor className="w-4 h-4" />}
                </td>
                <td className="text-center p-3 text-text-primary font-bold">{pt.prof}m</td>
                <td className="text-center p-3 text-text-tertiary text-xs">{pt.label}</td>
                <td className="text-center p-3 text-alert-gold font-bold">{pt.para}</td>
                <td className="text-center p-3 text-padi-blue font-bold">{pt.total}</td>
                <td className="text-center p-3 text-text-secondary">{pt.gas}</td>
                <td className="text-center p-3 text-text-secondary">{pt.po2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}