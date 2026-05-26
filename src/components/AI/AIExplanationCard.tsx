import { useState, useCallback } from 'react';
import { Bot, Copy, Loader2 } from 'lucide-react';
import { loadAIConfig, generateExplanation, getCachedExplanation, saveCachedExplanation, PLATFORM_PRESETS, getSelectedPromptName } from '../../utils/ai';
import { useToastStore } from '../../store';
import type { Question } from '../../types';

interface AIExplanationCardProps {
  question: Question;
  userAnswer: string[];
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function AIExplanationCard({ question, userAnswer }: AIExplanationCardProps) {
  const { addToast } = useToastStore();
  const [status, setStatus] = useState<Status>(() => {
    const cached = getCachedExplanation(question.id);
    return cached ? 'done' : 'idle';
  });
  const [text, setText] = useState(() => getCachedExplanation(question.id) || '');
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('');
  const [promptName, setPromptName] = useState('');
  const [timestamp, setTimestamp] = useState(0);

  const handleGenerate = useCallback(async () => {
    const config = loadAIConfig();
    if (!config) {
      addToast('请先在导航栏配置 AI 平台', 'error');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const result = await generateExplanation(question, userAnswer, config);
      const now = Date.now();
      saveCachedExplanation(question.id, result);
      setText(result);
      setStatus('done');
      setTimestamp(now);
      setPlatform(PLATFORM_PRESETS[config.platform]?.name || '');
      setPromptName(getSelectedPromptName(config));
    } catch (err: any) {
      setError(err.message || 'AI 请求失败');
      setStatus('error');
    }
  }, [question, userAnswer, addToast]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('已复制到剪贴板', 'success');
    } catch {
      addToast('复制失败', 'error');
    }
  }, [text, addToast]);

  // Idle — show generate button
  if (status === 'idle') {
    return (
      <button
        onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400 hover:border-accent-400 hover:text-accent-500 dark:hover:border-accent-500 dark:hover:text-accent-400 transition-colors text-sm"
      >
        <Bot className="h-4 w-4" />
        AI解析本题
      </button>
    );
  }

  // Loading
  if (status === 'loading') {
    return (
      <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-accent-500 animate-spin" />
        <span className="text-sm text-surface-500 dark:text-surface-400">AI 正在思考...</span>
      </div>
    );
  }

  // Error
  if (status === 'error') {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
        <p className="text-sm text-red-500 dark:text-red-400 mb-2">{error}</p>
        <button
          onClick={handleGenerate}
          className="text-xs text-red-500 hover:text-red-600 underline"
        >
          重试
        </button>
      </div>
    );
  }

  // Done
  return (
    <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent-500" />
          <span className="text-xs font-bold text-accent-600 dark:text-accent-400">
            {platform || 'AI'} 解析
            {promptName && (
              <span className="ml-1.5 text-surface-400 dark:text-surface-500">· {promptName}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {timestamp > 0 && (
            <span className="text-xs text-surface-400">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-accent-100 dark:hover:bg-accent-800/30 transition-colors"
            title="复制"
          >
            <Copy className="h-3.5 w-3.5 text-surface-400 hover:text-accent-500" />
          </button>
        </div>
      </div>
      <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}
