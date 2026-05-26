import { memo } from 'react';
import { BookOpen, Trash2, PlayCircle, Hash, FileText } from 'lucide-react';
import { QuestionBank } from '../../types';

interface BankCardProps {
  bank: QuestionBank;
  onDelete: () => void;
  onSelect: () => void;
}

const gradientMap = [
  'from-accent-500 to-accent-600',
  'from-accent-400 to-accent-500',
  'from-surface-400 to-surface-500',
  'from-accent-400 to-accent-400',
  'from-accent-300 to-accent-400',
];

export const BankCard = memo(function BankCard({ bank, onDelete, onSelect }: BankCardProps) {
  const typeCounts = bank.questions.reduce(
    (acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const colorIdx = bank.name.length % gradientMap.length;
  const gradient = gradientMap[colorIdx];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定删除题库「${bank.name}」吗？`)) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onSelect}
      className="card cursor-pointer group overflow-hidden"
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-xs`}>
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-surface-900 dark:text-surface-100">
                {bank.name}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 font-body">
                {bank.questions.length} 道题目
              </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="p-2 text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            title="删除题库"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {typeCounts['single'] > 0 && (
            <span className="badge-accent">
              <FileText className="h-3 w-3 mr-1" />
              单选 {typeCounts['single']}
            </span>
          )}
          {typeCounts['multiple'] > 0 && (
            <span className="badge-accent">
              <FileText className="h-3 w-3 mr-1" />
              多选 {typeCounts['multiple']}
            </span>
          )}
          {typeCounts['judge'] > 0 && (
            <span className="badge-surface">
              <Hash className="h-3 w-3 mr-1" />
              判断 {typeCounts['judge']}
            </span>
          )}
          {typeCounts['fill'] > 0 && (
            <span className="badge-sky">
              <FileText className="h-3 w-3 mr-1" />
              填空 {typeCounts['fill']}
            </span>
          )}
          {typeCounts['short'] > 0 && (
            <span className="badge-accent">
              <FileText className="h-3 w-3 mr-1" />
              简答 {typeCounts['short']}
            </span>
          )}
        </div>

        <button className="w-full btn-primary flex items-center justify-center gap-2">
          <PlayCircle className="h-5 w-5" />
          开始刷题
        </button>
      </div>
    </div>
  );
});