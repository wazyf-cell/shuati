import { create } from 'zustand';
import { WrongQuestion } from '../types';
import { storage } from '../utils/storage';

interface WrongState {
  wrongQuestions: WrongQuestion[];
  addWrong: (questionId: string, bankId: string, userAnswer: string[], correctAnswer: string[]) => void;
  removeWrong: (questionId: string) => void;
  clearAll: () => void;
  getWrongByBank: (bankId: string) => WrongQuestion[];
  isWrongQuestion: (questionId: string) => boolean;
}

export const useWrongStore = create<WrongState>((set, get) => ({
  wrongQuestions: storage.getWrong(),

  addWrong: (questionId, bankId, userAnswer, correctAnswer) => {
    set((state) => {
      const existing = state.wrongQuestions.find((w) => w.questionId === questionId);
      let newWrong: WrongQuestion[];

      if (existing) {
        newWrong = state.wrongQuestions.map((w) =>
          w.questionId === questionId
            ? {
                ...w,
                wrongCount: w.wrongCount + 1,
                lastWrongAt: Date.now(),
                userAnswers: [...w.userAnswers, ...userAnswer],
              }
            : w
        );
      } else {
        newWrong = [
          ...state.wrongQuestions,
          {
            questionId,
            bankId,
            wrongCount: 1,
            lastWrongAt: Date.now(),
            firstWrongAt: Date.now(),
            userAnswers: [...userAnswer],
            correctAnswer: [...correctAnswer],
          },
        ];
      }

      storage.setWrong(newWrong);
      return { wrongQuestions: newWrong };
    });
  },

  removeWrong: (questionId) => {
    set((state) => {
      const newWrong = state.wrongQuestions.filter((w) => w.questionId !== questionId);
      storage.setWrong(newWrong);
      return { wrongQuestions: newWrong };
    });
  },

  clearAll: () => {
    storage.setWrong([]);
    set({ wrongQuestions: [] });
  },

  getWrongByBank: (bankId) => {
    return get().wrongQuestions.filter((w) => w.bankId === bankId);
  },

  isWrongQuestion: (questionId) => {
    return get().wrongQuestions.some((w) => w.questionId === questionId);
  },
}));