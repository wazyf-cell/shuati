import { useMemo, useState } from 'react';
import { Search, Plus, BookOpen, Layers, Flag, X } from 'lucide-react';
import { useBankStore, useConfigStore } from '../../store';
import { BankCard } from './BankCard';
import { BankSelectModal } from './BankSelectModal';
import { QuestionBank } from '../../types';

interface DashboardProps {
  onSelectBank: (bankId: string) => void;
  onNavigate: (page: string) => void;
  onMultiBankPractice?: (bankIds: string[]) => void;
}

function SubjectSelect({ value, onChange, allSubjects }: { value: string; onChange: (v: string) => void; allSubjects: string[] }) {
  return (
    <div className="relative">
      <select
        value={allSubjects.includes(value) ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none w-full pr-8"
      >
        <option value="">不分类</option>
        {allSubjects.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        value={!allSubjects.includes(value) ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="或输入新分类名称..."
        className="input mt-2 text-sm"
      />
    </div>
  );
}

export function Dashboard({ onSelectBank, onNavigate, onMultiBankPractice }: DashboardProps) {
  const { banks, addBank, deleteBank, updateBank } = useBankStore();
  const { favorites } = useConfigStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewBank, setShowNewBank] = useState(false);
  const [showMultiBankModal, setShowMultiBankModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [renamingSubject, setRenamingSubject] = useState<string | null>(null);
  const [renameSubjectInput, setRenameSubjectInput] = useState('');

  const allSubjects = useMemo(() => {
    const subs = new Set<string>();
    banks.forEach(b => { if (b.subject) subs.add(b.subject); });
    return Array.from(subs).sort();
  }, [banks]);

  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter((b) =>
      b.name.toLowerCase().includes(term) ||
      (b.subject && b.subject.toLowerCase().includes(term))
    );
  }, [banks, searchTerm]);

  const subjectGroups = useMemo(() => {
    const groups = new Map<string, typeof banks>();
    const uncategorized: typeof banks = [];
    for (const bank of filteredBanks) {
      if (bank.subject) {
        const list = groups.get(bank.subject) || [];
        list.push(bank);
        groups.set(bank.subject, list);
      } else {
        uncategorized.push(bank);
      }
    }
    const sorted = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    if (uncategorized.length > 0) {
      sorted.push(['未分类', uncategorized]);
    }
    return sorted;
  }, [filteredBanks]);

  const handleAddBank = () => {
    if (!newName.trim()) return;
    addBank(newName.trim(), newSubject.trim() || undefined);
    setNewName('');
    setNewSubject('');
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

            <button
              onClick={() => onNavigate('favorite')}
              className="card p-5 text-left hover:shadow-sm transition-all duration-200 group cursor-pointer border-2 border-transparent hover:border-amber-300 dark:hover:border-amber-600"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Flag className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">收藏题库</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-300 mt-1">
                    {favorites.length > 0 ? `${favorites.length} 道已收藏题目` : '标记题目自动收藏'}
                  </p>
                </div>
                <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</span>
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
        <div className="space-y-8">
          {subjectGroups.map(([subject, banks]) => (
            <div key={subject}>
              <h3 className="text-lg font-display font-bold text-surface-600 dark:text-surface-300 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent-500" />
                {renamingSubject === subject ? (
                  <span className="flex items-center gap-2">
                    <input
                      value={renameSubjectInput}
                      onChange={(e) => setRenameSubjectInput(e.target.value)}
                      className="input text-sm py-1 px-2 w-40"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && renameSubjectInput.trim()) {
                          banks.forEach(b => updateBank(b.id, b.name, renameSubjectInput.trim()));
                          setRenamingSubject(null);
                        }
                        if (e.key === 'Escape') setRenamingSubject(null);
                      }}
                    />
                    <button
                      onClick={() => {
                        if (renameSubjectInput.trim()) {
                          banks.forEach(b => updateBank(b.id, b.name, renameSubjectInput.trim()));
                          setRenamingSubject(null);
                        }
                      }}
                      className="btn-primary text-xs py-1 px-2"
                    >
                      保存
                    </button>
                    <button onClick={() => setRenamingSubject(null)} className="btn-ghost text-xs py-1 px-2">取消</button>
                  </span>
                ) : (
                  <span
                    className={subject === '未分类' ? '' : 'cursor-pointer hover:text-accent-400 transition-colors'}
                    onClick={() => {
                      if (subject === '未分类') return;
                      setRenamingSubject(subject);
                      setRenameSubjectInput(subject);
                    }}
                    title={subject === '未分类' ? '' : '点击重命名学科'}
                  >
                    {subject}
                  </span>
                )}
                <span className="text-sm font-normal text-surface-400">
                  ({banks.length} 题库 · {banks.reduce((s, b) => s + b.questions.length, 0)} 题)
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {banks.map((bank, index) => (
                  <div
                    key={bank.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <BankCard
                      bank={bank}
                      onDelete={() => handleDelete(bank.id)}
                      onSelect={() => onSelectBank(bank.id)}
                      onEdit={() => {
                        setEditingBank(bank);
                        setEditName(bank.name);
                        setEditSubject(bank.subject || '');
                      }}
                    />
                  </div>
                ))}
              </div>
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
            <label className="text-xs font-bold text-surface-500 dark:text-surface-400 mb-1.5 block">学科分类</label>
            <SubjectSelect value={newSubject} onChange={setNewSubject} allSubjects={allSubjects} />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setShowNewBank(false); setNewSubject(''); }} className="btn-ghost">取消</button>
              <button onClick={handleAddBank} className="btn-primary">创建</button>
            </div>
          </div>
        </div>
      )}

      {editingBank && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditingBank(null)}>
          <div className="card p-6 w-full max-w-md mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">编辑题库</h3>
              <button onClick={() => setEditingBank(null)} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="题库名称..."
              className="input mb-4"
            />
            <label className="text-xs font-bold text-surface-500 dark:text-surface-400 mb-1.5 block">学科分类</label>
            <SubjectSelect value={editSubject} onChange={setEditSubject} allSubjects={allSubjects} />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setEditingBank(null)} className="btn-ghost">取消</button>
              <button
                onClick={() => {
                  if (!editName.trim()) return;
                  updateBank(editingBank.id, editName.trim(), editSubject.trim() || undefined);
                  setEditingBank(null);
                }}
                className="btn-primary"
              >
                保存
              </button>
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