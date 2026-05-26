import { useMemo, useState } from 'react';
import { Search, Plus, BookOpen, Layers } from 'lucide-react';
import { useBankStore } from '../../store';
import { BankCard } from './BankCard';
import { BankSelectModal } from './BankSelectModal';

interface DashboardProps {
  onSelectBank: (bankId: string) => void;
  onNavigate: (page: string) => void;
  onMultiBankPractice?: (bankIds: string[]) => void;
}

export function Dashboard({ onSelectBank, onNavigate, onMultiBankPractice }: DashboardProps) {
  const { banks, addBank, deleteBank } = useBankStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewBank, setShowNewBank] = useState(false);
  const [showMultiBankModal, setShowMultiBankModal] = useState(false);
  const [newName, setNewName] = useState('');

  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(term));
  }, [banks, searchTerm]);

  const handleAddBank = () => {
    if (!newName.trim()) return;
    addBank(newName.trim());
    setNewName('');
    setShowNewBank(false);
  };

  const handleDelete = (bankId: string) => {
    deleteBank(bankId);
  };

  const totalQuestions = useMemo(
    () => banks.reduce((sum, b) => sum + b.questions.length, 0),
    [banks],
  );

  return (
    <div className="animate-scale-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100 mb-2">
          题库广场
        </h1>
        <p className="section-subtitle text-lg">
          {banks.length > 0
            ? `共 ${banks.length} 个题库，${totalQuestions} 道题目`
            : '创建你的第一个题库，开始刷题之旅！'}
        </p>
      </div>

      {banks.length > 0 && (
        <>
          <div className="flex gap-3 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索题库..."
                className="input pl-12"
              />
            </div>
            <button onClick={() => setShowNewBank(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Plus className="h-5 w-5" />
              新建题库
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => onNavigate('wrong')}
              className="card p-5 text-left hover:shadow-sm transition-all duration-200 group cursor-pointer border-2 border-transparent hover:border-accent-300 dark:hover:border-accent-600"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">错题本</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-300 mt-1">
                    查看错题、按题库分组重刷
                  </p>
                </div>
                <span className="text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
              </div>
            </button>

            {banks.length >= 2 && onMultiBankPractice && (
              <button
                onClick={() => setShowMultiBankModal(true)}
                className="card p-5 text-left hover:shadow-sm transition-all duration-200 group cursor-pointer border-2 border-transparent hover:border-accent-300 dark:hover:border-accent-600"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-400 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Layers className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">多题库刷题</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-300 mt-1">
                      同时选择多个题库联合练习
                    </p>
                  </div>
                  <span className="text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
                </div>
              </button>
            )}
          </div>
        </>
      )}

      {banks.length === 0 ? (
        <div className="text-center py-20 animate-bounce-in">
          <div className="w-24 h-24 bg-gradient-to-br from-accent-100 to-accent-100 dark:from-accent-900/30 dark:to-accent-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="text-4xl">📚</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-3">
            还没有题库哦
          </h2>
          <p className="section-subtitle mb-6 max-w-md mx-auto">
            创建题库，手动添加题目或从 Excel/TXT 文件导入题目，开始高效刷题！
          </p>
          <button onClick={() => setShowNewBank(true)} className="btn-primary">
            <Plus className="inline h-5 w-5 mr-1" />
            创建第一个题库
          </button>
        </div>
      ) : filteredBanks.length === 0 ? (
        <div className="text-center py-16">
          <p className="section-subtitle text-lg">没有找到匹配的题库</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanks.map((bank, index) => (
            <div
              key={bank.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <BankCard
                bank={bank}
                onDelete={() => handleDelete(bank.id)}
                onSelect={() => onSelectBank(bank.id)}
              />
            </div>
          ))}
        </div>
      )}

      {showNewBank && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNewBank(false)}>
          <div className="card p-6 w-full max-w-md mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100 mb-4">新建题库</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
              placeholder="输入题库名称..."
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewBank(false)} className="btn-ghost">取消</button>
              <button onClick={handleAddBank} className="btn-primary">创建</button>
            </div>
          </div>
        </div>
      )}

      {showMultiBankModal && (
        <BankSelectModal
          banks={banks}
          onConfirm={(bankIds) => {
            setShowMultiBankModal(false);
            onMultiBankPractice?.(bankIds);
          }}
          onClose={() => setShowMultiBankModal(false)}
        />
      )}
    </div>
  );
}