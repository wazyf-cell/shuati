import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, XCircle } from 'lucide-react';
import { Question, QuestionBank, QuestionType } from '../../types';

interface QuestionTableProps {
  questions: Question[];
  banks?: QuestionBank[];
  wrongCounts?: Record<string, number>;
  showBankColumn?: boolean;
  showWrongCount?: boolean;
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onRemoveWrong?: (questionId: string) => void;
}

type SortField = 'index' | 'type' | 'content';
type SortOrder = 'asc' | 'desc';

const typeLabels: Record<QuestionType, string> = {
  single: '单选',
  multiple: '多选',
  judge: '判断',
  fill: '填空题',
  short: '简答题',
};

const typeBadges: Record<QuestionType, string> = {
  single: 'badge-brand',
  multiple: 'badge-mint',
  judge: 'badge-sun',
  fill: 'badge-sky',
  short: 'badge-lava',
};

const typeSortOrder: Record<QuestionType, number> = {
  single: 0,
  multiple: 1,
  judge: 2,
  fill: 3,
  short: 4,
};

function truncate(text: string, maxLen: number = 30): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

function getSortIcon(
  field: SortField,
  currentField: SortField,
  currentOrder: SortOrder,
) {
  if (field !== currentField) {
    return <ArrowUpDown className="h-3.5 w-3.5 inline-block ml-1 opacity-40" />;
  }
  return currentOrder === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 inline-block ml-1" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 inline-block ml-1" />
  );
}

export function QuestionTable({
  questions,
  banks,
  wrongCounts,
  showBankColumn = false,
  showWrongCount = false,
  onEdit,
  onDelete,
  onRemoveWrong,
}: QuestionTableProps) {
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getBankName = (questionId: string): string => {
    if (!banks) return '-';
    for (const bank of banks) {
      if (bank.questions.some((q) => q.id === questionId)) {
        return bank.name;
      }
    }
    return '-';
  };

  const sortedQuestions = useMemo(() => {
    const list = [...questions];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'type') {
        cmp = typeSortOrder[a.type] - typeSortOrder[b.type];
      } else if (sortField === 'content') {
        cmp = a.content.localeCompare(b.content, 'zh-CN');
      }
      // 'index' fallback: keep original order for stable sort
      if (cmp === 0) {
        cmp = 0; // stable sort relies on JS engine, index preserves original order
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [questions, sortField, sortOrder]);

  const hasActions = !!(onEdit || onDelete || onRemoveWrong);

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm font-body">
        <thead>
          <tr className="bg-surface-50 dark:bg-surface-700 font-display text-sm font-bold text-surface-800 dark:text-surface-300">
            <th
              className="px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('index')}
            >
              序号
              {getSortIcon('index', sortField, sortOrder)}
            </th>
            <th
              className="px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('type')}
            >
              题型
              {getSortIcon('type', sortField, sortOrder)}
            </th>
            <th
              className="px-4 py-3 text-left cursor-pointer select-none min-w-[200px]"
              onClick={() => handleSort('content')}
            >
              题干
              {getSortIcon('content', sortField, sortOrder)}
            </th>
            <th className="px-4 py-3 text-left whitespace-nowrap">选项数</th>
            {showBankColumn && (
              <th className="px-4 py-3 text-left whitespace-nowrap">所属题库</th>
            )}
            {showWrongCount && (
              <th className="px-4 py-3 text-left whitespace-nowrap">错误次数</th>
            )}
            {hasActions && (
              <th className="px-4 py-3 text-left whitespace-nowrap">操作</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedQuestions.map((question, idx) => {
            const bankName = getBankName(question.id);
            const wrongCount = wrongCounts?.[question.id];
            const truncatedContent = truncate(question.content);

            return (
              <tr
                key={question.id}
                className="border-b border-surface-100 dark:border-surface-600 hover:bg-surface-50/50 dark:hover:bg-surface-700/30 transition-colors"
              >
                <td className="px-4 py-3 text-surface-600 dark:text-surface-400 font-mono text-xs">
                  {idx + 1}
                </td>
                <td className="px-4 py-3">
                  <span className={typeBadges[question.type]}>
                    {typeLabels[question.type]}
                  </span>
                </td>
                <td
                  className="px-4 py-3 text-surface-800 dark:text-surface-300 max-w-[300px]"
                  title={question.content}
                >
                  {truncatedContent}
                </td>
                <td className="px-4 py-3 text-surface-600 dark:text-surface-400 text-center">
                  {question.options.length}
                </td>
                {showBankColumn && (
                  <td className="px-4 py-3 text-surface-600 dark:text-surface-400 text-xs max-w-[120px] truncate">
                    {bankName}
                  </td>
                )}
                {showWrongCount && (
                  <td className="px-4 py-3 text-center">
                    {wrongCount != null && wrongCount > 0 ? (
                      <span className="text-accent-600 dark:text-accent-400 font-bold">
                        {wrongCount}
                      </span>
                    ) : (
                      <span className="text-surface-400 dark:text-surface-400">0</span>
                    )}
                  </td>
                )}
                {hasActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(question)}
                          className="btn-ghost text-sm px-3 py-2"
                          title="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(question)}
                          className="btn-ghost text-sm px-3 py-2 text-accent-600 hover:text-accent-700"
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onRemoveWrong && (
                        <button
                          onClick={() => onRemoveWrong(question.id)}
                          className="btn-ghost text-sm px-3 py-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                          title="移出错题本"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {questions.length === 0 && (
        <div className="text-center py-12 text-surface-600 dark:text-surface-500 font-body">
          暂无题目数据
        </div>
      )}
    </div>
  );
}