import { motion } from 'framer-motion';
import { Calculator, CalendarDays, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getGreeting } from '@/lib/divingCalculations';

const quickActions = [
  { to: '/calculadoras/mod', label: 'Calculadora MOD', icon: Calculator, bg: 'bg-padi-blue' },
  { to: '/planificador', label: 'Planificar Buceo', icon: CalendarDays, bg: 'bg-safety-orange' },
  { to: '/cursos', label: 'Mis Cursos', icon: BookOpen, bg: 'bg-ocean-mid border border-ocean-surface' },
];

export default function HeroSection() {
  const greeting = getGreeting();

  return (
    <section className="relative w-full h-[280px] overflow-hidden">
      {/* Background image */}
      <img
        src="./hero-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover animate-subtle-zoom"
        loading="eager"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-ocean/30 via-deep-ocean/60 to-deep-ocean" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            {greeting}
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-text-secondary mt-1 text-base"
        >
          Planifica tu inmersión con seguridad
        </motion.p>

        {/* Quick actions row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="absolute bottom-3 left-4 right-4 flex gap-2 overflow-x-auto no-scrollbar"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-sm font-medium whitespace-nowrap flex-shrink-0 active:scale-95 transition-transform ${action.bg}`}
              >
                <Icon size={16} />
                {action.label}
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
