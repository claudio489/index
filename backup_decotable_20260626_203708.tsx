import { Clock, ArrowDown, ArrowUp, Anchor, Shield, Home } from 'lucide-react';
import type { TimelineEntry, DecoStop } from '../lib/buhlmann';

interface DecoTableProps {
  timeline: TimelineEntry[];
  stops: DecoStop[];
  totalDecoTime: number;
  runTime: number;
}

export default function DecoTable({ timeline, stops, totalDecoTime, runTime }: DecoTableProps) {
  if (!timeline || timeline.length === 0) return null;

  // Extraer puntos CLAVE del timeline (como MultiDeco):
  // - Inicio descenso
  // - Inicio fondo  
  // - Cada parada deco (solo inicio de parada con su duracion)
  // - Fin/superficie
  const keyPoints: {
    prof: number;
    para: string;
    total: number;
    gas: string;
    po2: string;
    phase: string;
  }[] = [];

  // Punto 1: Descenso hasta fondo
  const descentEnd = timeline.find(t => t.phase === 'bottom');
  if (descentEnd) {
    keyPoints.push({
      prof: descentEnd.depth,
      para: '-',
      total: descentEnd.runTime,
      gas: descentEnd.gas?.replace('EANx', '') || '-',
      po2: '-',
      phase: 'descent'
    });
  }

  // Punto 2: Fondo (fin del bottom time)
  const bottomEntries = timeline.filter(t => t.phase === 'bottom');
  if (bottomEntries.length > 0) {
    const lastBottom = bottomEntries[bottomEntries.length - 1];
    const firstBottom = bottomEntries[0];
    const bottomDuration = lastBottom.runTime - firstBottom.runTime;
    keyPoints.push({
      prof: lastBottom.depth,
      para: `${bottomDuration}`,
      total: lastBottom.runTime,
      gas: lastBottom.gas?.replace('EANx', '') || '-',
      po2: lastBottom.po2?.toFixed(2) || '-',
      phase: 'bottom'
    });
  }

  // Punto 3: Cada parada deco (del array stops, no del timeline)
  for (const stop of stops) {
    keyPoints.push({
      prof: stop.depth,
      para: `${stop.time}:00`,
      total: stop.runTime + stop.time,
      gas: stop.gas?.replace('EANx', '') || '-',
      po2: stop.po2.toFixed(2),
      phase: 'deco'
    });
  }

  // Punto 4: Superficie
  keyPoints.push({
    prof: 0,
    para: '-',
    total: runTime,
    gas: keyPoints.length > 0 ? keyPoints[keyPoints.length - 1].gas : '-',
    po2: '-',
    phase: 'surface'
  });

  const phaseIcons: Record<string, React.ReactNode> = {
    'descent': <ArrowDown className="w-4 h-4 text-padi-blue" />,
    'bottom': <Anchor className="w-4 h-4 text-padi-blue" />,
    'deco': <Shield className="w-4 h-4 text-alert-gold" />,
    'surface': <Home className="w-4 h-4 text-success-green" />,
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
              <th className="text-center p-3">Para</th>
              <th className="text-center p-3">Total</th>
              <th className="text-center p-3">Gas</th>
              <th className="text-center p-3">pO2</th>
            </tr>
          </thead>
          <tbody>
            {keyPoints.map((pt, index) => (
              <tr key={index} className="border-b border-ocean-surface/10 hover:bg-ocean-mid/20 transition-colors">
                <td className="p-3 text-center">
                  {phaseIcons[pt.phase] || <Anchor className="w-4 h-4" />}
                </td>
                <td className="text-center p-3 text-text-primary font-bold">{pt.prof}m</td>
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