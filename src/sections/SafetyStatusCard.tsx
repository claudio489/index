import { motion } from 'framer-motion';
import { ShieldCheck, Lightbulb } from 'lucide-react';
import { getDailyTip } from '@/lib/divingCalculations';
import { useCountUp } from '@/hooks/useCountUp';

interface SafetyStatusCardProps {
  divesThisMonth?: number;
  maxDepth?: number;
  favoriteMix?: string;
}

export default function SafetyStatusCard({
  divesThisMonth = 12,
  maxDepth = 34,
  favoriteMix = '32%',
}: SafetyStatusCardProps) {
  const tip = getDailyTip();
  const animatedDives = useCountUp(divesThisMonth, 800);
  const animatedDepth = useCountUp(maxDepth, 800);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mx-4 -mt-6 relative z-10 bg-ocean-dark rounded-2xl shadow-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-success-green" />
          <h3 className="text-sm font-semibold text-text-primary">Estado de Seguridad</h3>
        </div>
        <span className="text-[10px] text-text-tertiary">íšltima inmersión: Hace 2 dí­as</span>
      </div>

      {/* Safety Tip */}
      <div className="flex items-start gap-2 bg-padi-blue/8 rounded-lg p-2.5 mb-3 border-l-[3px] border-padi-blue">
        <Lightbulb size={14} className="text-padi-blue flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold font-mono text-padi-blue">{animatedDives}</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">Buceos este mes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold font-mono text-safety-orange">{animatedDepth}m</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">Prof. máxima</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold font-mono text-success-green">{favoriteMix}</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">Mezcla favorita</div>
        </div>
      </div>
    </motion.div>
  );
}

