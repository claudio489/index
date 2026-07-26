// src/pages/AdminPage.tsx
import { useState, useEffect } from 'react';
import { useSessionCodes } from '@/hooks/useSessionStore';
import { Shield, Plus, Trash2, Copy, Clock, Check, Smartphone, Lock, AlertTriangle, LogOut, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const MASTER_PIN_HASH = '9c7b8a341dd477eebe11dce4e2a70446f700f59d3177d22d237cb6b58f920be3';

function hash(str: string): string {
  return CryptoJS.SHA256(str).toString();
}

function verifyMasterPin(pin: string): boolean {
  return hash(pin) === MASTER_PIN_HASH;
}

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = () => {
    if (verifyMasterPin(pin)) onAuth();
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
                className={`w-full bg-slate-800 border ${error ? 'border-red-500 animate-pulse' : 'border-slate-700'} text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-center tracking-widest text-lg`} />
            </div>
            {error && <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4" /> PIN incorrecto</p>}
            <button onClick={handleSubmit} disabled={pin.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-semibold transition-colors">Entrar</button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">Dive Tools.cl - PADI TEC/REC INSTRUCTOR #458555</p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const { codes, loadCodes, createCode, revokeCode, isLoading, error, refreshCodes } = useSessionCodes();
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'instructor' | 'user'>('user');
  const [newExpiryDays, setNewExpiryDays] = useState(30);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => { loadCodes(); }, [loadCodes]);

  const handleGenerate = async () => {
    const result = await createCode({ label: newLabel || 'Sin nombre', role: newRole, expiresInDays: newExpiryDays });
    if (result && result.code) {
      setGeneratedCode(result.code);
      setNewLabel('');
      refreshCodes();
    }
  };

  const handleDelete = async (id: string) => {
    await revokeCode(id);
    refreshCodes();
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expiresAt?: string) => expiresAt ? new Date() > new Date(expiresAt) : false;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
            <Shield className="w-6 h-6 text-blue-500" />
            <h1 className="text-lg font-bold text-white">Admin Dive Tools</h1>
            {isLoading && <span className="text-xs text-yellow-400 animate-pulse">Syncing...</span>}
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm"><LogOut className="w-4 h-4" /> Salir</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {error && (
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-3 text-yellow-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

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
          <button onClick={() => setShowNew(!showNew)} className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /><span className="font-semibold text-white">Generar nuevo codigo</span></div>
            <span className="text-slate-400">{showNew ? '-' : '+'}</span>
          </button>
          {showNew && (
            <div className="p-4 border-t border-slate-800 space-y-4">
              <div>
                <label className="text-slate-400 text-sm block mb-1">Nombre / Alumno</label>
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Ej: Juan Perez - Tec 40"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-1">Rol</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg">
                  <option value="user">Alumno</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-1">Dias de validez</label>
                <input type="number" value={newExpiryDays} onChange={(e) => setNewExpiryDays(Number(e.target.value))} min={1} max={365}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg" />
              </div>
              <button onClick={handleGenerate} disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> {isLoading ? 'Guardando...' : 'Generar Codigo'}
              </button>
              {generatedCode && (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-green-400 text-sm mb-2">Codigo generado:</p>
                  <p className="text-2xl font-mono font-bold text-white tracking-wider">{generatedCode}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Smartphone className="w-5 h-5 text-slate-400" /> Codigos activos</h2>
          {codes.length === 0 && <div className="text-center py-12 text-slate-500"><Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No hay codigos generados</p></div>}
          {codes.map(code => {
            const expired = isExpired(code.expiresAt);
            return (
              <div key={code.id} className={`bg-slate-900 rounded-xl p-4 border ${expired ? 'border-red-500/30' : 'border-slate-800'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{code.label}</h3>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{code.role}</span>
                      {expired && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expirado</span>}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-lg font-mono font-bold text-blue-400 tracking-wider">{code.code}</p>
                      <button onClick={() => handleCopy(code.code, code.id)} className="p-1 hover:bg-slate-800 rounded transition-colors">
                        {copiedId === code.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(code.id)} className="p-2 bg-slate-800 hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expira: {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('es-CL') : 'Nunca'}</span>
                  <span>Usos: {code.usedCount}</span>
                </div>
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