import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Calculator, CalendarDays, BookMarked, Wrench, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/cursos', label: 'Repasos', icon: BookOpen },
  { to: '/calc-tools', label: 'Calc', icon: Calculator },
  { to: '/planificador', label: 'Plan', icon: CalendarDays },
  { to: '/equipo', label: 'Equipo', icon: Wrench },
  { to: '/bitacora', label: 'Log', icon: BookMarked },
  { to: '/perfil', label: 'Perfil', icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 bg-deep-ocean/95 backdrop-blur-md border-t border-ocean-surface/30 z-50 flex items-center justify-around select-none">
      <div className="absolute -top-5 right-2 text-[8px] text-text-tertiary/50 font-mono">v1.0.4</div>
      {navItems.map((item) => {
        const isActive = item.to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.to);
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center w-full h-full relative"
            aria-label={item.label}
          >
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-padi-blue rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon
              size={22}
              className={`transition-colors duration-200 ${
                isActive ? 'text-padi-blue drop-shadow-[0_0_6px_rgba(0,112,211,0.5)]' : 'text-text-tertiary'
              }`}
            />
            <span
              className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                isActive ? 'text-padi-blue' : 'text-text-tertiary'
              }`}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}





