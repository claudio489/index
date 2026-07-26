import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Wrench, Plus, Trash2, AlertTriangle, CheckCircle, Clock, 
  ChevronRight, Shield, Droplets, Gauge, Calendar, Hash
} from 'lucide-react';
import { useEquipmentStore } from '@/stores/equipmentStore';
import { useLogbookStorage } from '@/hooks/useLogbookStorage';
import { equipmentTypeLabels, equipmentTypeIcons, getAllAlerts, type EquipmentAlert, type EquipmentItem } from '@/stores/equipmentStore';
import EquipmentForm from '@/components/EquipmentForm';

export default function EquipmentPage() {
  const { items, addItem, updateItem, deleteItem, hydrateFromServer } = useEquipmentStore();
  const { entries } = useLogbookStorage();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

  useEffect(() => {
    hydrateFromServer();
  }, []);

  const totalDives = entries.length;
  const allAlerts = getAllAlerts(items);
  const criticalAlerts = allAlerts.filter((a: EquipmentAlert) => a.type === 'critical');
  const warningAlerts = allAlerts.filter((a: EquipmentAlert) => a.type === 'warning');

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este equipo?')) {
      deleteItem(id);
    }
  };

  const getStatusColor = (item: EquipmentItem) => {
    const alerts = getAllAlerts([item]);
    if (alerts.some((a: EquipmentAlert) => a.type === 'critical')) return 'text-alert-red border-alert-red/30 bg-alert-red/5';
    if (alerts.some((a: EquipmentAlert) => a.type === 'warning')) return 'text-safety-orange border-safety-orange/30 bg-safety-orange/5';
    return 'text-success-green border-success-green/30 bg-success-green/5';
  };

  const getStatusIcon = (item: EquipmentItem) => {
    const alerts = getAllAlerts([item]);
    if (alerts.some((a: EquipmentAlert) => a.type === 'critical')) return <AlertTriangle size={16} className="text-alert-red" />;
    if (alerts.some((a: EquipmentAlert) => a.type === 'warning')) return <Clock size={16} className="text-safety-orange" />;
    return <CheckCircle size={16} className="text-success-green" />;
  };

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench size={22} className="text-padi-blue" />
          <h1 className="text-xl font-bold text-text-primary">Mi Equipo</h1>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="w-9 h-9 bg-padi-blue rounded-full flex items-center justify-center active:scale-95"
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Alertas Summary */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="space-y-2 mb-4">
          {criticalAlerts.length > 0 && (
            <div className="bg-alert-red/10 border border-alert-red/20 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle size={20} className="text-alert-red flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-alert-red">{criticalAlerts.length} alertas críticas</p>
                <p className="text-xs text-alert-red/80">Requiere acción inmediata</p>
              </div>
            </div>
          )}
          {warningAlerts.length > 0 && (
            <div className="bg-safety-orange/10 border border-safety-orange/20 rounded-xl p-3 flex items-center gap-3">
              <Clock size={20} className="text-safety-orange flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-safety-orange">{warningAlerts.length} advertencias</p>
                <p className="text-xs text-safety-orange/80">Programar mantención pronto</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-ocean-dark rounded-xl p-3 text-center border border-ocean-surface/20">
          <p className="text-2xl font-bold font-mono text-padi-blue">{items.length}</p>
          <p className="text-[10px] text-text-tertiary">Equipos</p>
        </div>
        <div className="bg-ocean-dark rounded-xl p-3 text-center border border-ocean-surface/20">
          <p className="text-2xl font-bold font-mono text-alert-red">{criticalAlerts.length}</p>
          <p className="text-[10px] text-text-tertiary">Críticas</p>
        </div>
        <div className="bg-ocean-dark rounded-xl p-3 text-center border border-ocean-surface/20">
          <p className="text-2xl font-bold font-mono text-text-primary">{totalDives}</p>
          <p className="text-[10px] text-text-tertiary">Buceos</p>
        </div>
      </div>

      {/* Lista de Equipos */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-12">
            <Wrench size={48} className="text-text-tertiary mx-auto mb-3 opacity-30" />
            <p className="text-sm text-text-secondary mb-1">Sin equipo registrado</p>
            <p className="text-xs text-text-tertiary mb-4">Registra tu equipo para recibir alertas de mantención</p>
            <button 
              onClick={() => { setEditingItem(null); setShowForm(true); }}
              className="bg-padi-blue text-white px-4 py-2 rounded-full text-sm font-medium active:scale-95"
            >
              Agregar equipo
            </button>
          </div>
        )}

        {items.map((item: EquipmentItem) => {
          const alerts = getAllAlerts([item]);
          const statusClass = getStatusColor(item);
          const statusIcon = getStatusIcon(item);

          return (
            <motion.div 
              key={item.id}
              layout
              className={`bg-ocean-dark rounded-xl border p-4 ${statusClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ocean-mid flex items-center justify-center text-lg">
                    {equipmentTypeIcons[item.type]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {equipmentTypeLabels[item.type]}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {item.brand} {item.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {statusIcon}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-alert-red/10 ml-1"
                  >
                    <Trash2 size={14} className="text-alert-red" />
                  </button>
                </div>
              </div>

              {/* Detalles especificos */}
              <div className="mt-3 space-y-1.5">
                {item.type === 'tank' && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Droplets size={12} />
                      <span>{item.volume}L @ {item.workingPressure} bar — {item.material}</span>
                    </div>
                    {item.lastPhDate && (
                      <div className="flex items-center gap-2 text-xs">
                        <Shield size={12} className={alerts.some((a: EquipmentAlert) => a.message.includes('PH')) ? 'text-alert-red' : 'text-text-tertiary'} />
                        <span className={alerts.some((a: EquipmentAlert) => a.message.includes('PH')) ? 'text-alert-red font-medium' : 'text-text-tertiary'}>
                          PH: {item.lastPhDate} (cada {item.phIntervalYears} años)
                        </span>
                      </div>
                    )}
                    {item.lastVisualDate && (
                      <div className="flex items-center gap-2 text-xs">
                        <Gauge size={12} className={alerts.some((a: EquipmentAlert) => a.message.includes('Visual')) ? 'text-alert-red' : 'text-text-tertiary'} />
                        <span className={alerts.some((a: EquipmentAlert) => a.message.includes('Visual')) ? 'text-alert-red font-medium' : 'text-text-tertiary'}>
                          Visual: {item.lastVisualDate} (cada {item.visualIntervalMonths} meses)
                        </span>
                      </div>
                    )}
                  </>
                )}

                {(item.type === 'regulator' || item.type === 'bcd' || item.type === 'computer') && (
                  <>
                    {item.lastServiceDate && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={12} className={alerts.some((a: EquipmentAlert) => a.message.includes('Mantención') && a.type === 'critical') ? 'text-alert-red' : 'text-text-tertiary'} />
                        <span className={alerts.some((a: EquipmentAlert) => a.message.includes('Mantención') && a.type === 'critical') ? 'text-alert-red font-medium' : 'text-text-tertiary'}>
                          Última mantención: {item.lastServiceDate}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <Hash size={12} />
                      <span>{item.totalDives || 0} / {item.serviceIntervalDives} buceos</span>
                    </div>
                  </>
                )}
              </div>

              {/* Alertas del item */}
              {alerts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {alerts.map((alert: EquipmentAlert, idx: number) => (
                    <div key={idx} className={`rounded-lg p-2 text-xs flex items-center gap-2 ${
                      alert.type === 'critical' ? 'bg-alert-red/10 text-alert-red' : 
                      alert.type === 'warning' ? 'bg-safety-orange/10 text-safety-orange' : 
                      'bg-padi-blue/10 text-padi-blue'
                    }`}>
                      <AlertTriangle size={12} />
                      <span className="flex-1">{alert.message}</span>
                      <Link 
                        to="/servicios" 
                        className="text-[10px] font-medium underline flex-shrink-0"
                      >
                        {/* action removed */}
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => { setEditingItem(item); setShowForm(true); }}
                className="mt-3 w-full text-xs text-text-tertiary hover:text-padi-blue transition-colors flex items-center justify-center gap-1 py-1"
              >
                Editar <ChevronRight size={12} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <EquipmentForm 
            item={editingItem}
            onClose={() => setShowForm(false)}
            onSave={(data) => {
              if (editingItem) {
                updateItem(editingItem.id, data);
              } else {
                addItem(data as Omit<EquipmentItem, 'id'>);
              }
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}