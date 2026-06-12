import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { SafetyStatus } from '@/types';

interface StatusBannerProps {
  status: SafetyStatus;
  message: string;
}

const config = {
  safe: {
    bg: 'bg-success-green/15',
    border: 'border-success-green',
    icon: CheckCircle,
    iconColor: 'text-success-green',
  },
  caution: {
    bg: 'bg-safety-orange/15',
    border: 'border-safety-orange',
    icon: AlertTriangle,
    iconColor: 'text-safety-orange',
  },
  danger: {
    bg: 'bg-alert-red/15',
    border: 'border-alert-red',
    icon: AlertOctagon,
    iconColor: 'text-alert-red',
  },
};

export default function StatusBanner({ status, message }: StatusBannerProps) {
  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl ${c.bg} border-l-4 ${c.border}`}>
      <Icon size={18} className={`${c.iconColor} mt-0.5 flex-shrink-0`} />
      <p className={`text-sm leading-snug ${
        status === 'safe' ? 'text-success-green' :
        status === 'caution' ? 'text-safety-orange' : 'text-alert-red'
      }`}>
        {message}
      </p>
    </div>
  );
}
