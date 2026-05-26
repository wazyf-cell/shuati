import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, ExternalLink, RotateCcw, Save, Cpu, Trash2 } from 'lucide-react';
import { useToastStore } from '../../store';
import { PLATFORM_PRESETS, loadAIConfig, saveAIConfig, clearAIConfig, DEFAULT_PROMPTS, PROMPT_NAMES, clearAICache, testConnection, testModelIdentity } from '../../utils/ai';
import type { AIConfig } from '../../types';

const PLATFORM_KEYS = Object.keys(PLATFORM_PRESETS) as Array<keyof typeof PLATFORM_PRESETS>;

export function AIConfigPage() {
  const { addToast } = useToastStore();
  const [platform, setPlatform] = useState<string>('siliconflow');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [maxTokens, setMaxTokens] = useState(2000);
  const [showKey, setShowKey] = useState(false);
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [customPrompts, setCustomPrompts] = useState<[string, string, string]>([...DEFAULT_PROMPTS]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testError, setTestError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const preset = PLATFORM_PRESETS[platform];
  const isCustom = platform === 'custom';

  const loadConfig = useCallback(() => {
    const savedCfg = loadAIConfig();
    if (savedCfg) {
      setPlatform(savedCfg.platform);
      setApiKey(savedCfg.apiKey);
      setBaseUrl(savedCfg.baseUrl);
      setModel(savedCfg.model);
      setMaxTokens(savedCfg.maxTokens || 2000);
      setCustomPlatformName(savedCfg.customPlatformName || '');
      setCustomModelName(savedCfg.customModelName || '');
      setCustomPrompts(savedCfg.customPrompts || [...DEFAULT_PROMPTS]);
      setSelectedPromptIndex(savedCfg.selectedPromptIndex ?? 0);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handlePlatformChange = (newPlatform: string) => {
    if (newPlatform === platform) return;
    const p = PLATFORM_PRESETS[newPlatform];
    setPlatform(newPlatform);
    setBaseUrl(p.baseUrl);
    setModel(p.models[0]?.id || '');
    if (newPlatform === 'custom') {
      setCustomPlatformName('');
      setCustomModelName('');
    }
  };

  const handleSave = () => {
    const effectiveApiKey = apiKey.trim();
    const effectiveBaseUrl = isCustom ? baseUrl.trim() : baseUrl;

    if (!effectiveApiKey) {
      addToast('请输入 API Key', 'error');
      return;
    }
    if (!effectiveBaseUrl && isCustom) {
      addToast('请输入 Base URL', 'error');
      return;
    }

    const modelToSave = isCustom ? (customModelName.trim() || model) : model;

    const config: AIConfig = {
      platform: platform as AIConfig['platform'],
      apiKey: effectiveApiKey,
      baseUrl: effectiveBaseUrl,
      model: modelToSave,
      maxTokens,
      customPlatformName: isCustom ? (customPlatformName.trim() || undefined) : undefined,
      customModelName: isCustom ? (customModelName.trim() || undefined) : undefined,
      customPrompts,
      selectedPromptIndex,
    };

    saveAIConfig(config);
    setSaved(true);
    addToast('AI 配置已保存', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = () => {
    clearAICache();
    addToast('AI 解析缓存已清空', 'success');
  };

  const handleTestConnection = async () => {
    const effectiveApiKey = apiKey.trim();
    if (!effectiveApiKey) {
      addToast('请先填写 API Key', 'error');
      return;
    }
    setTesting(true);
    setTestResult('');
    setTestError(false);
    try {
      const config: AIConfig = {
        platform: platform as AIConfig['platform'],
        apiKey: effectiveApiKey,
        baseUrl: isCustom ? baseUrl.trim() : baseUrl,
        model,
        maxTokens,
        customPrompts,
        selectedPromptIndex,
      };
      await testConnection(config);
      setTestResult('API 连接正常，配置无误。');
    } catch (e: any) {
      setTestError(true);
      setTestResult(e.message || String(e));
    } finally {
      setTesting(false);
    }
  };

  const handleTestModel = async () => {
    const effectiveApiKey = apiKey.trim();
    if (!effectiveApiKey) {
      addToast('请先填写 API Key', 'error');
      return;
    }
    setTesting(true);
    setTestResult('');
    setTestError(false);
    try {
      const config: AIConfig = {
        platform: platform as AIConfig['platform'],
        apiKey: effectiveApiKey,
        baseUrl: isCustom ? baseUrl.trim() : baseUrl,
        model,
        maxTokens,
        customPrompts,
        selectedPromptIndex,
      };
      const reply = await testModelIdentity(config);
      setTestResult(reply);
    } catch (e: any) {
      setTestError(true);
      setTestResult(e.message || String(e));
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    clearAIConfig();
    clearAICache();
    setPlatform('siliconflow');
    setApiKey('');
    setBaseUrl(PLATFORM_PRESETS.siliconflow.baseUrl);
    setModel(PLATFORM_PRESETS.siliconflow.models[0]?.id || '');
    setMaxTokens(2000);
    setCustomPlatformName('');
    setCustomModelName('');
    setCustomPrompts([...DEFAULT_PROMPTS]);
    setSelectedPromptIndex(0);
    setShowResetConfirm(false);
    addToast('AI 配置已重置', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-surface-400 rounded-xl flex items-center justify-center shadow-sm">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
              AI 配置
            </h2>
            <p className="section-subtitle">选择平台、配置密钥、自定义提示词</p>
          </div>
        </div>
        {saved && (
          <span className="text-sm text-emerald-500 font-bold animate-bounce-in">
            ✅ 已保存
          </span>
        )}
      </div>

      {/* 平台 & 连接配置 */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200">
          连接设置
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              平台
            </label>
            <select
              value={platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="input"
            >
              {PLATFORM_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PLATFORM_PRESETS[key].name}
                </option>
              ))}
            </select>
          </div>

          {isCustom ? (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                自定义平台名称
              </label>
              <input
                type="text"
                value={customPlatformName}
                onChange={(e) => setCustomPlatformName(e.target.value)}
                placeholder="例如：Ollama 本地模型"
                className="input"
              />
            </div>
          ) : (
            <div />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入 API Key"
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4 text-surface-400" />
              ) : (
                <Eye className="h-4 w-4 text-surface-400" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              readOnly={!isCustom}
              className={`input ${!isCustom ? 'bg-surface-100 dark:bg-surface-700 text-surface-500' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              模型
            </label>
            <input
              type="text"
              list={`model-list-page`}
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                if (isCustom) setCustomModelName(e.target.value);
              }}
              placeholder="选择或输入模型 ID"
              className="input"
            />
            <datalist id={`model-list-page`}>
              {preset.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            最大输出 Token ({maxTokens})
          </label>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="w-full accent-accent-500"
          />
          <div className="flex justify-between text-xs text-surface-400 mt-1">
            <span>100</span>
            <span>10000</span>
          </div>
        </div>

        <div className="rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700 p-3">
          <p className="text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
            {preset.apiKeyHelp}
          </p>
          {preset.website && (
            <button
              onClick={async () => {
                if ((window as any).__TAURI_INTERNALS__) {
                  const { invoke } = await import('@tauri-apps/api/core');
                  await invoke('open_url', { url: preset.website });
                } else {
                  window.open(preset.website, '_blank');
                }
              }}
              className="inline-flex items-center gap-1 mt-2 text-xs text-accent-500 hover:text-accent-600 transition-colors"
            >
              前往官网 <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 提示词编辑 */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200">
            提示词模板
          </h3>
        </div>

        <div className="flex gap-2">
          {PROMPT_NAMES.map((name, i) => (
            <button
              key={i}
              onClick={() => setSelectedPromptIndex(i)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                selectedPromptIndex === i
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-500 dark:text-surface-400">
              编辑「{PROMPT_NAMES[selectedPromptIndex]}」
            </span>
            <button
              type="button"
              onClick={() => {
                const newPrompts = [...customPrompts] as [string, string, string];
                newPrompts[selectedPromptIndex] = DEFAULT_PROMPTS[selectedPromptIndex];
                setCustomPrompts(newPrompts);
              }}
              className="inline-flex items-center gap-1 text-xs text-accent-500 hover:text-accent-600 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              重置当前
            </button>
          </div>
          <textarea
            value={customPrompts[selectedPromptIndex]}
            onChange={(e) => {
              const newPrompts = [...customPrompts] as [string, string, string];
              newPrompts[selectedPromptIndex] = e.target.value;
              setCustomPrompts(newPrompts);
            }}
            rows={8}
            className="input resize-y font-mono text-sm"
            placeholder="输入自定义提示词模板..."
          />
        </div>
      </div>

      {/* 测试连接 */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200">
          测试连接
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          使用当前填写的参数测试 AI 接口是否可用
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="btn-ghost flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {testing ? '测试中...' : '测试连接'}
          </button>
          <button
            onClick={handleTestModel}
            disabled={testing}
            className="btn-ghost flex items-center gap-2"
          >
            <Cpu className="h-4 w-4" />
            {testing ? '测试中...' : '询问模型'}
          </button>
        </div>
        {testResult && (
          <div className={`rounded-lg p-4 text-sm border ${
            testError
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
          }`}>
            <div className="font-bold mb-1">{testError ? '连接失败' : '连接成功'}</div>
            <div className="whitespace-pre-wrap">{testResult}</div>
          </div>
        )}
      </div>

      {/* 操作区 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          保存配置
        </button>
        <button
          onClick={handleClearCache}
          className="btn-ghost flex items-center gap-2 text-amber-500"
        >
          <RotateCcw className="h-4 w-4" />
          清空 AI 缓存
        </button>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="btn-ghost flex items-center gap-2 text-rose-500 hover:text-rose-600"
        >
          <Trash2 className="h-4 w-4" />
          重置 AI 设置
        </button>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}>
          <div className="card p-6 w-full max-w-md mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100 mb-2">重置 AI 设置</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              确定清空所有 AI 配置吗？包括平台、API Key、模型、提示词模板等全部恢复默认。
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
              💡 重置后未重新配置时，导出的数据不会包含 API Key。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="btn-ghost flex-1">取消</button>
              <button onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl flex-1 transition-colors">确认重置</button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-4">
        <h4 className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">使用说明</h4>
        <ul className="text-xs text-surface-500 dark:text-surface-400 space-y-1 list-disc list-inside">
          <li>选择一个 AI 平台，填写 API Key 即可开始使用</li>
          <li>硅基流动：国内可直接访问，有免费额度，推荐使用</li>
          <li>提示词模板在刷题时选择合适的风格获得更好的解析效果</li>
          <li>AI 解析结果会自动缓存，同一题目不重复消耗 Token</li>
        </ul>
      </div>
    </div>
  );
}
