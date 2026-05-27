import { useMemo, memo, useCallback } from 'react';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Question, SubQuestion } from '../../types';
import { AnswerValue, fuzzyMatch } from '../../store/practice';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface OptionPanelProps {
  question: Question;
  showResult: boolean;
  userAnswer: AnswerValue | undefined;
  onAnswerChange: (answer: AnswerValue) => void;
  answers: Record<string, AnswerValue>;
  randomOptionOrder: boolean;
}

// ---------------------------------------------------------------------------
// Helper: compute fill input class
// ---------------------------------------------------------------------------
function getFillInputClass(idx: number, showResult: boolean, userAnswer: string[], correctAnswer: string[]) {
  if (!showResult) return 'input';
  const userVal = (userAnswer[idx] || '').trim();
  const correctVal = (correctAnswer[idx] || '').trim();
  if (userVal === correctVal) {
    return 'input border-accent-400 bg-accent-50 dark:bg-accent-900/30';
  }
  return 'input border-accent-500 bg-accent-50 dark:bg-accent-900/30';
}

// ---------------------------------------------------------------------------
// Helper: compute short textarea class
// ---------------------------------------------------------------------------
function getShortTextareaClass(
  showResult: boolean,
  userText: string,
  correctText: string,
) {
  if (!showResult) return 'input min-h-[100px] resize-y';
  if (fuzzyMatch(userText, correctText)) {
    return 'input min-h-[100px] resize-y border-accent-400 bg-accent-50 dark:bg-accent-900/30';
  }
  return 'input min-h-[100px] resize-y border-accent-500 bg-accent-50 dark:bg-accent-900/30';
}

// ---------------------------------------------------------------------------
// Helper: compute short-group input class per sub-question
// ---------------------------------------------------------------------------
function getSubQuestionInputClass(
  showResult: boolean,
  userVal: string,
  correctVal: string,
) {
  if (!showResult) return 'input';
  if (fuzzyMatch(userVal, correctVal)) {
    return 'input border-accent-400 bg-accent-50 dark:bg-accent-900/30';
  }
  return 'input border-accent-500 bg-accent-50 dark:bg-accent-900/30';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const OptionPanel = memo(function OptionPanel({
  question,
  showResult,
  userAnswer: rawUserAnswer,
  onAnswerChange,
  randomOptionOrder,
}: OptionPanelProps) {
  if (!question) return null;

  // -----------------------------------------------------------------------
  // Existing types: single / multiple / judge -- keep completely unchanged
  // -----------------------------------------------------------------------
  if (question.type === 'single' || question.type === 'multiple' || question.type === 'judge') {
    return (
      <OptionButtonsPanel
        question={question}
        showResult={showResult}
        userAnswer={rawUserAnswer}
        onAnswerChange={onAnswerChange}
        randomOptionOrder={randomOptionOrder}
      />
    );
  }

  // -----------------------------------------------------------------------
  // Fill type
  // -----------------------------------------------------------------------
  if (question.type === 'fill') {
    const userAnswer = (Array.isArray(rawUserAnswer) ? rawUserAnswer : []) as string[];
    const correctAnswer = question.correctAnswer;

    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-surface-500 dark:text-surface-300 font-body">
          请在对应空中填入答案
        </p>

        {correctAnswer.map((_, idx) => {
          const userVal = userAnswer[idx] || '';
          const correctVal = correctAnswer[idx] || '';
          const isMatch = showResult && userVal.trim() === correctVal.trim();

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-surface-500 dark:text-surface-300 font-display flex-shrink-0 w-6">
                  {idx + 1}.
                </span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={userVal}
                    onChange={(e) => {
                      const next = [...userAnswer];
                      next[idx] = e.target.value;
                      onAnswerChange(next);
                    }}
                    disabled={showResult}
                    placeholder={`填空第 ${idx + 1} 空`}
                    className={getFillInputClass(idx, showResult, userAnswer, correctAnswer)}
                  />
                  {showResult && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isMatch ? (
                        <CheckCircle className="h-4 w-4 text-accent-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-accent-500" />
                      )}
                    </span>
                  )}
                </div>
              </div>
              {showResult && !isMatch && (
                <p className="text-xs text-accent-500 dark:text-accent-400 font-body pl-8">
                  正确答案：{correctVal}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Short type
  // -----------------------------------------------------------------------
  if (question.type === 'short') {
    // ----- Short-group -----
    if (question.subType === 'group' && question.subQuestions && question.subQuestions.length > 0) {
      const groupAnswer = (!Array.isArray(rawUserAnswer) && rawUserAnswer ? rawUserAnswer : {}) as Record<string, string>;

      return (
        <div className="space-y-3">
          <p className="text-sm font-bold text-surface-500 dark:text-surface-300 font-body">
            请逐一回答每个小题
          </p>

          {question.subQuestions.map((sq: SubQuestion) => {
            const userVal = groupAnswer[sq.id] || '';
            const correctVal = sq.answer || '';

            return (
              <div key={sq.id} className="space-y-1.5">
                <label className="block text-sm font-bold text-surface-900 dark:text-surface-100 font-body whitespace-pre-wrap">
                  {sq.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userVal}
                    onChange={(e) => {
                      const next = { ...groupAnswer, [sq.id]: e.target.value };
                      onAnswerChange(next);
                    }}
                    disabled={showResult}
                    placeholder={`请输入 ${sq.label} 的答案`}
                    className={getSubQuestionInputClass(showResult, userVal, correctVal)}
                  />
                  {showResult && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {fuzzyMatch(userVal, correctVal) ? (
                        <CheckCircle className="h-4 w-4 text-accent-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-accent-500" />
                      )}
                    </span>
                  )}
                </div>
                {showResult && !fuzzyMatch(userVal, correctVal) && (
                  <p className="text-xs text-accent-500 dark:text-accent-400 font-body">
                    正确答案：{correctVal}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // ----- Short-single -----
    const userText = Array.isArray(rawUserAnswer) ? (rawUserAnswer[0] || '') : '';
    const correctText = question.correctAnswer[0] || '';

    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-surface-500 dark:text-surface-300 font-body">
          请输入你的答案
        </p>

        <div className="relative">
          <textarea
            value={userText}
            onChange={(e) => onAnswerChange([e.target.value])}
            disabled={showResult}
            placeholder="请输入你的答案..."
            className={getShortTextareaClass(showResult, userText, correctText)}
            rows={4}
          />
          {showResult && (
            <span className="absolute right-3 top-3 pointer-events-none">
              {fuzzyMatch(userText, correctText) ? (
                <CheckCircle className="h-4 w-4 text-accent-400" />
              ) : (
                <XCircle className="h-4 w-4 text-accent-500" />
              )}
            </span>
          )}
        </div>

        {showResult && !fuzzyMatch(userText, correctText) && (
          <p className="text-xs text-accent-500 dark:text-accent-400 font-body">
            正确答案：{correctText}
          </p>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Fallback -- shouldn't reach here
  // -----------------------------------------------------------------------
  return (
    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-300">
      <HelpCircle className="h-4 w-4" />
      <span className="text-sm font-body">暂不支持该题型</span>
    </div>
  );
});

// ===========================================================================
// Internal sub-component: option buttons for single/multiple/judge
// (kept completely unchanged from original logic)
// ===========================================================================
const OptionButtonsPanel = memo(function OptionButtonsPanel({
  question,
  showResult,
  userAnswer,
  onAnswerChange,
  randomOptionOrder,
}: {
  question: Question;
  showResult: boolean;
  userAnswer: AnswerValue | undefined;
  onAnswerChange: (answer: AnswerValue) => void;
  randomOptionOrder: boolean;
}) {
  const displayOptions = useMemo(() => {
    if (question.type === 'judge' || !randomOptionOrder) {
      return question.options;
    }
    const shuffled = [...question.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [question.options, question.type, randomOptionOrder]);

  const selectedKeys: string[] = Array.isArray(userAnswer) ? userAnswer : [];
  const correctAnswer = question.correctAnswer;

  const getOptionClass = useCallback(
    (key: string) => {
      const isSelected = selectedKeys.includes(key);
      if (!showResult) {
        return isSelected
          ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 shadow-sm'
          : 'border-surface-200 dark:border-surface-600 hover:border-accent-400 dark:hover:border-accent-500 hover:bg-accent-50/50 dark:hover:bg-accent-900/10';
      }
      const isCorrectOption = correctAnswer.includes(key);
      if (isCorrectOption) {
        return 'border-accent-400 bg-accent-50 dark:bg-accent-900/30 shadow-sm';
      }
      if (isSelected && !isCorrectOption) {
        return 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 animate-shake';
      }
      return 'border-surface-200 dark:border-surface-600 opacity-50';
    },
    [selectedKeys, showResult, correctAnswer],
  );

  const handleOptionClick = useCallback(
    (key: string) => {
      if (showResult) return;
      if (question.type === 'single' || question.type === 'judge') {
        onAnswerChange([key]);
      } else {
        const newAnswer = selectedKeys.includes(key)
          ? selectedKeys.filter((a) => a !== key)
          : [...selectedKeys, key];
        onAnswerChange(newAnswer);
      }
    },
    [showResult, question.type, selectedKeys, onAnswerChange],
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-surface-500 dark:text-surface-300 font-body">
        {question.type === 'multiple' ? '可多选，请选择正确答案：' : '请选择一个答案：'}
      </p>
      {displayOptions.map((option) => {
        const isSelected = selectedKeys.includes(option.key);
        const isCorrect = correctAnswer.includes(option.key);
        const showCorrectIcon = showResult && isCorrect;
        const showWrongIcon = showResult && isSelected && !isCorrect;

        return (
          <button
            key={option.key}
            onClick={() => handleOptionClick(option.key)}
            disabled={showResult}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${getOptionClass(option.key)}`}
            aria-label={`选项 ${option.key}: ${option.content}`}
            aria-pressed={isSelected}
            role="radio"
            aria-checked={isSelected}
          >
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 transition-all flex-shrink-0 font-display ${
                isSelected && !showResult
                  ? 'border-accent-500 bg-accent-500 text-white'
                  : showCorrectIcon
                    ? 'border-accent-400 bg-accent-400 text-white'
                    : showWrongIcon
                      ? 'border-accent-500 bg-accent-500 text-white'
                      : 'border-surface-200 dark:border-surface-600 text-surface-500 dark:text-surface-300 bg-surface-50 dark:bg-surface-700'
              }`}
            >
              {option.key}
            </span>
            <span className="flex-1 text-left font-body font-medium text-surface-900 dark:text-surface-100">
              {option.content}
            </span>
            {showCorrectIcon && <CheckCircle className="h-5 w-5 text-accent-400 flex-shrink-0" />}
            {showWrongIcon && <XCircle className="h-5 w-5 text-accent-500 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
});