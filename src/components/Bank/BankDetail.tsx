import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, Plus, Play, Upload, Eraser, RotateCcw } from 'lucide-react';
import { useBankStore, useWrongStore, useToastStore } from '../../store';
import { storage } from '../../utils/storage';
import { Question, QuestionType } from '../../types';
import { QuestionForm } from './QuestionForm';
import { ImportModal } from './ImportModal';

interface BankDetailProps {
  bankId: string;
  onBack: () => void;
  onStartPractice: (bankId: string) => void;
}

export function BankDetail({ bankId, onBack, onStartPractice }: BankDetailProps) {
  const { banks, deleteQuestion } = useBankStore();
  const { clearBankWrongs, wrongQuestions } = useWrongStore();
  const { addToast } = useToastStore();
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [showImportModal, setShowImportModal] = useState(false);

  const bank = banks.find((b) => b.id === bankId);

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('确定删除这道题目吗？')) {
      deleteQuestion(bankId, questionId);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!bank) return [];
    let result = bank.questions;
    if (typeFilter !== 'all') {
      result = result.filter((q) => q.type === typeFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const numSearch = parseInt(term, 10);
      result = result.filter((q) => {
        if (q.content.toLowerCase().includes(term)) return true;
        const origIdx = bank.questions.indexOf(q);
        if (!isNaN(numSearch) && origIdx + 1 === numSearch) return true;
        return false;
      });
    }
    return result;
  }, [bank, typeFilter, searchTerm]);

  // Navigation active index tracking
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const navClickLockRef = useRef(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (navClickLockRef.current) return;
    const visibleEntries = entries.filter((e) => e.isIntersecting);
    if (visibleEntries.length > 0) {
      const topMost = visibleEntries.reduce((prev, curr) =>
        curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev
      );
      const qId = (topMost.target as HTMLElement).dataset.questionId;
      if (qId) {
        const idx = filteredQuestions.findIndex((q) => q.id === qId);
        if (idx !== -1) setActiveIndex(idx);
      }
    }
  }, [filteredQuestions]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0,
    });

    cardRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredQuestions, handleIntersection]);

  if (!bank) return null;

  const typeLabels: Record<QuestionType, string> = {
    single: '单选',
    multiple: '多选',
    judge: '判断',
    fill: '填空',
    short: '简答',
  };

  const typeBadges: Record<QuestionType, string> = {
    single: 'badge-single',
    multiple: 'badge-multiple',
    judge: 'badge-judge',
    fill: 'badge-fill',
    short: 'badge-short',
  };

  const typeColors: Record<QuestionType, string> = {
    single: 'indigo',
    multiple: 'emerald',
    judge: 'amber',
    fill: 'sky',
    short: 'rose',
  };

  return (
    <>
    <div className="animate-scale-in">
      <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        返回题库广场
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-500 dark:text-surface-100">
            {bank.name}
          </h1>
          <p className="section-subtitle">
            {bank.questions.length} 道题目
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setEditingQuestion(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            添加题目
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-outline flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4" />
            导入题目
          </button>
          <button
            onClick={() => { if (confirm('确定清空该题库所有错题标记？')) { clearBankWrongs(bankId); } }}
            className="btn-outline flex items-center gap-2 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="清除所有错题记录"
          >
            <Eraser className="h-4 w-4" />
            清空错题
          </button>
          <button
            onClick={() => {
              if (confirm('确定清空该题库所有已刷标记？题库题目不受影响。')) {
                const records = storage.getRecords();
                const questionIds = new Set(bank?.questions.map(q => q.id) || []);
                const filtered = records.filter(r => !r.questionIds?.some((qid: string) => questionIds.has(qid)));
                storage.setRecords(filtered);
                addToast('已刷标记已清空', 'success');
              }
            }}
            className="btn-outline flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
            title="清除练习记录（题目和错题不受影响）"
          >
            <RotateCcw className="h-4 w-4" />
            清空已刷
          </button>
          <button onClick={() => onStartPractice(bankId)} className="btn-secondary flex items-center gap-2 text-sm">
            <Play className="h-4 w-4" />
            刷题
          </button>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-300 dark:text-surface-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索题目内容或题号..."
              className="input pl-12"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'single', 'multiple', 'judge', 'fill', 'short'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  typeFilter === type
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-600'
                }`}
              >
                {type === 'all' ? '全部' : typeLabels[type]}
              </button>
            ))}
          </div>
          </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="text-center py-16 card">
          {bank.questions.length === 0 ? (
            <>
              <p className="section-subtitle text-lg mb-4">题库中还没有题目</p>
              <button onClick={() => { setEditingQuestion(null); setShowForm(true); }} className="btn-primary">
                <Plus className="inline h-5 w-5 mr-1" />
                添加第一道题目
              </button>
            </>
          ) : (
            <p className="section-subtitle text-lg">没有找到匹配的题目</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile: fixed below header / Desktop: 3-col grid sidebar */}
          <div className="fixed top-16 left-0 right-0 z-40 px-4 bg-surface-50 dark:bg-surface-950 shadow-sm lg:contents">
            <nav
              className="question-nav lg:sticky lg:top-24 lg:z-auto lg:bg-transparent lg:dark:bg-transparent lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:w-36 lg:flex-shrink-0 py-1 lg:py-2"
            >
            <div className="question-nav-scroll lg:contents">
              {filteredQuestions.map((q, i) => {
                const color = typeColors[q.type];
                const origNum = bank.questions.indexOf(q) + 1;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      const el = document.getElementById(`question-${q.id}`);
                      if (el) {
                        setActiveIndex(i);
                        navClickLockRef.current = true;
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setTimeout(() => { navClickLockRef.current = false; }, 600);
                      }
                    }}
                    className={`question-nav-item text-${color}-600 dark:text-${color}-400 bg-surface-100 dark:bg-surface-700 ${
                      activeIndex === i
                        ? `question-nav-item--active bg-${color}-500`
                        : ''
                    }`}
                    title={`第${origNum}题 - ${typeLabels[q.type]}`}
                  >
                    {origNum}
                  </button>
                );
              })}
            </div>
          </nav>
          </div>

          {/* Card list */}
          <div className="flex-1 min-w-0 space-y-4 pt-14 lg:pt-0">
            {filteredQuestions.map((question, idx) => {
              const color = typeColors[question.type];
              return (
                <div
                  key={question.id}
                  id={`question-${question.id}`}
                  data-question-id={question.id}
                  className="card p-5 animate-slide-up scroll-mt-24"
                  style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                  ref={(el) => { if (el) cardRefs.current.set(question.id, el); else cardRefs.current.delete(question.id); }}
                >
                  <div className="flex items-start gap-4">
                    {/* Sequence number */}
                    <span className={`text-3xl font-bold text-${color}-500 dark:text-${color}-400 flex-shrink-0 leading-none pt-0.5`}>
                      {bank.questions.indexOf(question) + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${typeBadges[question.type]} flex-shrink-0`}>
                          {typeLabels[question.type]}
                        </span>
                      </div>
                      <p className="font-body font-medium text-surface-500 dark:text-surface-100 mb-3 break-words">
                        {question.content}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {question.options.map((opt) => (
                          <span
                            key={opt.key}
                            className={`text-xs px-2 py-0.5 rounded-lg font-body break-words ${
                              question.correctAnswer.includes(opt.key)
                                ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-bold'
                                : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300'
                            }`}
                          >
                            {opt.key}. {opt.content}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center min-w-[3rem]">
                      {(() => {
                        const wq = wrongQuestions.find(w => w.questionId === question.id);
                        if (wq && wq.wrongCount > 0) {
                          return (
                            <span className="text-xs text-red-400 dark:text-red-400 font-bold">
                              ❌ {wq.wrongCount}次
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setEditingQuestion(question); setShowForm(true); }}
                        className="btn-ghost text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="btn-ghost text-sm text-red-400 hover:text-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <QuestionForm
          bankId={bankId}
          question={editingQuestion}
          onClose={() => { setShowForm(false); setEditingQuestion(null); }}
        />
      )}

    </div>

      {showImportModal && (
        <ImportModal
          bankId={bankId}
          onClose={() => setShowImportModal(false)}
          onImported={() => setShowImportModal(false)}
        />
      )}
    </>
  );
}