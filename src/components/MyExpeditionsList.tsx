import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, AlertCircle, Loader2, Award, CheckCircle2 } from 'lucide-react';
import { useExpeditionStore } from '../stores/expeditionStore';

const statusConfig: Record<string, { label: string; bg: string }> = {
  forming: { label: 'En formación', bg: 'bg-alert-gold/20 border-alert-gold/30 text-alert-gold' },
  confirmed: { label: 'Confirmada', bg: 'bg-success-green/20 border-success-green/30 text-success-green' },
  completed: { label: 'Completada', bg: 'bg-text-tertiary/20 border-text-tertiary/30 text-text-tertiary' },
  cancelled: { label: 'Cancelada', bg: 'bg-alert-red/20 border-alert-red/30 text-alert-red' },
  open: { label: 'Abierta', bg: 'bg-success-green/20 border-success-green/30 text-success-green' },
  closed: { label: 'Cerrada', bg: 'bg-alert-red/20 border-alert-red/30 text-alert-red' },
  full: { label: 'Llena', bg: 'bg-text-tertiary/20 border-text-tertiary/30 text-text-tertiary' },
};

export const MyExpeditionsList: React.FC = () => {
  const { myExpeditions, loading, error, fetchMyExpeditions } = useExpeditionStore();

  useEffect(() => {
    fetchMyExpeditions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-padi-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-alert-red mx-auto mb-3" />
          <p className="text-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (myExpeditions.length === 0) {
    return (
      <div className="text-center py-16 bg-ocean-dark/50 border border-ocean-surface/20 rounded-2xl mx-4">
        <CheckCircle2 className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-40" />
        <h3 className="text-text-primary text-lg font-bold mb-2">Todavia no te uniste a ninguna expedicion</h3>
        <p className="text-text-secondary text-sm max-w-sm mx-auto">
          Explora la pestaña "Todas" y reserva tu cupo en la que mas te guste.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {myExpeditions.map((expedition, index) => {
        const status = statusConfig[expedition.status || ''] || statusConfig.forming;
        return (
          <motion.div
            key={expedition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link
              to={`/expedition/${expedition.id}`}
              className="group block bg-ocean-dark border border-ocean-surface/20 rounded-2xl overflow-hidden hover:border-padi-blue/40 transition-all duration-300"
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src="./hero-bg.jpg"
                  alt={expedition.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-dark via-ocean-dark/40 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg}`}>
                    {status.label}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-text-primary text-base font-bold mb-2 group-hover:text-padi-blue transition-colors">
                  {expedition.title}
                </h3>
                <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-padi-blue" />
                    {expedition.start_date
                      ? new Date(expedition.start_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
                      : 'A confirmar'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-success-green" />
                    {(expedition.spots_total || 0) - (expedition.spots_filled || 0)} cupos
                  </span>
                  {expedition.min_cert && (
                    <span className="flex items-center gap-1.5 text-padi-blue">
                      <Award className="w-3.5 h-3.5" />
                      {expedition.min_cert}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};
