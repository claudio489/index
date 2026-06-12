import type { Tool } from '@/types';

export const tools: Tool[] = [
  {
    id: 'tabla-rdp',
    name: 'Tabla RDP',
    slug: 'tabla-rdp',
    description: 'Tabla PADI RDP completa con límites de no-descompresión.',
    icon: 'Table',
    color: '#0070D3',
    category: 'Referencia'
  },
  {
    id: 'conversor',
    name: 'Conversor',
    slug: 'conversor',
    description: 'Conversión entre unidades: metros/pies, bar/psi, °C/°F.',
    icon: 'ArrowLeftRight',
    color: '#94B8C9',
    category: 'Utilidad'
  },
  {
    id: 'checklist',
    name: 'Checklist',
    slug: 'checklist',
    description: 'Lista de verificación de equipo antes del buceo.',
    icon: 'ClipboardCheck',
    color: '#2E8B57',
    category: 'Pre-buceo'
  },
  {
    id: 'log',
    name: 'Log de Buceos',
    slug: 'log',
    description: 'Registro de inmersiones con estadísticas y historial.',
    icon: 'BookMarked',
    color: '#FFD700',
    category: 'Registro'
  },
  {
    id: 'mod-tabla',
    name: 'Tabla MOD',
    slug: 'mod-tabla',
    description: 'Tabla rápida de MOD para todas las mezclas comunes.',
    icon: 'Grid3x3',
    color: '#0070D3',
    category: 'Referencia'
  },
  {
    id: 'cns',
    name: 'Calculadora CNS',
    slug: 'cns',
    description: 'Cálculo de toxicidad por oxígeno acumulada (CNS%).',
    icon: 'Activity',
    color: '#F23D4E',
    category: 'Seguridad'
  }
];

export const getToolBySlug = (slug: string): Tool | undefined =>
  tools.find(t => t.slug === slug);
