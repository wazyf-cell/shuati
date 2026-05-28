import { useEffect, useCallback } from 'react';
import { usePracticeStore } from '../store/practice';

interface ShortcutHandlers {
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onMark?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { questions, currentIndex, answers } = usePracticeStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (key === 'arrowleft' || key === 'a') {
        handlers.onPrev?.();
      } else if (key === 'arrowright' || key === 'd') {
        handlers.onNext?.();
      } else if (key === 'enter' || key === ' ') {
        handlers.onSubmit?.();
      } else if (key === 'm' || key === 'f') {
        handlers.onMark?.();
      } else if (/^\d$/.test(key)) {
        // 数字键 1-9 选对应选项
        const num = parseInt(key, 10);
        const currentQuestion = questions[currentIndex];
        if (currentQuestion && num >= 1 && num <= currentQuestion.options.length) {
          const optionKey = currentQuestion.options[num - 1].key;
          const currentAnswer = answers[currentQuestion.id];
          const selectedKeys: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
          const newAnswer = selectedKeys.includes(optionKey)
            ? selectedKeys.filter((a) => a !== optionKey)
            : [...selectedKeys, optionKey];
          usePracticeStore.getState().setAnswer(currentQuestion.id, newAnswer);
        }
      } else if (/^[a-z]$/.test(key)) {
        const optionKey = key.toUpperCase();
        const currentQuestion = questions[currentIndex];
        if (currentQuestion) {
          const optionExists = currentQuestion.options.some((o) => o.key === optionKey);
          if (optionExists) {
            const currentAnswer = answers[currentQuestion.id];
            const selectedKeys: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
            const newAnswer = selectedKeys.includes(optionKey)
              ? selectedKeys.filter((a) => a !== optionKey)
              : [...selectedKeys, optionKey];
            usePracticeStore.getState().setAnswer(currentQuestion.id, newAnswer);
          }
        }
      }
    },
    [questions, currentIndex, answers, handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}