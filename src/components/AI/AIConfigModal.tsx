import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, X, Cpu, ExternalLink } from 'lucide-react';
import { useToastStore } from '../../store';
import { PLATFORM_PRESETS, loadAIConfig, saveAIConfig, DEFAULT_PROMPTS, PROMPT_NAMES } from '../../utils/ai';
import type { AIConfig } from '../../types';

interface AIConfigModalProps {
  open: boolean;
  onClose: () => void;
}

const PLATFORM_KEYS = Object.keys(PLATFORM_PRESETS) as Array<keyof typeof PLATFORM_PRESETS>;

export function AIConfigModal({ open, onClose }: AIConfigModalProps) {
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

  const preset = PLATFORM_PRESETS[platform];
  const isCustom = platform === 'custom';

  const loadConfig = useCallback(() => {
    const saved = loadAIConfig();
    if (saved) {
      setPlatform(saved.platform);
      setApiKey(saved.apiKey);
      setBaseUrl(saved.baseUrl);
      setModel(saved.model);
      setMaxTokens(saved.maxTokens || 2000);
      setCustomPlatformName(saved.customPlatformName || '');
      setCustomModelName(saved.customModelName || '');
      setCustomPrompts(saved.customPrompts || [...DEFAULT_PROMPTS]);
      setSelectedPromptIndex(saved.selectedPromptIndex ?? 0);
    } else {
      resetToDefault('siliconflow');
    }
  }, []);

  const resetToDefault = (plat: string) => {
    const p = PLATFORM_PRESETS[plat];
    setPlatform(plat);
    setApiKey('');
    setBaseUrl(p.baseUrl);
    setModel(p.models[0]?.id || '');
    setMaxTokens(2000);
    setCustomPlatformName('');
    setCustomModelName('');
    setCustomPrompts([...DEFAULT_PROMPTS]);
    setSelectedPromptIndex(0);
  };

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open, loadConfig]);

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
    addToast('AI 配置已保存', 'success');
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30"
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-lg bg-white dark:bg-surface-800 w-full max-w-lg mx-4 animate-bounce-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-accent-500" />
            <h2 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200">
              AI 配置
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <X className="h-4 w-4 text-surface-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              平台
            </label>
            <select
              value={platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-colors"
            >
              {PLATFORM_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PLATFORM_PRESETS[key].name}
                </option>
              ))}
            </select>
          </div>

          {isCustom && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                自定义平台名称
              </label>
              <input
                type="text"
                value={customPlatformName}
                onChange={(e) => setCustomPlatformName(e.target.value)}
                placeholder="例如：Ollama 本地模型"
                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-colors"
              />
            </div>
          )}

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
                className="w-full px-3 py-2 pr-10 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-colors"
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

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              readOnly={!isCustom}
              className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-colors ${
                !isCustom
                  ? 'border-surface-200 dark:border-surface-600 text-surface-500 dark:text-surface-400 cursor-not-allowed'
                  : 'border-surface-300 dark:border-surface-600 placeholder:text-surface-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              模型（可手动输入）
            </label>
            <input
              type="text"
              list="model-list-modal"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                if (isCustom) setCustomModelName(e.target.value);
              }}
              placeholder="选择或输入模型 ID"
              className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-colors"
            />
            <datalist id="model-list-modal">
              {preset.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              最大 Token ({maxTokens})
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

          <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              提示词模板
            </label>
            <select
              value={selectedPromptIndex}
              onChange={(e) => setSelectedPromptIndex(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-colors"
            >
              {PROMPT_NAMES.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                编辑模板 — {PROMPT_NAMES[selectedPromptIndex]}
              </label>
              <button
                type="button"
                onClick={() => {
                  const newPrompts = [...customPrompts] as [string, string, string];
                  newPrompts[selectedPromptIndex] = DEFAULT_PROMPTS[selectedPromptIndex];
                  setCustomPrompts(newPrompts);
                }}
                className="text-xs text-accent-500 hover:text-accent-600 transition-colors"
              >
                重置当前模板
              </button>
            </div>
            <textarea
              value={customPrompts[selectedPromptIndex]}
              onChange={(e) => {
                const newPrompts = [...customPrompts] as [string, string, string];
                newPrompts[selectedPromptIndex] = e.target.value;
                setCustomPrompts(newPrompts);
              }}
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-colors resize-y"
            />
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

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="btn-ghost flex-1"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-accent-500 to-surface-400 text-white font-bold py-2.5 px-4 rounded-xl flex-1"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}