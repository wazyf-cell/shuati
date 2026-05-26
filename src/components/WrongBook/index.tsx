import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Trash2,
  Play,
  Search,
  Clock,
  BookOpen,
  CheckSquare,
  Square,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { AIExplanationCard } from '../AI/AIExplanationCard';
import { useWrongStore, useBankStore, useToastStore } from '../../store';
import { QuestionType, WrongQuestion, Question, QuestionBank } from '../../types';
import { ConfirmDialog } from '../shared/ConfirmDialog';

// ---- Props ----
interface WrongBookProps {
  onBack: () => void;
  onWrongReview: (questionIds: string[], bankId: string) => void;
}

// ---- Constants ----
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

const FILTER_TYPES = ['all', 'single', 'multiple', 'judge', 'fill', 'short'] as const;

// ---- Helpers ----
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function findQuestion(
  wrong: WrongQuestion,
  banks: QuestionBank[],
): { bank: QuestionBank; question: Question } | null {
  const bank = banks.find((b) => b.id === wrong.bankId);
  if (!bank) return null;
  const question = bank.questions.find((q) => q.id === wrong.questionId);
  if (!question) return null;
  return { bank, question };
}

// ---- Component ----
export function WrongBook({ onBack, onWrongReview }: WrongBookProps) {
  const { wrongQuestions, removeWrong, clearAll } = useWrongStore();
  const { banks } = useBankStore();
  const { addToast } = useToastStore();

  // -- View & filter state --
  const [viewMode, setViewMode] = useState<'time' | 'bank'>('time');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');

  // -- Selection state --
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // -- Collapse state --
  const [collapsedTimeKeys, setCollapsedTimeKeys] = useState<Set<string>>(new Set());
  const [collapsedBankKeys, setCollapsedBankKeys] = useState<Set<string>>(new Set());
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    wrongQuestions.forEach((w) => s.add(w.questionId));
    return s;
  });

  // 新增加的错题默认折叠
  const prevCountRef = useRef(wrongQuestions.length);
  const stableWrongIds = useMemo(() => wrongQuestions.map(w => w.questionId).join(','), [wrongQuestions]);
  useEffect(() => {
    if (wrongQuestions.length > prevCountRef.current) {
      setCollapsedQuestionIds((prev) => {
        const next = new Set(prev);
        wrongQuestions.forEach((w) => next.add(w.questionId));
        return next;
      });
    }
    prevCountRef.current = wrongQuestions.length;
  }, [stableWrongIds]);

  // -- Confirm dialog --
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ========================
  // Filter
  // ========================
  const filteredWrong = useMemo(() => {
    let result = wrongQuestions;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((w) => {
        const bank = banks.find((b) => b.id === w.bankId);
        const question = bank?.questions.find((q) => q.id === w.questionId);
        return question?.content.toLowerCase().includes(term) || false;
      });
    }

    if (typeFilter !== 'all') {
      result = result.filter((w) => {
        const bank = banks.find((b) => b.id === w.bankId);
        const question = bank?.questions.find((q) => q.id === w.questionId);
        return question?.type === typeFilter;
      });
    }

    return result;
  }, [wrongQuestions, searchTerm, typeFilter, banks]);

  // ========================
  // Time-grouped data
  // ========================
  type TimeBankSubgroup = { bankId: string; bankName: string; items: WrongQuestion[] };

  interface TimeGroup {
    timeKey: string;
    timestamp: number;
    subgroups: TimeBankSubgroup[];
  }

  const timeGroups = useMemo((): TimeGroup[] => {
    const map = new Map<string, TimeGroup>();

    filteredWrong.forEach((w) => {
      const rounded = Math.floor(w.lastWrongAt / 60000) * 60000;
      const timeKey = String(rounded);

      if (!map.has(timeKey)) {
        map.set(timeKey, { timeKey, timestamp: rounded, subgroups: [] });
      }

      const group = map.get(timeKey)!;
      let sub = group.subgroups.find((s) => s.bankId === w.bankId);
      if (!sub) {
        const bank = banks.find((b) => b.id === w.bankId);
        sub = { bankId: w.bankId, bankName: bank?.name || '未知题库', items: [] };
        group.subgroups.push(sub);
      }
      sub.items.push(w);
    });

    // Sort time groups descending, then sort bank subgroups within each
    return Array.from(map.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((g) => ({
        ...g,
        subgroups: g.subgroups.sort((a, b) => a.bankName.localeCompare(b.bankName)),
      }));
  }, [filteredWrong, banks]);

  // Total count per time group
  const timeGroupCounts = useMemo(() => {
    const result: Record<string, number> = {};
    timeGroups.forEach((g) => {
      result[g.timeKey] = g.subgroups.reduce((sum, s) => sum + s.items.length, 0);
    });
    return result;
  }, [timeGroups]);

  // ========================
  // Bank-grouped data
  // ========================
  interface BankGroup {
    bankId: string;
    bankName: string;
    items: WrongQuestion[];
  }

  const bankGroups = useMemo((): BankGroup[] => {
    const map = new Map<string, BankGroup>();

    filteredWrong.forEach((w) => {
      if (!map.has(w.bankId)) {
        const bank = banks.find((b) => b.id === w.bankId);
        map.set(w.bankId, { bankId: w.bankId, bankName: bank?.name || '未知题库', items: [] });
      }
      map.get(w.bankId)!.items.push(w);
    });

    // Sort items within each bank by lastWrongAt desc
    return Array.from(map.values())
      .sort((a, b) => a.bankName.localeCompare(b.bankName))
      .map((g) => ({
        ...g,
        items: [...g.items].sort((a, b) => b.lastWrongAt - a.lastWrongAt),
      }));
  }, [filteredWrong, banks]);

  // ========================
  // Toggle helpers
  // ========================
  const toggleTimeCollapse = (key: string) => {
    setCollapsedTimeKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleBankCollapse = (key: string) => {
    setCollapsedBankKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleQuestionCollapse = (qId: string) => {
    setCollapsedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const toggleSelect = (qId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredWrong.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWrong.map((w) => w.questionId)));
    }
  };

  // ========================
  // Actions
  // ========================
  const handleRemoveWrong = (qId: string) => {
    removeWrong(qId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
    addToast('已移出错题本', 'success');
  };

  const handleReviewOne = (qId: string, bankId: string) => {
    onWrongReview([qId], bankId);
  };

  const handleReviewSelected = () => {
    if (selectedIds.size === 0) {
      addToast('请先选择错题', 'warning');
      return;
    }
    const ids = Array.from(selectedIds);
    const firstWrong = wrongQuestions.find((w) => w.questionId === ids[0]);
    onWrongReview(ids, firstWrong?.bankId || '');
  };

  const handleReviewAll = () => {
    const ids = filteredWrong.map((w) => w.questionId);
    if (ids.length === 0) {
      addToast('没有可练习的错题', 'warning');
      return;
    }
    onWrongReview(ids, filteredWrong[0].bankId);
  };

  const handleClearAll = () => {
    setConfirmOpen(true);
  };

  const handleClearBank = (bankId: string) => {
    const items = wrongQuestions.filter((w) => w.bankId === bankId);
    items.forEach((w) => removeWrong(w.questionId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      items.forEach((w) => next.delete(w.questionId));
      return next;
    });
    addToast(`已清空该题库错题（${items.length} 道）`, 'info');
  };

  const confirmClearAll = () => {
    clearAll();
    setSelectedIds(new Set());
    setConfirmOpen(false);
    addToast('已清空所有错题', 'info');
  };

  // ========================
  // Render: wrong question card
  // ========================
  const renderWrongCard = (w: WrongQuestion, idx: number) => {
    const result = findQuestion(w, banks);
    if (!result) {
      return (
        <div key={w.questionId} className="card p-4 text-surface-400 text-sm">
          题目已不存在（ID: {w.questionId}）
        </div>
      );
    }
    const { bank: _bank, question } = result;
    const isSelected = selectedIds.has(w.questionId);
    const isWrongOption = (key: string) => w.userAnswers.includes(key);
    const isCorrectOption = (key: string) => question.correctAnswer.includes(key);
    const isExpanded = !collapsedQuestionIds.has(w.questionId);
    const userAnsStr = w.userAnswers.length > 0 ? w.userAnswers.join(', ') : '(未作答)';

    return (
      <div
        key={w.questionId}
        className="card p-4 animate-slide-up"
        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
      >
        {/* Summary row — always visible */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => toggleQuestionCollapse(w.questionId)}
        >
          {/* Checkbox */}
          <div onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleSelect(w.questionId)}
              className="flex-shrink-0 text-surface-400 hover:text-accent-500 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5 text-accent-500" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Expand/collapse icon */}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-surface-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-surface-400 flex-shrink-0" />
          )}

          {/* Type badge */}
          <span className={`badge ${typeBadges[question.type]}`}>
            {typeLabels[question.type]}
          </span>

          {/* Question preview */}
          <span className="flex-1 text-sm font-body truncate text-surface-800 dark:text-surface-200">
            {question.content}
          </span>

          {/* User answer summary */}
          <span className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block flex-shrink-0">
            你的: {userAnsStr}
          </span>

          {/* Wrong count */}
          <span className="text-xs text-rose-500 font-medium flex-shrink-0 whitespace-nowrap">
            ❌{w.wrongCount}
          </span>

          {/* Wrong time */}
          <span className="text-xs text-surface-400 flex-shrink-0 whitespace-nowrap hidden md:block">
            {formatTime(w.lastWrongAt)}
          </span>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-600 animate-slide-up">
            {/* 你的答案是 汇总行 */}
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-surface-500">你的答案是:</span>
              <span className="font-bold text-surface-800 dark:text-surface-200">{userAnsStr}</span>
              <span className="text-xs font-bold text-red-400">❌ 错误</span>
              <span className="text-xs text-surface-400">正确答案:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{question.correctAnswer.join(', ')}</span>
            </div>

            {/* Options grid */}
            {question.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {question.options.map((o) => {
                  let mark = '';
                  let extraClass = '';
                  if (isWrongOption(o.key) && isCorrectOption(o.key)) {
                    mark = ' ✅';
                    extraClass = 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20';
                  } else if (isWrongOption(o.key) && !isCorrectOption(o.key)) {
                    mark = ' ❌';
                    extraClass = 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/20';
                  } else if (!isWrongOption(o.key) && isCorrectOption(o.key)) {
                    mark = ' ✅';
                    extraClass = 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20';
                  }

                  return (
                    <div
                      key={o.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body text-surface-700 dark:text-surface-200 ${
                        extraClass || 'border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50'
                      }`}
                    >
                      <span className="font-bold text-accent-500">{o.key}.</span>
                      <span>{o.content}</span>
                      {mark && <span className="ml-auto flex-shrink-0">{mark}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fill / Short answer */}
            {(question.type === 'fill' || question.type === 'short') && (
              <div className="flex flex-wrap gap-3 mb-3 text-sm">
                <span className="text-rose-500 font-medium">
                  你的答案：{w.userAnswers.join(',')}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  正确答案：{question.correctAnswer.join('、')}
                </span>
              </div>
            )}

            {/* Analysis */}
            {question.analysis && (
              <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-3 mb-3">
                <p className="text-sm font-body text-surface-500 dark:text-surface-300">
                  <span className="font-semibold text-surface-700 dark:text-surface-200">解析：</span>
                  {question.analysis}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-600">
              <button
                onClick={() => handleReviewOne(w.questionId, w.bankId)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重刷此题
              </button>
              <button
                onClick={() => handleRemoveWrong(w.questionId)}
                className="btn-ghost text-xs py-1.5 px-3 text-rose-500 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                移除
              </button>
            </div>

            {/* AI 解析 */}
            <div className="mt-3">
              <AIExplanationCard
                question={question}
                userAnswer={w.userAnswers}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================
  // Render: time-grouped view
  // ========================
  const renderTimeView = () => (
    <div className="space-y-4">
      {timeGroups.map((timeGroup) => {
        const isTimeCollapsed = collapsedTimeKeys.has(timeGroup.timeKey);
        const totalCount = timeGroupCounts[timeGroup.timeKey] || 0;

        return (
          <div key={timeGroup.timeKey} className="card p-5">
            {/* Time group header */}
            <button
              onClick={() => toggleTimeCollapse(timeGroup.timeKey)}
              className="flex items-center gap-2 w-full text-left mb-2"
            >
              {isTimeCollapsed ? (
                <ChevronRight className="h-4 w-4 text-surface-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-surface-400 flex-shrink-0" />
              )}
              <Clock className="h-4 w-4 text-accent-500 flex-shrink-0" />
              <span className="font-display font-bold text-surface-700 dark:text-surface-200">
                {formatTime(timeGroup.timestamp)}
              </span>
              <span className="badge-accent badge text-xs">
                {totalCount} 题
              </span>
            </button>

            {!isTimeCollapsed && (
              <div className="space-y-3 mt-3 pl-6">
                {timeGroup.subgroups.map((sub) => {
                  const bankKey = `${timeGroup.timeKey}-${sub.bankId}`;
                  const isBankCollapsed = collapsedBankKeys.has(bankKey);

                  return (
                    <div key={bankKey}>
                      {/* Bank sub-group header */}
                      <button
                        onClick={() => toggleBankCollapse(bankKey)}
                        className="flex items-center gap-2 w-full text-left mb-2"
                      >
                        {isBankCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 text-surface-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-surface-400 flex-shrink-0" />
                        )}
                        <BookOpen className="h-3.5 w-3.5 text-surface-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-surface-600 dark:text-surface-300">
                          {sub.bankName}
                        </span>
                        <span className="text-xs text-surface-400">
                          ({sub.items.length} 题)
                        </span>
                      </button>

                      {!isBankCollapsed && (
                        <div className="space-y-3 pl-5">
                          {sub.items.map((w, idx) => renderWrongCard(w, idx))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ========================
  // Render: bank-grouped view
  // ========================
  const renderBankView = () => (
    <div className="space-y-4">
      {bankGroups.map((group) => {
        const isCollapsed = collapsedBankKeys.has(group.bankId);

        return (
          <div key={group.bankId} className="card p-5">
            {/* Bank group header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleBankCollapse(group.bankId)}
                className="flex items-center gap-2 text-left"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-surface-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-surface-400 flex-shrink-0" />
                )}
                <BookOpen className="h-4 w-4 text-accent-500 flex-shrink-0" />
                <span className="font-display font-bold text-surface-700 dark:text-surface-200">
                  {group.bankName}
                </span>
                <span className="badge-accent badge text-xs">
                  {group.items.length} 题
                </span>
              </button>

              <button
                onClick={() => handleClearBank(group.bankId)}
                className="btn-ghost text-xs text-rose-500 hover:text-rose-600 py-1 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                清空该题库
              </button>
            </div>

            {!isCollapsed && (
              <div className="space-y-3 mt-3">
                {group.items.map((w, idx) => renderWrongCard(w, idx))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ========================
  // Render: component
  // ========================
  return (
    <div className="animate-scale-in">
      {/* Back button */}
      <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        返回题库广场
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
            错题本
          </h1>
          <p className="section-subtitle">
            {wrongQuestions.length} 道错题
          </p>
        </div>
      </div>

      {/* ========================
          Toolbar: view toggle + batch operations
          ======================== */}
      <div className="card p-4 mb-6 space-y-3">
        {/* Row 1: view mode toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('time')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                viewMode === 'time'
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-1" />
              按时间
            </button>
            <button
              onClick={() => setViewMode('bank')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                viewMode === 'bank'
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300'
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-1" />
              按题库
            </button>
          </div>
        </div>

        {/* Row 2: search + type filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-300 dark:text-surface-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索错题..."
              className="input pl-12"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {FILTER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-2 rounded-xl font-bold text-xs transition-all ${
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

        {/* Row 3: batch operations */}
        {filteredWrong.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-600">
            <button
              onClick={toggleSelectAll}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {selectedIds.size === filteredWrong.length ? (
                <CheckSquare className="h-4 w-4 text-accent-500" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedIds.size === filteredWrong.length ? '取消全选' : '全选'}
            </button>

            <button
              onClick={handleReviewSelected}
              disabled={selectedIds.size === 0}
              className="btn-primary text-xs py-1.5 px-3"
            >
              <Play className="h-3.5 w-3.5" />
              重刷选中 ({selectedIds.size})
            </button>

            <button
              onClick={handleReviewAll}
              className="btn-primary text-xs py-1.5 px-3"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重刷全部 ({filteredWrong.length})
            </button>

            <button
              onClick={handleClearAll}
              className="btn-outline text-xs py-1.5 px-3 text-rose-500 hover:text-rose-600 hover:border-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              清空全部
            </button>
          </div>
        )}
      </div>

      {/* ========================
          Content area
          ======================== */}
      {wrongQuestions.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-xl font-display font-bold text-surface-400 dark:text-surface-300">
            暂无错题，继续保持！
          </p>
          <p className="section-subtitle mt-2">做错的题目会自动记录到这里</p>
        </div>
      ) : filteredWrong.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-lg font-display font-bold text-surface-400 dark:text-surface-300">
            没有找到匹配的错题
          </p>
          <p className="section-subtitle mt-2">试试调整搜索条件或筛选类型</p>
        </div>
      ) : (
        viewMode === 'time' ? renderTimeView() : renderBankView()
      )}

      {/* Confirm dialog for clear all */}
      <ConfirmDialog
        open={confirmOpen}
        message="确定清空所有错题吗？此操作不可恢复。"
        onConfirm={confirmClearAll}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}