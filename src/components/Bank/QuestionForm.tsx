import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { useBankStore } from '../../store';
import { useToastStore } from '../../store/toast';
import { Question, QuestionType, QuestionOption, SubQuestion } from '../../types';
import { loadAIConfig, generateExplanation } from '../../utils/ai';

// 可拖拽分割线的小题行
function SubQuestionRow({
  sq,
  idx,
  onUpdate,
  onRemove,
}: {
  sq: SubQuestion;
  idx: number;
  onUpdate: (i: number, label: string, answer: string) => void;
  onRemove: (i: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = () => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !rowRef.current) return;
      const rect = rowRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const totalW = rect.width - 50; // minus delete button
      const labelW = Math.max(60, Math.min(totalW - 60, x));
      const labelEl = rowRef.current.querySelector('.sub-label') as HTMLElement;
      const ansEl = rowRef.current.querySelector('.sub-answer') as HTMLElement;
      if (labelEl) labelEl.style.width = labelW + 'px';
      if (ansEl) ansEl.style.flex = '0 0 auto';
      if (ansEl) ansEl.style.width = (totalW - labelW - 2) + 'px';
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-0 border border-surface-200 dark:border-surface-600 rounded-lg overflow-hidden"
    >
      <input
        value={sq.label}
        onChange={(e) => onUpdate(idx, e.target.value, sq.answer)}
        placeholder="小题编号"
        className="sub-label input border-0 rounded-none flex-shrink-0"
        style={{ width: '30%', minWidth: '60px' }}
      />
      <div
        onMouseDown={onMouseDown}
        className="w-1.5 h-8 bg-surface-300 dark:bg-surface-500 cursor-col-resize hover:bg-accent-500 dark:hover:bg-accent-500 active:bg-accent-600 transition-colors flex-shrink-0"
      />
      <input
        value={sq.answer}
        onChange={(e) => onUpdate(idx, sq.label, e.target.value)}
        placeholder="参考答案"
        className="sub-answer input border-0 rounded-none flex-1"
      />
      <button
        onClick={() => onRemove(idx)}
        className="p-2 text-surface-300 dark:text-surface-400 hover:text-accent-500 rounded-r-lg transition-colors flex-shrink-0 border-l border-surface-200 dark:border-surface-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface QuestionFormProps {
  bankId: string;
  question: Question | null;
  onClose: () => void;
}

export function QuestionForm({ bankId, question, onClose }: QuestionFormProps) {
  const { addQuestion, updateQuestion } = useBankStore();
  const { addToast } = useToastStore();
  const [type, setType] = useState<QuestionType>(question?.type || 'single');
  const [content, setContent] = useState(question?.content || '');
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options || [
      { key: 'A', content: '' },
      { key: 'B', content: '' },
    ]
  );
  const [correctAnswer, setCorrectAnswer] = useState<string[]>(question?.correctAnswer || []);
  const [analysis, setAnalysis] = useState(question?.analysis || '');
  const [aiGenerating, setAiGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [analysis]);
  const [subType, setSubType] = useState<'single' | 'group'>(question?.subType || 'single');
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>(
    question?.subQuestions || [{ id: crypto.randomUUID(), label: '', answer: '' }]
  );

  const handleAddOption = () => {
    if (options.length >= 8) return;
    const nextKey = String.fromCharCode(65 + options.length);
    setOptions([...options, { key: nextKey, content: '' }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const removed = options.filter((_, i) => i !== idx);
    const rekeyed = removed.map((opt, i) => ({
      ...opt,
      key: String.fromCharCode(65 + i),
    }));
    setOptions(rekeyed);
    setCorrectAnswer((prev) =>
      prev
        .filter((k) => k !== options[idx].key)
        .map((k) => {
          const oldIdx = options.findIndex((o) => o.key === k);
          if (oldIdx < 0 || oldIdx === idx) return k;
          return oldIdx > idx ? String.fromCharCode(65 + oldIdx - 1) : String.fromCharCode(65 + oldIdx);
        })
    );
  };

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    setCorrectAnswer([]);
    if (newType === 'judge') {
      setOptions([
        { key: 'A', content: '正确' },
        { key: 'B', content: '错误' },
      ]);
    }
    if (newType !== 'short') {
      setSubType('single');
      setSubQuestions([{ id: crypto.randomUUID(), label: '', answer: '' }]);
    }
  };

  const handleAddSubQuestion = () => {
    setSubQuestions([...subQuestions, { id: crypto.randomUUID(), label: '', answer: '' }]);
  };

  const handleRemoveSubQuestion = (idx: number) => {
    if (subQuestions.length <= 1) return;
    setSubQuestions(subQuestions.filter((_, i) => i !== idx));
  };

  const handleAIAnalyze = async () => {
    if (!content.trim()) {
      addToast('请先输入题目内容', 'warning');
      return;
    }
    const config = loadAIConfig();
    if (!config) {
      addToast('请先在 AI 平台配置中设置 API 密钥', 'warning');
      return;
    }
    setAiGenerating(true);
    try {
      const q: Question = {
        id: question?.id || '',
        type,
        content,
        options,
        correctAnswer,
        analysis: '',
      };
      const result = await generateExplanation(q, [], config);
      setAnalysis(result);
      // 立即保存到题库
      const qData: any = {
        type,
        content: content.trim(),
        options: type === 'fill' || type === 'short' ? [] : options.filter((o) => o.content.trim()),
        correctAnswer: [...correctAnswer],
        analysis: result.trim() || '',
        ...(type === 'short' ? { subType, subQuestions } : {}),
      };
      if (question?.id) {
        updateQuestion(bankId, question.id, qData);
      } else {
        addQuestion(bankId, qData);
      }
      addToast('AI 解析已生成并保存', 'success');
    } catch (e: any) {
      addToast(`AI 生成失败: ${e.message || e}`, 'error');
    }
    setAiGenerating(false);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      addToast('请填写题目内容', 'warning');
      return;
    }

    if (type === 'fill') {
      if (!correctAnswer[0]?.trim()) {
        addToast('请填写正确答案', 'warning');
        return;
      }
    } else if (type === 'short') {
      if (subType === 'single') {
        if (!correctAnswer[0]?.trim()) {
          addToast('请填写参考答案', 'warning');
          return;
        }
      } else {
        if (subQuestions.length === 0) {
          addToast('请至少添加一个小题', 'warning');
          return;
        }
        for (const sq of subQuestions) {
          if (!sq.label.trim()) {
            addToast('请填写小题编号', 'warning');
            return;
          }
          if (!sq.answer.trim()) {
            addToast('请填写小题参考答案', 'warning');
            return;
          }
        }
      }
    } else {
      // single / multiple / judge
      const filledOptions = options.filter((o) => o.content.trim());
      if (filledOptions.length < 2) {
        addToast('请至少填写两个选项', 'warning');
        return;
      }

      if (correctAnswer.length === 0) {
        addToast('请选择正确答案', 'warning');
        return;
      }
    }

    const qData = {
      type,
      content: content.trim(),
      options: type === 'fill' || type === 'short' ? [] : options.filter((o) => o.content.trim()),
      correctAnswer: [...correctAnswer],
      analysis: analysis.trim() || '',
      ...(type === 'short' ? { subType, subQuestions } : {}),
    };

    if (question) {
      updateQuestion(bankId, question.id, qData);
      addToast('题目已更新', 'success');
    } else {
      addQuestion(bankId, qData);
      addToast('题目添加成功', 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="card p-6 w-full max-w-2xl mx-4 mb-8 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-bold text-surface-500 dark:text-surface-100">
            {question ? '编辑题目' : '添加题目'}
          </h3>
          <button onClick={onClose} className="p-2 text-surface-300 dark:text-surface-400 hover:text-accent-500 rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['single', 'multiple', 'judge', 'fill', 'short'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                type === t
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300'
              }`}
            >
              {{ single: '单选题', multiple: '多选题', judge: '判断题', fill: '填空题', short: '简答题' }[t]}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-surface-500 dark:text-surface-100 mb-2 font-body">题目内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入题目内容..."
              className="input min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Options area - only for single/multiple/judge */}
          {type !== 'fill' && type !== 'short' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-surface-500 dark:text-surface-100 font-body">
                  选项（点击选项标记为正确答案）
                </label>
                <button onClick={handleAddOption} className="btn-ghost text-sm flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  添加选项
                </button>
              </div>
              <div className="space-y-2">
                {options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (correctAnswer.includes(option.key)) {
                          setCorrectAnswer(correctAnswer.filter((k) => k !== option.key));
                        } else {
                          if (type === 'single' || type === 'judge') {
                            setCorrectAnswer([option.key]);
                          } else {
                            setCorrectAnswer([...correctAnswer, option.key]);
                          }
                        }
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 transition-all ${
                        correctAnswer.includes(option.key)
                          ? 'bg-accent-500 text-white border-accent-500'
                          : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300 border-surface-200 dark:border-surface-600'
                      }`}
                    >
                      {option.key}
                    </button>
                    <input
                      value={option.content}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = { ...option, content: e.target.value };
                        setOptions(newOpts);
                      }}
                      placeholder={`选项 ${option.key} 内容...`}
                      className="input flex-1"
                      disabled={type === 'judge' && idx < 2}
                    />
                    {type !== 'judge' && (
                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-surface-300 dark:text-surface-400 hover:text-accent-500 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 填空题 - correctAnswer input */}
          {type === 'fill' && (
            <div>
              <label className="block text-sm font-bold text-surface-500 dark:text-surface-100 mb-2 font-body">正确答案</label>
              <input
                value={correctAnswer[0] || ''}
                onChange={(e) => setCorrectAnswer([e.target.value])}
                placeholder="每空答案用英文逗号分隔，如 北京,2024"
                className="input"
              />
            </div>
          )}

          {/* 简答题 - subType toggle & fields */}
          {type === 'short' && (
            <>
              <div className="flex gap-2">
                {(['single', 'group'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSubType(st)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      subType === st
                        ? 'bg-accent-500 text-white shadow-sm'
                        : 'bg-surface-50 dark:bg-surface-700 text-surface-400 dark:text-surface-300'
                    }`}
                  >
                    {{ single: '单题单答', group: '大题多小题' }[st]}
                  </button>
                ))}
              </div>

              {subType === 'single' && (
                <div>
                  <label className="block text-sm font-bold text-surface-500 dark:text-surface-100 mb-2 font-body">参考答案</label>
                  <input
                    value={correctAnswer[0] || ''}
                    onChange={(e) => setCorrectAnswer([e.target.value])}
                    placeholder="参考答案"
                    className="input"
                  />
                </div>
              )}

              {subType === 'group' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-surface-500 dark:text-surface-100 font-body">小题列表</label>
                    <button onClick={handleAddSubQuestion} className="btn-ghost text-sm flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      添加小题
                    </button>
                  </div>
                  <div className="space-y-2">
                    {subQuestions.map((sq, idx) => (
                      <SubQuestionRow
                        key={sq.id}
                        sq={sq}
                        idx={idx}
                        onUpdate={(i, label, answer) => {
                          const updated = [...subQuestions];
                          updated[i] = { ...updated[i], label, answer };
                          setSubQuestions(updated);
                        }}
                        onRemove={(i) => handleRemoveSubQuestion(i)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-surface-500 dark:text-surface-100 mb-2 font-body">题目解析（选填）</label>
            <textarea
              ref={textareaRef}
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="输入题目解析..."
              className="input min-h-[60px] overflow-hidden"
              rows={1}
            />
            <button
              onClick={handleAIAnalyze}
              disabled={aiGenerating}
              className="mt-2 btn-outline flex items-center gap-2 text-sm text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20 disabled:opacity-50"
            >
              <Sparkles className={`h-4 w-4 ${aiGenerating ? 'animate-spin' : ''}`} />
              {aiGenerating ? 'AI 正在思考...' : '🤖 AI 生成解析'}
            </button>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={handleSubmit} className="btn-primary">{question ? '保存修改' : '添加题目'}</button>
        </div>
      </div>
    </div>
  );
}