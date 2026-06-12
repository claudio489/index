import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Save, Plus, Trash2, CloudOff } from 'lucide-react';
import type { LogbookEntryDB } from '@/lib/supabase';

const diveTypes = ['Orilla', 'Bote', 'Cueva', 'Corriente', 'Nocturno', 'Profundo', 'Pecios', 'Curso', 'Drift', 'Ice'];
const tankTypes = ['Aire', 'Nitrox', 'Trimix', 'Acero', 'Aluminio'];
const equipmentList = ['Seco', 'Semi seco', 'Humedo', 'Largo', 'Corto', '2 Piezas', 'Botas', 'Guantes', 'Capucha', 'Linterna', 'Cuchillo', 'Linea', 'Boya', 'Salchicha', 'Brujula', 'Computador', 'Camara', 'Flash'];
const conditionsList = ['Soleado', 'Nublado', 'Lluvia', 'Mar Calmo', 'Oleaje', 'Termoclinas', 'Mar de fondo'];

// ---- Local Storage (siempre funciona, sin depender de Supabase) ----
const STORAGE_KEY = 'index_logbook_v2';

function loadEntries(): LogbookEntryDB[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: LogbookEntryDB[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full
  }
}

// ---- Component ----
export default function LogbookPage() {
  const [entries, setEntries] = useState<LogbookEntryDB[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<LogbookEntryDB>>({
    dive_type: [], tank_type: [], equipment: [], conditions: []
  });

  // Load on mount
  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const handleSave = () => {
    const newEntry: LogbookEntryDB = {
      id: `local-${Date.now()}`,
      device_fp: '',
      dive_number: form.dive_number || '',
      date: form.date || new Date().toISOString().split('T')[0],
      location: form.location || '',
      site: form.site || '',
      entry_time: form.entry_time || '',
      exit_time: form.exit_time || '',
      bottom_time: form.bottom_time || '',
      max_depth: form.max_depth || '',
      avg_depth: form.avg_depth || '',
      psi_start: form.psi_start || '',
      psi_end: form.psi_end || '',
      tank_size: form.tank_size || '',
      dive_type: form.dive_type || [],
      tank_type: form.tank_type || [],
      equipment: form.equipment || [],
      conditions: form.conditions || [],
      participants: form.participants || '',
      buddy: form.buddy || '',
      guide: form.guide || '',
      comments: form.comments || '',
      diver_name: form.diver_name || '',
      cert_number: form.cert_number || '',
      club: form.club || '',
      operator: form.operator || '',
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);

    setShowForm(false);
    setForm({ dive_type: [], tank_type: [], equipment: [], conditions: [] });
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  const toggleArray = (field: keyof LogbookEntryDB, value: string) => {
    const current = ((form[field] || []) as string[]);
    if (current.includes(value)) {
      setForm({ ...form, [field]: current.filter(v => v !== value) });
    } else {
      setForm({ ...form, [field]: [...current, value] });
    }
  };

  // Stats
  const totalDives = entries.length;
  const maxDepth = entries.length > 0 ? Math.max(...entries.map(e => Number(e.max_depth) || 0)) : 0;
  const totalBottomTime = entries.reduce((s, e) => s + (Number(e.bottom_time) || 0), 0);

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookMarked size={24} className="text-padi-blue" />
            <h1 className="text-2xl font-bold text-text-primary">Bitacora de Buceo</h1>
          </div>
          <p className="text-sm text-text-secondary">Registro de inmersiones PADI</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-safety-orange/10">
            <CloudOff size={12} className="text-safety-orange" />
            <span className="text-[10px] text-safety-orange font-medium">Local</span>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 bg-padi-blue rounded-full flex items-center justify-center active:scale-95">
            {showForm ? <Trash2 size={18} className="text-white" /> : <Plus size={22} className="text-white" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-ocean-dark rounded-xl p-3 text-center border border-ocean-surface/20">
            <p className="text-lg font-bold font-mono text-padi-blue">{totalDives}</p>
            <p className="text-[10px] text-text-tertiary">Inmersiones</p>
          </div>
          <div className="bg-ocean-dark rounded-xl p-3 text-center border border-ocean-surface/20">
            <p className="text-lg font-bold font-mono text-safety-orange">{maxDepth}m</p>
            <p className="text-[10px] text-text-tertiary">Prof. max</p>
          </div>
          <div className="bg-ocean-dark rounded-xl p-3 text-center border border-ocean-surface/20">
            <p className="text-lg font-bold font-mono text-success-green">{totalBottomTime}m</p>
            <p className="text-[10px] text-text-tertiary">Tiempo total</p>
          </div>
        </div>
      )}

      {/* New Entry Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-ocean-dark rounded-2xl shadow-card p-4 space-y-4 mb-4 max-h-[70vh] overflow-y-auto">
          <h3 className="text-sm font-semibold text-text-primary">Nueva Inmersion</h3>

          {/* PADI U-Profile SVG */}
          <div className="bg-ocean-mid/30 rounded-xl p-3">
            <p className="text-[10px] text-text-tertiary text-center mb-1">Perfil de inmersion</p>
            <svg viewBox="0 0 300 70" className="w-full h-auto">
              <rect width="300" height="70" fill="#0B1D2E" rx="8" />
              <line x1="10" y1="12" x2="290" y2="12" stroke="#1B5B7D" strokeWidth="0.5" strokeDasharray="3" />
              <polyline points="30,12 30,55 150,55 260,12" fill="none" stroke="#0070D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="8" y="4" width="48" height="18" rx="5" fill="#0F2940" stroke="#0070D3" strokeWidth="1" />
              <text x="14" y="12" fill="#94B8C9" fontSize="6">IS</text>
              <text x="28" y="12" fill="#94B8C9" fontSize="6">GP</text>
              <text x="14" y="18" fill="#FFD700" fontSize="7" fontWeight="600">?</text>
              <rect x="244" y="4" width="48" height="18" rx="5" fill="#0F2940" stroke="#2E8B57" strokeWidth="1" />
              <text x="260" y="15" fill="#94B8C9" fontSize="7" fontWeight="600">GP</text>
              <rect x="225" y="28" width="52" height="14" rx="5" fill="#0F2940" stroke="#2E8B57" strokeWidth="0.8" />
              <text x="230" y="37" fill="#2E8B57" fontSize="5.5" fontWeight="600">Parada 5m</text>
              <text x="265" y="37" fill="#5A8299" fontSize="5">(15ft)</text>
              <text x="90" y="64" fill="#5A8299" fontSize="6">TNR:____ TRF:____ TTF:____</text>
            </svg>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className="text-[10px] text-text-tertiary font-medium mb-1 block">Inmersion N°</label>
              <input type="text" value={form.dive_number || ''} onChange={e => setForm({ ...form, dive_number: e.target.value })}
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" /></div>
            <div><label className="text-[10px] text-text-tertiary font-medium mb-1 block">Fecha</label>
              <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" /></div>
            <div><label className="text-[10px] text-text-tertiary font-medium mb-1 block">Lugar</label>
              <input type="text" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" /></div>
            <div><label className="text-[10px] text-text-tertiary font-medium mb-1 block">Punto de buceo</label>
              <input type="text" value={form.site || ''} onChange={e => setForm({ ...form, site: e.target.value })}
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" /></div>
          </div>

          {/* Times & Depths */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { k: 'entry_time', label: 'Hora entrada', type: 'time' },
              { k: 'exit_time', label: 'Hora salida', type: 'time' },
              { k: 'bottom_time', label: 'T. fondo (min)', type: 'text' },
              { k: 'max_depth', label: 'Prof. max (m)', type: 'text' },
              { k: 'avg_depth', label: 'Prof. prom (m)', type: 'text' },
              { k: 'tank_size', label: 'Tanque (L)', type: 'text' },
            ].map(f => (
              <div key={f.k}>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.k] || ''}
                  onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
              </div>
            ))}
          </div>

          {/* PSI */}
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className="text-[10px] text-text-tertiary font-medium mb-1 block">BAR/PSI Inicial</label>
              <input type="number" value={form.psi_start || ''} onChange={e => setForm({ ...form, psi_start: e.target.value })}
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" /></div>
            <div><label className="text-[10px] text-text-tertiary font-medium mb-1 block">BAR/PSI Final</label>
              <input type="number" value={form.psi_end || ''} onChange={e => setForm({ ...form, psi_end: e.target.value })}
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" /></div>
          </div>

          {/* Checkboxes */}
          <CBG label="Tipo de Inmersion" items={diveTypes} sel={form.dive_type || []} onToggle={v => toggleArray('dive_type', v)} />
          <CBG label="Tanque / Gas" items={tankTypes} sel={form.tank_type || []} onToggle={v => toggleArray('tank_type', v)} />
          <CBG label="Equipos" items={equipmentList} sel={form.equipment || []} onToggle={v => toggleArray('equipment', v)} />
          <CBG label="Condiciones" items={conditionsList} sel={form.conditions || []} onToggle={v => toggleArray('conditions', v)} />

          {/* Participants */}
          <div className="space-y-2.5">
            {[
              { k: 'participants', label: 'Quienes participaron' },
              { k: 'buddy', label: 'Mi companero fue' },
              { k: 'guide', label: 'Inmersion guiada por' },
            ].map(f => (
              <div key={f.k}>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">{f.label}</label>
                <input type="text" value={(form as any)[f.k] || ''} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Comentarios</label>
            <textarea value={form.comments || ''} onChange={e => setForm({ ...form, comments: e.target.value })}
              rows={3} className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { k: 'diver_name', label: 'Nombre y Apellido' },
              { k: 'cert_number', label: 'Certif. N°' },
              { k: 'club', label: 'Club de buceo' },
              { k: 'operator', label: 'Operadora' },
            ].map(f => (
              <div key={f.k}>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">{f.label}</label>
                <input type="text" value={(form as any)[f.k] || ''} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
              </div>
            ))}
          </div>

          <button onClick={handleSave}
            className="w-full bg-padi-blue text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98]">
            <Save size={18} /> Guardar Inmersion
          </button>
        </motion.div>
      )}

      {/* Entries List */}
      {entries.length === 0 && !showForm && (
        <div className="text-center py-16">
          <BookMarked size={48} className="text-ocean-surface mx-auto mb-3" />
          <p className="text-text-secondary text-sm mb-1">Sin inmersiones registradas</p>
          <p className="text-text-tertiary text-xs">Toca + para agregar tu primera inmersion</p>
        </div>
      )}

      {entries.map((entry, i) => (
        <motion.div key={entry.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="bg-ocean-dark rounded-2xl shadow-card p-4 mb-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-padi-blue">#{entry.dive_number || '?'}</span>
                <span className="text-xs text-text-secondary">{entry.date}</span>
                <span className="text-[9px] text-safety-orange bg-safety-orange/10 px-1.5 py-0.5 rounded-full">Local</span>
              </div>
              <p className="text-sm font-medium text-text-primary mt-0.5">{entry.location}</p>
              <p className="text-xs text-text-secondary">{entry.site}</p>
            </div>
            <button onClick={() => handleDelete(entry.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-alert-red/10">
              <Trash2 size={16} className="text-alert-red" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div><p className="text-[10px] text-text-tertiary">Fondo</p><p className="text-sm font-mono font-semibold text-safety-orange">{entry.bottom_time || '-'}m</p></div>
            <div><p className="text-[10px] text-text-tertiary">Max</p><p className="text-sm font-mono font-semibold text-padi-blue">{entry.max_depth || '-'}m</p></div>
            <div><p className="text-[10px] text-text-tertiary">Gas</p><p className="text-xs font-semibold text-success-green">{entry.tank_type?.[0] || '-'}</p></div>
            <div><p className="text-[10px] text-text-tertiary">PSI</p><p className="text-xs font-mono text-text-secondary">{entry.psi_start || '-'}/{entry.psi_end || '-'}</p></div>
          </div>

          {entry.buddy && <p className="text-[10px] text-text-tertiary mt-2">Buddy: {entry.buddy}</p>}
          {entry.comments && <p className="text-[10px] text-text-secondary mt-1 line-clamp-2">{entry.comments}</p>}
        </motion.div>
      ))}
    </div>
  );
}

// Checkbox Group helper
function CBG({ label, items, sel, onToggle }: { label: string; items: string[]; sel: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => {
          const isSel = sel.includes(item);
          return <button key={item} onClick={() => onToggle(item)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${isSel ? 'bg-padi-blue text-white' : 'bg-ocean-mid text-text-secondary'}`}>
            {isSel ? '✓ ' : ''}{item}</button>;
        })}
      </div>
    </div>
  );
}
