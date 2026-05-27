import { useState, useRef } from 'react';
import { FileSpreadsheet, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { parseExcel, ParsedQuestion } from '../../utils/excelParser';
import { parseTxt, getTxtTemplate } from '../../utils/txtParser';
import { useBankStore } from '../../store/bank';
import { useToastStore } from '../../store';
import { QuestionType } from '../../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ImportModalProps {
  bankId: string;
  onClose: () => void;
  onImported: () => void;
}

// ---------------------------------------------------------------------------
// 常量映射
// ---------------------------------------------------------------------------

const typeLabels: Record<QuestionType, string> = {
  single: '单选',
  multiple: '多选',
  judge: '判断',
  fill: '填空',
  short: '简答',
};

const typeBadges: Record<QuestionType, string> = {
  single: 'badge-brand',
  multiple: 'badge-mint',
  judge: 'badge-sun',
  fill: 'badge-lava',
  short: 'badge-rose',
};

/** 截断文本，超出 maxLen 追加省略号 */
function truncate(text: string, maxLen: number = 30): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

/** 根据文件名判断是否为 Excel 文件 */
function isExcelFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.xlsx') || lower.endsWith('.xls');
}

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

export function ImportModal({ bankId, onClose, onImported }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);

  // UI 状态
  const [showTemplate, setShowTemplate] = useState(false);
  const [showExcelTemplate, setShowExcelTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');

  const addToast = useToastStore((s) => s.addToast);

  // ---------------------------------------------------------------------------
  // 文件选择与解析
  // ---------------------------------------------------------------------------

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseStatus('parsing');
    setQuestions([]);

    try {
      if (isExcelFile(file.name)) {
        const result = await parseExcel(file);
        setQuestions(result.questions);
      } else {
        const text = await readFileAsText(file);
        const result = parseTxt(text);
        setQuestions(result.questions);
      }
      setParseStatus('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : '文件解析失败';
      setParseStatus('error');
      addToast(message, 'error');
    }
  };

  /** 以文本方式读取文件 */
  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? '');
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  // ---------------------------------------------------------------------------
  // 有效 / 无效题目
  // ---------------------------------------------------------------------------

  const validQuestions = questions.filter((q) => !q.errors || q.errors.length === 0);
  const invalidQuestions = questions.filter((q) => q.errors && q.errors.length > 0);

  // ---------------------------------------------------------------------------
  // 导入
  // ---------------------------------------------------------------------------

  const handleImport = async () => {
    if (validQuestions.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: validQuestions.length });

    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      useBankStore.getState().addQuestion(bankId, {
        type: q.type,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        analysis: q.analysis,
        subType: q.subType,
        subQuestions: q.subQuestions,
      });
      setImportProgress({ current: i + 1, total: validQuestions.length });
      // 给予微小延迟以保持 UI 响应并展示进度
      await new Promise((r) => setTimeout(r, 30));
    }

    setImporting(false);
    addToast(`成功导入 ${validQuestions.length} 道题目`, 'success');
    onImported();
  };

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------

  const hasResult = parseStatus === 'done' || parseStatus === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/50 backdrop-blur-sm p-4">
      <div className="card animate-bounce-in max-w-xl w-full max-h-[85vh] flex flex-col overflow-y-auto">
        {/* ---- 头部 ---- */}
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-display text-xl font-bold text-surface-800 dark:text-surface-200">
            导入题目
          </h2>
        </div>

        {/* ---- 文件选择 ---- */}
        <div className="px-5 pb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm font-body text-surface-600 dark:text-surface-400
              file:mr-4 file:py-2 file:px-5 file:rounded-xl file:border-0
              file:text-sm file:font-bold file:font-body
              file:bg-accent-500 file:text-white
              hover:file:bg-accent-600 file:cursor-pointer
              file:transition-colors"
          />
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 font-body">
            支持 .xlsx、.xls、.txt 格式
          </p>
        </div>

        {/* ---- 解析中 ---- */}
        {parseStatus === 'parsing' && (
          <div className="px-5 py-8 text-center font-body text-surface-600 dark:text-surface-400">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            正在解析文件...
          </div>
        )}

        {/* ---- 预览 ---- */}
        {hasResult && (
          <>
            {/* 统计标题 */}
            <div className="px-5 pb-2">
              <h3 className="font-display text-sm font-bold text-surface-800 dark:text-surface-200">
                导入预览 - 共 {questions.length} 题（有效 {validQuestions.length} 题，无效 {invalidQuestions.length} 题）
              </h3>
            </div>

            {/* 题目列表 */}
            <div className="px-5 max-h-64 overflow-y-auto scrollbar-thin">
              {questions.length === 0 && (
                <p className="py-8 text-center text-sm font-body text-surface-600 dark:text-surface-500">
                  没有可导入的题目
                </p>
              )}

              <div className="space-y-2 pb-2">
                {questions.map((q, idx) => {
                  const isValid = !q.errors || q.errors.length === 0;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl p-3 border-2 transition-colors ${
                        isValid
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20'
                          : 'border-accent-300 dark:border-accent-700 bg-accent-50/50 dark:bg-accent-900/20'
                      }`}
                    >
                      {/* 状态图标 */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-accent-600" />
                        )}
                      </div>

                      {/* 题型 badge */}
                      <span className={`${typeBadges[q.type]} flex-shrink-0 text-xs`}>
                        {typeLabels[q.type]}
                      </span>

                      {/* 题干 */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-body text-sm text-surface-800 dark:text-surface-300 truncate"
                          title={q.content}
                        >
                          {truncate(q.content)}
                        </p>
                        {/* 无效题目的第一条错误 */}
                        {!isValid && q.errors && (
                          <p className="text-xs text-accent-600 dark:text-accent-400 mt-0.5 font-body">
                            {q.errors[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ---- TXT 模板 ---- */}
        <div className="px-5 pt-2">
          <button
            onClick={() => setShowTemplate((prev) => !prev)}
            className="btn-ghost shadow-xs flex items-center gap-1.5 text-sm font-body"
          >
            <Eye className="h-4 w-4" />
            {showTemplate ? '收起模板' : '查看 TXT 格式模板'}
          </button>

          {showTemplate && (
            <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin rounded-xl border-2 border-surface-100 dark:border-surface-600 bg-surface-50 dark:bg-surface-700">
              <pre className="p-3 text-xs font-mono text-surface-800 dark:text-surface-300 whitespace-pre leading-relaxed">
                {getTxtTemplate()}
              </pre>
            </div>
          )}

          <button
            onClick={() => setShowExcelTemplate((prev) => !prev)}
            className="btn-ghost shadow-xs flex items-center gap-1.5 text-sm font-body mt-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {showExcelTemplate ? '收起格式' : '查看 Excel 格式规范'}
          </button>

          {showExcelTemplate && (
            <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin rounded-xl border-2 border-surface-100 dark:border-surface-600 bg-surface-50 dark:bg-surface-700">
              <table className="w-full text-xs font-body text-surface-800 dark:text-surface-300">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-500">
                    <th className="p-2 text-left font-bold">列名</th>
                    <th className="p-2 text-left font-bold">说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-surface-100 dark:border-surface-600">
                    <td className="p-2 font-mono">题型</td>
                    <td className="p-2">单选 / 多选 / 判断 / 填空 / 简答</td>
                  </tr>
                  <tr className="border-b border-surface-100 dark:border-surface-600">
                    <td className="p-2 font-mono">题干</td>
                    <td className="p-2">题目内容</td>
                  </tr>
                  <tr className="border-b border-surface-100 dark:border-surface-600">
                    <td className="p-2 font-mono">选项A ~ 选项F</td>
                    <td className="p-2">选项内容（填空/简答留空）</td>
                  </tr>
                  <tr className="border-b border-surface-100 dark:border-surface-600">
                    <td className="p-2 font-mono">正确答案</td>
                    <td className="p-2">
                      单选/判断：选项字母如 A<br />
                      多选：连续字母如 AB<br />
                      填空：逗号分隔各空答案如 H2O, CO2<br />
                      简答：参考答案文本
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">解析</td>
                    <td className="p-2">题目解析（选填）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ---- 底部按钮 ---- */}
        <div className="flex items-center justify-end gap-3 p-5 pt-4 mt-auto">
          <button
            onClick={onClose}
            disabled={importing}
            className="btn-outline shadow-xs font-body"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={validQuestions.length === 0 || importing}
            className="btn-primary shadow-xs font-body flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                导入中 {importProgress.current}/{importProgress.total}
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                确认导入{validQuestions.length > 0 ? `（${validQuestions.length} 题）` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;