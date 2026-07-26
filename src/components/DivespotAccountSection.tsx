// src/components/DivespotAccountSection.tsx
// Seccion de cuenta REAL (email + contrasena, Supabase Auth) contra el proyecto divespot.
// Convive en paralelo con el sistema de codigos INDEX-XXXX. No lo reemplaza (todavia).

import React, { useEffect, useState } from 'react';
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';
import { LogIn, UserPlus, LogOut, Award, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export const DivespotAccountSection: React.FC = () => {
  const {
    isAuthenticated,
    email,
    profile,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    loadSession,
    clearError,
  } = useDivespotAuthStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const inputClass =
    'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all';
  const labelClass = 'block text-sm font-medium text-white/70 mb-1.5';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setConfirmSent(false);

    if (mode === 'signup') {
      const ok = await signUp(formEmail, formPassword, formName);
      if (ok) {
        // Si no genero sesion inmediata, es porque falta confirmar el mail
        const stillLoggedOut = !useDivespotAuthStore.getState().isAuthenticated;
        if (stillLoggedOut) setConfirmSent(true);
      }
    } else {
      await signIn(formEmail, formPassword);
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
      <h3 className="text-white font-medium flex items-center gap-2">
        <Award className="w-5 h-5 text-cyan-400" /> Cuenta Divespot
      </h3>

      {isAuthenticated ? (
        <div className="space-y-3">
          <p className="text-white/70 text-sm">
            Conectado como <span className="text-cyan-400">{email}</span>
          </p>
          {profile?.is_instructor && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-400/20 rounded-full text-cyan-400 text-xs">
              Instructor verificado
            </span>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full py-2.5 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/15 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesion Divespot
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setMode('login'); clearError(); setConfirmSent(false); }}
              className={`flex-1 py-2 rounded-lg border transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); clearError(); setConfirmSent(false); }}
              className={`flex-1 py-2 rounded-lg border transition-all ${
                mode === 'signup'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {confirmSent && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
              Te enviamos un mail de confirmacion. Revisa tu bandeja y hace click en el link antes de iniciar sesion.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className={labelClass}>
                  <User className="w-4 h-4 inline mr-1" /> Nombre
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputClass}
                  placeholder="Juan Perez"
                />
              </div>
            )}
            <div>
              <label className={labelClass}>
                <Mail className="w-4 h-4 inline mr-1" /> Email
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className={inputClass}
                placeholder="juan@example.com"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Lock className="w-4 h-4 inline mr-1" /> Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className={inputClass}
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isLoading
                ? 'Un momento...'
                : mode === 'signup'
                ? 'Crear cuenta'
                : 'Iniciar sesion'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};