import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const ExpeditionFAB: React.FC = () => {
  return (
    <Link
      to="/expeditions"
      className="fixed bottom-6 right-6 z-50 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full p-4 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all active:scale-95"
      title="Expediciones"
    >
      <Compass className="w-6 h-6" />
    </Link>
  );
};
