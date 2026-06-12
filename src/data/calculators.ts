import type { Calculator } from '@/types';

export const calculators: Calculator[] = [
  {
    id: 'mod',
    name: 'MOD',
    slug: 'mod',
    description: 'Profundidad máxima operativa para cualquier mezcla de gas basada en PO2 límite.',
    icon: 'Ruler',
    color: '#0070D3',
    category: 'planificacion'
  },
  {
    id: 'lnd',
    name: 'LND / NDL',
    slug: 'lnd',
    description: 'Tiempo máximo de fondo sin descompresión usando tablas PADI RDP con EAD.',
    icon: 'Hourglass',
    color: '#2E8B57',
    category: 'planificacion'
  },
  {
    id: 'best-mix',
    name: 'Best Mix',
    slug: 'best-mix',
    description: 'Mezcla óptima de O2 para una profundidad objetivo dada.',
    icon: 'Gauge',
    color: '#FFD700',
    category: 'planificacion'
  },
  {
    id: 'gas-blender',
    name: 'Mezclador',
    slug: 'gas-blender',
    description: 'Calcula mezclas de gases técnicos por presión parcial.',
    icon: 'FlaskConical',
    color: '#FF7B2E',
    category: 'tecnico'
  },
  {
    id: 'sac',
    name: 'SAC',
    slug: 'sac',
    description: 'Cálculo del consumo de aire en superficie (Surface Air Consumption).',
    icon: 'Wind',
    color: '#FF7B2E',
    category: 'tecnico'
  },
  {
    id: 'ead',
    name: 'EAD / PEA',
    slug: 'ead',
    description: 'Profundidad Equivalente al Aire para planificación con Nitrox.',
    icon: 'ArrowDownToLine',
    color: '#4DA3FF',
    category: 'seguridad'
  },
  {
    id: 'conversor',
    name: 'Conversor',
    slug: 'conversor',
    description: 'Conversor de unidades: presión, peso, distancia, velocidad, temperatura.',
    icon: 'ArrowLeftRight',
    color: '#9B59B6',
    category: 'herramientas'
  },
  {
    id: 'tabla-rdp',
    name: 'Tabla RDP',
    slug: 'tabla-rdp',
    description: 'Tabla PADI RDP completa con límites de no-descompresión.',
    icon: 'Table',
    color: '#0070D3',
    category: 'herramientas'
  },
  {
    id: 'checklist',
    name: 'Checklist',
    slug: 'checklist',
    description: 'Lista de verificación de equipo antes del buceo.',
    icon: 'ClipboardCheck',
    color: '#2E8B57',
    category: 'herramientas'
  },
  {
    id: 'mod-tabla',
    name: 'Tabla MOD',
    slug: 'mod-tabla',
    description: 'Tabla rápida de MOD para todas las mezclas comunes.',
    icon: 'Grid3x3',
    color: '#0070D3',
    category: 'herramientas'
  },
  {
    id: 'cns',
    name: 'Calc. CNS',
    slug: 'cns',
    description: 'Cálculo de toxicidad por oxígeno acumulada (CNS%).',
    icon: 'Activity',
    color: '#F23D4E',
    category: 'herramientas'
  },
  {
    id: 'log',
    name: 'Log de Buceos',
    slug: 'log',
    description: 'Registro de inmersiones con estadísticas y historial.',
    icon: 'BookMarked',
    color: '#FFD700',
    category: 'herramientas'
  }
];

export const getCalculatorBySlug = (slug: string): Calculator | undefined =>
  calculators.find(c => c.slug === slug);
