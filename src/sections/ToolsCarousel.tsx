import { motion } from 'framer-motion';
import { getIcon } from '@/lib/icons';
import { Link } from 'react-router-dom';
import SectionHeader from '@/components/SectionHeader';
import ScrollableRow from '@/components/ScrollableRow';

const toolsList = [
  { slug: 'tabla-rdp', name: 'Tabla RDP', icon: 'Table', color: '#0070D3', category: 'Referencia' },
  { slug: 'conversor', name: 'Conversor', icon: 'ArrowLeftRight', color: '#94B8C9', category: 'Utilidad' },
  { slug: 'checklist', name: 'Checklist', icon: 'ClipboardCheck', color: '#2E8B57', category: 'Pre-buceo' },
  { slug: 'log', name: 'Log Buceos', icon: 'BookMarked', color: '#FFD700', category: 'Registro' },
  { slug: 'mod-tabla', name: 'Tabla MOD', icon: 'Grid3x3', color: '#0070D3', category: 'Referencia' },
  { slug: 'cns', name: 'Calc. CNS', icon: 'Activity', color: '#F23D4E', category: 'Seguridad' },
];

export default function ToolsCarousel() {
  return (
    <section className="mt-6">
      <SectionHeader title="Herramientas" linkTo="/calc-tools" />

      <ScrollableRow>
        {toolsList.map((tool, index) => {
          const Icon = getIcon(tool.icon);
          return (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className="snap-start flex-shrink-0 w-[160px]"
            >
              <Link
                to={`/herramientas/${tool.slug}`}
                className="block bg-ocean-dark rounded-xl shadow-card p-4 text-center active:scale-[0.97] transition-transform"
              >
                <div
                  className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${tool.color}15` }}
                >
                  <Icon size={18} style={{ color: tool.color }} />
                </div>
                <p className="text-xs font-medium text-text-primary truncate">{tool.name}</p>
                <div
                  className="w-1.5 h-1.5 rounded-full mx-auto mt-2"
                  style={{ backgroundColor: tool.color }}
                />
              </Link>
            </motion.div>
          );
        })}
      </ScrollableRow>
    </section>
  );
}
