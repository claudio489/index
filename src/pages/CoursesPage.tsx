import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { Link } from 'react-router-dom';
import { courses } from '@/data/courses';
import VideoSection from '@/components/VideoSection';
import type { VideoItem } from '@/components/VideoSection';
import { useSessionStore } from '@/stores/useSessionStore';

// Course videos configuration
const courseVideos: Record<string, VideoItem[]> = {
  'enriched-air-nitrox': [
    { id: 'nitrox1', title: 'Enriched Air Nitrox - Parte 1', src: 'nitrox1.mp4', duration: '45 min', expiryDays: 7 },
    { id: 'nitrox2', title: 'Enriched Air Nitrox - Parte 2', src: 'nitrox2.mp4', duration: '38 min', expiryDays: 7 },
  ],
};

const categoryLabels: Record<string, string> = {
  tecnico: 'Técnico',
  tecRec: 'TecRec',
  especialidad: 'Especialidad',
  recreacional: 'Recreacional',
};

const categoryOrder = ['tecRec', 'tecnico', 'especialidad', 'recreacional'];

export default function CoursesPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const hasCourseAccess = useSessionStore(s => s.hasCourseAccess);

  // Filter courses by user's access code permissions
  const accessibleCourses = courses.filter(c => hasCourseAccess(c.id));

  const grouped = categoryOrder.map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    items: accessibleCourses.filter(c => c.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Mis Repasos</h1>
      <p className="text-sm text-text-secondary mb-5">Guí­as de repaso tecRec y especialidades PADI</p>

      {grouped.map((group) => (
        <div key={group.category} className="mb-5">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1">
            {group.label}
          </h2>

          {group.items.map((course) => {
            const Icon = getIcon(course.icon);
            const isOpen = openId === course.id;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setOpenId(isOpen ? null : course.id)}
                  className="w-full flex items-center gap-3 bg-ocean-dark rounded-xl p-3 text-left active:bg-ocean-mid transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${course.color}20` }}
                  >
                    <Icon size={18} style={{ color: course.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{course.name}</h3>
                    <span className="text-[10px] text-text-tertiary">{course.learningPoints.length} temas</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-text-tertiary transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-ocean-mid rounded-b-xl px-3 py-3 -mt-1 pt-4"
                  >
                    <p className="text-xs text-text-secondary mb-2 px-1">{course.description}</p>
                    <ul className="space-y-1.5 mb-3">
                      {course.learningPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary px-1">
                          <span className="text-padi-blue mt-0.5">â€¢</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                    {course.hasCalculator && course.calculatorSlug && (
                      <Link
                        to={`/calculadoras/${course.calculatorSlug}`}
                        className="inline-flex items-center gap-1 text-xs text-padi-blue font-medium px-1 hover:underline mb-2"
                      >
                        Ir a calculadora â†’
                      </Link>
                    )}

                    {/* Videos for this course */}
                    {courseVideos[course.id] && (
                      <div className="mt-2 -mx-1">
                        <VideoSection videos={courseVideos[course.id]} courseName={course.name} />
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

