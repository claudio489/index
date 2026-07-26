/**
 * Device Fingerprint - Generates a unique device identifier
 * Used to bind access codes to specific devices, preventing code sharing
 * All computation is client-side, no external services
 */

// Simple hash function combining multiple device characteristics
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Canvas fingerprint - subtle differences between GPUs/drivers
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // Draw complex shapes that render slightly differently per GPU
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#0070D3';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#0B1D2E';
    ctx.font = '16px "Inter", Arial, sans-serif';
    ctx.fillText('Dive Tools ' + String.fromCharCode(55357, 56843), 10, 30);

    // Draw some curves
    ctx.strokeStyle = '#FF7B2E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(160, 25, 15, 0, Math.PI * 2);
    ctx.stroke();

    return canvas.toDataURL('image/png').slice(-50); // Last 50 chars of base64
  } catch {
    return 'canvas-error';
  }
}

// WebGL fingerprint
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      return `${vendor}|${renderer}`;
    }
    return 'webgl-no-debug';
  } catch {
    return 'webgl-error';
  }
}

// Combine all device characteristics into a single fingerprint
export function getDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
    navigator.hardwareConcurrency?.toString() || '',
    new Date().getTimezoneOffset().toString(),
    !!navigator.platform ? navigator.platform : '',
    'deviceMemory' in navigator ? String((navigator as any).deviceMemory) : '',
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ];

  const combined = components.join('::');
  const hash = djb2(combined);
  return 'DEV-' + hash.toString(36).toUpperCase().padStart(10, '0');
}

// Store/retrieve device fingerprint
export function storeDeviceFingerprint(): string {
  const fp = getDeviceFingerprint();
  localStorage.setItem('index_device_fp', fp);
  return fp;
}

export function getStoredFingerprint(): string | null {
  return localStorage.getItem('index_device_fp');
}

// Check if current device matches stored fingerprint
export function isSameDevice(storedFp: string): boolean {
  const currentFp = getDeviceFingerprint();
  return currentFp === storedFp;
}

