import type { TimelineEntry } from '../lib/buhlmann';

interface DiveProfileChartProps {
  timeline: TimelineEntry[];
}

function getPhase(entry: TimelineEntry): string {
  if (entry.event?.includes('Bottom') || entry.event?.includes('fondo')) return 'bottom';
  if (entry.event?.includes('Stop') || entry.event?.includes('Parada')) return 'deco';
  if (entry.event?.includes('Switch') || entry.event?.includes('Cambio')) return 'gas-switch';
  if (entry.event?.includes('Surface') || entry.event?.includes('Superficie')) return 'surface';
  if (entry.depth === 0) return 'surface';
  return 'descent';
}

export default function DiveProfileChart({ timeline }: DiveProfileChartProps) {
  if (timeline.length === 0) return null;

  const keyPoints: TimelineEntry[] = timeline;
  const maxDepth = Math.max(...keyPoints.map(t => t.depth));
  const maxTime = Math.max(...keyPoints.map(t => t.time));
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  const xScale = (time: number) => padding.left + (time / maxTime) * (width - padding.left - padding.right);
  const yScale = (depth: number) => padding.top + (depth / maxDepth) * (height - padding.top - padding.bottom);

  let pathData = '';
  for (let i = 0; i < keyPoints.length; i++) {
    const x = xScale(keyPoints[i].time);
    const y = yScale(keyPoints[i].depth);
    if (i === 0) {
      pathData += `M ${x} ${y}`;
    } else {
      pathData += ` L ${x} ${y}`;
    }
  }

  const phaseColors: Record<string, string> = {
    'surface': '#5A8299',
    'descent': '#F23D4E',
    'bottom': '#0070D3',
    'ascent': '#FF7B2E',
    'deco': '#FFD700',
    'safety': '#2E8B57',
    'gas-switch': '#E8621A',
  };

  return (
    <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4">
      <h3 className="text-text-primary font-bold mb-4">Perfil de Inmersion</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[600px] mx-auto" style={{ minWidth: '600px' }}>
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <g key={tick}>
              <line x1={padding.left + tick * (width - padding.left - padding.right)} y1={padding.top}
                x2={padding.left + tick * (width - padding.left - padding.right)} y2={height - padding.bottom}
                stroke="#1B5B7D" strokeWidth="0.5" strokeDasharray="4" />
              <text x={padding.left + tick * (width - padding.left - padding.right)} y={height - padding.bottom + 15}
                fill="#94B8C9" fontSize="10" textAnchor="middle">{Math.round(maxTime * tick)}min</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <g key={`d-${tick}`}>
              <line x1={padding.left} y1={padding.top + tick * (height - padding.top - padding.bottom)}
                x2={width - padding.right} y2={padding.top + tick * (height - padding.top - padding.bottom)}
                stroke="#1B5B7D" strokeWidth="0.5" strokeDasharray="4" />
              <text x={padding.left - 10} y={padding.top + tick * (height - padding.top - padding.bottom) + 4}
                fill="#94B8C9" fontSize="10" textAnchor="end">{Math.round(maxDepth * tick)}m</text>
            </g>
          ))}
          <path d={pathData} fill="none" stroke="#0070D3" strokeWidth="2.5" strokeLinejoin="round" />
          {keyPoints.map((t, i) => (
            <circle key={i} cx={xScale(t.time)} cy={yScale(t.depth)} r="3"
              fill={phaseColors[getPhase(t)] || '#0070D3'} stroke="#0B1D2E" strokeWidth="1" />
          ))}
          <text x={width / 2} y={height - 5} fill="#94B8C9" fontSize="11" textAnchor="middle">Tiempo (min)</text>
          <text x={15} y={height / 2} fill="#94B8C9" fontSize="11" textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}>Profundidad (m)</text>
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {Object.entries(phaseColors).map(([phase, color]) => (
          <div key={phase} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{phase.replace('-', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

