import type { Course } from '@/types';

export const courses: Course[] = [
  {
    id: 'enriched-air-nitrox',
    name: 'Enriched Air Nitrox',
    slug: 'enriched-air-nitrox',
    category: 'tecnico',
    color: '#0070D3',
    icon: 'FlaskConical',
    description: 'Buceo con aire enriquecido en oxígeno para tiempos de fondo extendidos y menor fatiga por nitrógeno.',
    learningPoints: [
      'Cálculo de MOD (Profundidad Máxima Operativa) para cada mezcla',
      'Presión parcial de O2 (PO2): límites seguros 1.4 bar / contingencia 1.6 bar',
      'Análisis y etiquetado de mezclas de gas antes de cada inmersión',
      'Cálculo de oxígeno acumulado (CNS%) y gestión de toxicidad',
      'Uso de calculadoras Nitrox para planificación de inmersiones'
    ],
    hasCalculator: true,
    calculatorSlug: 'mod'
  },
  {
    id: 'deep-diver',
    name: 'Deep Diver',
    slug: 'deep-diver',
    category: 'especialidad',
    color: '#FF7B2E',
    icon: 'ArrowDownToLine',
    description: 'Inmersiones entre 18-40 metros con técnicas de gestión de gas, narcosis y planificación.',
    learningPoints: [
      'Planificación de inmersiones profundas con reservas de gas aumentadas',
      'Reconocimiento y manejo de la narcosis por nitrógeno',
      'Técnicas de descenso y ascenso controlado',
      'Uso de guías de referencia y líneas de fondo',
      'Comunicación y procedimientos de emergencia en profundidad'
    ],
    hasCalculator: true,
    calculatorSlug: 'mod'
  },
  {
    id: 'tec-40',
    name: 'Tec 40',
    slug: 'tec-40',
    category: 'tecRec',
    color: '#F23D4E',
    icon: 'Cog',
    description: 'Primer nivel de buceo técnico: inmersiones hasta 40m con descompresión limitada y backmount doble.',
    learningPoints: [
      'Configuración y manejo de equipamiento técnico (doble tanque, stages)',
      'Planificación de descompresión con paradas de seguridad',
      'Gestión de gases: back gas + un deco gas (hasta 50% O2)',
      'Procedimientos de emergencia: S-drill, valve drill, sharing',
      'Uso de software de planificación (MultiDeco, GAP)'
    ],
    hasCalculator: true,
    calculatorSlug: 'mod'
  },
  {
    id: 'tec-45',
    name: 'Tec 45',
    slug: 'tec-45',
    category: 'tecRec',
    color: '#F23D4E',
    icon: 'Cog',
    description: 'Segundo nivel tecRec: inmersiones hasta 45m con descompresión extendida y dos gases de deco.',
    learningPoints: [
      'Descompresión con oxígeno puro y mezclas ricas (hasta 100% O2)',
      'Planificación de perfiles de descompresión complejos',
      'Manejo de dos deco stages con cambios de gas',
      'Técnicas de ascenso con paradas obligatorias',
      'Gestión de emergencias de descompresión omitida'
    ],
    hasCalculator: true,
    calculatorSlug: 'gas-blender'
  },
  {
    id: 'tec-50',
    name: 'Tec 50',
    slug: 'tec-50',
    category: 'tecRec',
    color: '#F23D4E',
    icon: 'Cog',
    description: 'Tercer nivel tecRec: inmersiones hasta 50m con descompresión completa y múltiples gases.',
    learningPoints: [
      'Inmersiones con descompresión significativa (hasta 15-20 min)',
      'Uso de trimix para reducir narcosis en profundidad',
      'Manejo de múltiples stages de descompresión (2-3 gases)',
      'Procedimientos de emergencia en descompresión',
      'Team diving y coordinación de buddies técnicos'
    ],
    hasCalculator: true,
    calculatorSlug: 'gas-blender'
  },
  {
    id: 'gas-blender',
    name: 'Gas Blender',
    slug: 'gas-blender',
    category: 'tecnico',
    color: '#2E8B57',
    icon: 'Wrench',
    description: 'Mezclado de gases para buceo técnico: Nitrox, Trimix, Heliox con métodos de presión parcial y membrana.',
    learningPoints: [
      'Método de presión parcial para mezclado de Nitrox y Trimix',
      'Cálculos de mezcla: top-up, partial pressure, continuous flow',
      'Manejo seguro de oxígeno puro y helio',
      'Limpieza de sistemas para uso con O2 (oxygen service)',
      'Análisis y verificación de mezclas producidas'
    ],
    hasCalculator: true,
    calculatorSlug: 'gas-blender'
  },
  {
    id: 'search-recovery',
    name: 'Search & Recovery',
    slug: 'search-recovery',
    category: 'especialidad',
    color: '#FFD700',
    icon: 'Search',
    description: 'Técnicas de búsqueda subacuática y recuperación de objetos con equipo de elevación.',
    learningPoints: [
      'Patrones de búsqueda: circular, en U, en expansión',
      'Uso de bolsas de elevación (lift bags) de diferentes capacidades',
      'Cálculo de flotabilidad y peso de objetos sumergidos',
      'Nudos y líneas para amarre y recuperación',
      'Planificación de operaciones de búsqueda con equipo'
    ],
    hasCalculator: false
  },
  {
    id: 'navigation',
    name: 'Underwater Navigation',
    slug: 'navigation',
    category: 'especialidad',
    color: '#4DA3FF',
    icon: 'Compass',
    description: 'Navegación subacuática con brújula, referencias naturales y técnicas de orientación.',
    learningPoints: [
      'Uso de brújula subacuática en patrón recíproco',
      'Navegación por referencias naturales y artificiales',
      'Patrones de búsqueda y mapeo del sitio de buceo',
      'Estimación de distancias y tiempos de navegación',
      'Navegación en condiciones de baja visibilidad'
    ],
    hasCalculator: false
  },
  {
    id: 'tec-basics',
    name: 'Tec Basics',
    slug: 'tec-basics',
    category: 'tecRec',
    color: '#F23D4E',
    icon: 'Settings',
    description: 'Introducción al buceo técnico: manejo de equipamiento twinset, flotabilidad y habilidades fundacionales.',
    learningPoints: [
      'Configuración y ajuste de equipamiento twinset (backmount doble)',
      'Flotabilidad y trim en configuración técnica',
      'Manejo de stages y switches de gas',
      'S-drills y valve drills: práctica de emergencia',
      'Fundamentos de planificación técnica de inmersiones'
    ],
    hasCalculator: true,
    calculatorSlug: 'mod'
  }
];

export const getCourseBySlug = (slug: string): Course | undefined =>
  courses.find(c => c.slug === slug);

export const getCoursesByCategory = (category: Course['category']): Course[] =>
  courses.filter(c => c.category === category);
