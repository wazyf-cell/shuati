import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { APP_VERSION } from '../../version';
import { isAndroid, isTauri } from '../../utils/platform';
import {
  checksumFor,
  fetchChecksums,
  parseReleaseNotes,
  pickAsset,
  RELEASES_PAGE,
  type LatestRelease,
} from '../../utils/githubRelease';
import { ShuatiUpdater } from '../../utils/shuatiUpdater';

type Phase =
  | 'idle'
  | 'preparing'
  | 'downloading'
  | 'ready'
  | 'launching'
  | 'permission'
  | 'done'
  | 'error';

type Mode = 'replace' | 'setup' | 'apk' | 'manual';

interface UpdateDialogProps {
  release: LatestRelease;
  onClose: () => void;
  onLater?: () => void;
}

interface Progress {
  downloaded: number;
  total: number;
  percent: number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UpdateDialog({ release, onClose, onLater }: UpdateDialogProps) {
  const notes = parseReleaseNotes(release.notes);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<Progress>({ downloaded: 0, total: 0, percent: 0 });
  const [error, setError] = useState('');
  const [downloadPath, setDownloadPath] = useState('');
  const [mode, setMode] = useState<Mode>('manual');
  const [apkFileName, setApkFileName] = useState('');
  const [apkSha, setApkSha] = useState('');
  const cancelledRef = useRef(false);
  const tauriUnlistenRef = useRef<null | (() => void)>(null);
  const androidListenerRef = useRef<null | { remove: () => Promise<void> }>(null);

  useEffect(() => {
    return () => {
      tauriUnlistenRef.current?.();
      androidListenerRef.current?.remove().catch(() => {});
      if (isTauri) {
        import('@tauri-apps/api/core').then(({ invoke }) => invoke('cancel_download').catch(() => {}));
      } else if (isAndroid) {
        ShuatiUpdater.cancel().catch(() => {});
      }
    };
  }, []);

  const openExternal = async (url: string) => {
    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_url', { url });
    } else {
      window.open(url, '_blank');
    }
  };

  const installApk = async (fileName: string, sha: string) => {
    setPhase('launching');
    try {
      const result = await ShuatiUpdater.install({ fileName, expectedSha256: sha });
      setPhase(result?.needsPermission ? 'permission' : 'done');
    } catch (e: any) {
      setError(e?.message || String(e || '安装失败'));
      setPhase('error');
    }
  };

  const startUpdate = async () => {
    setError('');
    cancelledRef.current = false;
    setProgress({ downloaded: 0, total: 0, percent: 0 });

    if (!isTauri && !isAndroid) {
      const asset =
        pickAsset(release, 'setup') || pickAsset(release, 'portable') || pickAsset(release, 'apk');
      await openExternal(asset?.url || release.htmlUrl);
      setPhase('done');
      return;
    }

    setPhase('preparing');
    try {
      const checksums = await fetchChecksums(release);
      if (cancelledRef.current) {
        setPhase('idle');
        return;
      }

      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        const canReplace = await invoke<boolean>('can_replace_exe');
        let nextMode: Mode = canReplace ? 'replace' : 'setup';
        let asset = canReplace ? pickAsset(release, 'portable') : pickAsset(release, 'setup');
        if (!asset) {
          nextMode = canReplace ? 'setup' : 'replace';
          asset = canReplace ? pickAsset(release, 'setup') : pickAsset(release, 'portable');
        }
        if (!asset) throw new Error('该 Release 没有可用的 Windows 安装文件');
        const sha = checksumFor(checksums, asset);
        if (!sha) throw new Error(`SHA256SUMS.txt 中没有 ${asset.name}`);

        setMode(nextMode);
        const { listen } = await import('@tauri-apps/api/event');
        const unlisten = await listen<Progress>('update-download-progress', (event) => {
          if (!cancelledRef.current) setProgress(event.payload);
        });
        tauriUnlistenRef.current = unlisten;
        setPhase('downloading');
        const path = await invoke<string>('download_asset', {
          url: asset.url,
          expectedSha256: sha,
          fileName: asset.name,
        });
        unlisten();
        tauriUnlistenRef.current = null;
        if (cancelledRef.current) return;
        setDownloadPath(path);
        setPhase('ready');
        return;
      }

      const asset = pickAsset(release, 'apk');
      if (!asset) throw new Error('该 Release 没有 APK');
      const sha = checksumFor(checksums, asset);
      if (!sha) throw new Error(`SHA256SUMS.txt 中没有 ${asset.name}`);
      const fileName = 'shuati-update.apk';
      setApkFileName(fileName);
      setApkSha(sha);

      const listener = await ShuatiUpdater.addListener('progress', (event) => {
        if (!cancelledRef.current) setProgress(event);
      });
      androidListenerRef.current = listener;
      setPhase('downloading');
      await ShuatiUpdater.download({ url: asset.url, fileName, expectedSha256: sha });
      await listener.remove();
      androidListenerRef.current = null;
      if (cancelledRef.current) return;
      setProgress((prev) => ({
        downloaded: prev.total || prev.downloaded,
        total: prev.total,
        percent: 100,
      }));
      await installApk(fileName, sha);
    } catch (e: any) {
      if (cancelledRef.current || /CANCELLED|已取消/i.test(String(e?.message || e))) {
        setPhase('idle');
        return;
      }
      setError(e?.message || String(e || '更新失败'));
      setPhase('error');
    }
  };

  const cancelDownload = async () => {
    cancelledRef.current = true;
    try {
      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('cancel_download');
      } else if (isAndroid) {
        await ShuatiUpdater.cancel();
      }
    } catch {
      // ignore
    }
    tauriUnlistenRef.current?.();
    tauriUnlistenRef.current = null;
    androidListenerRef.current?.remove().catch(() => {});
    androidListenerRef.current = null;
    setProgress({ downloaded: 0, total: 0, percent: 0 });
    setPhase('idle');
  };

  const applyAndRestart = async () => {
    setPhase('launching');
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('apply_update', { path: downloadPath, mode });
    } catch (e: any) {
      setError(e?.message || String(e || '启动安装程序失败'));
      setPhase('error');
    }
  };

  const close = async () => {
    if (phase === 'downloading' || phase === 'preparing') await cancelDownload();
    onClose();
  };

  const later = async () => {
    if (phase === 'downloading' || phase === 'preparing') await cancelDownload();
    (onLater || onClose)();
  };

  const percent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100))
      : Math.max(0, Math.min(100, progress.percent || 0));
  const published = release.publishedAt
    ? new Date(release.publishedAt).toLocaleDateString('zh-CN')
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={phase === 'downloading' || phase === 'preparing' ? undefined : close}
    >
      <div
        className="card p-6 w-full max-w-lg mx-4 animate-bounce-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-xl flex items-center justify-center shadow-sm">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">
                发现新版本
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                v{APP_VERSION} → v{release.version}
                {published ? ` · ${published}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="关闭"
          >
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>

        {notes.length > 0 && (
          <div className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl mb-4 max-h-48 overflow-y-auto">
            <div className="space-y-1">
              {notes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300"
                >
                  <span className="text-accent-500 mt-0.5 flex-shrink-0">·</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(phase === 'preparing' || phase === 'downloading') && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-surface-600 dark:text-surface-300 mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {phase === 'preparing' ? '正在准备...' : `下载中 ${percent}%`}
              </span>
              <span className="font-mono text-xs text-surface-400">
                {formatBytes(progress.downloaded)}
                {progress.total > 0 ? ` / ${formatBytes(progress.total)}` : ''}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-600 overflow-hidden">
              <div
                className="h-full bg-accent-500 transition-all duration-200"
                style={{ width: `${phase === 'preparing' ? 3 : percent}%` }}
              />
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={cancelDownload} className="btn-ghost text-sm">
                取消下载
              </button>
            </div>
          </div>
        )}

        {phase === 'ready' && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 mb-4">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              下载完成，SHA256 校验通过
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              当前程序会退出，然后{mode === 'setup' ? '启动安装程序' : '替换程序并自动重启'}。
            </p>
          </div>
        )}

        {phase === 'launching' && (
          <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700 mb-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent-500" />
            <span className="text-sm text-accent-700 dark:text-accent-300">
              正在启动安装程序，请稍候...
            </span>
          </div>
        )}

        {phase === 'permission' && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 mb-4">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              需要允许安装未知应用
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              请在系统设置里允许「刷题助手」安装应用，然后回来点“我已允许，重试”。
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 mb-4">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {isAndroid ? '已打开系统安装程序' : '已开始更新'}
            </p>
            {isAndroid && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                请按系统提示完成安装。安装完成后重新打开应用即可。
              </p>
            )}
          </div>
        )}

        {phase === 'error' && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 mb-4">
            <p className="text-sm font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              更新失败
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-all">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {phase === 'idle' && (
            <>
              <button onClick={startUpdate} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                {isAndroid ? '下载 APK 并安装' : isTauri ? '下载并更新' : '前往下载'}
              </button>
              <button onClick={later} className="btn-ghost flex-1">
                暂不更新
              </button>
            </>
          )}

          {phase === 'ready' && isTauri && (
            <>
              <button
                onClick={applyAndRestart}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {mode === 'setup' ? '立即运行安装程序' : '立即更新并重启'}
              </button>
              <button onClick={later} className="btn-ghost flex-1">
                稍后
              </button>
            </>
          )}

          {phase === 'permission' && (
            <>
              <button
                onClick={() => ShuatiUpdater.openSettings()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                打开设置
              </button>
              <button
                onClick={() => installApk(apkFileName, apkSha)}
                className="btn-ghost flex-1 flex items-center justify-center gap-2"
              >
                我已允许，重试
              </button>
            </>
          )}

          {phase === 'error' && (
            <>
              <button
                onClick={startUpdate}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </button>
              <button
                onClick={() => openExternal(release.htmlUrl || RELEASES_PAGE)}
                className="btn-ghost flex-1 flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                打开 Release
              </button>
            </>
          )}

          {(phase === 'done' || phase === 'launching') && (
            <button onClick={close} className="btn-ghost flex-1">
              关闭
            </button>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => openExternal(release.htmlUrl || RELEASES_PAGE)}
            className="text-xs text-surface-400 hover:text-accent-500 inline-flex items-center gap-1"
          >
            查看 Release 页面
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
