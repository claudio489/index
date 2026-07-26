import { motion } from 'framer-motion';
import { getIcon } from '@/lib/icons';
import { Link } from 'react-router-dom';
import { courses } from '@/data/courses';
import SectionHeader from '@/components/SectionHeader';
import ScrollableRow from '@/components/ScrollableRow';
import { useAppStore } from '@/stores/useAppStore';

const categoryLabels: Record<string, string> = {
  tecnico: 'Técnico',
  tecRec: 'TecRec',
  especialidad: 'Especialidad',
  recreacional: 'Recreacional',
};

export default function CoursesCarousel() {
  const enrolledCourses = useAppStore(s => s.enrolledCourses);
  const courseProgress = useAppStore(s => s.courseProgress);

  const enrolled = courses.filter(c => enrolledCourses.includes(c.id));

  return (
    <section className="mt-6">
      <SectionHeader title="Mis Repasos" linkTo="/cursos" />

      <ScrollableRow>
        {enrolled.map((course, index) => {
          const Icon = getIcon(course.icon);
          const progress = courseProgress.find(p => p.courseId === course.id);
          const progressPct = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="snap-start flex-shrink-0 w-[260px]"
            >
              <Link
                to={`/cursos/${course.slug}`}
                className="block bg-ocean-dark rounded-2xl shadow-card overflow-hidden active:scale-[0.97] transition-transform"
              >
                {/* Color bar */}
                <div className="h-1" style={{ backgroundColor: course.color }} />

                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${course.color}20` }}
                    >
                      <Icon size={20} style={{ color: course.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {course.name}
                      </h3>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${course.color}15`, color: course.color }}
                      >
                        {categoryLabels[course.category]}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {progress && (
                    <div className="mb-3">
                      <div className="h-1 bg-ocean-mid rounded-full overflow-hidden">
                        <div
                          className="h-full bg-padi-blue rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-text-tertiary mt-1">{progressPct}% completado</p>
                    </div>
                  )}

                  <span className="text-xs text-padi-blue font-medium">
                    {progressPct > 0 ? 'Continuar' : 'Ver detalle'} â†’
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </ScrollableRow>
    </section>
  );
}

