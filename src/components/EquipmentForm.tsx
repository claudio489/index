import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Wrench, Droplets, Gauge, Calendar, Hash, Shield } from 'lucide-react';
import { type EquipmentItem } from '@/stores/equipmentStore';

interface EquipmentFormProps {
  item: EquipmentItem | null;
  onClose: () => void;
  onSave: (data: Partial<EquipmentItem>) => void;
}

const equipmentTypes = [
  { id: 'regulator', label: 'Regulador', icon: '🔧' },
  { id: 'tank', label: 'Botella', icon: '🫙' },
  { id: 'bcd', label: 'BCD / Chaleco', icon: '🦺' },
  { id: 'computer', label: 'Computadora', icon: '⌚' },
  { id: 'dry-suit', label: 'Traje Seco', icon: '👔' },
  { id: 'wetsuit', label: 'Traje Húmedo', icon: '🤿' },
  { id: 'mask', label: 'Máscara', icon: '🥽' },
  { id: 'fins', label: 'Aletas', icon: '🦶' },
  { id: 'other', label: 'Otro', icon: '📦' },
];

export default function EquipmentForm({ item, onClose, onSave }: EquipmentFormProps) {
  const [type, setType] = useState(item?.type || 'regulator');
  const [brand, setBrand] = useState(item?.brand || '');
  const [model, setModel] = useState(item?.model || '');
  const [serialNumber, setSerialNumber] = useState(item?.serialNumber || '');
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [alertEnabled, setAlertEnabled] = useState(item?.alertEnabled !== false);

  // Regulador / BCD / Computadora
  const [lastServiceDate, setLastServiceDate] = useState(item?.lastServiceDate || '');
  const [serviceIntervalDives, setServiceIntervalDives] = useState(item?.serviceIntervalDives || 100);
  const [serviceIntervalMonths, setServiceIntervalMonths] = useState(item?.serviceIntervalMonths || 12);
  const [totalDives, setTotalDives] = useState(item?.totalDives || 0);

  // Botella
  const [volume, setVolume] = useState(item?.volume || '');
  const [workingPressure, setWorkingPressure] = useState(item?.workingPressure || '');
  const [material, setMaterial] = useState(item?.material || 'Acero');
  const [lastPhDate, setLastPhDate] = useState(item?.lastPhDate || '');
  const [phIntervalYears, setPhIntervalYears] = useState(item?.phIntervalYears || 5);
  const [lastVisualDate, setLastVisualDate] = useState(item?.lastVisualDate || '');
  const [visualIntervalMonths, setVisualIntervalMonths] = useState(item?.visualIntervalMonths || 12);

  const isTank = type === 'tank';
  const isServiceable = type === 'regulator' || type === 'bcd' || type === 'computer';

  const handleSubmit = () => {
    const data: Partial<EquipmentItem> = {
      type,
      brand,
      model,
      serialNumber,
      purchaseDate,
      notes,
      alertEnabled,
    };

    if (isServiceable) {
      data.lastServiceDate = lastServiceDate;
      data.serviceIntervalDives = serviceIntervalDives;
      data.serviceIntervalMonths = serviceIntervalMonths;
      data.totalDives = totalDives;
    }

    if (isTank) {
      data.volume = volume;
      data.workingPressure = workingPressure;
      data.material = material;
      data.lastPhDate = lastPhDate;
      data.phIntervalYears = phIntervalYears;
      data.lastVisualDate = lastVisualDate;
      data.visualIntervalMonths = visualIntervalMonths;
    }

    onSave(data);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-ocean-dark w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-ocean-dark border-b border-ocean-surface/20 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-text-primary">
            {item ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ocean-mid">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Tipo de equipo */}
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-2 block uppercase tracking-wider">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {equipmentTypes.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => setType(eq.id as any)}
                  className={`p-2 rounded-xl text-center transition-all ${
                    type === eq.id 
                      ? 'bg-padi-blue text-white shadow-lg' 
                      : 'bg-ocean-mid text-text-secondary hover:bg-ocean-mid/80'
                  }`}
                >
                  <span className="text-lg block mb-0.5">{eq.icon}</span>
                  <span className="text-[10px] font-medium">{eq.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info básica */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Marca</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Scubapro"
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Modelo</label>
                <input 
                  type="text" 
                  value={model} 
                  onChange={e => setModel(e.target.value)}
                  placeholder="Mk25 EVO"
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">N° Serie</label>
                <input 
                  type="text" 
                  value={serialNumber} 
                  onChange={e => setSerialNumber(e.target.value)}
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Fecha compra</label>
                <input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Configuración especí­fica por tipo */}
          {isTank && (
            <div className="bg-ocean-mid/30 rounded-xl p-3 space-y-3 border border-ocean-surface/20">
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={14} className="text-padi-blue" />
                <h3 className="text-xs font-semibold text-text-primary">Configuración Botella</h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Volumen (L)</label>
                  <input 
                    type="text" 
                    value={volume} 
                    onChange={e => setVolume(e.target.value)}
                    placeholder="12"
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Presión (bar)</label>
                  <input 
                    type="text" 
                    value={workingPressure} 
                    onChange={e => setWorkingPressure(e.target.value)}
                    placeholder="200"
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Material</label>
                  <select 
                    value={material} 
                    onChange={e => setMaterial(e.target.value as any)}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  >
                    <option value="Acero">Acero</option>
                    <option value="Aluminio">Aluminio</option>
                    <option value="Fibra de carbono">Fibra</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block flex items-center gap-1">
                    <Shield size={10} /> íšltima PH
                  </label>
                  <input 
                    type="date" 
                    value={lastPhDate} 
                    onChange={e => setLastPhDate(e.target.value)}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Intervalo PH (años)</label>
                  <input 
                    type="number" 
                    value={phIntervalYears} 
                    onChange={e => setPhIntervalYears(Number(e.target.value))}
                    min={1} max={10}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block flex items-center gap-1">
                    <Gauge size={10} /> íšltima Visual
                  </label>
                  <input 
                    type="date" 
                    value={lastVisualDate} 
                    onChange={e => setLastVisualDate(e.target.value)}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Intervalo Visual (meses)</label>
                  <input 
                    type="number" 
                    value={visualIntervalMonths} 
                    onChange={e => setVisualIntervalMonths(Number(e.target.value))}
                    min={1} max={24}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {isServiceable && (
            <div className="bg-ocean-mid/30 rounded-xl p-3 space-y-3 border border-ocean-surface/20">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={14} className="text-padi-blue" />
                <h3 className="text-xs font-semibold text-text-primary">Mantención Programada</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block flex items-center gap-1">
                    <Calendar size={10} /> íšltima mantención
                  </label>
                  <input 
                    type="date" 
                    value={lastServiceDate} 
                    onChange={e => setLastServiceDate(e.target.value)}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Intervalo (meses)</label>
                  <input 
                    type="number" 
                    value={serviceIntervalMonths} 
                    onChange={e => setServiceIntervalMonths(Number(e.target.value))}
                    min={1} max={24}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block flex items-center gap-1">
                    <Hash size={10} /> Buceos actuales
                  </label>
                  <input 
                    type="number" 
                    value={totalDives} 
                    onChange={e => setTotalDives(Number(e.target.value))}
                    min={0}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Lí­mite buceos</label>
                  <input 
                    type="number" 
                    value={serviceIntervalDives} 
                    onChange={e => setServiceIntervalDives(Number(e.target.value))}
                    min={1}
                    className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notas y alertas */}
          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Notas</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones, número de serie del kit de mantención, etc."
              rows={2}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="alertEnabled" 
              checked={alertEnabled} 
              onChange={e => setAlertEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-ocean-surface"
            />
            <label htmlFor="alertEnabled" className="text-sm text-text-secondary">
              Activar alertas de mantención
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ocean-dark border-t border-ocean-surface/20 p-4">
          <button 
            onClick={handleSubmit}
            className="w-full bg-padi-blue text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Save size={16} />
            {item ? 'Guardar cambios' : 'Agregar equipo'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}










