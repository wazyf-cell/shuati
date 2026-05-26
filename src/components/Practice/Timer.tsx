import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  countdownSeconds?: number;
  onTimeUp?: () => void;
  isPaused?: boolean;
}

export function Timer({ countdownSeconds, onTimeUp, isPaused = false }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const isCountdown = countdownSeconds !== undefined && countdownSeconds > 0;
  const totalSeconds = isCountdown ? Math.max(0, countdownSeconds - elapsed) : elapsed;

  const formatTime = useCallback((total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (isCountdown && next >= countdownSeconds!) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeout(() => onTimeUpRef.current?.(), 0);
          return countdownSeconds!;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, isCountdown, countdownSeconds]);

  const isWarning = isCountdown && totalSeconds <= 60;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
      isWarning
        ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 animate-pulse shadow-sm'
        : 'border-accent-400 bg-accent-50 dark:bg-accent-900/30 shadow-sm'
    }`}>
      <Clock className={`h-4 w-4 ${isWarning ? 'text-accent-600' : 'text-emerald-500'}`} />
      <span className={`font-mono font-bold text-lg font-body ${isWarning ? 'text-accent-600' : 'text-emerald-500'}`}>
        {formatTime(totalSeconds)}
      </span>
    </div>
  );
}