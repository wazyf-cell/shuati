import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Flag,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Search,
  Square,
  CheckSquare,
  RotateCcw,
} from 'lucide-react';
import { AIExplanationCard } from '../AI/AIExplanationCard';
import { useBankStore, useConfigStore, useWrongStore } from '../../store';
import { QuestionType, Question, QuestionBank } from '../../types';

interface FavoriteBankProps {
  onBack: () => void;
  onStartPractice?: (questionIds: string[], bankId: string) => void;
}

const typeLabels: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
};

const typeBadges: Record<QuestionType, string> = {
  single: 'badge-single',
  multiple: 'badge-multiple',
  judge: 'badge-judge',
  fill: 'badge-fill',
  short: 'badge-short',
};

const FILTER_TYPES = ['all', 'single', 'multiple', 'judge', 'fill', 'short'] as const;

export function FavoriteBank({ onBack, onStartPractice }: FavoriteBankProps) {
  const { banks } = useBankStore();
  const { favorites, removeFavorite } = useConfigStore();
  const { wrongQuestions } = useWrongStore();

  const [viewMode, setViewMode] = useState<'bank' | 'subject'>('subject');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<Set<string>>(new Set());

  // Helper: find a question by id from any bank
  const findQuestion = (qId: string): { bank: QuestionBank; question: Question } | null => {
    for (const bank of banks) {
      const q = bank.questions.find((x) => x.id === qId);
      if (q) return { bank, question: q };
    }
    return null;
  };

  // Filtered favorite IDs
  const filteredFavIds = useMemo(() => {
    let result = favorites;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((qId) => {
        const found = findQuestion(qId);
        return found?.question.content.toLowerCase().includes(term) ?? false;
      });
    }
    if (typeFilter !== 'all') {
      result = result.filter((qId) => {
        const found = findQuestion(qId);
        return found?.question.type === typeFilter;
      });
    }
    return result;
  }, [favorites, searchTerm, typeFilter, banks]);

  // Bank groups from filtered
  interface FavBankGroup {
    bankId: string;
    bankName: string;
    subject: string;
    questions: Question[];
  }
  const bankGroups = useMemo((): FavBankGroup[] => {
    const map = new Map<string, FavBankGroup>();
    for (const qId of filteredFavIds) {
      const found = findQuestion(qId);
      if (!found) continue;
      let group = map.get(found.bank.id);
      if (!group) {
        group = { bankId: found.bank.id, bankName: found.bank.name, subject: found.bank.subject || '未分类', questions: [] };
        map.set(found.bank.id, group);
      }
      group.questions.push(found.question);
    }
    return Array.from(map.values()).sort((a, b) => a.bankName.localeCompare(b.bankName));
  }, [filteredFavIds, banks]);

  // Subject groups from filtered
  interface FavSubjectGroup {
    subject: string;
    banks: FavBankGroup[];
  }
  const subjectGroups = useMemo((): FavSubjectGroup[] => {
    const map = new Map<string, FavSubjectGroup>();
    for (const bg of bankGroups) {
      let group = map.get(bg.subject);
      if (!group) {
        group = { subject: bg.subject, banks: [] };
        map.set(bg.subject, group);
      }
      group.banks.push(bg);
    }
    return Array.from(map.values()).sort((a, b) => a.subject.localeCompare(b.subject));
  }, [bankGroups]);

  // Toggle helpers
  const toggleCollapse = (qId: string) => {
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
    if (selectedIds.size === filteredFavIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFavIds));
    }
  };

  const handleRemoveFav = (qId: string) => {
    removeFavorite(qId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
  };

  const handleReviewSelected = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const first = findQuestion(ids[0]);
    onStartPractice?.(ids, first?.bank.id || '');
  };

  const handleReviewAll = () => {
    if (filteredFavIds.length === 0) return;
    const ids = Array.from(filteredFavIds);
    const first = findQuestion(ids[0]);
    onStartPractice?.(ids, first?.bank.id || '');
  };

  // Render question card
  const renderQuestionCard = (question: Question) => {
    const isExpanded = !collapsedQuestionIds.has(question.id);
    const isSelected = selectedIds.has(question.id);
    const isWrongOption = (key: string) => {
      const wq = wrongQuestions.find((w) => w.questionId === question.id);
      return wq ? wq.userAnswers.includes(key) : false;
    };
    const isCorrectOption = (key: string) => question.correctAnswer.includes(key);
    const wq = wrongQuestions.find((w) => w.questionId === question.id);

    return (
      <div key={question.id} className="card p-4 mb-3">
        {/* Summary row */}
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={() => toggleSelect(question.id)}
            className="flex-shrink-0 text-surface-400 hover:text-accent-500 transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-accent-500" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>

          {/* Expand/collapse */}
          <button
            onClick={() => toggleCollapse(question.id)}
            className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Type badge */}
          <span className={typeBadges[question.type]}>
            {typeLabels[question.type]}
          </span>

          {/* Question preview */}
          <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 whitespace-pre-wrap line-clamp-2">
            {question.content}
          </span>

          {/* Wrong count */}
          {wq && wq.wrongCount > 0 && (
            <span className="text-xs text-red-400 flex-shrink-0">❌ {wq.wrongCount}次</span>
          )}

          {/* Favorite icon */}
          <button
            onClick={() => handleRemoveFav(question.id)}
            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex-shrink-0"
            title="取消收藏"
          >
            <Flag className="h-4 w-4 fill-current" />
          </button>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 space-y-3">
            {/* Answer summary */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {(() => {
                const userAnsStr = wq?.userAnswers?.join(', ') || '(未做错)';
                return (
                  <>
                    <span className="text-surface-500 dark:text-surface-400">
                      做错答案：<span className="font-bold text-rose-500 dark:text-rose-400">{userAnsStr}</span>
                    </span>
                    <span className="text-surface-500 dark:text-surface-400">
                      正确答案：<span className="font-bold text-emerald-500 dark:text-emerald-400">
                        {question.correctAnswer.join(', ')}
                      </span>
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Options grid */}
            {question.options && question.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt) => {
                  const isRight = isCorrectOption(opt.key);
                  const isWrong = isWrongOption(opt.key);
                  const userAnsweredWrong = isWrong && !isRight;
                  const missedRight = isRight && !isWrong;

                  let borderClass = 'border-surface-200 dark:border-surface-600';
                  let marker: string | null = null;
                  if (missedRight) {
                    borderClass = 'border-emerald-400 dark:border-emerald-600';
                    marker = '✅';
                  } else if (userAnsweredWrong) {
                    borderClass = 'border-rose-400 dark:border-rose-600';
                    marker = '❌';
                  } else if (isRight) {
                    borderClass = 'border-emerald-300 dark:border-emerald-700';
                    marker = '✅';
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border ${borderClass} bg-surface-50 dark:bg-surface-700/50 text-sm`}
                    >
                      {marker && <span className="flex-shrink-0">{marker}</span>}
                      <span className="font-bold text-surface-500 dark:text-surface-400">{opt.key}.</span>
                      <span className="text-surface-700 dark:text-surface-300">{opt.content}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Teacher analysis */}
            {question.analysis && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm text-blue-700 dark:text-blue-300">
                <span className="font-bold">解析：</span>
                {question.analysis}
              </div>
            )}

            {/* AI Analysis */}
            <AIExplanationCard
              question={question}
              userAnswer={wq?.userAnswers || []}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onStartPractice?.([question.id], banks.find((b) => b.questions.some((q) => q.id === question.id))?.id || '')}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Play className="h-4 w-4" />
                重刷此题
              </button>
              <button
                onClick={() => handleRemoveFav(question.id)}
                className="btn-outline flex items-center gap-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <Trash2 className="h-4 w-4" />
                取消收藏
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render: bank-grouped view
  const renderBankView = () => (
    <div className="space-y-6">
      {bankGroups.map((group) => (
        <div key={group.bankId} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {group.bankName}
              <span className="text-sm font-normal text-surface-400 dark:text-surface-500 ml-2">
                {group.questions.length} 题
              </span>
            </h3>
            <button
              onClick={() => onStartPractice?.(group.questions.map((q) => q.id), group.bankId)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Play className="h-4 w-4" />
              刷这些题
            </button>
          </div>
          <div>
            {group.questions.map((q) => renderQuestionCard(q))}
          </div>
        </div>
      ))}
    </div>
  );

  // Render: subject-grouped view
  const renderSubjectView = () => (
    <div className="space-y-8">
      {subjectGroups.map((group) => (
        <div key={group.subject}>
          <h3 className="text-lg font-display font-bold text-surface-600 dark:text-surface-300 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent-500" />
            {group.subject}
          </h3>
          <div className="space-y-4">
            {group.banks.map((bg) => (
              <div key={bg.bankId} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {bg.bankName}
                    <span className="text-sm font-normal text-surface-400 dark:text-surface-500 ml-2">
                      {bg.questions.length} 题
                    </span>
                  </h4>
                  <button
                    onClick={() => onStartPractice?.(bg.questions.map((q) => q.id), bg.bankId)}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Play className="h-4 w-4" />
                    刷这些题
                  </button>
                </div>
                <div>
                  {bg.questions.map((q) => renderQuestionCard(q))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-scale-in">
      <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <Flag className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">收藏题库</h2>
          <p className="section-subtitle">{favorites.length} 道收藏题目</p>
        </div>
      </div>

      {/* Toolbar */}
      {favorites.length > 0 && (
        <div className="card p-4 mb-6 space-y-3">
          {/* Row 1: view toggle */}
          <div className="flex gap-1">
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
            <button
              onClick={() => setViewMode('subject')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                viewMode === 'subject'
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300'
              }`}
            >
              <Flag className="h-4 w-4 inline mr-1" />
              按学科
            </button>
          </div>

          {/* Row 2: search + type filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-300 dark:text-surface-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索收藏题目..."
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
          {filteredFavIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-600">
              <button
                onClick={toggleSelectAll}
                className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                {selectedIds.size === filteredFavIds.length ? (
                  <CheckSquare className="h-4 w-4 text-accent-500" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedIds.size === filteredFavIds.length ? '取消全选' : '全选'}
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
                重刷全部 ({filteredFavIds.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {favorites.length === 0 ? (
        <div className="card p-12 text-center">
          <Flag className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <p className="text-surface-500 dark:text-surface-400">暂无收藏题目</p>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-2">
            刷题时点击 <Flag className="h-4 w-4 inline" /> 图标即可收藏
          </p>
        </div>
      ) : filteredFavIds.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-lg font-display font-bold text-surface-400 dark:text-surface-300">
            没有找到匹配的收藏题目
          </p>
        </div>
      ) : (
        viewMode === 'bank' ? renderBankView() : renderSubjectView()
      )}
    </div>
  );
}
