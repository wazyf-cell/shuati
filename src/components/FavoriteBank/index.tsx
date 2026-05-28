import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Flag,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
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

export function FavoriteBank({ onBack, onStartPractice }: FavoriteBankProps) {
  const { banks } = useBankStore();
  const { favorites, removeFavorite } = useConfigStore();
  const { wrongQuestions } = useWrongStore();

  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<Set<string>>(new Set());

  // 按题库分组
  const bankGroups = useMemo(() => {
    const map = new Map<string, { bank: QuestionBank; questions: Question[] }>();
    for (const bank of banks) {
      const favs = bank.questions.filter((q) => favorites.includes(q.id));
      if (favs.length > 0) {
        map.set(bank.id, { bank, questions: favs });
      }
    }
    return Array.from(map.values());
  }, [banks, favorites]);

  const toggleCollapse = (qId: string) => {
    setCollapsedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleRemoveFav = (qId: string) => {
    removeFavorite(qId);
  };

  const renderQuestionCard = (question: Question) => {
    const isExpanded = !collapsedQuestionIds.has(question.id);
    const isWrongOption = (key: string) => {
      const wq = wrongQuestions.find((w) => w.questionId === question.id);
      return wq ? wq.userAnswers.includes(key) : false;
    };
    const isCorrectOption = (key: string) => question.correctAnswer.includes(key);

    return (
      <div key={question.id} className="card p-4 mb-3">
        {/* Summary row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleCollapse(question.id)}
            className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <span className={typeBadges[question.type]}>
            {typeLabels[question.type]}
          </span>
          <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 whitespace-pre-wrap line-clamp-2">
            {question.content}
          </span>
          {(() => {
            const wq = wrongQuestions.find((w) => w.questionId === question.id);
            if (wq && wq.wrongCount > 0) {
              return <span className="text-xs text-red-400 flex-shrink-0">❌ {wq.wrongCount}次</span>;
            }
            return null;
          })()}
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
                const wq = wrongQuestions.find((w) => w.questionId === question.id);
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
              userAnswer={wrongQuestions.find((w) => w.questionId === question.id)?.userAnswers || []}
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

  return (
    <div className="animate-scale-in">
      <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <Flag className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">收藏题库</h2>
          <p className="section-subtitle">{favorites.length} 道收藏题目</p>
        </div>
      </div>

      {bankGroups.length === 0 ? (
        <div className="card p-12 text-center">
          <Flag className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <p className="text-surface-500 dark:text-surface-400">暂无收藏题目</p>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-2">
            刷题时点击 <Flag className="h-4 w-4 inline" /> 图标即可收藏
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {bankGroups.map(({ bank, questions }) => (
            <div key={bank.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {bank.name}
                  <span className="text-sm font-normal text-surface-400 dark:text-surface-500 ml-2">
                    {questions.length} 题
                  </span>
                </h3>
                <button
                  onClick={() => onStartPractice?.(questions.map((q) => q.id), bank.id)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Play className="h-4 w-4" />
                  刷这些题
                </button>
              </div>
              <div>
                {questions.map((q) => renderQuestionCard(q))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
