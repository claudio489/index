import React, { useState } from 'react';
import { Check, Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { useExpeditionStore } from '@/stores/expeditionStore';
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';

interface JoinExpeditionButtonProps {
  expeditionId: string;
  maxDivers: number;
  currentReservations: number;
}

export const JoinExpeditionButton: React.FC<JoinExpeditionButtonProps> = ({
  expeditionId,
  maxDivers,
  currentReservations
}) => {
  const isAuthenticated = useDivespotAuthStore(s => s.isAuthenticated);
  const userId = useDivespotAuthStore(s => s.userId);
  const { joinExpedition, getUserReservations, reservations } = useExpeditionStore();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const isJoined = reservations.some(
    r => r.expedition_id === expeditionId && r.user_id === userId
  );
  const isFull = currentReservations >= maxDivers;

  const getButtonState = () => {
    if (!isAuthenticated) return { text: 'Inicia sesion para unirte', disabled: true, variant: 'disabled' as const };
    if (isJoined) return { text: 'Unido', disabled: true, variant: 'success' as const };
    if (isFull) return { text: 'Cupos llenos', disabled: true, variant: 'disabled' as const };
    if (joined) return { text: 'Unido', disabled: true, variant: 'success' as const };
    return { text: 'Unirme a la expedicion', disabled: false, variant: 'primary' as const };
  };

  const buttonState = getButtonState();

  const handleJoin = async () => {
    if (buttonState.disabled || loading) return;
    setLoading(true);
    const success = await joinExpedition(expeditionId);
    setLoading(false);
    if (success) {
      setJoined(true);
      setShowToast(true);
      await getUserReservations();
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const variantStyles = {
    primary: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-default',
    disabled: 'bg-slate-500/10 text-slate-500 border-slate-500/20 cursor-not-allowed'
  };

  return (
    <div className="relative flex-1">
      <button
        onClick={handleJoin}
        disabled={buttonState.disabled}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold border transition-all duration-300 active:scale-95 ${variantStyles[buttonState.variant]}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isJoined || joined ? (
          <Check className="w-5 h-5" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
        {buttonState.text}
      </button>
      {showToast && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap flex items-center gap-2">
          <Check className="w-4 h-4" />
          Te has unido a la expedicion
        </div>
      )}
      {!isAuthenticated && (
        <p className="text-[#64748b] text-xs mt-2 text-center flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Debes iniciar sesion para reservar
        </p>
      )}
    </div>
  );
};