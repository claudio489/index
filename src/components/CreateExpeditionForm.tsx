import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Compass, Loader2 } from 'lucide-react';
import { useExpeditionStore } from '@/stores/expeditionStore';
import { SpotSelector } from '@/components/SpotSelector';
import type { CreateExpeditionInput, Expedition } from '@/types/expedition';

interface CreateExpeditionFormProps {
  onClose: () => void;
  onCreated: () => void;
  expedition?: Expedition;
}

export function CreateExpeditionForm({ onClose, onCreated, expedition }: CreateExpeditionFormProps) {
  const { createExpedition, updateExpedition, loading, error } = useExpeditionStore();
  const isEditing = !!expedition;
  const [form, setForm] = useState<CreateExpeditionInput>({
    title: expedition?.title || '',
    description: expedition?.description || '',
    site_ids: expedition?.site_ids || [],
    start_date: expedition?.start_date || '',
    end_date: expedition?.end_date || '',
    spots_total: expedition?.spots_total || 6,
    price_per_person: expedition?.price_per_person || undefined,
    currency: expedition?.currency || 'CLP',
    min_cert: expedition?.min_cert || '',
  });

  const inputClass =
    'w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-4 py-3 text-text-primary outline-none placeholder:text-text-tertiary';
  const labelClass = 'text-xs text-text-tertiary font-medium mb-1 block';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (isEditing && expedition) {
      const ok = await updateExpedition(expedition.id, form);
      if (ok) onCreated();
    } else {
      const result = await createExpedition(form);
      if (result) onCreated();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-ocean-dark rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Compass className="w-5 h-5 text-padi-blue" /> {isEditing ? 'Editar expedicion' : 'Crear expedicion'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-alert-red/10 border border-alert-red/20 rounded-lg text-alert-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Titulo *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Expedicion Isla de Pascua"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descripcion</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalles de la salida..."
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha inicio</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fecha fin</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cupos totales</label>
              <input
                type="number"
                min={1}
                value={form.spots_total}
                onChange={(e) => setForm({ ...form, spots_total: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Precio por persona (CLP)</label>
              <input
                type="number"
                min={0}
                value={form.price_per_person ?? ''}
                onChange={(e) => setForm({ ...form, price_per_person: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Opcional"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Spots incluidos</label>
            <SpotSelector
              selectedIds={form.site_ids || []}
              onChange={(ids) => setForm({ ...form, site_ids: ids })}
            />
          </div>

          <div>
            <label className={labelClass}>Certificacion minima</label>
            <input
              type="text"
              value={form.min_cert}
              onChange={(e) => setForm({ ...form, min_cert: e.target.value })}
              placeholder="Ej: Open Water, Advanced, Tec 40..."
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-padi-blue hover:bg-padi-blue-light disabled:opacity-50 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Compass className="w-5 h-5" />}
            {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar cambios' : 'Crear expedicion')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
