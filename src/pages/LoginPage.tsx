import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, AlertTriangle, UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, isLoading, error, clearError } = useDivespotAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setConfirmSent(false);

    if (mode === 'signup') {
      const ok = await signUp(formEmail, formPassword, formName);
      if (ok) {
        const stillLoggedOut = !useDivespotAuthStore.getState().isAuthenticated;
        if (stillLoggedOut) {
          setConfirmSent(true);
        } else {
          navigate('/');
        }
      }
    } else {
      const ok = await signIn(formEmail, formPassword);
      if (ok) navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-deep-ocean flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px]"
      >
        <div className="text-center mb-8">
          <img src="./logo-header.png" alt="Dive Tools" className="w-20 h-20 mx-auto rounded-2xl mb-4 shadow-glow" />
          <h1 className="text-2xl font-bold text-text-primary">Dive Tools</h1>
          <p className="text-xs text-text-tertiary mt-2">
            Acceso exclusivo para alumnos certificados
          </p>
        </div>

        <div className="bg-ocean-dark rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-padi-blue" />
            <h2 className="text-lg font-semibold text-text-primary">
              {mode === 'signup' ? 'Crear cuenta' : 'Ingresar'}
            </h2>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setMode('login'); clearError(); setConfirmSent(false); }}
              className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                mode === 'login'
                  ? 'bg-padi-blue/20 border-padi-blue text-padi-blue'
                  : 'bg-ocean-mid border-transparent text-text-tertiary'
              }`}
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); clearError(); setConfirmSent(false); }}
              className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                mode === 'signup'
                  ? 'bg-padi-blue/20 border-padi-blue text-padi-blue'
                  : 'bg-ocean-mid border-transparent text-text-tertiary'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {confirmSent && (
            <div className="mb-4 flex items-start gap-2 bg-success-green/10 rounded-lg p-2.5 border border-success-green/20">
              <p className="text-xs text-success-green leading-relaxed">
                Te enviamos un mail de confirmacion. Revisa tu bandeja y hace click en el link antes de iniciar sesion.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-[10px] text-text-tertiary font-medium mb-1 block">
                  <User size={10} className="inline mr-1" /> Nombre
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-4 py-3 text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-text-tertiary font-medium mb-1 block">
                <Mail size={10} className="inline mr-1" /> Email
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="juan@example.com"
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-4 py-3 text-text-primary outline-none placeholder:text-text-tertiary"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] text-text-tertiary font-medium mb-1 block">
                <Lock size={10} className="inline mr-1" /> Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-4 py-3 text-text-primary outline-none placeholder:text-text-tertiary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 bg-alert-red/10 rounded-lg p-2.5 border border-alert-red/20"
              >
                <AlertTriangle size={14} className="text-alert-red flex-shrink-0 mt-0.5" />
                <p className="text-xs text-alert-red leading-snug">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-padi-blue hover:bg-padi-blue-light disabled:opacity-50 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {mode === 'signup' ? <UserPlus size={18} /> : <LogIn size={18} />}
              {isLoading ? 'Un momento...' : mode === 'signup' ? 'Crear cuenta' : 'Acceder'}
            </button>
          </form>
        </div>

        <p className="text-[10px] text-text-tertiary text-center mt-4 leading-relaxed">
          Modelo matematico basado en algoritmo Buhlmann ZHL-16C con GF
        </p>
      </motion.div>
    </div>
  );
}