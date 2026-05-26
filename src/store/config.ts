import { create } from 'zustand';
import { storage } from '../utils/storage';
import { QuestionType } from '../types';

interface ConfigState {
  darkMode: boolean;
  randomOptionOrder: boolean;
  showAnswerImmediately: boolean;
  showAnswerSwitch: boolean;
  enableAIInPractice: boolean;
  autoAddWrong: boolean;
  multiBankTypeOrder: QuestionType[];
  favorites: string[];
  toggleDarkMode: () => void;
  setRandomOptionOrder: (enabled: boolean) => void;
  setShowAnswerImmediately: (enabled: boolean) => void;
  setShowAnswerSwitch: (val: boolean) => void;
  setEnableAIInPractice: (val: boolean) => void;
  setAutoAddWrong: (val: boolean) => void;
  setMultiBankTypeOrder: (order: QuestionType[]) => void;
  addFavorite: (questionId: string) => void;
  removeFavorite: (questionId: string) => void;
  isFavorite: (questionId: string) => boolean;
}

export const useConfigStore = create<ConfigState>((set) => {
  const config = storage.getConfig();
  return {
    darkMode: config.darkMode,
    randomOptionOrder: config.randomOptionOrder,
    showAnswerImmediately: true,
    showAnswerSwitch: config.showAnswerSwitch ?? false,
    enableAIInPractice: config.enableAIInPractice ?? false,
    autoAddWrong: config.autoAddWrong ?? true,
    multiBankTypeOrder: config.multiBankTypeOrder || ['judge', 'single', 'multiple', 'fill', 'short'],
    favorites: config.favorites || [],

    toggleDarkMode: () => {
      set((state) => {
        const newDarkMode = !state.darkMode;
        const config = storage.getConfig();
        storage.setConfig({ ...config, darkMode: newDarkMode });
        return { darkMode: newDarkMode };
      });
    },

    setRandomOptionOrder: (enabled) => {
      set({ randomOptionOrder: enabled });
      const config = storage.getConfig();
      storage.setConfig({ ...config, randomOptionOrder: enabled });
    },

    setShowAnswerImmediately: (enabled) => {
      set({ showAnswerImmediately: enabled });
    },

    setShowAnswerSwitch: (val) => {
      set({ showAnswerSwitch: val });
      const config = storage.getConfig();
      storage.setConfig({ ...config, showAnswerSwitch: val });
    },

    setEnableAIInPractice: (val) => {
      set({ enableAIInPractice: val });
      const config = storage.getConfig();
      storage.setConfig({ ...config, enableAIInPractice: val });
    },

    setAutoAddWrong: (val) => {
      set({ autoAddWrong: val });
      const config = storage.getConfig();
      storage.setConfig({ ...config, autoAddWrong: val });
    },

    setMultiBankTypeOrder: (order) => {
      set({ multiBankTypeOrder: order });
      const config = storage.getConfig();
      storage.setConfig({ ...config, multiBankTypeOrder: order });
    },

    addFavorite: (questionId) => {
      set((state) => {
        if (state.favorites.includes(questionId)) return state;
        const favorites = [...state.favorites, questionId];
        const conf = storage.getConfig();
        storage.setConfig({ ...conf, favorites });
        return { favorites };
      });
    },

    removeFavorite: (questionId) => {
      set((state) => {
        const favorites = state.favorites.filter((id) => id !== questionId);
        const conf = storage.getConfig();
        storage.setConfig({ ...conf, favorites });
        return { favorites };
      });
    },

    isFavorite: (questionId): boolean => {
      const state = useConfigStore.getState();
      return (state as ConfigState).favorites.includes(questionId);
    },
  };
});