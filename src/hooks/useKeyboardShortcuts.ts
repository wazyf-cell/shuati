import { useEffect, useCallback } from 'react';
import { usePracticeStore } from '../store/practice';
import { hasAnswer } from '../store/practice';

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

      if (key === 'arrowleft') {
        handlers.onPrev?.();
      } else if (key === 'arrowright') {
        handlers.onNext?.();
      } else if (key === 'enter') {
        const currentQuestion = questions[currentIndex];
        if (currentQuestion && hasAnswer(answers[currentQuestion.id])) {
          handlers.onSubmit?.();
        }
      } else if (key === 'm') {
        handlers.onMark?.();
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