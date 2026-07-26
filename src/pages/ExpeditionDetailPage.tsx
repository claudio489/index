import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Award, MapPin, Loader2, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { useExpeditionStore } from '@/stores/expeditionStore';
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';
import { JoinExpeditionButton } from '@/components/JoinExpeditionButton';
import { CreateExpeditionForm } from '@/components/CreateExpeditionForm';

export default function ExpeditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentExpedition,
    spots,
    reservations,
    expeditionReservations,
    loading,
    error,
    fetchExpeditionById,
    getUserReservations,
    fetchExpeditionReservations,
    updateReservationStatus,
  } = useExpeditionStore();
  const { userId } = useDivespotAuthStore();
  const [showEditForm, setShowEditForm] = useState(false);

  const isOwner = !!currentExpedition && !!userId && currentExpedition.created_by === userId;

  useEffect(() => {
    if (id) {
      fetchExpeditionById(id);
      getUserReservations();
    }
  }, [id]);

  useEffect(() => {
    if (id && isOwner) {
      fetchExpeditionReservations(id);
    }
  }, [id, isOwner]);

  if (loading && !currentExpedition) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-padi-blue animate-spin" />
      </div>
    );
  }

  if (error || !currentExpedition) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-alert-red mx-auto mb-4" />
          <h2 className="text-text-primary text-xl font-bold mb-2">No se encontro la expedicion</h2>
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={() => navigate('/herramientas/expediciones')}
            className="mt-4 text-padi-blue text-sm underline"
          >
            Volver a expediciones
          </button>
        </div>
      </div>
    );
  }

  const taken = currentExpedition.spots_filled ||
    reservations.filter(r => r.expedition_id === currentExpedition.id).length;
  const available = (currentExpedition.spots_total || 0) - taken;

  return (
    <div className="pb-24">
      <div className="relative w-full h-[220px] overflow-hidden mb-4">
        <img src="./hero-bg.jpg" alt={currentExpedition.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-ocean via-deep-ocean/60 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-deep-ocean/70 backdrop-blur rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        {isOwner && (
          <button
            onClick={() => setShowEditForm(true)}
            className="absolute top-4 right-4 w-9 h-9 bg-deep-ocean/70 backdrop-blur rounded-full flex items-center justify-center"
          >
            <Pencil className="w-4 h-4 text-text-primary" />
          </button>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-text-primary text-2xl font-bold">{currentExpedition.title}</h1>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-5">
        {currentExpedition.description && (
          <p className="text-text-secondary text-sm leading-relaxed">
            {currentExpedition.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-ocean-dark rounded-xl p-3 border border-ocean-surface/20">
            <div className="flex items-center gap-2 text-padi-blue mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs text-text-tertiary">Fechas</span>
            </div>
            <p className="text-sm text-text-primary font-medium">
              {currentExpedition.start_date
                ? new Date(currentExpedition.start_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
                : 'A confirmar'}
              {currentExpedition.end_date && ` - ${new Date(currentExpedition.end_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`}
            </p>
          </div>
          <div className="bg-ocean-dark rounded-xl p-3 border border-ocean-surface/20">
            <div className="flex items-center gap-2 text-success-green mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs text-text-tertiary">Cupos</span>
            </div>
            <p className="text-sm text-text-primary font-medium">
              {available} de {currentExpedition.spots_total || 0} disponibles
            </p>
          </div>
          {currentExpedition.min_cert && (
            <div className="bg-ocean-dark rounded-xl p-3 border border-ocean-surface/20">
              <div className="flex items-center gap-2 text-safety-orange mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs text-text-tertiary">Certificacion minima</span>
              </div>
              <p className="text-sm text-text-primary font-medium">{currentExpedition.min_cert}</p>
            </div>
          )}
          {currentExpedition.price_per_person && (
            <div className="bg-ocean-dark rounded-xl p-3 border border-ocean-surface/20">
              <div className="flex items-center gap-2 text-padi-blue mb-1">
                <span className="text-xs text-text-tertiary">Precio por persona</span>
              </div>
              <p className="text-sm text-text-primary font-medium">
                {currentExpedition.currency || 'CLP'} ${currentExpedition.price_per_person.toLocaleString('es-CL')}
              </p>
            </div>
          )}
        </div>

        {spots.length > 0 && (
          <div>
            <h3 className="text-text-primary font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-padi-blue" /> Spots incluidos
            </h3>
            <div className="space-y-2">
              {spots.map(spot => (
                <div key={spot.id} className="bg-ocean-dark rounded-xl p-3 border border-ocean-surface/20">
                  <p className="text-sm text-text-primary font-medium">{spot.name}</p>
                  {spot.city && <p className="text-xs text-text-tertiary">{spot.city}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {isOwner && expeditionReservations.length > 0 && (
          <div>
            <h3 className="text-text-primary font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-padi-blue" /> Reservas ({expeditionReservations.length})
            </h3>
            <div className="space-y-2">
              {expeditionReservations.map((r) => (
                <div key={r.id} className="bg-ocean-dark rounded-xl p-3 border border-ocean-surface/20 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">{r.user_id}</p>
                    <p className="text-xs text-text-tertiary capitalize">{r.status}</p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateReservationStatus(r.id, 'confirmed')}
                        className="w-8 h-8 bg-success-green/20 text-success-green rounded-lg flex items-center justify-center"
                        title="Confirmar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateReservationStatus(r.id, 'cancelled')}
                        className="w-8 h-8 bg-alert-red/20 text-alert-red rounded-lg flex items-center justify-center"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <JoinExpeditionButton
            expeditionId={currentExpedition.id}
            maxDivers={currentExpedition.spots_total || 0}
            currentReservations={taken}
          />
        </div>
      </div>

      {showEditForm && currentExpedition && (
        <CreateExpeditionForm
          expedition={currentExpedition}
          onClose={() => setShowEditForm(false)}
          onCreated={() => {
            setShowEditForm(false);
            if (id) fetchExpeditionById(id);
          }}
        />
      )}
    </div>
  );
}

