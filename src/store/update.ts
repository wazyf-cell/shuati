import { create } from 'zustand';
import { APP_VERSION } from '../version';
import { compareVersions, fetchLatestRelease, type LatestRelease } from '../utils/githubRelease';

interface UpdateState {
  latest: LatestRelease | null;
  loading: boolean;
  error: string;
  checkedAt: number;
  fetchLatest: (force?: boolean) => Promise<LatestRelease | null>;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  latest: null,
  loading: false,
  error: '',
  checkedAt: 0,
  fetchLatest: async (force = false) => {
    const { latest, loading, checkedAt } = get();
    if (loading) return latest;
    if (!force && latest && Date.now() - checkedAt < 60_000) return latest;
    set({ loading: true, error: '' });
    try {
      const release = await fetchLatestRelease();
      set({ latest: release, loading: false, checkedAt: Date.now() });
      return release;
    } catch (e: any) {
      set({
        latest: null,
        loading: false,
        error: e?.message || String(e || '检查更新失败'),
        checkedAt: Date.now(),
      });
      return null;
    }
  },
}));

export function isNewerRelease(latest: LatestRelease | null): boolean {
  return !!latest && compareVersions(latest.version, APP_VERSION) > 0;
}
