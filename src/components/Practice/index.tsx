import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Send, RotateCcw, Trophy, Keyboard, Play, ChevronUp, ChevronDown, ChevronRight, Lightbulb, Bot, Copy, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { usePracticeStore, useBankStore, useWrongStore, useToastStore, useConfigStore } from '../../store';
import { hasAnswer, AnswerValue } from '../../store/practice';
import { storage } from '../../utils/storage';
import { PracticeRecord, QuestionType, Question } from '../../types';
import { loadAIConfig, generateExplanation, getCachedExplanation, saveCachedExplanation, PLATFORM_PRESETS, getSelectedPromptName } from '../../utils/ai';
import { QuestionNav } from './QuestionNav';
import { QuestionView } from './QuestionView';
import { OptionPanel } from './OptionPanel';
import { FeedbackPanel } from './FeedbackPanel';
import { Timer } from './Timer';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface PracticeProps {
  bankId?: string;
  bankIds?: string[];
  presetQuestionIds?: string[];
  mode?: 'normal' | 'wrong-review' | 'favorite';
  onBack: () => void;
}

type Phase = 'config' | 'practice' | 'review';

type AIStatus = 'idle' | 'loading' | 'done' | 'error';

interface AIState {
  status: AIStatus;
  text?: string;
  error?: string;
  timestamp?: number;
  platform?: string;
  promptName?: string;
}

const typeLabels: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
};

const typeBadges: Record<QuestionType, string> = {
  single: 'badge-accent',
  multiple: 'badge-accent',
  judge: 'badge-surface',
  fill: 'badge-accent',
  short: 'badge-accent',
};

export function Practice({ bankId, bankIds, presetQuestionIds, mode, onBack }: PracticeProps) {
  const { banks } = useBankStore();
  const { startPractice, currentIndex, questions, answers, setAnswer, nextQuestion, prevQuestion, submitAnswers, isSubmitted, resetPractice, markQuestion } = usePracticeStore();
  const { addWrong } = useWrongStore();
  const { addToast } = useToastStore();
  const { randomOptionOrder, setRandomOptionOrder, multiBankTypeOrder, setMultiBankTypeOrder, showAnswerSwitch, setShowAnswerSwitch, enableAIInPractice, setEnableAIInPractice, autoAddWrong, setAutoAddWrong, favorites } = useConfigStore();

  const [phase, setPhase] = useState<Phase>('config');
  const [questionCount, setQuestionCount] = useState(10);
  const [isRandom, setIsRandom] = useState(true);
  const [enableTimer, setEnableTimer] = useState(false);
  const [timerMode, setTimerMode] = useState<'countup' | 'countdown'>('countup');
  const [countdownMinutes, setCountdownMinutes] = useState(30);
  const [timerSeconds, setTimerSeconds] = useState<number | undefined>(undefined);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [usePerType, setUsePerType] = useState(false);
  const [typeCounts, setTypeCounts] = useState<{ single: number; multiple: number; judge: number; fill: number; short: number }>({
    single: 10,
    multiple: 10,
    judge: 10,
    fill: 5,
    short: 3,
  });
  const [typeOrder, setTypeOrder] = useState<QuestionType[]>(['single', 'multiple', 'judge', 'fill', 'short']);
  const [bankCounts, setBankCounts] = useState<Record<string, number>>({});
  const [excludePracticed, setExcludePracticed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [viewedAnswerIds, setViewedAnswerIds] = useState<Set<string>>(new Set());
  const [submitResult, setSubmitResult] = useState<{ correctCount: number; totalCount: number; results: Record<string, boolean>; startTime: number; endTime: number } | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [aiStates, setAiStates] = useState<Record<string, AIState>>({});
  const [practiceShowAI, setPracticeShowAI] = useState(false);

  const hasAIConfig = loadAIConfig() !== null;
  const bank = banks.find((b) => b.id === bankId);
  const resolvedBankIds: string[] = bankIds && bankIds.length > 0 ? bankIds : (bankId ? [bankId] : []);
  const selectedBanks = resolvedBankIds.map(id => banks.find(b => b.id === id)).filter(Boolean) as typeof banks;
  const isMultiBank = resolvedBankIds.length > 1;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  useEffect(() => {
    if (phase === 'config' && isMultiBank) {
      const initial: Record<string, number> = {};
      selectedBanks.forEach((bk) => {
        initial[bk.id] = Math.min(5, bk.questions.length);
      });
      setBankCounts(initial);
    }
  }, [phase, bankIds?.join(',')]);

  useEffect(() => {
    if (phase === 'practice' && !isSubmitted) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [phase, isSubmitted]);

  useEffect(() => {
    if (phase === 'review' && questions.length > 0) {
      const newAiStates: Record<string, AIState> = {};
      questions.forEach((q) => {
        const cached = getCachedExplanation(q.id);
        if (cached) {
          newAiStates[q.id] = { status: 'done', text: cached };
        }
      });
      setAiStates(prev => ({ ...newAiStates, ...prev }));
    }
  }, [phase, questions]);

  const handleStartPractice = () => {
    if (presetQuestionIds && presetQuestionIds.length > 0) {
      const allBanks = useBankStore.getState().banks;
      const pickedQuestions: Question[] = [];
      for (const qId of presetQuestionIds) {
        for (const b of allBanks) {
          const q = b.questions.find(qq => qq.id === qId);
          if (q) { pickedQuestions.push(q); break; }
        }
      }
      if (pickedQuestions.length === 0) {
        addToast('没有找到可练习的题目', 'error');
        return;
      }
      startPractice(pickedQuestions, favorites);
      setPhase('practice');
      setSubmitResult(null);
      return;
    }

    let pickedQuestions: Question[] = [];

    let correctIds: Set<string> | null = null;
    if (excludePracticed) {
      const records = storage.getRecords();
      correctIds = new Set<string>();
      records.forEach(r => {
        Object.entries(r.results).forEach(([qId, ok]) => {
          if (ok) correctIds!.add(qId);
        });
      });
    }

    if (isMultiBank) {
      if (usePerType) {
        // 多题库 + 按题型分配：跨各题库按题型依次抽取
        for (const type of multiBankTypeOrder) {
          let pool: Question[] = [];
          for (const bankId of resolvedBankIds) {
            const bank = banks.find((b) => b.id === bankId);
            if (!bank) continue;
            const typeQuestions = correctIds
              ? bank.questions.filter(q => q.type === type && !correctIds.has(q.id))
              : bank.questions.filter(q => q.type === type);
            pool.push(...typeQuestions);
          }
          const count = Math.min(typeCounts[type], pool.length);
          const selected = isRandom
            ? [...pool].sort(() => Math.random() - 0.5).slice(0, count)
            : pool.slice(0, count);
          pickedQuestions.push(...selected);
        }
      } else {
        for (const bankId of resolvedBankIds) {
          const bank = banks.find((b) => b.id === bankId);
          if (!bank) continue;
          const bankQuestions = correctIds
            ? bank.questions.filter(q => !correctIds.has(q.id))
            : bank.questions;
          const count = Math.min(bankCounts[bankId] || 5, bankQuestions.length);
          const selected = isRandom
            ? [...bankQuestions].sort(() => Math.random() - 0.5).slice(0, count)
            : bankQuestions.slice(0, count);
          pickedQuestions.push(...selected);
        }
      }
      if (pickedQuestions.length === 0) {
        addToast('所有题库均无可用题目', 'error');
        return;
      }
      const typeIndex = (q: Question) => {
        const idx = multiBankTypeOrder.indexOf(q.type);
        return idx === -1 ? 999 : idx;
      };
      pickedQuestions.sort((a, b) => typeIndex(a) - typeIndex(b));
      if (isRandom) {
        const groups: Record<string, Question[]> = {};
        for (const q of pickedQuestions) {
          if (!groups[q.type]) groups[q.type] = [];
          groups[q.type].push(q);
        }
        pickedQuestions = [];
        for (const type of multiBankTypeOrder) {
          if (groups[type]) {
            pickedQuestions.push(...groups[type].sort(() => Math.random() - 0.5));
          }
        }
      }
    } else {
      const bank = banks.find((b) => b.id === resolvedBankIds[0]);
      let allQuestions = bank?.questions || [];
      if (correctIds) {
        allQuestions = allQuestions.filter(q => !correctIds!.has(q.id));
      }

      if (usePerType) {
        for (const type of typeOrder) {
          const typeQuestions = allQuestions.filter((q) => q.type === type);
          const count = Math.min(typeCounts[type], typeQuestions.length);
          if (isRandom) {
            const shuffled = [...typeQuestions].sort(() => Math.random() - 0.5);
            pickedQuestions.push(...shuffled.slice(0, count));
          } else {
            pickedQuestions.push(...typeQuestions.slice(0, count));
          }
        }
      } else {
        if (isRandom) {
          pickedQuestions = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, questionCount);
        } else {
          pickedQuestions = allQuestions.slice(0, questionCount);
        }
      }
    }

    if (pickedQuestions.length === 0) {
      addToast('没有符合条件的题目', 'error');
      return;
    }

    startPractice(pickedQuestions, favorites);
    setPhase('practice');
    setSubmitResult(null);
    if (enableTimer) {
      setTimerSeconds(timerMode === 'countdown' ? countdownMinutes * 60 : undefined);
    } else {
      setTimerSeconds(undefined);
    }
  };

  const doSubmit = () => {
    setConfirmOpen(false);

    const { totalCount } = submitAnswers();
    const rawResults = usePracticeStore.getState().results;
    const questionResults: Record<string, boolean> = { ...rawResults };
    viewedAnswerIds.forEach((qId) => {
      questionResults[qId] = false;
    });

    const actualCorrect = Object.values(questionResults).filter(Boolean).length;

    setSubmitResult({
      correctCount: actualCorrect,
      totalCount,
      results: questionResults,
      startTime: usePracticeStore.getState().startTime,
      endTime: Date.now(),
    });

    const record: PracticeRecord = {
      id: Date.now().toString(),
      bankIds: bankIds || (bankId ? [bankId] : []),
      bankId: bankId || (bankIds ? bankIds[0] : ''),
      questionIds: questions.map((q) => q.id),
      answers: { ...answers },
      results: questionResults,
      startTime: usePracticeStore.getState().startTime,
      endTime: Date.now(),
      totalCount,
      correctCount: actualCorrect,
      source: mode === 'wrong-review' ? 'wrong-review' : 'bank',
    };
    const records = storage.getRecords();
    storage.setRecords([...records, record]);

    questions.forEach((q) => {
      const correct = questionResults[q.id] ?? false;
      if (correct && mode === 'wrong-review') {
        // 错题重刷：答对则移出错题本
        // 收藏刷题：不移除
        useWrongStore.getState().removeWrong(q.id);
      }
      if (!correct) {
        // 自动加入错题本（可配置）
        if (autoAddWrong) {
          const userAns: AnswerValue | undefined = answers[q.id];
          const wrongAns: string[] = Array.isArray(userAns) ? userAns : [];
          const questionBank = banks.find((b) => b.questions.some((bq) => bq.id === q.id));
          if (questionBank) {
            addWrong(q.id, questionBank.id, wrongAns, q.correctAnswer);
          }
        }
      }
    });

    setPhase('review');
    setReviewIndex(0);
  };

  const handleSubmit = () => {
    const actualUnanswered = questions.filter((q) => !hasAnswer(answers[q.id]) && !viewedAnswerIds.has(q.id)).length;
    if (actualUnanswered > 0) {
      setConfirmOpen(true);
      return;
    }
    doSubmit();
  };

  const handleReset = () => {
    resetPractice();
    setPhase('config');
    setSubmitResult(null);
    setTimerSeconds(undefined);
    setViewedAnswerIds(new Set());
    setReviewIndex(0);
    setAiStates({});
    setPracticeShowAI(false);
  };

  const handleBackToConfig = () => {
    setPhase('config');
    setSubmitResult(null);
    setViewedAnswerIds(new Set());
    setReviewIndex(0);
    setAiStates({});
    setPracticeShowAI(false);
  };

  const handleViewAnswer = (qId: string) => {
    setViewedAnswerIds(prev => {
      const next = new Set(prev);
      next.add(qId);
      return next;
    });
  };

  const handlePracticeAIExplain = async () => {
    const q = questions[currentIndex];
    if (!q) return;
    const userAns: AnswerValue | undefined = answers[q.id];
    const userAnswer: string[] = Array.isArray(userAns) ? userAns : [];

    const config = loadAIConfig();
    if (!config) {
      addToast('请先在导航栏配置 AI 平台', 'error');
      return;
    }

    setPracticeShowAI(true);
    setAiStates(prev => ({
      ...prev,
      [q.id]: { status: 'loading' },
    }));

    try {
      const text = await generateExplanation(q, userAnswer, config);
      const now = Date.now();
      saveCachedExplanation(q.id, text);
      setAiStates(prev => ({
        ...prev,
        [q.id]: { status: 'done', text, timestamp: now, platform: PLATFORM_PRESETS[config.platform]?.name, promptName: getSelectedPromptName(config) },
      }));
    } catch (err: any) {
      setAiStates(prev => ({
        ...prev,
        [q.id]: { status: 'error', error: err.message || 'AI 请求失败' },
      }));
    }
  };

  const handleReviewAIExplain = async (qId: string) => {
    const q = questions.find(qq => qq.id === qId);
    if (!q) return;
    const userAns: AnswerValue | undefined = answers[qId];
    const userAnswer: string[] = Array.isArray(userAns) ? userAns : [];

    const config = loadAIConfig();
    if (!config) {
      addToast('请先在导航栏配置 AI 平台', 'error');
      return;
    }

    setAiStates(prev => ({
      ...prev,
      [qId]: { status: 'loading' },
    }));

    try {
      const text = await generateExplanation(q, userAnswer, config);
      const now = Date.now();
      saveCachedExplanation(qId, text);
      setAiStates(prev => ({
        ...prev,
        [qId]: { status: 'done', text, timestamp: now, platform: PLATFORM_PRESETS[config.platform]?.name, promptName: getSelectedPromptName(config) },
      }));
    } catch (err: any) {
      setAiStates(prev => ({
        ...prev,
        [qId]: { status: 'error', error: err.message || 'AI 请求失败' },
      }));
    }
  };

  const handleBatchAI = async () => {
    if (!submitResult) return;
    const config = loadAIConfig();
    if (!config) {
      addToast('请先在导航栏配置 AI 平台', 'error');
      return;
    }

    const wrongIds = questions
      .filter(q => submitResult.results[q.id] === false)
      .map(q => q.id)
      .filter(id => {
        const s = aiStates[id];
        return !s || s.status === 'idle' || s.status === 'error';
      });

    if (wrongIds.length === 0) {
      addToast('所有错题解析已生成', 'info');
      return;
    }

    const concurrency = 3;
    for (let i = 0; i < wrongIds.length; i += concurrency) {
      const batch = wrongIds.slice(i, i + concurrency);
      await Promise.all(batch.map(id => handleReviewAIExplain(id)));
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('已复制到剪贴板', 'success');
    } catch {
      addToast('复制失败', 'error');
    }
  };

  useKeyboardShortcuts({
    onPrev: prevQuestion,
    onNext: nextQuestion,
    onSubmit: handleSubmit,
    onMark: () => {
      const q = questions[currentIndex];
      if (q) markQuestion(q.id);
    },
  });

  const renderAIExplanationCard = (qId: string) => {
    const state = aiStates[qId];
    if (!state || state.status === 'idle') {
      return (
        <button
          onClick={() => handleReviewAIExplain(qId)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400 hover:border-accent-400 hover:text-accent-500 dark:hover:border-accent-500 dark:hover:text-accent-400 transition-colors text-sm"
        >
          <Bot className="h-4 w-4" />
          AI解析本题
        </button>
      );
    }

    if (state.status === 'loading') {
      return (
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-accent-500 animate-spin" />
          <span className="text-sm text-surface-500 dark:text-surface-400">AI 正在思考...</span>
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <p className="text-sm text-red-500 dark:text-red-400 mb-2">{state.error}</p>
          <button
            onClick={() => handleReviewAIExplain(qId)}
            className="text-xs text-red-500 hover:text-red-600 underline"
          >
            重试
          </button>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent-500" />
            <span className="text-xs font-bold text-accent-600 dark:text-accent-400">
              {state.platform || 'AI'} 解析
              {state.promptName && (
                <span className="ml-1.5 text-surface-400 dark:text-surface-500">· {state.promptName}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {state.timestamp && (
              <span className="text-xs text-surface-400">
                {new Date(state.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => handleCopy(state.text || '')}
              className="p-1 rounded hover:bg-accent-100 dark:hover:bg-accent-800/30 transition-colors"
              title="复制"
            >
              <Copy className="h-3.5 w-3.5 text-surface-400 hover:text-accent-500" />
            </button>
          </div>
        </div>
        <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
          {state.text}
        </p>
      </div>
    );
  };

  if (phase === 'config') {
    return (
      <div className="max-w-lg mx-auto animate-scale-in">
        <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        <div className="card p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-surface-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Play className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
              {mode === 'favorite' && presetQuestionIds ? '收藏刷题' : mode === 'wrong-review' && presetQuestionIds ? '错题重刷' : (isMultiBank ? '多题库联合刷题' : (bank?.name || '刷题'))}
            </h2>
            <p className="section-subtitle mt-1">
              {mode === 'favorite' && presetQuestionIds ? (
                `已锁定 ${presetQuestionIds.length} 道收藏题目`
              ) : mode === 'wrong-review' && presetQuestionIds ? (
                `已锁定 ${presetQuestionIds.length} 道错题`
              ) : (() => {
                if (isMultiBank) {
                  if (excludePracticed) {
                    const recs = storage.getRecords();
                    const cIds = new Set<string>();
                    recs.forEach(r => Object.entries(r.results).forEach(([qId, ok]) => { if (ok) cIds.add(qId); }));
                    const available = selectedBanks.reduce((s, b) => s + b.questions.filter(q => !cIds.has(q.id)).length, 0);
                    return `${selectedBanks.length} 个题库 · 可用 ${available} 道题目（已排除已刷）`;
                  }
                  return `${selectedBanks.length} 个题库 · 共 ${selectedBanks.reduce((sum, b) => sum + b.questions.length, 0)} 道题目`;
                }
                if (excludePracticed) {
                  const recs = storage.getRecords();
                  const cIds = new Set<string>();
                  recs.forEach(r => Object.entries(r.results).forEach(([qId, ok]) => { if (ok) cIds.add(qId); }));
                  const available = bank ? bank.questions.filter(q => !cIds.has(q.id)).length : 0;
                  return `可用 ${available} 道题目（已排除已刷）`;
                }
                return `共 ${bank?.questions.length || 0} 道题目`;
              })()}
            </p>
          </div>

          {isMultiBank && !usePerType && (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-display font-bold text-surface-500 dark:text-surface-300">各题库抽题数量</h3>
              {selectedBanks.map((bk) => (
                <div key={bk.id} className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">
                      {bk.name}：可用 {bk.questions.length} 题
                    </label>
                    <span className="text-sm font-bold text-accent-500 font-body">
                      {bankCounts[bk.id] || Math.min(5, bk.questions.length)} 题
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={bk.questions.length || 1}
                    value={bankCounts[bk.id] || Math.min(5, bk.questions.length)}
                    onChange={(e) =>
                      setBankCounts({ ...bankCounts, [bk.id]: parseInt(e.target.value) })
                    }
                    className="w-full accent-accent-500"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {mode !== 'wrong-review' && (
              <>
                <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer">
                  <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">按题型设置题目数量</span>
                  <div
                    onClick={() => setUsePerType(!usePerType)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${usePerType ? 'bg-accent-500' : 'bg-surface-300 dark:bg-surface-600'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${usePerType ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>

                {usePerType ? (
                  <>
                    <div>
                      <label className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body block mb-3">题型出现顺序</label>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {(isMultiBank ? multiBankTypeOrder : typeOrder).map((type, index) => {
                          const arr = isMultiBank ? multiBankTypeOrder : typeOrder;
                          const setter = isMultiBank ? setMultiBankTypeOrder : setTypeOrder;
                          return (
                            <div key={type} className="flex items-center gap-1">
                              <div className="flex flex-col items-center gap-0.5">
                                <button
                                  onClick={() => {
                                    if (index <= 0) return;
                                    const newOrder = [...arr];
                                    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                                    setter(newOrder);
                                  }}
                                  disabled={index === 0}
                                  className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <span className={`${typeBadges[type]}`}>
                                  {typeLabels[type]}
                                </span>
                                <button
                                  onClick={() => {
                                    if (index >= arr.length - 1) return;
                                    const newOrder = [...arr];
                                    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                    setter(newOrder);
                                  }}
                                  disabled={index === arr.length - 1}
                                  className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              {index < arr.length - 1 && (
                                <ChevronRight className="h-4 w-4 text-surface-400 dark:text-surface-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(isMultiBank ? multiBankTypeOrder : typeOrder).map((type) => {
                        const available = isMultiBank
                          ? selectedBanks.reduce((sum, bk) => sum + bk.questions.filter((q) => q.type === type).length, 0)
                          : bank?.questions.filter((q) => q.type === type).length || 0;
                        return (
                          <div key={type}>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">
                                {typeLabels[type]}：可用 {available} 题
                              </label>
                              <span className="text-sm font-bold text-accent-500 font-body">{typeCounts[type]} 题</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max={available || 1}
                              value={typeCounts[type]}
                              onChange={(e) =>
                                setTypeCounts({ ...typeCounts, [type]: parseInt(e.target.value) })
                              }
                              className="w-full accent-accent-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">题目数量</label>
                      <span className="text-sm font-bold text-accent-500 font-body">{questionCount} 题</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={bank?.questions.length || 50}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full accent-accent-500"
                    />
                  </div>
                )}
              </>
            )}

            {mode !== 'wrong-review' && (
            <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer">
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">排除已刷题目</span>
              <div
                onClick={() => setExcludePracticed(!excludePracticed)}
                className={`relative w-12 h-6 rounded-full transition-colors ${excludePracticed ? 'bg-accent-500' : 'bg-surface-400 dark:bg-surface-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${excludePracticed ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>
            )}

            <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer">
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">随机抽取题目</span>
              <div
                onClick={() => setIsRandom(!isRandom)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isRandom ? 'bg-accent-500' : 'bg-surface-400 dark:bg-surface-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${isRandom ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer">
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">随机选项顺序</span>
              <div
                onClick={() => setRandomOptionOrder(!randomOptionOrder)}
                className={`relative w-12 h-6 rounded-full transition-colors ${randomOptionOrder ? 'bg-accent-500' : 'bg-surface-400 dark:bg-surface-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${randomOptionOrder ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer">
              <div>
                <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">自动加入错题本</span>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">做错时自动记录</p>
              </div>
              <div
                onClick={() => setAutoAddWrong(!autoAddWrong)}
                className={`relative w-12 h-6 rounded-full transition-colors ${autoAddWrong ? 'bg-accent-500' : 'bg-surface-400 dark:bg-surface-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${autoAddWrong ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer">
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">计时模式</span>
              <div
                onClick={() => setEnableTimer(!enableTimer)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enableTimer ? 'bg-accent-400' : 'bg-surface-400 dark:bg-surface-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${enableTimer ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>

            {enableTimer && (
              <div className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setTimerMode('countup')}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                      timerMode === 'countup'
                        ? 'bg-accent-400 text-white shadow-sm'
                        : 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100'
                    }`}
                  >
                    正计时
                  </button>
                  <button
                    onClick={() => setTimerMode('countdown')}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                      timerMode === 'countdown'
                        ? 'bg-accent-400 text-white shadow-sm'
                        : 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100'
                    }`}
                  >
                    倒计时
                  </button>
                </div>
                {timerMode === 'countdown' && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-surface-500 dark:text-surface-300 font-body">时间限制（分钟）</label>
                      <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">{countdownMinutes} 分钟</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="120"
                      value={countdownMinutes}
                      onChange={(e) => setCountdownMinutes(parseInt(e.target.value))}
                      className="w-full accent-accent-400"
                    />
                  </div>
                )}
              </div>
            )}

            <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl cursor-pointer">
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">查看正确答案</span>
              <div
                onClick={() => setShowAnswerSwitch(!showAnswerSwitch)}
                className={`relative w-12 h-6 rounded-full transition-colors ${showAnswerSwitch ? 'bg-accent-500' : 'bg-surface-400 dark:bg-surface-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${showAnswerSwitch ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>

            <div>
              <label
                className={`flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl ${!hasAIConfig ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <span className="text-sm font-bold text-surface-900 dark:text-surface-100 font-body">启用 AI 解析</span>
                <div
                  onClick={() => {
                    if (!hasAIConfig) return;
                    setEnableAIInPractice(!enableAIInPractice);
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${enableAIInPractice ? 'bg-accent-500' : 'bg-surface-400 dark:bg-surface-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${enableAIInPractice ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </label>
              {!hasAIConfig && (
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 ml-1">
                  请先在导航栏配置 AI 平台
                </p>
              )}
            </div>
          </div>

          <button onClick={handleStartPractice} className="w-full btn-primary flex items-center justify-center gap-2">
            <Play className="h-5 w-5" />
            开始刷题
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'review' && submitResult) {
    const accuracy = Math.round((submitResult.correctCount / submitResult.totalCount) * 100);
    const elapsed = Math.round((submitResult.endTime - submitResult.startTime) / 1000);
    const rq = questions[reviewIndex];
    const isCorrect = submitResult.results[rq?.id] ?? false;
    const viewed = viewedAnswerIds.has(rq?.id);
    const wrongCount = questions.filter(q => submitResult.results[q.id] === false).length;

    return (
      <div className="animate-scale-in">
        <div className="card p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accuracy === 100 ? 'bg-gradient-to-br from-surface-400 to-accent-500' : accuracy >= 80 ? 'bg-accent-100 dark:bg-accent-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
              <Trophy className={`h-6 w-6 ${accuracy === 100 ? 'text-white' : accuracy >= 80 ? 'text-accent-500' : 'text-amber-500'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
                  <CheckCircle2 className="h-5 w-5 inline text-emerald-500 mr-1" />
                  {submitResult.correctCount}/{submitResult.totalCount}
                </span>
                <span className="text-xl font-display font-bold text-accent-500">{accuracy}%</span>
              </div>
              <span className="text-xs text-surface-400">用时 {formatTime(elapsed)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleReset()} className="btn-ghost text-sm flex items-center gap-1">
              <RotateCcw className="h-4 w-4" />
              再来一次
            </button>
            <button onClick={handleBackToConfig} className="btn-ghost text-sm flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              返回配置
            </button>
          </div>
        </div>

        {wrongCount > 0 && (
          <div className="mb-4">
            <button
              onClick={handleBatchAI}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-accent-50 to-surface-50 dark:from-accent-900/20 dark:to-surface-800 border border-accent-200 dark:border-accent-700 text-accent-600 dark:text-accent-400 hover:border-accent-400 transition-colors text-sm font-bold"
            >
              <Bot className="h-4 w-4" />
              一键生成所有错题解析（{wrongCount} 题）
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-64 flex-shrink-0">
            <div className="card p-4">
              {usePerType && mode !== 'wrong-review' ? (() => {
                const typeRuns: { type: QuestionType; start: number; end: number }[] = [];
                let curType: QuestionType | null = null;
                let curStart = 0;
                questions.forEach((q, i) => {
                  if (q.type !== curType) {
                    if (curType !== null) {
                      typeRuns.push({ type: curType, start: curStart, end: i - 1 });
                    }
                    curType = q.type;
                    curStart = i;
                  }
                });
                if (curType !== null) {
                  typeRuns.push({ type: curType, start: curStart, end: questions.length - 1 });
                }
                return typeRuns.map((run) => (
                  <div key={run.type + '-' + run.start} className="mb-3">
                    <div className="text-xs font-bold text-surface-400 dark:text-surface-500 mb-2 px-1">
                      {typeLabels[run.type]} ({run.start + 1}-{run.end + 1})
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {questions.slice(run.start, run.end + 1).map((q, j) => {
                        const i = run.start + j;
                        const correct = submitResult.results[q.id] ?? false;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setReviewIndex(i)}
                            className={`flex items-center justify-center gap-1 p-1.5 rounded-lg text-sm transition-colors ${
                              i === reviewIndex
                                ? 'bg-accent-100 dark:bg-accent-900/30 ring-2 ring-accent-400/50'
                                : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                            }`}
                          >
                            <span className={typeBadges[q.type]}>
                              {i + 1}
                            </span>
                            {correct ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })() : (
                <div className="grid grid-cols-3 gap-1.5">
                  {questions.map((q, i) => {
                    const correct = submitResult.results[q.id] ?? false;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setReviewIndex(i)}
                        className={`flex items-center justify-center gap-1 p-1.5 rounded-lg text-sm transition-colors ${
                          i === reviewIndex
                            ? 'bg-accent-100 dark:bg-accent-900/30 ring-2 ring-accent-400/50'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                        }`}
                      >
                        <span className={typeBadges[q.type]}>
                          {i + 1}
                        </span>
                        {correct ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 text-center">
                <span className="text-xs text-surface-500">
                  <CheckCircle2 className="h-3.5 w-3.5 inline text-emerald-500 mr-1" />
                  {submitResult.correctCount}/{submitResult.totalCount} 正确
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {rq && (
              <div className="card p-6" key={rq.id}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={typeBadges[rq.type]}>
                    {typeLabels[rq.type]}
                  </span>
                  <span className="text-sm text-surface-400">{reviewIndex + 1}/{questions.length}</span>
                  {(() => {
                    const ua = answers[rq.id];
                    const userAnsStr = ua ? (Array.isArray(ua) ? ua.join(', ') : Object.values(ua).join(', ')) : '(未作答)';
                    return (
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs">
                          <span className="text-surface-500">你的答案是: </span>
                          <span className="font-bold">{userAnsStr}</span>
                        </span>
                        <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-500' : 'text-red-400'}`}>
                          {isCorrect ? '✅ 正确' : (viewed ? '👁 已查看答案' : '❌ 错误')}
                          {!isCorrect && <span className="text-surface-500 ml-1">正确答案: {rq.correctAnswer.join(', ')}</span>}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 leading-relaxed mb-4">
                  {rq.content}
                </h3>

                <div className="mt-4">
                  <OptionPanel
                    question={rq}
                    showResult={true}
                    userAnswer={answers[rq.id]}
                    onAnswerChange={() => {}}
                    answers={answers}
                    randomOptionOrder={randomOptionOrder}
                  />
                </div>

                {rq.analysis && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                    <span className="text-xs font-bold text-blue-500 dark:text-blue-400">💡 解析</span>
                    <p className="text-sm text-surface-700 dark:text-surface-300 mt-1 leading-relaxed">{rq.analysis}</p>
                  </div>
                )}

                {!isCorrect && (
                  <div className="mt-4">
                    {renderAIExplanationCard(rq.id)}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                disabled={reviewIndex === 0}
                className="btn-outline flex items-center gap-1 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                上一题
              </button>

              <span className="text-sm text-surface-400">{reviewIndex + 1} / {questions.length}</span>

              <button
                onClick={() => setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))}
                disabled={reviewIndex === questions.length - 1}
                className="btn-outline flex items-center gap-1 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                下一题
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleReset} className="btn-ghost flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          重新设置
        </button>

        {timerSeconds !== undefined && (
          <Timer
            countdownSeconds={timerSeconds}
            onTimeUp={() => {
              if (questions.some((q) => !hasAnswer(answers[q.id]) && !viewedAnswerIds.has(q.id))) {
                addToast('时间到！未作答的题目计为错误', 'warning');
              }
              handleSubmit();
            }}
            isPaused={isSubmitted}
          />
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <div className="card p-4">
            <QuestionNav usePerType={usePerType && mode !== 'wrong-review'} />
          </div>
        </div>

        <div className="flex-1 order-1 lg:order-2 space-y-6">
          {questions[currentIndex] && (
            <>
              <div className="card p-6 min-h-[360px]" key={questions[currentIndex].id}>
                <QuestionView />
                <div className="mt-6">
                  <OptionPanel
                    question={questions[currentIndex]}
                    showResult={isSubmitted || viewedAnswerIds.has(questions[currentIndex].id)}
                    userAnswer={answers[questions[currentIndex].id]}
                    onAnswerChange={(ans) => setAnswer(questions[currentIndex].id, ans)}
                    answers={answers}
                    randomOptionOrder={randomOptionOrder}
                  />
                </div>

                {showAnswerSwitch && !viewedAnswerIds.has(questions[currentIndex].id) && !isSubmitted && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleViewAnswer(questions[currentIndex].id)}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors text-sm"
                    >
                      <Lightbulb className="h-4 w-4" />
                      查看正确答案
                    </button>
                  </div>
                )}

                {showAnswerSwitch && viewedAnswerIds.has(questions[currentIndex].id) && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-center">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        👁 已查看答案，本题不计正确率
                      </p>
                    </div>
                    {questions[currentIndex].analysis && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-bold text-blue-500 dark:text-blue-400">💡 解析</span>
                        <p className="text-sm text-surface-700 dark:text-surface-300 mt-1 leading-relaxed">{questions[currentIndex].analysis}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {enableAIInPractice && !isSubmitted && (
                <div className="animate-slide-up">
                  {!practiceShowAI ? (
                    <button
                      onClick={handlePracticeAIExplain}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400 hover:border-accent-400 hover:text-accent-500 dark:hover:border-accent-500 dark:hover:text-accent-400 transition-colors text-sm"
                    >
                      <Bot className="h-4 w-4" />
                      AI解析
                    </button>
                  ) : (
                    renderAIExplanationCard(questions[currentIndex].id)
                  )}
                </div>
              )}

              {isSubmitted && (
                <div className="animate-slide-up">
                  <FeedbackPanel />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showShortcuts && (
        <div className="card p-5 mt-6 animate-slide-up" role="region" aria-label="快捷键说明">
          <h4 className="text-sm font-display font-bold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-accent-500" />
            键盘快捷键
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: '← →', desc: '上一题/下一题' },
              { key: 'A - Z', desc: '选择对应选项' },
              { key: 'M', desc: '标记/取消标记' },
              { key: 'Enter', desc: '提交答案' },
            ].map((item) => (
              <div key={item.key} className="flex flex-col gap-1 p-3 bg-surface-50 dark:bg-surface-700 rounded-xl text-center">
                <kbd className="px-2 py-1 bg-white dark:bg-surface-600 border-2 border-surface-200 dark:border-surface-900 rounded-lg text-sm font-mono font-bold text-surface-900 dark:text-surface-100">
                  {item.key}
                </kbd>
                <span className="text-xs text-surface-500 dark:text-surface-300 font-body">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-6 border-t-2 border-surface-900/10 dark:border-surface-100/10 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-surface-500 dark:text-surface-300 font-body">
            已答 {questions.filter((q) => hasAnswer(answers[q.id]) || viewedAnswerIds.has(q.id)).length} / {questions.length} 题
          </span>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-400 hover:text-accent-500 dark:hover:text-accent-400 transition-colors font-body"
            aria-label="查看快捷键"
          >
            <Keyboard className="h-3 w-3" />
            快捷键
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="btn-outline flex items-center gap-1 text-sm flex-1 sm:flex-none justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            上一题
          </button>

          {currentIndex < questions.length - 1 ? (
            <button onClick={nextQuestion} className="btn-outline flex items-center gap-1 text-sm flex-1 sm:flex-none justify-center">
              下一题
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-secondary flex items-center gap-1 text-sm flex-1 sm:flex-none justify-center">
              <Send className="h-4 w-4" />
              提交答案
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message={`还有 ${questions.filter((q) => !hasAnswer(answers[q.id]) && !viewedAnswerIds.has(q.id)).length} 题未作答，未答题目将计为错误。确定提交吗？`}
        onConfirm={doSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}