import { memo } from 'react';
import { usePracticeStore } from '../../store';
import { hasAnswer } from '../../store/practice';
import { QuestionType } from '../../types';

const typeLabels: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
};

interface QuestionNavProps {
  usePerType?: boolean;
}

export const QuestionNav = memo(function QuestionNav({ usePerType }: QuestionNavProps) {
  const { questions, currentIndex, answers, marked, goToQuestion } = usePracticeStore();

  const getStatusClass = (index: number) => {
    const question = questions[index];
    const isAnswered = hasAnswer(answers[question.id]);
    const isMarked = marked.includes(question.id);
    const isCurrent = index === currentIndex;

    if (isCurrent) {
      return 'bg-accent-500 text-white shadow-sm';
    }
    return isMarked
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-2 border-amber-400'
      : isAnswered
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
      : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-600';
  };

  const getSizeClass = () => {
    const len = questions.length;
    if (len <= 10) return 'w-9 h-9 text-sm';
    if (len > 50) return 'w-7 h-7 text-xs';
    return 'w-8 h-8 text-sm';
  };

  const getAriaLabel = (index: number) => {
    const question = questions[index];
    const isAnswered = hasAnswer(answers[question.id]);
    const isMarked = marked.includes(question.id);
    const isCurrent = index === currentIndex;
    let label = `第 ${index + 1} 题`;
    if (isAnswered) label += '（已答）';
    if (isMarked) label += '（已标记）';
    if (isCurrent) label += '（当前）';
    if (!isAnswered) label += '（未答）';
    return label;
  };

  const renderFlatGrid = () => {
    const sizeClass = getSizeClass();
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => goToQuestion(index)}
            className={`${sizeClass} rounded-xl flex items-center justify-center font-bold transition-all ${getStatusClass(index)}`}
            aria-label={getAriaLabel(index)}
            aria-current={index === currentIndex ? 'true' : undefined}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  };

  const renderTypeSegments = () => {
    const sizeClass = getSizeClass();
    // 按题型连续分段
    const typeRuns: { type: QuestionType; start: number; end: number }[] = [];
    let curType: QuestionType | null = null;
    let curStart = 0;
    questions.forEach((q, i) => {
      if (q.type !== curType) {
        if (curType !== null) {
          typeRuns.push({ type: curType, start: curStart, end: i - 1 });
        }
        curType = q.type;
        curStart = i;
      }
    });
    if (curType !== null) {
      typeRuns.push({ type: curType, start: curStart, end: questions.length - 1 });
    }

    return typeRuns.map((run) => (
      <div key={run.type + '-' + run.start} className="mb-3 last:mb-0">
        <div className="text-xs font-bold text-surface-400 dark:text-surface-500 mb-2 px-1">
          {typeLabels[run.type]} ({run.start + 1}-{run.end + 1})
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {questions.slice(run.start, run.end + 1).map((_, j) => {
            const index = run.start + j;
            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`${sizeClass} rounded-xl flex items-center justify-center font-bold transition-all ${getStatusClass(index)}`}
                aria-label={getAriaLabel(index)}
                aria-current={index === currentIndex ? 'true' : undefined}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div>
      <h4 className="text-sm font-display font-bold text-surface-600 dark:text-surface-400 mb-3">题目导航</h4>
      {usePerType ? renderTypeSegments() : renderFlatGrid()}
      <div className="flex flex-wrap gap-3 mt-3 text-xs font-body">
        <span className="flex items-center gap-1 text-surface-600 dark:text-surface-400">
          <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30" /> 已答
        </span>
        <span className="flex items-center gap-1 text-surface-600 dark:text-surface-400">
          <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-400" /> 标记
        </span>
        <span className="flex items-center gap-1 text-surface-600 dark:text-surface-400">
          <span className="w-3 h-3 rounded bg-surface-50 dark:bg-surface-700" /> 未答
        </span>
      </div>
    </div>
  );
});
