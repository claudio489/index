import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogIn, AlertTriangle, Smartphone, Lock } from 'lucide-react';
import { validateAccessWithDevice } from '@/stores/useSessionStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { getDeviceFingerprint, storeDeviceFingerprint } from '@/lib/deviceFingerprint';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useSessionStore(s => s.login);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!code || code.length < 4) {
      setError('Ingresa un codigo de acceso valido');
      setLoading(false);
      return;
    }

    try {
      // Generate device fingerprint
      const deviceFp = storeDeviceFingerprint();
      const deviceName = navigator.userAgent;

      const result = await validateAccessWithDevice(code, deviceFp, deviceName);

      if (result.valid && result.token) {
        await login(result.token, deviceFp);
        navigate('/');
      } else {
        setError(result.error || 'Error al validar. Intenta de nuevo.');
      }
    } catch (e) {
      setError('Error al validar. Intenta de nuevo.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-deep-ocean flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px]"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="./icon-crab.png" alt="INDEX" className="w-20 h-20 mx-auto rounded-2xl mb-4 shadow-glow" />
          <h1 className="text-2xl font-bold text-text-primary">INDEX</h1>
          <p className="text-sm text-text-secondary mt-1">by DiveSpot</p>
          <p className="text-xs text-text-tertiary mt-2">
            Acceso exclusivo para alumnos certificados
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-ocean-dark rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-padi-blue" />
            <h2 className="text-lg font-semibold text-text-primary">Ingresar</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-text-tertiary font-medium mb-1 block">
                Codigo de Acceso
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="INDEX-XXXXXX"
                className="w-full bg-ocean-mid border border-transparent focus:border-padi-blue rounded-xl px-4 py-3.5 text-center text-lg font-mono text-text-primary outline-none placeholder:text-text-tertiary tracking-widest uppercase"
                autoFocus
              />
              <p className="text-[9px] text-text-tertiary mt-1.5 text-center">
                Tu instructor te proporciono este codigo
              </p>
            </div>

            {/* Security info */}
            <div className="flex items-start gap-2 bg-ocean-mid/40 rounded-lg p-2.5 border border-ocean-surface/20">
              <Lock size={12} className="text-success-green flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-text-secondary leading-relaxed">
                Este codigo se vincula a <strong className="text-text-primary">este dispositivo</strong> en el primer uso.
                No se puede compartir — si lo intentas en otro dispositivo, no funcionara.
              </p>
            </div>

            {/* Device info */}
            <div className="flex items-center gap-1.5 text-[9px] text-text-tertiary">
              <Smartphone size={10} />
              <span>Dispositivo: {getDeviceFingerprint().slice(0, 15)}...</span>
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
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-padi-blue hover:bg-padi-blue-light disabled:opacity-50 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <LogIn size={18} />
              {loading ? 'Verificando...' : 'Acceder'}
            </button>

            {/* Admin link */}
            <Link to="/admin"
              className="block text-center text-[10px] text-text-tertiary hover:text-padi-blue transition-colors mt-2">
              Panel de instructor →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-text-tertiary text-center mt-4 leading-relaxed">
          Modelo matematico basado en algoritmo Buhlmann ZHL-16C con GF by DiveSpot
        </p>

        {/* Demo hint */}
        <p className="text-[9px] text-text-tertiary/50 text-center mt-2">
          Demo: <code className="text-padi-blue">INDEX-DEMO1</code>
        </p>
      </motion.div>
    </div>
  );
}
