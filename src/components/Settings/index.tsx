import { useState, useEffect, useCallback } from 'react';
import {
  Moon,
  Sun,
  RefreshCw,
  Download,
  X,
  ArrowLeft,
  Settings as SettingsIcon,
  Github,
  BookOpen,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { useConfigStore, useToastStore, useUpdateStore } from '../../store';
import { isNewerRelease } from '../../store/update';
import { APP_VERSION } from '../../version';
import { storage } from '../../utils/storage';
import { isAndroid, isTauri } from '../../utils/platform';
import { parseReleaseNotes, pickAsset, RELEASES_PAGE } from '../../utils/githubRelease';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { UpdateDialog } from '../Update/UpdateDialog';
interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { darkMode, toggleDarkMode } = useConfigStore();
  const { addToast } = useToastStore();
  const { latest, loading, error, fetchLatest } = useUpdateStore();
  const hasUpdate = isNewerRelease(latest);
  const notes = latest ? parseReleaseNotes(latest.notes) : [];
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const openUrl = useCallback(async (url: string) => {
    if (isTauri) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_url', { url });
    } else {
      window.open(url, '_blank');
    }
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    const release = await fetchLatest(true);
    if (release && isNewerRelease(release)) {
      setShowUpdateDialog(true);
    }
  }, [fetchLatest]);

  const crossDownload = useCallback(async () => {
    if (!latest) {
      await openUrl(RELEASES_PAGE);
      return;
    }
    const asset = isAndroid
      ? pickAsset(latest, 'setup') || pickAsset(latest, 'portable')
      : pickAsset(latest, 'apk');
    await openUrl(asset?.url || latest.htmlUrl || RELEASES_PAGE);
  }, [latest, openUrl]);

  const openLogDir = useCallback(async () => {
    if (!isTauri) return;
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_log_dir');
  }, []);

  return (
    <>
      {showUpdateDialog && latest && (
        <UpdateDialog release={latest} onClose={() => setShowUpdateDialog(false)} />
      )}

      <div className="animate-scale-in">
        <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        <button
          onClick={() => setShowGuide(true)}
          className="btn-ghost mb-6 flex items-center gap-2 ml-auto"
        >
          <BookOpen className="h-4 w-4" />
          使用说明
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
            <p className="text-sm text-surface-600 dark:text-surface-300 font-body">
              当前版本：<span className="font-bold text-accent-500">v{APP_VERSION}</span>
            </p>
            <button
              onClick={handleCheckUpdate}
              disabled={loading}
              className="btn-ghost flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '检查中...' : '检查更新'}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700">
              <p className="text-base font-bold text-red-700 dark:text-red-300 mb-2">
                ⚠️ 无法检测最新版本
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 break-all">{error}</p>
              <button
                onClick={() => openUrl(RELEASES_PAGE)}
                className="mt-2 text-sm text-accent-600 dark:text-accent-400 font-bold underline hover:no-underline"
              >
                打开 Releases 手动下载
              </button>
            </div>
          )}

          {!error && latest && !hasUpdate && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-sm text-emerald-700 dark:text-emerald-300">
              ✅ 已是最新版本（v{latest.version}）
            </div>
          )}

          {!error && latest && hasUpdate && (
            <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700 text-sm text-accent-700 dark:text-accent-300">
              🆕 v{latest.version} 可用！
              <button
                onClick={() => setShowUpdateDialog(true)}
                className="ml-2 underline hover:no-underline"
              >
                查看详情
              </button>
            </div>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-surface-600 dark:text-surface-400">更新日志</h4>
              {latest?.publishedAt && (
                <span className="text-xs text-surface-400">
                  {new Date(latest.publishedAt).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>
            {loading && !latest && (
              <p className="text-sm text-surface-400">正在获取最新 Release...</p>
            )}
            {latest && (
              <div className="max-h-64 overflow-y-auto pr-1">
                <h5 className="text-sm font-bold text-accent-500 mb-2">v{latest.version}</h5>
                <div className="space-y-1">
                  {notes.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400"
                    >
                      <span className="text-accent-500 mt-0.5 flex-shrink-0">·</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => openUrl(latest.htmlUrl || RELEASES_PAGE)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-accent-500 hover:text-accent-600"
                >
                  查看 Release 页面
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
            {!loading && !latest && (
              <div className="text-sm text-surface-400">
                {error ? '无法获取在线更新日志。' : '暂无更新日志。'}
                <button
                  onClick={() => openUrl(RELEASES_PAGE)}
                  className="ml-1 text-accent-500 underline hover:no-underline"
                >
                  打开 Releases
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 数据管理 */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 mb-4">数据管理</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="w-full btn-outline flex items-center justify-between p-3 text-sm border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <span className="text-red-500 dark:text-red-400 font-bold">清空所有数据</span>
              <span className="text-red-400 text-xs">⚠ 不可恢复</span>
            </button>
          </div>
        </div>

        {/* 关于 */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 mb-4">关于</h3>
          <div className="space-y-2 text-sm text-surface-500 dark:text-surface-400 font-body">
            <p>刷题助手 <span className="font-bold text-surface-700 dark:text-surface-300">v{APP_VERSION}</span></p>
            <p className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              <button
                onClick={() => openUrl('https://github.com/wazyf-cell/shuati')}
                className="hover:text-accent-500 transition-colors"
              >
                开源项目 · GitHub
              </button>
            </p>
            <div className="pt-2 border-t border-surface-200 dark:border-surface-700 flex flex-wrap gap-4">
              <button
                onClick={crossDownload}
                className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-600 font-bold transition-colors"
              >
                <Download className="h-4 w-4" />
                {isAndroid ? '下载电脑版' : '下载安卓版（推荐平板使用）'}
              </button>
              {isTauri && (
                <button
                  onClick={openLogDir}
                  className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-accent-500 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  打开日志文件夹
                </button>
              )}
            </div>
            {latest && (
              <p className="text-xs text-surface-400 dark:text-surface-500">
                最新版本：v{latest.version}
                {latest.assets.length > 0 ? ` · ${latest.assets.length} 个下载文件` : ''}
              </p>
            )}
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-3">
              基于 React + Tauri 构建 · 数据存储在本地
            </p>
          </div>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowGuide(false)}>
          <div className="card p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">使用说明</h2>
              <button onClick={() => setShowGuide(false)} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>

            <div className="space-y-6 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">📚 题库管理</h3>
                <p>首页「题库广场」可创建、导入、管理题库。支持 TXT 和 Excel 两种导入格式，详细格式见「导入格式规范.md」。题库支持搜索、编辑、删除题目。</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">✏️ 题型支持</h3>
                <p>支持 5 种题型：单选、多选、判断（用 A/B 选项）、填空、简答。简答支持大题模式（完形填空、阅读理解、七选五、选词填空），含小题拆分和独立的答案判分。</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">🎯 刷题模式</h3>
                <p>支持单题库刷题、多题库联合刷题、错题重刷、收藏题库刷题。可配置题目数量、随机抽取、排除已刷、计时模式、随机选项顺序、AI 解析等。</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">⌨️ 快捷键</h3>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[['← / A', '上一题'], ['→ / D', '下一题'], ['Space', '提交答案'], ['F', '标记/取消'], ['1-9', '选对应选项']].map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-2">
                      <kbd className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-xs font-mono">{key}</kbd>
                      <span className="text-xs">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">🤖 AI 解析</h3>
                <p>AI 配置页支持 6 个平台（硅基流动、OpenAI、DeepSeek、Azure、Gemini、Claude）。刷题时可实时 AI 解析，Review 时可查看错题解析。支持 3 种模式 × 3 个可编辑提示词模板。解析结果本地缓存，不重复消耗 Token。</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">📊 错题本与统计</h3>
                <p>做错的题目自动记录到错题本，支持按题库、题型筛选。统计页面可视化展示正确率、各题型正确率、打卡日历等。收藏功能可标记重点题目，Review 界面也可标记同步。</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">💾 数据与安全</h3>
                <p>所有数据保存在浏览器本地（localStorage），不上传到任何服务器。桌面版额外支持 Tauri 本地运行。设置页可一键清空所有数据恢复出厂状态。</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">📱 多端使用</h3>
                <p>支持 Windows 桌面版（exe/安装包）、Android APK、网页版。数据互不相通，各端独立。设置页「关于」区可下载其他平台版本。</p>
              </div>

              <div>
                <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">⚠️ 杀毒误报说明</h3>
                <p className="text-amber-600 dark:text-amber-400">Windows Defender 可能误报本应用为病毒，这是因为没有购买数字签名证书（每年数千元），而非真正含有病毒。本应用完全开源、无后门、不联网上传数据。如遇拦截请选择「允许运行」或暂时关闭实时保护后安装。</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700 text-center">
              <button onClick={() => setShowGuide(false)} className="btn-primary text-sm">我知道了</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showClearAllConfirm}
        message="确定清空所有数据吗？题库、错题、练习记录、配置、AI 设置全部删除，不可恢复！"
        onConfirm={() => {
          storage.clearAll();
          localStorage.removeItem('ai_config');
          localStorage.removeItem('ai_explanations');
          addToast('所有数据已清空', 'success');
          setShowClearAllConfirm(false);
          setTimeout(() => window.location.reload(), 500);
        }}
        onCancel={() => setShowClearAllConfirm(false)}
      />
    </>
  );
}
