import { Download } from 'lucide-react';
import { downloadBackup } from '../lib/divespotApi';

export function BackupButton() {
  return (
    <button
      onClick={downloadBackup}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" />
      Descargar mis datos (.json)
    </button>
  );
}
