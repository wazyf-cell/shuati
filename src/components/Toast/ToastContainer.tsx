import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, ToastType } from '../../store/toast';

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
  success: 'border-accent-400 bg-accent-50 dark:bg-accent-900/30 text-accent-800 dark:text-accent-200 shadow-sm',
  error: 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 text-accent-800 dark:text-accent-200 shadow-sm',
  info: 'border-surface-400 bg-surface-50 dark:bg-surface-700/50 text-surface-800 dark:text-surface-200',
  warning: 'border-surface-400 bg-surface-50 dark:bg-surface-900/30 text-surface-700 dark:text-surface-200 shadow-sm',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-2 animate-slide-in ${colorMap[toast.type]}`}
          >
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-bold font-body">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}