import { registerPlugin } from '@capacitor/core';

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export interface InstallResult {
  needsPermission?: boolean;
}

interface ShuatiUpdaterPlugin {
  download(options: {
    url: string;
    fileName: string;
    expectedSha256: string;
  }): Promise<{ path: string; sha256: string }>;
  cancel(): Promise<void>;
  install(options: { fileName: string; expectedSha256: string }): Promise<InstallResult>;
  openSettings(): Promise<void>;
  addListener(
    event: 'progress',
    listener: (event: UpdateProgress) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

export const ShuatiUpdater = registerPlugin<ShuatiUpdaterPlugin>('ShuatiUpdater');
