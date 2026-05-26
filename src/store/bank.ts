import { create } from 'zustand';
import { Question, QuestionBank } from '../types';
import { storage } from '../utils/storage';

interface BankState {
  banks: QuestionBank[];
  currentBankId: string;
  setCurrentBankId: (id: string) => void;
  addBank: (name: string) => string;
  deleteBank: (id: string) => void;
  updateBank: (id: string, name: string) => void;
  getCurrentBank: () => QuestionBank | undefined;
  addQuestion: (bankId: string, question: Omit<Question, 'id'>) => void;
  updateQuestion: (bankId: string, questionId: string, question: Partial<Question>) => void;
  deleteQuestion: (bankId: string, questionId: string) => void;
  getQuestionById: (bankId: string, questionId: string) => Question | undefined;
}

export const useBankStore = create<BankState>((set, get) => ({
  banks: storage.getBanks(),
  currentBankId: storage.getConfig().currentBankId,

  setCurrentBankId: (id) => {
    set({ currentBankId: id });
    const config = storage.getConfig();
    storage.setConfig({ ...config, currentBankId: id });
  },

  addBank: (name) => {
    const newBank: QuestionBank = {
      id: Date.now().toString(),
      name,
      questions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => {
      const newBanks = [...state.banks, newBank];
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
    return newBank.id;
  },

  deleteBank: (id) => {
    set((state) => {
      const newBanks = state.banks.filter((b) => b.id !== id);
      storage.setBanks(newBanks);
      return {
        banks: newBanks,
        currentBankId: state.currentBankId === id ? '' : state.currentBankId,
      };
    });
  },

  updateBank: (id, name) => {
    set((state) => {
      const newBanks = state.banks.map((bank) =>
        bank.id === id ? { ...bank, name, updatedAt: Date.now() } : bank
      );
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },

  getCurrentBank: () => {
    const { banks, currentBankId } = get();
    return banks.find((b) => b.id === currentBankId);
  },

  addQuestion: (bankId, question) => {
    const newQuestion: Question = {
      ...question,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    set((state) => {
      const newBanks = state.banks.map((bank) =>
        bank.id === bankId
          ? { ...bank, questions: [...bank.questions, newQuestion], updatedAt: Date.now() }
          : bank
      );
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },

  updateQuestion: (bankId, questionId, updates) => {
    set((state) => {
      const newBanks = state.banks.map((bank) =>
        bank.id === bankId
          ? {
              ...bank,
              questions: bank.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
              updatedAt: Date.now(),
            }
          : bank
      );
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },

  deleteQuestion: (bankId, questionId) => {
    set((state) => {
      const newBanks = state.banks.map((bank) =>
        bank.id === bankId
          ? {
              ...bank,
              questions: bank.questions.filter((q) => q.id !== questionId),
              updatedAt: Date.now(),
            }
          : bank
      );
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },

  getQuestionById: (bankId, questionId) => {
    const bank = get().banks.find((b) => b.id === bankId);
    return bank?.questions.find((q) => q.id === questionId);
  },
}));