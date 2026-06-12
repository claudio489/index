import {
  Home, BookOpen, Calculator, CalendarDays, Wrench, Menu, ChevronDown,
  FlaskConical, ArrowDownToLine, Cog, Search, Compass, Settings,
  Ruler, Hourglass, Gauge, Wind, Table, ArrowLeftRight,
  ClipboardCheck, BookMarked, Grid3x3, Activity, ShieldCheck,
  Lightbulb, HeartPulse, CheckCircle, AlertTriangle, AlertOctagon,
  ChevronRight, CloudOff, ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconRegistry: Record<string, LucideIcon> = {
  Home, BookOpen, Calculator, CalendarDays, Wrench, Menu, ChevronDown,
  FlaskConical, ArrowDownToLine, Cog, Search, Compass, Settings,
  Ruler, Hourglass, Gauge, Wind, Table, ArrowLeftRight,
  ClipboardCheck, BookMarked, Grid3x3, Activity, ShieldCheck,
  Lightbulb, HeartPulse, CheckCircle, AlertTriangle, AlertOctagon,
  ChevronRight, CloudOff, ArrowRight,
};

export function getIcon(name: string): LucideIcon {
  return iconRegistry[name] || Calculator;
}

export {
  Home, BookOpen, Calculator, CalendarDays, Wrench, Menu, ChevronDown,
  FlaskConical, ArrowDownToLine, Cog, Search, Compass, Settings,
  Ruler, Hourglass, Gauge, Wind, Table, ArrowLeftRight,
  ClipboardCheck, BookMarked, Grid3x3, Activity,
};
