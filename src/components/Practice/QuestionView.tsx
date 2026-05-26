import { memo } from 'react';
import { Flag } from 'lucide-react';
import { usePracticeStore } from '../../store';
import { QuestionType } from '../../types';

const typeLabels: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
};

const typeColors: Record<QuestionType, string> = {
  single: 'badge-brand',
  multiple: 'badge-mint',
  judge: 'badge-sun',
  fill: 'badge-brand',
  short: 'badge-purple',
};

export const QuestionView = memo(function QuestionView() {
  const { questions, currentIndex, marked, markQuestion } = usePracticeStore();
  const question = questions[currentIndex];

  if (!question) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={typeColors[question.type]}>
            {typeLabels[question.type]}
          </span>
          <span className="text-sm font-bold text-surface-600 dark:text-surface-400 font-body">
            第 {currentIndex + 1} / {questions.length} 题
          </span>
        </div>
        <button
          onClick={() => markQuestion(question.id)}
          className={`p-2 rounded-xl transition-all ${
            marked.includes(question.id)
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
              : 'text-surface-400 dark:text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-700'
          }`}
          aria-label={marked.includes(question.id) ? '取消标记' : '标记题目'}
        >
          <Flag className={`h-5 w-5 ${marked.includes(question.id) ? 'fill-current' : ''}`} />
        </button>
      </div>

      <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 leading-relaxed">
        {question.content}
      </h3>
    </div>
  );
});