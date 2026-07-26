// src/pages/AdminPage.tsx
// ADMIN - Login compatible + Recuperacion de codigos

import { useState, useEffect } from 'react';
import { getAccessCodes, saveAccessCode, deleteAccessCode, getSyncStatus, syncPendingCodes } from '../stores/useSessionStore';
import { Shield, Plus, Trash2, Copy, Clock, Check, Smartphone, Lock, AlertTriangle, LogOut, ChevronLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const MASTER_PIN_HASH = '9c7b8a341dd477eebe11dce4e2a70446f700f59d3177d22d237cb6b58f920be3';
const CODE_PREFIX = 'INDEX-';

interface AccessCode {
  id: string;
  name: string;
  code?: string;        // Codigo plano (opcional, para codigos nuevos)
  codeHash: string;     // Hash SHA256 para validacion
  courses: string[];
  expiresAt: string;
  createdAt: string;
  notes?: string;
}







function hash(str: string): string {
  return CryptoJS.SHA256(str).toString();
}

function verifyMasterPin(pin: string): boolean {
  return hash(pin) === MASTER_PIN_HASH;
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = CODE_PREFIX;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function loadAllCodes(): Promise<AccessCode[]> {
  // Usar getAccessCodes() que ahora busca en Supabase primero, fallback a local
  return await getAccessCodes();
}

async function saveCode(code: AccessCode) {
  // Usar saveAccessCode() que guarda en Supabase + local
  await saveAccessCode(code as any);
}

async function deleteCode(id: string) {
  // Usar deleteAccessCode() que elimina en Supabase + local
  await deleteAccessCode(id);
}

async function regenerateCode(id: string): Promise<string | null> {
  const codes = await loadAllCodes();
  const code = codes.find(c => c.id === id);
  if (!code) return null;
  const newRawCode = generateAccessCode();
  const newHash = hash(newRawCode.toUpperCase());
  const updated = { ...code, code: newRawCode, codeHash: newHash };
  await saveCode(updated);
  return newRawCode;
}

const COURSES = [
  'Open Water', 'Advanced OW', 'Rescue + EFR', 'Dive Master',
  'Nitrox', 'Deep Diver', 'Wreck', 'Sidemount Rec',
  'Tec 40', 'Tec 45', 'Trimix', 'Dry Suit', 'Foto Sub'
];

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (verifyMasterPin(pin)) { onAuth(); }
    else { setError(true); setTimeout(() => setError(false), 1500); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Panel de Administracion</h1>
            <p className="text-slate-400 text-sm">Solo instructores autorizados</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="password" inputMode="numeric" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="PIN de 6 digitos"
                className={`w-full bg-slate-800 border ${error ? 'border-red-500 animate-pulse' : 'border-slate-700'}
                  text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-center tracking-widest text-lg`}
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" /> PIN incorrecto
              </p>
            )}
            <button onClick={handleSubmit} disabled={pin.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-semibold transition-colors">
              Entrar
            </button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">Dive Tools.cl - PADI TEC/REC INSTRUCTOR #458555</p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newCourses, setNewCourses] = useState<string[]>([]);
  const [newExpiryDays, setNewExpiryDays] = useState(30);
  const [newNotes, setNewNotes] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    loadAllCodes().then(setCodes);
    // Verificar estado de sync
    const status = getSyncStatus();
    setSyncPending(status.pending);
    
    // Reintentar sync cada 30 seg si hay pendientes
    const interval = setInterval(() => {
      const status = getSyncStatus();
      if (status.pending) {
        syncPendingCodes().then(() => setSyncPending(false)).catch(() => {});
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    const rawCode = generateAccessCode();
    const codeHash = hash(rawCode.toUpperCase());
    const newCode: AccessCode = {
      id: `code-${Date.now()}`,
      name: newName || 'Sin nombre',
      code: rawCode,
      codeHash: codeHash,
      courses: newCourses,
      expiresAt: new Date(Date.now() + newExpiryDays * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      notes: newNotes,
    };
    await saveCode(newCode);
    const updated = await loadAllCodes();
    setCodes(updated);
    setGeneratedCode(rawCode);
    setNewName(''); setNewCourses([]); setNewNotes('');
    // Verificar si qued� pendiente de sync
    const status = getSyncStatus();
    setSyncPending(status.pending);
  };

  const handleDelete = async (id: string) => {
    await deleteCode(id);
    setCodes(await loadAllCodes());
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCourse = (course: string) => {
    setNewCourses(prev => prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]);
  };

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <Shield className="w-6 h-6 text-blue-500" />
            <h1 className="text-lg font-bold text-white">Admin Dive Tools</h1>
            {syncPending && (
              <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Sync pendiente
              </span>
            )}
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase">Total Codigos</p>
            <p className="text-2xl font-bold text-white">{codes.length}</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase">Activos</p>
            <p className="text-2xl font-bold text-green-400">{codes.filter(c => !isExpired(c.expiresAt)).length}</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase">Expirados</p>
            <p className="text-2xl font-bold text-red-400">{codes.filter(c => isExpired(c.expiresAt)).length}</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <button onClick={() => setShowNew(!showNew)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-white">Generar nuevo codigo</span>
            </div>
            <span className="text-slate-400">{showNew ? '-' : '+'}</span>
          </button>

          {showNew && (
            <div className="p-4 border-t border-slate-800 space-y-4">
              <div>
                <label className="text-slate-400 text-sm block mb-1">Nombre / Alumno</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Juan Perez - Tec 40"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-2">Cursos habilitados</label>
                <div className="flex flex-wrap gap-2">
                  {COURSES.map(course => (
                    <button key={course} onClick={() => toggleCourse(course)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        newCourses.includes(course) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                      }`}>{course}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm block mb-1">Dias de validez</label>
                  <input type="number" value={newExpiryDays} onChange={(e) => setNewExpiryDays(Number(e.target.value))}
                    min={1} max={365}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-sm block mb-1">Notas</label>
                  <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Opcional"
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <button onClick={handleGenerate}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Generar Codigo
              </button>
              {generatedCode && (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-green-400 text-sm mb-2">Codigo generado:</p>
                  <p className="text-2xl font-mono font-bold text-white tracking-wider">{generatedCode}</p>
                  <p className="text-slate-400 text-xs mt-2">Copia y comparte con el alumno</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-slate-400" /> Codigos activos
          </h2>
          {codes.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay codigos generados</p>
            </div>
          )}
          {codes.map(code => {
            const expired = isExpired(code.expiresAt);
            return (
              <div key={code.id} className={`bg-slate-900 rounded-xl p-4 border ${expired ? 'border-red-500/30' : 'border-slate-800'} space-y-3`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{code.name}</h3>
                      {expired && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expirado</span>}
                    </div>

                    {/* CÓDIGO: si existe, mostrarlo. Si no, botón regenerar */}
                    {code.code ? (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg font-mono font-bold text-blue-400 tracking-wider">{code.code}</p>
                        <button onClick={() => handleCopy(code.code!, code.id)}
                          className="p-1 hover:bg-slate-800 rounded transition-colors" title="Copiar codigo">
                          {copiedId === code.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-yellow-500">Codigo no disponible (perdido)</p>
                        <button onClick={async () => {
                            const newCode = await regenerateCode(code.id);
                            if (newCode) { alert(`Nuevo codigo: ${newCode}`); setCodes(await loadAllCodes()); }
                          }}
                          className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors">
                          <RefreshCw className="w-3 h-3" /> Regenerar
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 font-mono">ID: {code.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(code.id)}
                      className="p-2 bg-slate-800 hover:bg-red-900/30 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {code.courses.map(c => <span key={c} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full">{c}</span>)}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expira: {new Date(code.expiresAt).toLocaleDateString('es-CL')}</span>
                  <span>Creado: {new Date(code.createdAt).toLocaleDateString('es-CL')}</span>
                </div>
                {code.notes && <p className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">{code.notes}</p>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  if (!authenticated) return <LoginScreen onAuth={() => setAuthenticated(true)} />;
  return <AdminDashboard onLogout={() => setAuthenticated(false)} />;
}
