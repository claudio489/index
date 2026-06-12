import { motion } from 'framer-motion';
import { getIcon } from '@/lib/icons';
import { Link } from 'react-router-dom';
import { tools } from '@/data/tools';

export default function ToolsPage() {
  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Herramientas</h1>
      <p className="text-sm text-text-secondary mb-5">Referencia, checklists y utilidades</p>

      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool, index) => {
          const Icon = getIcon(tool.icon);
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.06 }}
            >
              <Link
                to={`/herramientas/${tool.slug}`}
                className="block bg-ocean-dark rounded-2xl shadow-card p-4 text-center active:scale-[0.97] transition-transform hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div
                  className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${tool.color}15` }}
                >
                  <Icon size={22} style={{ color: tool.color }} />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{tool.name}</h3>
                <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-2">{tool.description}</p>
                <span className="inline-block mt-2 text-[9px] text-text-tertiary bg-ocean-mid px-2 py-0.5 rounded-full">
                  {tool.category}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
