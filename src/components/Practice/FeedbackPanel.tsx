import { memo } from 'react';
import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { usePracticeStore } from '../../store';
import { AnswerValue, fuzzyMatch } from '../../store/practice';

export const FeedbackPanel = memo(function FeedbackPanel() {
  const { isSubmitted, questions, currentIndex, answers } = usePracticeStore();
  const question = questions[currentIndex];

  if (!question || !isSubmitted) return null;

  const userAnswer: AnswerValue | undefined = answers[question.id];
  const correctAnswer = question.correctAnswer;
  let isCorrect = false;

  if (question.type === 'fill') {
    const ua = (Array.isArray(userAnswer) ? userAnswer : []) as string[];
    const userTrimmed = ua.map((a) => a.trim());
    const correctTrimmed = correctAnswer.map((a) => a.trim());
    isCorrect =
      userTrimmed.length === correctTrimmed.length &&
      userTrimmed.every((ans, i) => ans === correctTrimmed[i]);
  } else if (question.type === 'short' && question.subType === 'group' && question.subQuestions) {
    const record = (!Array.isArray(userAnswer) && userAnswer ? userAnswer : {}) as Record<string, string>;
    isCorrect = question.subQuestions.every((sq) => {
      const subUserAnswer = record[sq.id] || '';
      return fuzzyMatch(subUserAnswer, sq.answer);
    });
  } else if (question.type === 'short') {
    const ua = (Array.isArray(userAnswer) ? userAnswer : []) as string[];
    const userStr = ua[0] || '';
    const correctStr = correctAnswer[0] || '';
    isCorrect = fuzzyMatch(userStr, correctStr);
  } else {
    // single / multiple / judge
    const ua = (Array.isArray(userAnswer) ? userAnswer : []) as string[];
    isCorrect =
      JSON.stringify([...ua].sort()) === JSON.stringify([...correctAnswer].sort());
  }

  return (
    <div className={`card p-6 border-2 ${isCorrect ? 'border-emerald-500' : 'border-accent-500'}`}>
      <div className="flex items-center gap-3 mb-4">
        {isCorrect ? (
          <>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <h4 className="text-lg font-display font-bold text-emerald-500">回答正确！</h4>
          </>
        ) : (
          <>
            <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-accent-600" />
            </div>
            <h4 className="text-lg font-display font-bold text-accent-600">
              正确答案：{correctAnswer.join(', ')}
            </h4>
          </>
        )}
      </div>

      {question.analysis && (
        <div className="flex gap-3 p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
          <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-surface-800 dark:text-surface-200 font-body leading-relaxed">
            {question.analysis}
          </p>
        </div>
      )}
    </div>
  );
});