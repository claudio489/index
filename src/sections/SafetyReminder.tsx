import { HeartPulse } from 'lucide-react';

export default function SafetyReminder() {
  return (
    <section className="mt-6 px-4 pb-6">
      <div className="rounded-2xl p-4 text-center bg-gradient-to-r from-alert-red/8 via-safety-orange/8 to-padi-blue/8 border-t border-alert-red/15">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HeartPulse size={16} className="text-alert-red" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Esta aplicación es una herramienta de apoyo. Siempre verifica tus cálculos con tablas oficiales PADI
            y nunca reemplaces el juicio de un instructor certificado.
          </p>
        </div>
        <p className="text-[10px] text-text-tertiary">
          PADI es marca registrada. Dive Tools no está afiliada oficialmente con PADI.
        </p>
      </div>
    </section>
  );
}


