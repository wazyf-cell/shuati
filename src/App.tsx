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
import { ToastContainer } from './components/Toast/ToastContainer';
import './index.css';

type Page = 'dashboard' | 'bank' | 'practice' | 'wrong' | 'statistics' | 'ai' | 'settings';

function App() {
  const { darkMode } = useConfigStore();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [presetQuestionIds, setPresetQuestionIds] = useState<string[] | null>(null);
  const [practiceMode, setPracticeMode] = useState<'normal' | 'wrong-review'>('normal');

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
      default:
        return <Dashboard onSelectBank={handleSelectBank} onNavigate={handleNavigate} onMultiBankPractice={handleMultiBankPractice} />;
    }
  };

  return (
    <div className="min-h-screen">
      <ToastContainer />
      <Header onNavigate={handleNavigate} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;