import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Calendar, Users, Filter, AlertCircle, Loader2, Award } from 'lucide-react';
import { useExpeditionStore } from '../stores/expeditionStore';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  forming: { label: 'En formación', color: 'text-alert-gold', bg: 'bg-alert-gold/20 border-alert-gold/30' },
  confirmed: { label: 'Confirmada', color: 'text-success-green', bg: 'bg-success-green/20 border-success-green/30' },
  completed: { label: 'Completada', color: 'text-text-tertiary', bg: 'bg-text-tertiary/20 border-text-tertiary/30' },
  cancelled: { label: 'Cancelada', color: 'text-alert-red', bg: 'bg-alert-red/20 border-alert-red/30' },
  open: { label: 'Abierta', color: 'text-success-green', bg: 'bg-success-green/20 border-success-green/30' },
  closed: { label: 'Cerrada', color: 'text-alert-red', bg: 'bg-alert-red/20 border-alert-red/30' },
  full: { label: 'Llena', color: 'text-text-tertiary', bg: 'bg-text-tertiary/20 border-text-tertiary/30' }
};

type StatusFilter = 'all' | 'forming' | 'confirmed' | 'completed' | 'cancelled';

export const ExpeditionList: React.FC = () => {
  const { expeditions, loading, error, fetchExpeditions, reservations } = useExpeditionStore();
  const [filter, setFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    fetchExpeditions();
  }, []);

  const getReservationCount = (expeditionId: string) => {
    return reservations.filter(r => r.expedition_id === expeditionId).length;
  };

  const filteredExpeditions = filter === 'all'
    ? expeditions
    : expeditions.filter(e => e.status === filter);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-padi-blue animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Cargando expediciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-alert-red mx-auto mb-4" />
          <h2 className="text-text-primary text-xl font-bold mb-2">Error al cargar</h2>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="relative w-full h-[200px] overflow-hidden mb-6">
        <img
          src="./hero-bg.jpg"
          alt="Expediciones"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-ocean via-deep-ocean/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-text-primary text-2xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-padi-blue" />
            Expediciones
          </h1>
          <p className="text-text-secondary text-sm mt-1">Unete a una salida organizada y vive la aventura</p>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'forming', 'confirmed', 'completed', 'cancelled'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-padi-blue/20 text-padi-blue border border-padi-blue/30'
                  : 'bg-ocean-dark text-text-secondary border border-ocean-surface/30 hover:border-ocean-surface'
              }`}
            >
              {f === 'all' && <Filter className="w-3.5 h-3.5" />}
              {f === 'all' ? 'Todas' : f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredExpeditions.length === 0 ? (
          <div className="text-center py-16 bg-ocean-dark/50 border border-ocean-surface/20 rounded-2xl">
            <Compass className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-text-primary text-lg font-bold mb-2">No hay expediciones disponibles</h3>
            <p className="text-text-secondary text-sm max-w-sm mx-auto">
              {filter === 'all'
                ? 'No hay expediciones programadas. Vuelve pronto para ver nuevas salidas.'
                : 'No hay expediciones con ese estado. Prueba otro filtro.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExpeditions.map((expedition, index) => {
              const status = statusConfig[expedition.status || ''] || statusConfig.forming;
              const taken = expedition.spots_filled || getReservationCount(expedition.id);
              const available = (expedition.spots_total || 0) - taken;
              const durationDays = expedition.start_date && expedition.end_date
                ? Math.ceil((new Date(expedition.end_date).getTime() - new Date(expedition.start_date).getTime()) / (1000 * 60 * 60 * 24))
                : 0;

              return (
                <motion.div
                  key={expedition.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    to={`/expedition/${expedition.id}`}
                    className="group block bg-ocean-dark border border-ocean-surface/20 rounded-2xl overflow-hidden hover:border-padi-blue/40 hover:shadow-lg hover:shadow-padi-blue/10 transition-all duration-300"
                  >
                    {/* Imagen */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src="./hero-bg.jpg"
                        alt={expedition.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ocean-dark via-ocean-dark/40 to-transparent" />

                      {/* Badge estado */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Precio */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-ocean-dark/80 backdrop-blur text-text-primary text-sm font-bold px-3 py-1 rounded-full">
                          {expedition.price_per_person
                            ? `$${(expedition.price_per_person / 1000000).toFixed(1)}M`
                            : 'Consultar'}
                        </span>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-4">
                      <h3 className="text-text-primary text-lg font-bold mb-2 group-hover:text-padi-blue transition-colors">
                        {expedition.title}
                      </h3>

                      <p className="text-text-secondary text-sm line-clamp-2 mb-3">
                        {expedition.description?.substring(0, 100)}...
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-padi-blue" />
                          {expedition.start_date ? new Date(expedition.start_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : ''}
                          {durationDays > 0 && ` (${durationDays}d)`}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-success-green" />
                          {available} cupos
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-safety-orange" />
                          {(expedition.site_ids || []).length} spots
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
        )}
      </div>
    </div>
  );
};