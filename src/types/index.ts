export interface Course {
  id: string;
  name: string;
  slug: string;
  category: 'tecnico' | 'tecRec' | 'especialidad' | 'recreacional';
  color: string;
  icon: string;
  description: string;
  learningPoints: string[];
  hasCalculator: boolean;
  calculatorSlug?: string;
}

export interface Calculator {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category: 'planificacion' | 'tecnico' | 'seguridad' | 'herramientas' | 'referencia';
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

export interface DiveLog {
  id: number;
  date: string;
  depth: number;
  time: number;
  gasMix: string;
  location?: string;
  notes?: string;
}

export interface PlannerResult {
  mod: number;
  po2: number;
  ndl: number | null;
  ead: number;
  safetyStop: boolean;
  status: 'safe' | 'caution' | 'danger';
  warningMessage: string;
}

export interface CourseProgress {
  courseId: string;
  completed: number;
  total: number;
}

export type GasMix = {
  label: string;
  fO2: number;
};

export type SafetyStatus = 'safe' | 'caution' | 'danger';
