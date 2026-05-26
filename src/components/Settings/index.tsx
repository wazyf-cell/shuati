import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, RefreshCw, Download, X, ArrowLeft, Settings as SettingsIcon, Github } from 'lucide-react';
import { useConfigStore, useToastStore } from '../../store';

const APP_VERSION = '1.0.1';
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

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.1',
    items: [
      '新增程序内自动更新：点击自动更新后后台下载，自动替换 exe 并重启',
      '新增 Windows 无感更新：下载 → 替换 exe → 自动重启，无需手动操作',
      '新增 Gitee 更新源：国内直连，不需要梯子',
      '优化设置页面：深色模式移入设置，新增版本检测和手动下载链接',
      '修复 AI 平台配置缺少 website 字段导致编译错误',
      '修复更新 URL 指向 Vercel 导致国内网络错误',
      '修复 .gitignore 合并冲突导致构建产物无法推送',
      '修复多题库按题型设置题目数量时题型顺序重复显示',
      '优化构建产物目录：versel-update → gitee-update',
    ],
  },
  {
    version: '0.1.0',
    items: [
      '新增 AI 多平台配置（硅基流动/OpenAI/DeepSeek/Azure/Google/Claude/自定义）',
      '新增 AI 配置测试连接与询问模型功能',
      '新增 AI 解析结果缓存，同一题目不重复消耗 Token',
      '新增刷题计时模式（正计时/倒计时）',
      '新增刷题时及错题重刷时查看正确答案功能',
      '新增「排除已刷题目」选项',
      '新增随机选项顺序功能',
      '新增多题库联合刷题',
      '新增错题本按时间/按题库分组浏览',
      '新增错题本题目默认折叠，点击展开',
      '新增错题本 AI 解析',
      '新增错题本搜索与题型筛选',
      '新增练习统计单题库删除',
      '新增按题型设置题目数量（单题库/多题库）',
      '新增题型分组导航显示',
      '新增 Review 页面「你的答案是」标注',
      '新增一键生成全部错题 AI 解析',
      '新增导入/导出数据（含 AI 配置）',
      '新增重置 AI 设置按钮',
      '新增版本自检更新功能',
      '优化模型输入框：下拉推荐 + 手动输入',
      '优化 Review 导航改为三列网格',
      '优化导航栏按钮颜色统一',
      '优化导入/导出图标互换',
      '修复导航 Key 警告',
      '修复 Review 题型分组显示错误',
      '修复错题重刷模式导航三列显示',
      '修复旧版数据兼容（自动补全缺失字段）',
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
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [autoCheckDone, setAutoCheckDone] = useState(false);

  // 启动时自动检查
  useEffect(() => {
    if (autoCheckDone) return;
    const check = async () => {
      try {
        const res = await fetch(UPDATE_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const data: UpdateInfo = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          setUpdateInfo(data);
          setShowUpdatePopup(true);
        }
      } catch {
        // 静默失败 — 不打扰用户
      }
      setAutoCheckDone(true);
    };
    check();
  }, [autoCheckDone]);

  const handleCheckUpdate = useCallback(async () => {
    setChecking(true);
    setChecked(true);
    setNoUpdate(false);
    setUpdateInfo(null);

    try {
      const res = await fetch(UPDATE_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        addToast('无法连接更新服务器', 'error');
        setChecking(false);
        return;
      }
      const data: UpdateInfo = await res.json();
      if (data.version && data.version !== APP_VERSION) {
        setUpdateInfo(data);
        setShowUpdatePopup(true);
      } else {
        setNoUpdate(true);
      }
    } catch {
      setChecked(false);
      setNoUpdate(false);
    }
    setChecking(false);
  }, [addToast]);

  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
  const isAndroid = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

  const handleDownload = useCallback(async () => {
    if (!updateInfo) return;

    // Tauri 桌面端：程序内自动更新
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        addToast('正在下载更新...', 'info');
        await invoke('download_update', { url: updateInfo.downloadUrl });
        addToast('下载完成，正在更新...', 'info');
        await invoke('apply_update');
        // 到这步 app 会自动退出并重启
      } catch (e: any) {
        addToast(`更新失败: ${e}`, 'error');
      }
      return;
    }

    // 非 Tauri（Web / Android）：浏览器下载
    const url = isAndroid && updateInfo.apkDownloadUrl
      ? updateInfo.apkDownloadUrl
      : updateInfo.downloadUrl;
    if (url) {
      window.open(url, '_blank');
    }
    setShowUpdatePopup(false);
  }, [updateInfo, isTauri, isAndroid, addToast]);

  return (
    <>
      {/* 更新通知弹窗 */}
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

          {!checked && !noUpdate && !updateInfo && (
            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-sm text-surface-500 dark:text-surface-400">
              检测失败？手动下载更新：
              <a
                href={isAndroid ? 'https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/app-debug.apk' : 'https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/shuati.exe'}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-accent-500 hover:underline"
              >
                点击下载
              </a>
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
              {CHANGELOG.map((ver) => (
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
