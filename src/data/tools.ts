import type { Tool } from '@/types';

export const tools: Tool[] = [
  {
    id: 'expediciones',
    name: 'Expediciones',
    slug: 'expediciones',
    description: 'Descubre y únete a expediciones de buceo organizadas. Isla de Pascua y más destinos.',
    icon: 'Compass',
    color: '#00d4ff',
    category: 'Expedición'
  },
  {
    id: 'tabla-rdp',
    name: 'Tabla RDP',
    slug: 'tabla-rdp',
    description: 'Tabla PADI RDP completa con lí­mites de no-descompresión.',
    icon: 'Table',
    color: '#0070D3',
    category: 'Referencia'
  },
  {
    id: 'conversor',
    name: 'Conversor',
    slug: 'conversor',
    description: 'Conversión entre unidades: metros/pies, bar/psi, Â°C/Â°F.',
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
    description: 'Registro de inmersiones con estadí­sticas y historial.',
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
    description: 'Cálculo de toxicidad por oxí­geno acumulada (CNS%).',
    icon: 'Activity',
    color: '#F23D4E',
    category: 'Seguridad'
  }
];

export const getToolBySlug = (slug: string): Tool | undefined =>
  tools.find(t => t.slug === slug);


