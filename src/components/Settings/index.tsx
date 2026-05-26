import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, RefreshCw, Download, X, ArrowLeft, Settings as SettingsIcon, Github } from 'lucide-react';
import { useConfigStore } from '../../store';
import { APP_VERSION } from '../../version';
const UPDATE_URL = 'https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/version.json';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  apkDownloadUrl?: string;
  notes: string;
}

interface ChangelogEntry {
  version: string;
  items: string[];
}

// 从 version.json 解析更新日志
function parseNotes(notes: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const blocks = notes.split(/\n\n(?=v\d)/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const version = lines[0].replace(/^v/, '').trim();
    const items = lines.slice(1).map((l) => l.trim()).filter(Boolean);
    if (version && items.length > 0) {
      entries.push({ version, items });
    }
  }
  return entries;
}

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { darkMode, toggleDarkMode } = useConfigStore();
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const [noUpdate, setNoUpdate] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [autoCheckDone, setAutoCheckDone] = useState(false);
  const [manualCheckDone, setManualCheckDone] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);

  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
  const isAndroid = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

  // 设置页打开后自动检查（失败则显示错误 + 手动下载链接）
  useEffect(() => {
    if (autoCheckDone || manualCheckDone) return;
    const check = async () => {
      try {
        if (isTauri) {
          const { invoke } = await import('@tauri-apps/api/core');
          const text = await invoke<string>('check_update_v2');
          const data: UpdateInfo = JSON.parse(text);
          setChecked(true);
          if (data.version && data.version !== APP_VERSION) {
            setUpdateInfo(data);
          } else {
            setNoUpdate(true);
          }
        } else {
          const res = await fetch(UPDATE_URL, { signal: AbortSignal.timeout(5000) });
          if (!res.ok) return;
          const data: UpdateInfo = await res.json();
          setChecked(true);
          if (data.version && data.version !== APP_VERSION) {
            setUpdateInfo(data);
          } else {
            setNoUpdate(true);
          }
        }
      } catch (e: any) {
        setNetworkError(true);
        setErrorDetail(e instanceof Error ? e.message : String(e || ''));
      }
      setAutoCheckDone(true);
    };
    check();
  }, [autoCheckDone, isTauri, manualCheckDone]);

  // 从 version.json 加载更新日志
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(UPDATE_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const data: UpdateInfo = await res.json();
        if (data.notes) {
          setChangelog(parseNotes(data.notes));
        }
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    setChecking(true);
    setChecked(true);
    setNoUpdate(false);
    setNetworkError(false);
    setErrorDetail('');
    setUpdateInfo(null);
    setManualCheckDone(true);

    try {
      let data: UpdateInfo;

      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        const text = await invoke<string>('check_update_v2');
        data = JSON.parse(text);
      } else {
        const res = await fetch(UPDATE_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) {
          setNetworkError(true);
          setErrorDetail(`服务器返回 HTTP ${res.status}`);
          setChecking(false);
          return;
        }
        data = await res.json();
      }

      if (data.version && data.version !== APP_VERSION) {
        setUpdateInfo(data);
        setShowUpdatePopup(true);
      } else {
        setNoUpdate(true);
      }
    } catch (e: any) {
      setNetworkError(true);
      setErrorDetail(e instanceof Error ? e.message : String(e || ''));
    }
    setChecking(false);
  }, [isTauri]);

  const openUrl = useCallback(async (url: string) => {
    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_url', { url });
    } else {
      window.open(url, '_blank');
    }
  }, [isTauri]);

  const handleDownload = useCallback(async () => {
    if (!updateInfo) return;
    const url = isAndroid && updateInfo.apkDownloadUrl
      ? updateInfo.apkDownloadUrl
      : updateInfo.downloadUrl;
    if (url) {
      openUrl(url);
    }
    setShowUpdatePopup(false);
  }, [updateInfo, isTauri, isAndroid, openUrl]);

  return (
    <>
      {/* 更新通知弹窗（手动检查触发） */}
      {showUpdatePopup && updateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowUpdatePopup(false)}>
          <div className="card p-6 w-full max-w-lg mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-xl flex items-center justify-center shadow-sm">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">发现新版本</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">v{APP_VERSION} → v{updateInfo.version}</p>
                </div>
              </div>
              <button onClick={() => setShowUpdatePopup(false)} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>
            <div className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl mb-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
                {updateInfo.notes}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownload} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                {isAndroid ? '下载 APK' : '下载更新'}
              </button>
              <button onClick={() => setShowUpdatePopup(false)} className="btn-ghost flex-1">暂不更新</button>
            </div>
          </div>
        </div>
      )}

      <div className="animate-scale-in">
        <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-xl flex items-center justify-center shadow-sm">
            <SettingsIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">设置与更新</h2>
            <p className="section-subtitle">外观、版本检测与更新日志</p>
          </div>
        </div>

        {/* 外观 */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 mb-4">外观</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5 text-amber-500" /> : <Sun className="h-5 w-5 text-amber-500" />}
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">深色模式</span>
            </div>
            <div
              onClick={() => toggleDarkMode()}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-accent-500' : 'bg-surface-400 dark:bg-surface-600'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>

        {/* 更新 */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 mb-4">更新</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-300 font-body">
                当前版本：<span className="font-bold text-accent-500">v{APP_VERSION}</span>
              </p>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={checking}
              className="btn-ghost flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? '检查中...' : '检查更新'}
            </button>
          </div>

          {networkError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700">
              <p className="text-base font-bold text-red-700 dark:text-red-300 mb-2">
                ⚠️ 无法检测最新版本
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                手动下载更新：
                <button
                  onClick={() => openUrl(isAndroid ? 'https://raw.githubusercontent.com/wazyf-cell/shuati/main/shuati-update/app-debug.apk' : 'https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/shuati.exe')}
                  className="ml-1 text-accent-600 dark:text-accent-400 font-bold underline hover:no-underline"
                >
                  点击下载 {isAndroid ? 'app-debug.apk' : 'shuati.exe'}
                </button>
              </p>
              {errorDetail && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 break-all font-mono">{errorDetail}</p>
              )}
            </div>
          )}

          {checked && noUpdate && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-sm text-emerald-700 dark:text-emerald-300">
              ✅ 已是最新版本
            </div>
          )}

          {checked && updateInfo && !showUpdatePopup && (
            <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700 text-sm text-accent-700 dark:text-accent-300">
              🆕 v{updateInfo.version} 可用！
              <button onClick={() => setShowUpdatePopup(true)} className="ml-2 underline hover:no-underline">查看详情</button>
            </div>
          )}

          {/* 更新日志 */}
          <div className="mt-4">
            <h4 className="text-sm font-bold text-surface-600 dark:text-surface-400 mb-3">更新日志</h4>
            <div className="max-h-64 overflow-y-auto pr-1">
              {changelog.map((ver) => (
                <div key={ver.version} className="mb-4 last:mb-0">
                  <h5 className="text-sm font-bold text-accent-500 mb-2">v{ver.version}</h5>
                  <div className="space-y-1">
                    {ver.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <span className="text-accent-500 mt-0.5 flex-shrink-0">·</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 mb-4">关于</h3>
          <div className="space-y-2 text-sm text-surface-500 dark:text-surface-400 font-body">
            <p>刷题助手 <span className="font-bold text-surface-700 dark:text-surface-300">v{APP_VERSION}</span></p>
            <p className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              开源项目 · 反馈与建议请联系开发者
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-3">
              基于 React + Tauri 构建 · 数据存储在本地
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
