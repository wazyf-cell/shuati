import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, RefreshCw, Download, X, ArrowLeft, Settings as SettingsIcon, Github, BookOpen } from 'lucide-react';
import { useConfigStore, useToastStore } from '../../store';
import { APP_VERSION } from '../../version';
import { storage } from '../../utils/storage';
import { ConfirmDialog } from '../shared/ConfirmDialog';
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

// 硬编码兜底（网页版 fetch 被 CORS 拦截时使用）
const FALLBACK_CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.8',
    items: [
      '设置页新增「使用说明」弹窗',
      'APK 版本化命名（app-1.0.8.apk）',
      '设置页「下载安卓版/电脑版」按钮',
      '返回按钮保留刷题状态，不再回配置页',
    ],
  },
  {
    version: '1.0.7',
    items: [
      'AI 提示词模板系统（3模式 × 3模板，可编辑名称和内容）',
      '底部导航栏常驻（已答数、快捷键提示、上/下一题）',
      '刷题/Review 导航栏滚动条 + 高度适配',
      'Review 支持 Flag 标记同步收藏',
      '快捷键增强（A/D、Space、数字键、F 标记）',
      '清空所有数据（设置页一键恢复出厂状态）',
      '清空标记拆分（错题标记 / 已刷标记分开清理）',
      'AI 缓存清空加确认弹窗',
      '页面缓存 Bug 修复（切换刷题模式不串数据）',
      '多题库滑块上限修复',
      '错题本/收藏题库长文本不截断',
    ],
  },
  {
    version: '1.0.6',
    items: [
      '简答大题导入支持多行选项',
      '完形/阅读/七选五/选词填空导入示例',
      '刷题题目和选项支持换行显示',
      '导入格式规范增加 AI 格式提示',
      'CLAUDE.md 发布流程规范化',
    ],
  },
  {
    version: '1.0.5',
    items: [
      '导航栏新增返回按钮（支持历史回溯）',
      '刷题状态持久化（切换页面不丢失）',
      '简答大题编辑左右分栏+可拖拽分割线',
      '简答题导入多行内容支持',
      '简答题 AI 解析包含小题',
      '清理死代码（旧解析器/AIConfigModal）',
      'localStorage 写入保护',
      'clearAll 清理 AI 缓存',
    ],
  },
  {
    version: '1.0.4',
    items: [
      '收藏题库刷题标题独立、标记预加载',
      '刷题查看正确答案自动显示题目解析',
      'Review 每题显示题目解析',
      'AI 解析自动保存到题库',
      'AI 解析缓存标识📋已缓存',
      '题目编辑解析框自适应高度',
      '更新日志自动同步 version.json',
    ],
  },
  {
    version: '1.0.3',
    items: ['修复版本号不统一问题'],
  },
  {
    version: '1.0.2',
    items: [
      '新增收藏题库（Flag 标记自动收藏，按题库分组查看，支持 AI 解析）',
      '新增自动加入错题本开关（刷题设置中可关闭）',
      '新增题目编辑 AI 生成解析',
      '新增题库清空错题标记功能',
      'AI 配置前往官网自动打开系统浏览器',
      '收藏题库与错题本 UI 统一',
      '优化导入弹窗居中显示',
    ],
  },
  {
    version: '1.0.1',
    items: [
      '新增程序内自动更新',
      '新增 Windows 无感更新',
      '新增 GitHub 更新源',
      '优化设置页面',
      '修复 AI 平台配置编译错误',
      '修复更新 URL 指向 Vercel',
      '修复 .gitignore 合并冲突',
      '优化构建产物目录',
    ],
  },
  {
    version: '0.1.0',
    items: [
      '新增 AI 多平台配置',
      '新增 AI 解析结果缓存',
      '新增刷题计时模式',
      '新增多题库联合刷题',
      '新增错题本分组浏览与 AI 解析',
      '新增练习统计',
      '新增导入/导出数据',
      '修复多项 Bug',
    ],
  },
];
interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { darkMode, toggleDarkMode } = useConfigStore();
  const { addToast } = useToastStore();
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const [noUpdate, setNoUpdate] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [autoCheckDone, setAutoCheckDone] = useState(false);
  const [manualCheckDone, setManualCheckDone] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>(FALLBACK_CHANGELOG);

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
          // Tauri：也不覆盖本地 changelog，远程 notes 仅用于弹窗
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
          // 网页版：只查版本，不用远程 notes
        }
      } catch (e: any) {
        setNetworkError(true);
        setErrorDetail(e instanceof Error ? e.message : String(e || ''));
        setChangelog(FALLBACK_CHANGELOG);
      }
      setAutoCheckDone(true);
    };
    check();
  }, [autoCheckDone, isTauri, manualCheckDone]);

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
                  onClick={() => openUrl(isAndroid ? 'https://raw.githubusercontent.com/wazyf-cell/shuati/main/gitee-update/app-debug.apk' : 'https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/shuati.exe')}
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
              开源项目 · 反馈与建议请联系开发者
            </p>
            <p className="pt-2 border-t border-surface-200 dark:border-surface-700">
              {isAndroid ? (
                <button
                  onClick={() => openUrl('https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/shuati.exe')}
                  className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-600 font-bold transition-colors"
                >
                  <Download className="h-4 w-4" />
                  下载电脑版
                </button>
              ) : (
                <button
                  onClick={() => openUrl(`https://raw.githubusercontent.com/wazyf-cell/shuati/main/gitee-update/app-${APP_VERSION}.apk`)}
                  className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-600 font-bold transition-colors"
                >
                  <Download className="h-4 w-4" />
                  下载安卓版（推荐平板使用）
                </button>
              )}
            </p>
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
