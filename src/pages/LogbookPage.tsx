import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Save, Plus, Trash2 } from 'lucide-react';
import { useLogbookStorage, type LogEntry } from '@/hooks/useLogbookStorage';

const emptyForm: Omit<LogEntry, 'id'> = {
  dive_number: '', date: '', location: '', site: '',
  entry_time: '', exit_time: '', bottom_time: '',
  max_depth: '', avg_depth: '', psi_start: '', psi_end: '',
  tank_size: '', tank_type: 'Aire', dive_type: 'Orilla',
  buddy: '', comments: '', diver_name: '',
};

export default function LogbookPage() {
  const { entries, isLoading, lastError, saveEntry, deleteEntry } = useLogbookStorage();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<LogEntry, 'id'>>({ ...emptyForm });

  const updateField = (field: keyof Omit<LogEntry, 'id'>, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const newEntry: LogEntry = {
      id: `local-${Date.now()}`, ...form,
      date: form.date || new Date().toISOString().split('T')[0],
    };
    saveEntry(newEntry);
    setShowForm(false);
    setForm({ ...emptyForm });
  };

  const totalDives = entries.length;
  const maxDepth = entries.length > 0 ? Math.max(...entries.map(e => Number(e.max_depth) || 0)) : 0;
  const totalBottomTime = entries.reduce((s, e) => s + (Number(e.bottom_time) || 0), 0);

  return (
    <div className="px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookMarked size={24} className="text--blue" />
            <h1 className="text-2xl font-bold text-text-primary">Bitacora de Buceo</h1>
          </div>
          <p className="text-sm text-text-secondary">Registro de inmersiones</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 bg--blue rounded-full flex items-center justify-center active:scale-95">
            {showForm ? <span className="text-white text-lg">&times;</span> : <Plus size={22} className="text-white" />}
          </button>
        </div>
      </div>

      {lastError && (
        <div className="rounded-xl p-3 mb-4 text-center text-xs bg-alert-gold/10 border border-alert-gold/20 text-alert-gold">
          {lastError}
        </div>
      )}

      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-ocean-dark rounded-xl p-3 text-center"><p className="text-lg font-bold font-mono text--blue">{totalDives}</p><p className="text-[10px] text-text-tertiary">Inmersiones</p></div>
          <div className="bg-ocean-dark rounded-xl p-3 text-center"><p className="text-lg font-bold font-mono text-safety-orange">{maxDepth}m</p><p className="text-[10px] text-text-tertiary">Prof. max</p></div>
          <div className="bg-ocean-dark rounded-xl p-3 text-center"><p className="text-lg font-bold font-mono text-success-green">{totalBottomTime}m</p><p className="text-[10px] text-text-tertiary">Tiempo total</p></div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="bg-ocean-dark rounded-2xl p-4 space-y-3 max-h-[65vh] overflow-y-auto">
              <h3 className="text-sm font-semibold sticky top-0 bg-ocean-dark py-2 z-10">Nueva Inmersion</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <F label="Inmersión N°" type="text" value={form.dive_number} onChange={v => updateField('dive_number', v)} />
                <F label="Fecha" type="date" value={form.date} onChange={v => updateField('date', v)} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <F label="Lugar" type="text" value={form.location} onChange={v => updateField('location', v)} />
                <F label="Punto de buceo" type="text" value={form.site} onChange={v => updateField('site', v)} />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <F label="Hora entrada" type="time" value={form.entry_time} onChange={v => updateField('entry_time', v)} />
                <F label="Hora salida" type="time" value={form.exit_time} onChange={v => updateField('exit_time', v)} />
                <F label="T. fondo (min)" type="number" value={form.bottom_time} onChange={v => updateField('bottom_time', v)} />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <F label="Prof. max (m)" type="number" value={form.max_depth} onChange={v => updateField('max_depth', v)} />
                <F label="Prof. prom (m)" type="number" value={form.avg_depth} onChange={v => updateField('avg_depth', v)} />
                <F label="Tanque (L)" type="number" value={form.tank_size} onChange={v => updateField('tank_size', v)} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <F label="BAR/PSI Inicial" type="number" value={form.psi_start} onChange={v => updateField('psi_start', v)} />
                <F label="BAR/PSI Final" type="number" value={form.psi_end} onChange={v => updateField('psi_end', v)} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <S label="Tipo" value={form.dive_type} onChange={v => updateField('dive_type', v)} options={['Orilla','Bote','Cueva','Corriente','Nocturno','Profundo','Pecios','Curso','Drift','Ice']} />
                <S label="Gas" value={form.tank_type} onChange={v => updateField('tank_type', v)} options={['Aire','Nitrox','Trimix','Acero','Aluminio']} />
              </div>
              <F label="Buddy" type="text" value={form.buddy} onChange={v => updateField('buddy', v)} />
              <div>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Comentarios</label>
                <textarea value={form.comments} onChange={e => updateField('comments', e.target.value)} rows={2} className="w-full bg-ocean-mid border border-transparent focus:border--blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none resize-none" />
              </div>
              <button onClick={handleSave} className="w-full bg--blue text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2">
                <Save size={18} /> Guardar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && <div className="text-center py-16"><div className="w-8 h-8 border-2 border--blue border-t-transparent rounded-full animate-spin mx-auto" /></div>}

      {!isLoading && entries.length === 0 && !showForm && (
        <div className="text-center py-16">
          <BookMarked size={48} className="text-ocean-surface mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Sin inmersiones</p>
          <p className="text-text-tertiary text-xs">Toca + para agregar</p>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-ocean-dark rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold font-mono text--blue">#{entry.dive_number || '?'}</span>
                  <span className="text-xs text-text-secondary">{entry.date}</span>
                  {entry.id.startsWith('local-') && <span className="text-[9px] text-safety-orange bg-safety-orange/10 px-1.5 py-0.5 rounded-full">Pendiente</span>}
                </div>
                <p className="text-sm font-medium text-text-primary">{entry.location}</p>
                <p className="text-xs text-text-secondary">{entry.site}</p>
              </div>
              <button onClick={() => deleteEntry(entry.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-alert-red/10 flex-shrink-0 ml-2">
                <Trash2 size={16} className="text-alert-red" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-[10px] text-text-tertiary">Fondo</p><p className="text-sm font-mono font-semibold text-safety-orange">{entry.bottom_time || '-'}m</p></div>
              <div><p className="text-[10px] text-text-tertiary">Max</p><p className="text-sm font-mono font-semibold text--blue">{entry.max_depth || '-'}m</p></div>
              <div><p className="text-[10px] text-text-tertiary">Gas</p><p className="text-xs font-semibold text-success-green">{entry.tank_type || '-'}</p></div>
              <div><p className="text-[10px] text-text-tertiary">PSI</p><p className="text-xs font-mono text-text-secondary">{entry.psi_start || '-'}/{entry.psi_end || '-'}</p></div>
            </div>
            {entry.buddy && <p className="text-[10px] text-text-tertiary mt-2">Buddy: {entry.buddy}</p>}
            {entry.comments && <p className="text-[10px] text-text-secondary mt-1">{entry.comments}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function F({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-text-tertiary font-medium mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-ocean-mid border border-transparent focus:border--blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
    </div>
  );
}

function S({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] text-text-tertiary font-medium mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-ocean-mid border border-transparent focus:border--blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none appearance-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
