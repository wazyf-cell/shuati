export const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

export const isAndroid =
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
