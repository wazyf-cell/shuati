import { create } from 'zustand';
import { Question } from '../types';
import { useConfigStore } from './config';

// ---------------------------------------------------------------------------
// Answer types – fill/short-group use different shapes
// ---------------------------------------------------------------------------
export type AnswerValue = string[] | Record<string, string>;

/** check whether an answer is non-empty (works for both shapes) */
export function hasAnswer(answer: AnswerValue | undefined): boolean {
  if (!answer) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  return Object.keys(answer).length > 0;
}

// ---------------------------------------------------------------------------
// fuzzy-match helper for short-answer questions
// ---------------------------------------------------------------------------
export function fuzzyMatch(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s
      .replace(/[\s，。,.、；;：:？！?！'"'"「」『』【】《》<>\[\]{}()（）\/\\\-_+=|@#$%^&*!~`\u3000]/g, '')
      .toLowerCase();
  return normalize(a) === normalize(b);
}

// ---------------------------------------------------------------------------
/** 获取题目类型的用户答案展示文本 */
// ---------------------------------------------------------------------------
function getUserAnswerDisplay(
  question: Question,
  userAnswer: AnswerValue | undefined,
): string {
  if (!userAnswer) return '';

  if (question.type === 'fill') {
    return Array.isArray(userAnswer) ? userAnswer.join('、') : '';
  }
  if (question.type === 'short') {
    if (question.subType === 'group' && question.subQuestions) {
      if (!Array.isArray(userAnswer)) {
        // Record<string, string>
        const record = userAnswer as Record<string, string>;
        return question.subQuestions
          .map((sq) => `${sq.label}: ${record[sq.id] || ''}`)
          .join('；');
      }
      return '';
    }
    // short-single: string[] with one element
    return Array.isArray(userAnswer) ? (userAnswer[0] || '') : '';
  }
  // single / multiple / judge
  return Array.isArray(userAnswer) ? userAnswer.join(', ') : '';
}

// ---------------------------------------------------------------------------
interface PracticeState {
  currentIndex: number;
  questions: Question[];
  answers: Record<string, AnswerValue>;
  results: Record<string, boolean>;
  marked: string[];
  startTime: number;
  isSubmitted: boolean;
  questionStartTime: number;

  startPractice: (questions: Question[], initialMarked?: string[]) => void;
  setAnswer: (questionId: string, answer: AnswerValue) => void;
  markQuestion: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitAnswers: () => { correctCount: number; totalCount: number };
  resetPractice: () => void;
  getCurrentQuestion: () => Question | undefined;
  getAnsweredCount: () => number;
  /** 获取当前题目用户答案的展示文本 */
  getUserAnswerText: () => string;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  currentIndex: 0,
  questions: [],
  answers: {},
  results: {},
  marked: [],
  startTime: 0,
  isSubmitted: false,
  questionStartTime: 0,

  startPractice: (questions, initialMarked = []) => {
    set({
      currentIndex: 0,
      questions,
      answers: {},
      results: {},
      marked: initialMarked,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      isSubmitted: false,
    });
  },

  setAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  markQuestion: (questionId) => {
    set((state) => {
      const wasMarked = state.marked.includes(questionId);
      // 同步到持久化收藏
      const configStore = useConfigStore.getState();
      if (wasMarked) {
        configStore.removeFavorite(questionId);
      } else {
        configStore.addFavorite(questionId);
      }
      return {
        marked: wasMarked
          ? state.marked.filter((id) => id !== questionId)
          : [...state.marked, questionId],
      };
    });
  },

  nextQuestion: () => {
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
      questionStartTime: Date.now(),
    }));
  },

  prevQuestion: () => {
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
      questionStartTime: Date.now(),
    }));
  },

  goToQuestion: (index) => {
    set({ currentIndex: index, questionStartTime: Date.now() });
  },

  submitAnswers: () => {
    const { questions, answers } = get();
    const results: Record<string, boolean> = {};
    let correctCount = 0;

    questions.forEach((q) => {
      const userAnswer: AnswerValue | undefined = answers[q.id];
      let correct = false;

      if (q.type === 'fill') {
        const ua = (Array.isArray(userAnswer) ? userAnswer : []) as string[];
        const userTrimmed = ua.map((a) => a.trim());
        const correctTrimmed = q.correctAnswer.map((a) => a.trim());
        correct =
          userTrimmed.length === correctTrimmed.length &&
          userTrimmed.every((ans, i) => ans === correctTrimmed[i]);
      } else if (q.type === 'short') {
        if (q.subType === 'group' && q.subQuestions) {
          // 分组简答：Record<string, string>，逐小题模糊匹配
          const record = (!Array.isArray(userAnswer) && userAnswer ? userAnswer : {}) as Record<string, string>;
          correct = q.subQuestions.every((sq) => {
            const subUserAnswer = record[sq.id] || '';
            return fuzzyMatch(subUserAnswer, sq.answer);
          });
        } else {
          // 普通简答：模糊匹配 userAnswer[0] 与 correctAnswer[0]
          const ua = (Array.isArray(userAnswer) ? userAnswer : []) as string[];
          const userStr = ua[0] || '';
          const correctStr = q.correctAnswer[0] || '';
          correct = fuzzyMatch(userStr, correctStr);
        }
      } else {
        // single / multiple / judge：保持原有逻辑不变
        const ua = (Array.isArray(userAnswer) ? userAnswer : []) as string[];
        correct =
          JSON.stringify([...ua].sort()) ===
          JSON.stringify([...q.correctAnswer].sort());
      }

      results[q.id] = correct;
      if (correct) correctCount++;
    });

    set({ results, isSubmitted: true });

    return { correctCount, totalCount: questions.length };
  },

  resetPractice: () => {
    set({
      currentIndex: 0,
      questions: [],
      answers: {},
      results: {},
      marked: [],
      startTime: 0,
      isSubmitted: false,
      questionStartTime: 0,
    });
  },

  getCurrentQuestion: () => {
    const { questions, currentIndex } = get();
    return questions[currentIndex];
  },

  getAnsweredCount: () => {
    const { questions, answers } = get();
    return questions.filter((q) => hasAnswer(answers[q.id])).length;
  },

  getUserAnswerText: () => {
    const { questions, currentIndex, answers } = get();
    const question = questions[currentIndex];
    if (!question) return '';
    const userAnswer = answers[question.id];
    return getUserAnswerDisplay(question, userAnswer);
  },
}));