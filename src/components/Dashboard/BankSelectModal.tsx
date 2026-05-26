import { useState } from 'react';
import { X, CheckSquare, Square } from 'lucide-react';
import { QuestionBank } from '../../types';

interface BankSelectModalProps {
  banks: QuestionBank[];
  onConfirm: (bankIds: string[]) => void;
  onClose: () => void;
}

export function BankSelectModal({ banks, onConfirm, onClose }: BankSelectModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = selected.size === banks.length;

  const toggleBank = (bankId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId);
      else next.add(bankId);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(banks.map((b) => b.id)));
    }
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm(Array.from(selected));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="card p-6 w-full max-w-md mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">
            多选题库刷题
          </h3>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-surface-500 dark:text-surface-300 mb-4">
          勾选要联合刷题的题库（至少选择一个）
        </p>

        <label className="flex items-center gap-3 p-3 mb-3 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors">
          {allSelected ? (
            <CheckSquare className="h-5 w-5 text-accent-500 flex-shrink-0" />
          ) : (
            <Square className="h-5 w-5 text-surface-400 dark:text-surface-400 flex-shrink-0" />
          )}
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="hidden"
          />
          <span className="text-sm font-bold text-surface-900 dark:text-surface-100">
            全选（{banks.length} 个题库）
          </span>
        </label>

        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {banks.map((bank) => (
            <label
              key={bank.id}
              className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
            >
              {selected.has(bank.id) ? (
                <CheckSquare className="h-5 w-5 text-accent-500 flex-shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-surface-400 dark:text-surface-400 flex-shrink-0" />
              )}
              <input
                type="checkbox"
                checked={selected.has(bank.id)}
                onChange={() => toggleBank(bank.id)}
                className="hidden"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-surface-900 dark:text-surface-100 block truncate">
                  {bank.name}
                </span>
              </div>
              <span className="text-xs text-surface-500 dark:text-surface-300 font-body flex-shrink-0">
                {bank.questions.length} 题
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 text-sm text-surface-500 dark:text-surface-300 font-body">
            {selected.size > 0
              ? `已选 ${selected.size} / ${banks.length} 个题库`
              : '请至少选择一个题库'
            }
          </div>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            开始刷题
          </button>
        </div>
      </div>
    </div>
  );
}