import { motion } from 'framer-motion';
import { Ruler, Hourglass, Gauge, FlaskConical, Wind, ArrowDownToLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculators } from '@/data/calculators';

const iconMap: Record<string, React.ElementType> = {
  Ruler, Hourglass, Gauge, FlaskConical, Wind, ArrowDownToLine,
};

const categoryLabels: Record<string, string> = {
  planificacion: 'Planificación',
  tecnico: 'Técnico',
  seguridad: 'Seguridad',
  referencia: 'Referencia',
};

export default function CalculatorsPage() {
  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Calculadoras</h1>
      <p className="text-sm text-text-secondary mb-5">Herramientas técnicas de planificación</p>

      <div className="space-y-3">
        {calculators.map((calc, index) => {
          const Icon = iconMap[calc.icon] || Ruler;
          return (
            <motion.div
              key={calc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.06 }}
            >
              <Link
                to={`/calculadoras/${calc.slug}`}
                className="flex items-center gap-4 bg-ocean-dark rounded-2xl p-4 shadow-card active:scale-[0.98] transition-transform hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${calc.color}15` }}
                >
                  <Icon size={22} style={{ color: calc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-semibold text-text-primary">{calc.name}</h3>
                    <span className="text-[10px] text-text-tertiary bg-ocean-mid px-1.5 py-0.5 rounded-full">
                      {categoryLabels[calc.category]}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{calc.description}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: calc.color }} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

