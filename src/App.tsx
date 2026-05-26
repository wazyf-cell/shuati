import { useEffect, useState } from 'react';
import { useConfigStore } from './store';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard';
import { BankDetail } from './components/Bank/BankDetail';
import { Practice } from './components/Practice';
import { WrongBook } from './components/WrongBook';
import { Statistics } from './components/Statistics';
import { AIConfigPage } from './components/AI/AIConfigPage';
import { Settings } from './components/Settings';
import { FavoriteBank } from './components/FavoriteBank';
import { ToastContainer } from './components/Toast/ToastContainer';
import { Download, X } from 'lucide-react';
import './index.css';

const APP_VERSION = '1.0.2';

type Page = 'dashboard' | 'bank' | 'practice' | 'wrong' | 'statistics' | 'ai' | 'settings' | 'favorite';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  apkDownloadUrl?: string;
  notes: string;
}

function App() {
  const { darkMode } = useConfigStore();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [presetQuestionIds, setPresetQuestionIds] = useState<string[] | null>(null);
  const [practiceMode, setPracticeMode] = useState<'normal' | 'wrong-review'>('normal');

  // 全局自动更新检测
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
  const isAndroid = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

  // App 启动后自动检测更新（仅桌面端，Android 跳过）
  useEffect(() => {
    if (autoChecked) return;
    const check = async () => {
      try {
        const UPDATE_URL = 'https://gitee.com/zhong-yongfu/shuati/raw/master/gitee-update/version.json';
        let data: UpdateInfo;

        if (isTauri) {
          const { invoke } = await import('@tauri-apps/api/core');
          const text = await invoke<string>('check_update_v2');
          data = JSON.parse(text);
        } else {
          const res = await fetch(UPDATE_URL, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) return;
          data = await res.json();
        }

        if (data.version && data.version !== APP_VERSION) {
          setUpdateInfo(data);
          if (!popupDismissed) {
            setShowUpdatePopup(true);
          }
        }
      } catch {
        // 静默失败 — app 仍正常使用
      }
      setAutoChecked(true);
    };
    check();
  }, [autoChecked, isTauri, popupDismissed]);

  const handlePopupDownload = async () => {
    if (!updateInfo) return;
    const url = isAndroid && updateInfo.apkDownloadUrl
      ? updateInfo.apkDownloadUrl
      : updateInfo.downloadUrl;
    if (url) {
      if (isTauri) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('open_url', { url });
        } catch {
          window.open(url, '_blank');
        }
      } else {
        window.open(url, '_blank');
      }
    }
    setShowUpdatePopup(false);
    setPopupDismissed(true);
  };

  const downloadLabel = isAndroid ? '下载 APK' : '下载更新';

  // 挂载后隐藏启动屏
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('fade-out');
      const timer = setTimeout(() => splash.remove(), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSelectBank = (bankId: string) => {
    setSelectedBankId(bankId);
    setCurrentPage('bank');
  };

  const handleStartPractice = (bankId: string) => {
    setSelectedBankId(bankId);
    setSelectedBankIds([bankId]);
    setCurrentPage('practice');
  };

  const handleMultiBankPractice = (bankIds: string[]) => {
    setSelectedBankIds(bankIds);
    setCurrentPage('practice');
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
    setSelectedBankId(null);
    setPresetQuestionIds(null);
    setPracticeMode('normal');
  };

  const handleWrongReview = (questionIds: string[], bankId: string) => {
    setSelectedBankId(bankId);
    setPresetQuestionIds(questionIds);
    setPracticeMode('wrong-review');
    setCurrentPage('practice');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'bank':
        return selectedBankId ? (
          <BankDetail
            bankId={selectedBankId}
            onBack={handleBack}
            onStartPractice={handleStartPractice}
          />
        ) : null;
      case 'practice':
        return (selectedBankId || selectedBankIds.length > 0 || presetQuestionIds) ? (
          <Practice
            bankId={selectedBankId || undefined}
            bankIds={selectedBankIds.length > 0 ? selectedBankIds : undefined}
            presetQuestionIds={presetQuestionIds || undefined}
            mode={practiceMode}
            onBack={handleBack}
          />
        ) : null;
      case 'wrong':
        return <WrongBook onBack={handleBack} onWrongReview={handleWrongReview} />;
      case 'statistics':
        return <Statistics onBack={handleBack} />;
      case 'ai':
        return <AIConfigPage />;
      case 'settings':
        return <Settings onBack={handleBack} />;
      case 'favorite':
        return <FavoriteBank onBack={handleBack} onStartPractice={handleWrongReview} />;
      default:
        return <Dashboard onSelectBank={handleSelectBank} onNavigate={handleNavigate} onMultiBankPractice={handleMultiBankPractice} />;
    }
  };

  return (
    <div className="min-h-screen">
      <ToastContainer />

      {/* 全局更新弹窗 */}
      {showUpdatePopup && updateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setShowUpdatePopup(false); setPopupDismissed(true); }}>
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
              <button onClick={() => { setShowUpdatePopup(false); setPopupDismissed(true); }} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>
            <div className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl mb-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
                {updateInfo.notes}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePopupDownload} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                {downloadLabel}
              </button>
              <button onClick={() => { setShowUpdatePopup(false); setPopupDismissed(true); }} className="btn-ghost flex-1">暂不更新</button>
            </div>
          </div>
        </div>
      )}

      <Header onNavigate={handleNavigate} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;