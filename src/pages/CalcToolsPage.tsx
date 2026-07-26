import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { Link } from 'react-router-dom';

const allItems = [
  // Calculadoras
  { slug: 'mod', name: 'MOD', desc: 'Profundidad maxima operativa para cualquier mezcla de gas.', icon: 'Ruler', color: '#0070D3', cat: 'Planificacion' },
  { slug: 'lnd', name: 'LND / NDL', desc: 'Tiempo de fondo sin descompresion usando tablas PADI RDP con EAD.', icon: 'Hourglass', color: '#2E8B57', cat: 'Planificacion' },
  { slug: 'best-mix', name: 'Best Mix', desc: 'Mezcla optima de O2 para una profundidad objetivo dada.', icon: 'Gauge', color: '#FFD700', cat: 'Planificacion' },
  { slug: 'gas-blender', name: 'Mezclador', desc: 'Calcula mezclas de gases tecnicos por presion parcial.', icon: 'FlaskConical', color: '#FF7B2E', cat: 'Tecnico' },
  { slug: 'sac', name: 'SAC', desc: 'Consumo de aire en superficie (Surface Air Consumption).', icon: 'Wind', color: '#FF7B2E', cat: 'Tecnico' },
  { slug: 'ead', name: 'EAD / PEA', desc: 'Profundidad Equivalente al Aire para planificacion con Nitrox.', icon: 'ArrowDownToLine', color: '#4DA3FF', cat: 'Seguridad' },
  // Herramientas
  { slug: 'tabla-rdp', name: 'Tabla RDP', desc: 'Tabla PADI RDP completa con limites de no-descompresion.', icon: 'Table', color: '#0070D3', cat: 'Referencia' },
  { slug: 'conversor', name: 'Conversor', desc: 'Conversion entre metros/pies, bar/psi, Â°C/Â°F.', icon: 'ArrowLeftRight', color: '#94B8C9', cat: 'Utilidad' },
  { slug: 'checklist', name: 'Checklist', desc: 'Lista de verificacion de equipo antes del buceo.', icon: 'ClipboardCheck', color: '#2E8B57', cat: 'Pre-buceo' },
  { slug: 'bitacora', name: 'Log de Buceos', desc: 'Registro de inmersiones con estadisticas y historial.', icon: 'BookMarked', color: '#FFD700', cat: 'Registro' },
  { slug: 'expediciones', name: 'Expediciones', desc: 'Descubre y unete a expediciones de buceo organizadas. Isla de Pascua y mas destinos.', icon: 'Compass', color: '#00d4ff', cat: 'Expedicion' },
  { slug: 'mod-tabla', name: 'Tabla MOD', desc: 'Tabla rapida de MOD para todas las mezclas comunes.', icon: 'Grid3x3', color: '#0070D3', cat: 'Referencia' },
  { slug: 'cns', name: 'Calc. CNS', desc: 'Calculo de toxicidad por oxigeno acumulada (CNS%).', icon: 'Activity', color: '#F23D4E', cat: 'Seguridad' },
];

const categoryFilters = ['Todas', 'Planificacion', 'Tecnico', 'Seguridad', 'Referencia', 'Pre-buceo', 'Registro', 'Utilidad', 'Expedicion'];

export default function CalcToolsPage() {
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');

  const filtered = allItems.filter(item => {
    const matchCat = filter === 'Todas' || item.cat === filter;
    const matchSearch = search === '' || item.name.toLowerCase().includes(search.toLowerCase()) || item.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Calculadoras y Herramientas</h1>
      <p className="text-sm text-text-secondary mb-4">Todo en un solo lugar</p>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar calculadora o herramienta..."
          className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 pb-1">
        {categoryFilters.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors ${
              filter === cat
                ? 'bg-padi-blue text-white'
                : 'bg-ocean-dark text-text-secondary border border-ocean-surface/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item, index) => {
          const Icon = getIcon(item.icon);
          return (
            <motion.div
              key={item.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <Link
                to={item.slug === 'bitacora' ? '/bitacora' : `/calculadoras/${item.slug}`}
                className="block bg-ocean-dark rounded-2xl shadow-card p-4 h-full active:scale-[0.97] transition-transform hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon size={20} style={{ color: item.color }} />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{item.name}</h3>
                <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-2">{item.desc}</p>
                <span className="inline-block mt-2 text-[9px] text-text-tertiary bg-ocean-mid px-1.5 py-0.5 rounded-full">
                  {item.cat}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm text-text-tertiary">No se encontraron resultados</p>
        </div>
      )}
    </div>
  );
}



