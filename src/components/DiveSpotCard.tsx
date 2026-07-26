import React from 'react';
import { Fish, Ruler, Waves, MapPin } from 'lucide-react';
import type { DiveSpot } from '../types/expedition';

interface DiveSpotCardProps {
  spot: DiveSpot;
}

const parseSpotInfo = (description: string | null) => {
  if (!description) return { type: 'Spot', highlight: 'Destacado', cleanDesc: '' };
  const parts = description.split('.');
  const cleanDesc = parts[0] || '';
  const metaPart = parts[1] || '';
  const metaItems = metaPart.split('·').map(s => s.trim());
  return {
    type: metaItems[0] || 'Spot',
    highlight: metaItems[1] || 'Destacado',
    cleanDesc
  };
};

const typeColors: Record<string, string> = {
  'Islote': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Pared rocosa': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Cueva submarina': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Shore': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Pared profunda': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Formaciones rocosas': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Pecio histórico': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Pared vertical': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Spot': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

const highlightColors: Record<string, string> = {
  'Lobos marinos': 'bg-emerald-500/20 text-emerald-300',
  'Tiburones martillo': 'bg-red-500/20 text-red-300',
  'Moai sumergido': 'bg-amber-500/20 text-amber-300',
  'Coral': 'bg-pink-500/20 text-pink-300',
  'Vis extrema': 'bg-cyan-500/20 text-cyan-300',
  'Anciano de mar': 'bg-teal-500/20 text-teal-300',
  'Penetración': 'bg-orange-500/20 text-orange-300',
  'Esponjas': 'bg-violet-500/20 text-violet-300',
  'Destacado': 'bg-slate-500/20 text-slate-300'
};

export const DiveSpotCard: React.FC<DiveSpotCardProps> = ({ spot }) => {
  const info = parseSpotInfo(spot.description);
  const typeStyle = typeColors[info.type] || typeColors['Spot'];
  const highlightStyle = highlightColors[info.highlight] || highlightColors['Destacado'];

  return (
    <div className="group relative bg-gradient-to-br from-[#0c1a2d] to-[#0a1628] border border-[rgba(0,212,255,0.08)] rounded-2xl p-5 hover:border-[rgba(0,212,255,0.25)] hover:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300 hover:-translate-y-1">
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#0a1628] border border-[rgba(0,212,255,0.15)] rounded-full px-3 py-1">
        <Ruler className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-cyan-400 text-sm font-bold">{spot.max_depth}m</span>
      </div>

      <h3 className="text-[#f0f4f8] text-lg font-bold mb-3 pr-16 group-hover:text-cyan-300 transition-colors">
        {spot.name}
      </h3>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${typeStyle}`}>
          <Waves className="w-3.5 h-3.5" />
          {info.type}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${highlightStyle}`}>
          <Fish className="w-3.5 h-3.5" />
          {info.highlight}
        </span>
      </div>

      <p className="text-[#64748b] text-sm leading-relaxed line-clamp-3">
        {info.cleanDesc}
      </p>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[rgba(0,212,255,0.06)]">
        <div className="flex items-center gap-1.5 text-[#64748b] text-xs">
          <MapPin className="w-3.5 h-3.5" />
          {spot.city || 'Isla de Pascua'}
        </div>
        <div className="flex items-center gap-1.5 text-[#64748b] text-xs">
          <Ruler className="w-3.5 h-3.5" />
          {spot.max_depth}m max
        </div>
        {spot.is_tec && (
          <span className="text-amber-400 text-xs font-medium">TÉC</span>
        )}
      </div>
    </div>
  );
};
