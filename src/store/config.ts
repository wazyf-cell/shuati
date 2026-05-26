import { create } from 'zustand';
import { storage } from '../utils/storage';
import { QuestionType } from '../types';

interface ConfigState {
  darkMode: boolean;
  randomOptionOrder: boolean;
  showAnswerImmediately: boolean;
  showAnswerSwitch: boolean;
  enableAIInPractice: boolean;
  multiBankTypeOrder: QuestionType[];
  toggleDarkMode: () => void;
  setRandomOptionOrder: (enabled: boolean) => void;
  setShowAnswerImmediately: (enabled: boolean) => void;
  setShowAnswerSwitch: (val: boolean) => void;
  setEnableAIInPractice: (val: boolean) => void;
  setMultiBankTypeOrder: (order: QuestionType[]) => void;
}

export const useConfigStore = create<ConfigState>((set) => {
  const config = storage.getConfig();
  return {
    darkMode: config.darkMode,
    randomOptionOrder: config.randomOptionOrder,
    showAnswerImmediately: true,
    showAnswerSwitch: config.showAnswerSwitch ?? false,
    enableAIInPractice: config.enableAIInPractice ?? false,
    multiBankTypeOrder: config.multiBankTypeOrder || ['judge', 'single', 'multiple', 'fill', 'short'],

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

    setMultiBankTypeOrder: (order) => {
      set({ multiBankTypeOrder: order });
      const config = storage.getConfig();
      storage.setConfig({ ...config, multiBankTypeOrder: order });
    },
  };
});