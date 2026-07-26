import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Plus, Trash2, Copy, X, Clock, Check, Smartphone, Lock, AlertTriangle, LogOut } from 'lucide-react';
import { verifyMasterPin, generateAccessCode, hash } from '@/lib/accessControl';
import { getAccessCodesWithDevices, saveAccessCode, deleteAccessCode, revokeDeviceFromCode } from '@/stores/useSessionStore';
import type { AccessCode } from '@/lib/accessControl';
import { availableCourses } from '@/lib/accessControl';

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [codes, setCodes] = useState<(AccessCode & { deviceFp?: string; deviceName?: string })[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokedId, setRevokedId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newCourses, setNewCourses] = useState<string[]>([]);
  const [newExpiryDays, setNewExpiryDays] = useState(30);
  const [newNotes, setNewNotes] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => { if (authenticated) loadCodes(); }, [authenticated]);

  const loadCodes = async () => {
    const c = await getAccessCodesWithDevices();
    setCodes(c);
  };

  const handlePinSubmit = () => {
    if (verifyMasterPin(pin)) setAuthenticated(true);
  };

  const handleGenerate = async () => {
    const code = generateAccessCode();
    const codeHash = hash(code);
    const newCode: AccessCode = {
      id: `code-${Date.now()}`,
      name: newName || 'Sin nombre',
      codeHash,
      courses: newCourses,
      expiresAt: new Date(Date.now() + newExpiryDays * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      notes: newNotes,
    };
    await saveAccessCode(newCode);
    setGeneratedCode(code);
    loadCodes();
  };

  const handleDelete = async (id: string) => {
    await deleteAccessCode(id);
    loadCodes();
  };

  const handleRevokeDevice = async (codeId: string) => {
    revokeDeviceFromCode(codeId);
    setRevokedId(codeId);
    setTimeout(() => setRevokedId(null), 2000);
    loadCodes();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCourse = (id: string) => {
    if (newCourses.includes(id)) setNewCourses(newCourses.filter(c => c !== id));
    else setNewCourses([...newCourses, id]);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-deep-ocean flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[320px]">
          <div className="bg-ocean-dark rounded-2xl shadow-card p-6 text-center">
            <Shield size={32} className="text-padi-blue mx-auto mb-3" />
            <h2 className="text-lg font-bold text-text-primary mb-1">Panel de Administracion</h2>
            <p className="text-xs text-text-secondary mb-4">Solo instructores autorizados</p>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
              placeholder="PIN de instructor" maxLength={6}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-4 py-3 text-center text-lg font-mono text-text-primary outline-none placeholder:text-text-tertiary tracking-widest mb-3"
              autoFocus />
            <button onClick={handlePinSubmit} className="w-full bg-padi-blue text-white font-semibold py-3 rounded-full active:scale-[0.98]">
              Entrar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={22} className="text-padi-blue" />
          <h1 className="text-xl font-bold text-text-primary">Panel Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="w-9 h-9 flex items-center justify-center rounded-full bg-ocean-mid hover:bg-alert-red/20 active:scale-95 transition-colors" title="Volver al login">
            <LogOut size={16} className="text-text-tertiary" />
          </Link>
          <button onClick={() => setShowNew(!showNew)}
            className="w-9 h-9 bg-padi-blue rounded-full flex items-center justify-center active:scale-95">
            {showNew ? <X size={18} className="text-white" /> : <Plus size={20} className="text-white" />}
          </button>
        </div>
      </div>

      {/* New Code Form */}
      {showNew && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-ocean-dark rounded-2xl shadow-card p-4 space-y-4 mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Nuevo Codigo de Acceso</h3>

          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Nombre del alumno</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
          </div>

          <div>
            <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Cursos habilitados</label>
            <div className="flex flex-wrap gap-1.5">
              {availableCourses.map(c => (
                <button key={c.id} onClick={() => toggleCourse(c.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    newCourses.includes(c.id) ? 'bg-padi-blue text-white' : 'bg-ocean-mid text-text-secondary'
                  }`}>
                  {newCourses.includes(c.id) ? '✓ ' : ''}{c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Expira en (dias)</label>
              <input type="number" value={newExpiryDays} onChange={e => setNewExpiryDays(Number(e.target.value))}
                min={1} max={365} className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary font-medium mb-1 block">Notas</label>
              <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none" />
            </div>
          </div>

          <button onClick={handleGenerate}
            className="w-full bg-success-green text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98]">
            <Plus size={16} /> Generar Codigo
          </button>

          {generatedCode && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-alert-gold/10 border border-alert-gold/30 rounded-xl p-4 text-center space-y-2">
              <div className="flex items-center gap-1.5 justify-center">
                <Lock size={12} className="text-alert-gold" />
                <p className="text-[10px] text-alert-gold font-medium">Codigo vinculado a 1 dispositivo</p>
              </div>
              <p className="text-2xl font-mono font-bold text-alert-gold tracking-[0.2em]">{generatedCode}</p>
              <p className="text-[9px] text-text-secondary">Comparte este codigo con {newName || 'el alumno'}</p>
              <button onClick={() => copyCode(generatedCode)}
                className="text-xs text-alert-gold flex items-center gap-1 mx-auto">
                {copiedId === generatedCode ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar codigo</>}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Codes List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Codigos Activos ({codes.length})
        </h3>

        {codes.map(code => {
          const isExpired = new Date(code.expiresAt) < new Date();
          const hasDevice = !!code.deviceFp;

          return (
            <div key={code.id} className={`bg-ocean-dark rounded-xl p-3 border ${isExpired ? 'border-alert-red/20 opacity-60' : 'border-ocean-surface/20'}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{code.name}</p>
                  <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                    <Clock size={9} />
                    {isExpired ? 'EXPIRADO' : `Expira: ${new Date(code.expiresAt).toLocaleDateString('es-ES')}`}
                  </p>
                </div>
                <button onClick={() => handleDelete(code.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-alert-red/10 transition-colors">
                  <Trash2 size={14} className="text-alert-red" />
                </button>
              </div>

              {/* Courses */}
              <div className="flex flex-wrap gap-1 mb-2">
                {code.courses.map(c => (
                  <span key={c} className="text-[9px] bg-ocean-mid text-text-secondary px-1.5 py-0.5 rounded-full">
                    {availableCourses.find(ac => ac.id === c)?.name || c}
                  </span>
                ))}
              </div>

              {/* Device binding status */}
              <div className={`rounded-lg p-2.5 border ${hasDevice ? 'bg-success-green/5 border-success-green/20' : 'bg-ocean-mid/30 border-ocean-surface/20'}`}>
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className={hasDevice ? 'text-success-green' : 'text-text-tertiary'} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-medium ${hasDevice ? 'text-success-green' : 'text-text-tertiary'}`}>
                      {hasDevice ? 'Dispositivo vinculado' : 'Sin vincular (esperando primer uso)'}
                    </p>
                    {hasDevice && code.deviceFp && (
                      <p className="text-[9px] text-text-tertiary truncate">
                        ID: {code.deviceFp}
                      </p>
                    )}
                  </div>
                  {hasDevice && (
                    <button
                      onClick={() => handleRevokeDevice(code.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium bg-alert-red/10 text-alert-red hover:bg-alert-red/20 transition-colors flex-shrink-0"
                    >
                      {revokedId === code.id ? <Check size={10} /> : <AlertTriangle size={10} />}
                      {revokedId === code.id ? 'Revocado' : 'Desvincular'}
                    </button>
                  )}
                </div>
              </div>

              {code.notes && <p className="text-[9px] text-text-tertiary mt-1.5">{code.notes}</p>}
            </div>
          );
        })}

        {codes.length === 0 && (
          <p className="text-center text-sm text-text-tertiary py-8">Sin codigos registrados</p>
        )}
      </div>
    </div>
  );
}
