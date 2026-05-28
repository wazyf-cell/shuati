import { ArrowLeft, ArrowRight, Send, Keyboard } from 'lucide-react';

interface BottomNavProps {
  onPrev: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  currentIndex: number;
  total: number;
  answeredCount: number;
  isLast?: boolean;
  onShowShortcuts?: () => void;
  showSubmit?: boolean;
}

export function BottomNav({
  onPrev,
  onNext,
  onSubmit,
  currentIndex,
  total,
  answeredCount,
  isLast = false,
  onShowShortcuts,
  showSubmit = true,
}: BottomNavProps) {
  return (
    <div className="sticky bottom-0 z-10 bg-surface-50/95 dark:bg-surface-800/95 backdrop-blur-xl border-t border-surface-200 dark:border-surface-700 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-surface-500 dark:text-surface-300 font-body">
            已答 {answeredCount} / {total} 题
          </span>
          {onShowShortcuts && (
            <button
              onClick={onShowShortcuts}
              className="flex items-center gap-1 text-xs text-surface-400 hover:text-accent-500 transition-colors font-body"
              aria-label="查看快捷键"
            >
              <Keyboard className="h-3 w-3" />
              快捷键
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={currentIndex <= 0}
            className="btn-outline flex items-center gap-1 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            上一题
          </button>

          {showSubmit && isLast && onSubmit ? (
            <button onClick={onSubmit} className="btn-secondary flex items-center gap-1 text-sm">
              <Send className="h-4 w-4" />
              提交答案
            </button>
          ) : (
            <button onClick={onNext} className="btn-outline flex items-center gap-1 text-sm">
              下一题
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
