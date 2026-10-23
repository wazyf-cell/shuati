import { useEffect, useState } from 'react';
import { useConfigStore, usePracticeStore } from './store';
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
import { UpdateDialog } from './components/Update/UpdateDialog';
import './index.css';
import { isNewerRelease, useUpdateStore } from './store';

type Page = 'dashboard' | 'bank' | 'practice' | 'wrong' | 'statistics' | 'ai' | 'settings' | 'favorite';

function App() {
  const { darkMode } = useConfigStore();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [presetQuestionIds, setPresetQuestionIds] = useState<string[] | null>(null);
  const [practiceMode, setPracticeMode] = useState<'normal' | 'wrong-review' | 'favorite'>('normal');

  // 导航历史栈（最多 5 条）
  const MAX_HISTORY = 5;
  const [navHistory, setNavHistory] = useState<Page[]>(['dashboard']);

  const navigateWithHistory = (page: Page) => {
    setNavHistory((prev) => {
      if (prev[prev.length - 1] === page) return prev; // 同一页不重复
      const next = [...prev, page];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setCurrentPage(page);
  };

  const handleNavBack = () => {
    setNavHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      setCurrentPage(next[next.length - 1]);
      return next;
    });
  };

  const { latest, fetchLatest } = useUpdateStore();
  const [showUpdate, setShowUpdate] = useState(false);

  // 启动时检查 GitHub 最新 Release；每个新版本只自动提示一次
  useEffect(() => {
    let cancelled = false;
    fetchLatest().then((release) => {
      if (cancelled || !release || !isNewerRelease(release)) return;
      if (localStorage.getItem('quiz_update_seen_version') !== release.version) {
        setShowUpdate(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchLatest]);

  const markUpdateSeen = () => {
    if (latest) localStorage.setItem('quiz_update_seen_version', latest.version);
    setShowUpdate(false);
  };

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
    navigateWithHistory('bank');
  };

  const handleStartPractice = (bankId: string) => {
    usePracticeStore.getState().resetPractice();
    setSelectedBankId(bankId);
    setSelectedBankIds([bankId]);
    navigateWithHistory('practice');
  };

  const handleMultiBankPractice = (bankIds: string[]) => {
    usePracticeStore.getState().resetPractice();
    setSelectedBankIds(bankIds);
    navigateWithHistory('practice');
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
    setSelectedBankId(null);
    setPresetQuestionIds(null);
    setPracticeMode('normal');
    setNavHistory(['dashboard']);
  };

  const handleWrongReview = (questionIds: string[], bankId: string) => {
    usePracticeStore.getState().resetPractice();
    setSelectedBankId(bankId);
    setPresetQuestionIds(questionIds);
    setPracticeMode('wrong-review');
    navigateWithHistory('practice');
  };

  const handleFavoritePractice = (questionIds: string[], bankId: string) => {
    usePracticeStore.getState().resetPractice();
    setSelectedBankId(bankId);
    setPresetQuestionIds(questionIds);
    setPracticeMode('favorite');
    navigateWithHistory('practice');
  };

  const handleNavigate = (page: string) => {
    navigateWithHistory(page as Page);
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
        return <FavoriteBank onBack={handleBack} onStartPractice={handleFavoritePractice} />;
      default:
        return <Dashboard onSelectBank={handleSelectBank} onNavigate={handleNavigate} onMultiBankPractice={handleMultiBankPractice} />;
    }
  };

  return (
    <div className="min-h-screen">
      <ToastContainer />

      {showUpdate && latest && (
        <UpdateDialog release={latest} onClose={markUpdateSeen} onLater={markUpdateSeen} />
      )}

      <Header onNavigate={handleNavigate} canBack={navHistory.length > 1} onNavBack={handleNavBack} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;