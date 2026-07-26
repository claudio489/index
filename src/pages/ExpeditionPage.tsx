import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Calendar, Users, Thermometer, Eye, Clock, DollarSign, Check, Share2, AlertCircle, Loader2, Award, ArrowLeft, Fish } from 'lucide-react';
import { useExpeditionStore } from '../stores/expeditionStore';
import { DiveSpotCard } from '../components/DiveSpotCard';
import { JoinExpeditionButton } from '../components/JoinExpeditionButton';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  forming: { label: 'En formación', color: 'text-alert-gold', bg: 'bg-alert-gold/20 border-alert-gold/30' },
  confirmed: { label: 'Confirmada', color: 'text-success-green', bg: 'bg-success-green/20 border-success-green/30' },
  completed: { label: 'Completada', color: 'text-text-tertiary', bg: 'bg-text-tertiary/20 border-text-tertiary/30' },
  cancelled: { label: 'Cancelada', color: 'text-alert-red', bg: 'bg-alert-red/20 border-alert-red/30' },
  open: { label: 'Abierta', color: 'text-success-green', bg: 'bg-success-green/20 border-success-green/30' },
  closed: { label: 'Cerrada', color: 'text-alert-red', bg: 'bg-alert-red/20 border-alert-red/30' },
  full: { label: 'Llena', color: 'text-text-tertiary', bg: 'bg-text-tertiary/20 border-text-tertiary/30' }
};

export const ExpeditionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shared, setShared] = useState(false);

  const {
    currentExpedition,
    spots,
    loading,
    error,
    fetchExpeditionById,
    reservations
  } = useExpeditionStore();

  useEffect(() => {
    if (id) {
      fetchExpeditionById(id);
    }
  }, [id]);

  const expeditionReservations = reservations.filter(r => r.expedition_id === id);
  const spotsTaken = currentExpedition?.spots_filled || expeditionReservations.length;
  const spotsAvailable = currentExpedition 
    ? (currentExpedition.spots_total || 0) - spotsTaken 
    : 0;

  const handleShare = async () => {
    const url = window.location.href;
    const text = currentExpedition 
      ? `🤿 ${currentExpedition.title}`
      : 'Expedición de buceo';

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-padi-blue animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Cargando expedición...</p>
        </div>
      </div>
    );
  }

  if (error || !currentExpedition) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-alert-red mx-auto mb-4" />
          <h2 className="text-text-primary text-xl font-bold mb-2">Expedición no encontrada</h2>
          <p className="text-text-secondary mb-6">{error || 'La expedición que buscas no existe.'}</p>
          <button 
            onClick={() => navigate('/herramientas/expediciones')}
            className="bg-padi-blue/20 text-padi-blue border border-padi-blue/30 rounded-xl px-6 py-2.5 font-medium hover:bg-padi-blue/30 transition-colors"
          >
            Ver todas las expediciones
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[currentExpedition.status || ''] || statusConfig.forming;
  const priceFormatted = currentExpedition.price_per_person
    ? new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currentExpedition.currency || 'CLP',
        minimumFractionDigits: 0
      }).format(currentExpedition.price_per_person)
    : 'Consultar';

  const durationDays = currentExpedition.start_date && currentExpedition.end_date 
    ? Math.ceil((new Date(currentExpedition.end_date).getTime() - new Date(currentExpedition.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="relative w-full h-[280px] overflow-hidden">
        <img
          src="./hero-bg.jpg"
          alt={currentExpedition.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-ocean via-deep-ocean/60 to-transparent" />
        
        {/* Botón volver */}
        <button
          onClick={() => navigate('/herramientas/expediciones')}
          className="absolute top-4 left-4 z-10 bg-ocean-dark/80 backdrop-blur text-text-primary p-2 rounded-full hover:bg-ocean-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg}`}>
              <Compass className="w-3.5 h-3.5" />
              {status.label}
            </span>
            {currentExpedition.min_cert && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-padi-blue/20 text-padi-blue border border-padi-blue/30">
                <Award className="w-3.5 h-3.5" />
                {currentExpedition.min_cert}
              </span>
            )}
          </div>
          <h1 className="text-text-primary text-2xl md:text-3xl font-bold">
            {currentExpedition.title}
          </h1>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto py-6 space-y-6">
        {/* Info bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
            <Thermometer className="w-6 h-6 text-padi-blue mx-auto mb-2" />
            <div className="text-text-primary font-bold">20°C</div>
            <div className="text-text-secondary text-xs">Temperatura</div>
          </div>
          <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
            <Eye className="w-6 h-6 text-padi-blue mx-auto mb-2" />
            <div className="text-text-primary font-bold">30-50m</div>
            <div className="text-text-secondary text-xs">Visibilidad</div>
          </div>
          <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
            <Users className="w-6 h-6 text-padi-blue mx-auto mb-2" />
            <div className="text-text-primary font-bold">Bruno del Mar</div>
            <div className="text-text-secondary text-xs">Instructor</div>
          </div>
          <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 text-center">
            <Compass className="w-6 h-6 text-padi-blue mx-auto mb-2" />
            <div className="text-text-primary font-bold">{spots.length}</div>
            <div className="text-text-secondary text-xs">Spots</div>
          </div>
        </div>

        {/* Fechas y cupos */}
        <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="w-5 h-5 text-padi-blue" />
              <span className="text-sm">
                {currentExpedition.start_date ? new Date(currentExpedition.start_date).toLocaleDateString('es-CL') : ''} 
                {currentExpedition.end_date ? ` → ${new Date(currentExpedition.end_date).toLocaleDateString('es-CL')}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="w-5 h-5 text-padi-blue" />
              <span className="text-sm">{durationDays} días</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-success-green" />
            <span className="text-sm text-text-secondary">
              <span className="text-success-green font-bold">{spotsAvailable}</span> cupos disponibles / {currentExpedition.spots_total || 0} total
            </span>
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-6">
          <h2 className="text-text-primary text-xl font-bold mb-3">Sobre la expedición</h2>
          <p className="text-text-secondary leading-relaxed">{currentExpedition.description || ''}</p>
        </div>

        {/* Spots grid */}
        <div>
          <h2 className="text-text-primary text-xl font-bold mb-4 flex items-center gap-2">
            <Fish className="w-5 h-5 text-padi-blue" />
            Spots de buceo ({spots.length})
          </h2>
          {spots.length === 0 ? (
            <div className="text-center py-12 text-text-secondary bg-ocean-dark/50 rounded-2xl">Cargando spots...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {spots.map((spot, index) => (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <DiveSpotCard spot={spot} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Precio y servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-6">
            <h2 className="text-text-primary text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-padi-blue" />
              Precio estimado
            </h2>
            <div className="text-3xl font-bold text-padi-blue mb-2">{priceFormatted}</div>
            <p className="text-text-secondary text-sm">Por persona</p>
          </div>

          <div className="bg-ocean-dark border border-ocean-surface/20 rounded-2xl p-6">
            <h2 className="text-text-primary text-xl font-bold mb-4">Servicios incluidos</h2>
            <ul className="space-y-2.5">
              {['Buceos guiados', 'Transporte marítimo', 'Fotografía submarina', 'Alojamiento', 'Alimentación'].map((service, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-text-secondary text-sm">
                  <Check className="w-4 h-4 text-success-green flex-shrink-0" />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-ocean-dark/95 backdrop-blur-md border border-ocean-surface/30 rounded-2xl p-4 md:static md:bg-transparent md:border-0 md:p-0 md:backdrop-blur-none">
          <JoinExpeditionButton 
            expeditionId={currentExpedition.id}
            maxDivers={currentExpedition.spots_total || 0}
            currentReservations={spotsTaken}
          />
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-ocean-dark border border-ocean-surface/30 text-text-primary rounded-xl px-6 py-3 font-medium hover:border-padi-blue/50 hover:bg-ocean-mid transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            {shared ? '¡Copiado!' : 'Compartir'}
          </button>
        </div>
      </div>
    </div>
  );
};



