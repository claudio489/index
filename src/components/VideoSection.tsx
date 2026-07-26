import { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Clock, AlertTriangle, Play } from 'lucide-react';

export interface VideoItem {
  id: string;
  title: string;
  src: string;
  duration?: string;
  expiryDays?: number;
}

interface VideoSectionProps {
  videos: VideoItem[];
  courseName?: string;
}

export default function VideoSection({ videos, courseName: _courseName }: VideoSectionProps) {
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const expiryDate = (days: number = 7) => {
    const f = new Date();
    f.setDate(f.getDate() + days);
    return f.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleError = (videoId: string) => {
    setErrors(prev => new Set(prev).add(videoId));
  };

  if (videos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 mb-2"
    >
      <div className="bg-ocean-dark rounded-2xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="bg-padi-blue px-4 py-3 flex items-center gap-2">
          <Film size={18} className="text-white" />
          <h3 className="text-sm font-semibold text-white">Videos del Curso</h3>
          <span className="text-[10px] text-white/70 ml-auto">{videos.length} videos</span>
        </div>

        <div className="p-3 space-y-3">
          {videos.map((video) => {
            const hasError = errors.has(video.id);

            return (
              <div key={video.id} className="bg-deep-ocean rounded-xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-ocean-mid/30">
                  <Play size={12} className="text-padi-blue flex-shrink-0" />
                  <span className="text-xs font-medium text-text-primary flex-1 truncate">{video.title}</span>
                  {video.duration && (
                    <span className="text-[10px] text-text-tertiary flex items-center gap-0.5 flex-shrink-0">
                      <Clock size={10} /> {video.duration}
                    </span>
                  )}
                </div>

                {/* Video player or fallback */}
                <div className="relative">
                  {!hasError ? (
                    <video
                      controls
                      preload="metadata"
                      className="w-full aspect-video bg-black"
                      onError={() => handleError(video.id)}
                    >
                      <source src={video.src} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-2">
                      <Film size={32} className="text-alert-gold/60" />
                      <p className="text-xs text-text-secondary text-center px-4">
                        <strong className="text-alert-gold">Video no disponible</strong>
                      </p>
                      <p className="text-[10px] text-text-tertiary text-center px-6">
                        Verifica que <code className="text-alert-gold">{video.src}</code> esté en la misma carpeta.
                      </p>
                    </div>
                  )}
                </div>

                {/* Info only - no download */}
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[9px] text-text-tertiary flex items-center gap-1">
                    <Clock size={9} />
                    Disponible hasta: <strong className="text-text-secondary">{expiryDate(video.expiryDays || 7)}</strong>
                  </span>
                  <span className="text-[9px] text-alert-gold bg-alert-gold/10 px-2 py-0.5 rounded-full">
                    Streaming only
                  </span>
                </div>
              </div>
            );
          })}

          {/* Warning */}
          <div className="flex items-start gap-2 bg-alert-gold/5 rounded-lg p-2.5 border border-alert-gold/10">
            <AlertTriangle size={12} className="text-alert-gold flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-secondary leading-relaxed">
              Los videos tienen fecha de expiración. Estos videos son materiales educativos de apoyo â€” no reemplazan la certificación PADI.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

