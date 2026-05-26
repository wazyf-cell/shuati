interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30"
      onClick={onCancel}
    >
      <div
        className="rounded-xl shadow-lg bg-white dark:bg-surface-800 p-6 max-w-md w-full animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-surface-900 dark:text-surface-100 font-body text-sm leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="bg-gradient-to-r from-accent-500 to-surface-400 text-white font-bold py-2.5 px-4 rounded-xl flex-1"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}