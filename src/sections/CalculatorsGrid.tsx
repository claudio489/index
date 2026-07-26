import { motion } from 'framer-motion';
import { Ruler, Hourglass, Gauge, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from '@/components/SectionHeader';

const calcItems = [
  { slug: 'mod', name: 'MOD', desc: 'Profundidad máxima operativa para cualquier mezcla', icon: Ruler, color: '#0070D3' },
  { slug: 'lnd', name: 'LND', desc: 'Tiempo de fondo sin descompresión', icon: Hourglass, color: '#2E8B57' },
  { slug: 'gas-blender', name: 'Mezclador', desc: 'Calcula mezclas de gases técnicos', icon: FlaskConical, color: '#FF7B2E' },
  { slug: 'best-mix', name: 'Best Mix', desc: 'Mezcla óptima para tu profundidad', icon: Gauge, color: '#FFD700' },
];

export default function CalculatorsGrid() {
  return (
    <section className="mt-6 px-4">
      <SectionHeader title="Calculadoras y Herramientas" linkTo="/calc-tools" />

      <div className="grid grid-cols-2 gap-3">
        {calcItems.map((calc, index) => {
          const Icon = calc.icon;
          return (
            <motion.div
              key={calc.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.08 }}
            >
              <Link
                to={`/calculadoras/${calc.slug}`}
                className="block bg-ocean-dark rounded-2xl shadow-card p-5 text-center active:scale-[0.97] transition-transform hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${calc.color}15` }}
                >
                  <Icon size={24} style={{ color: calc.color }} />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{calc.name}</h3>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{calc.desc}</p>
                <div
                  className="w-2 h-2 rounded-full mx-auto mt-3"
                  style={{ backgroundColor: calc.color }}
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

