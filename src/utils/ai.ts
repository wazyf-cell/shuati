import type { AIConfig, AIPlatformDef, AIPromptTemplate, PromptContext, Question, QuestionType } from '../types';

export const PLATFORM_PRESETS: Record<string, AIPlatformDef> = {
  siliconflow: {
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    website: 'https://siliconflow.cn/',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B' },
      { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen2.5-32B' },
    ],
    apiKeyHelp: '国内可直接访问，注册即送免费额度，推荐使用。',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    website: 'https://platform.openai.com/',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'o3-mini', name: 'o3 Mini' },
    ],
    apiKeyHelp: '需要海外网络环境，需绑定信用卡。',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    website: 'https://platform.deepseek.com/',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-Reasoner' },
    ],
    apiKeyHelp: '国产大模型，中文理解能力强，价格实惠。',
  },
  azure: {
    name: 'Azure OpenAI',
    baseUrl: 'https://YOUR_RESOURCE.openai.azure.com',
    website: 'https://portal.azure.com/',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo' },
    ],
    apiKeyHelp: '微软 Azure 云平台，企业级稳定性，需 Azure 账号。',
  },
  google: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    website: 'https://aistudio.google.com/',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    apiKeyHelp: '需海外网络环境，Google 账号可直接使用。',
  },
  claude: {
    name: 'Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    website: 'https://console.anthropic.com/',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
    apiKeyHelp: '需海外网络环境，擅长逻辑推理和长文本。',
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    website: '',
    models: [],
    apiKeyHelp: '输入兼容 OpenAI 格式的 API 地址和 Key，支持 Ollama 等本地模型。',
  },
};

const AI_CONFIG_KEY = 'ai_config';
const AI_CACHE_KEY = 'ai_explanations';

export const DEFAULT_PROMPTS: [string, string, string] = [
  '请对以下题目进行简单解析，对每个选项进行判断和简短解释。',
  '请你扮演一位经验丰富的教师，对以下题目进行详细解析。\n要求：1) 逐一分析每个选项的对错原因\n      2) 指出题目考察的知识点\n      3) 给出解题思路和技巧',
  '这道题我做错了，请帮我分析：\n1) 正确答案为什么是对的\n2) 我选的答案错在哪里（思维误区）\n3) 如何避免再犯类似错误',
];

export const PROMPT_NAMES = ['简洁模式', '详细模式', '错题模式'];

// 新模板系统（v1.1.0）
function uuid() { return crypto.randomUUID(); }

export const DEFAULT_TEMPLATES: Record<PromptContext, AIPromptTemplate[]> = {
  practice: [
    { id: uuid(), name: '简洁解析', content: '请对以下题目进行简短解析，指出考点和正确答案原因。' },
    { id: uuid(), name: '详细讲解', content: '请你扮演一位经验丰富的教师，对以下题目进行详细解析。\n要求：\n1) 逐一分析每个选项的对错原因\n2) 指出题目考察的知识点\n3) 给出解题思路和技巧' },
    { id: uuid(), name: '错题剖析', content: '这道题我做错了，请帮我分析：\n1) 正确答案为什么是对的\n2) 我选的答案错在哪里（思维误区）\n3) 如何避免再犯类似错误' },
  ],
  review: [
    { id: uuid(), name: '简洁回顾', content: '请简要回顾这道题的解题要点。' },
    { id: uuid(), name: '详细复习', content: '请你扮演一位资深教师，在回顾错题时给出详细解析：\n1) 题目知识点梳理\n2) 每个选项的详细分析\n3) 同类题目的解题套路' },
    { id: uuid(), name: '知识巩固', content: '请针对这道错题，帮我：\n1) 总结核心知识点\n2) 设计一道变式题巩固理解\n3) 给出记忆口诀或技巧' },
  ],
  analyze: [
    { id: uuid(), name: '快速分析', content: '请快速分析这道题目的考点和难度。' },
    { id: uuid(), name: '深度分析', content: '请对这道题目进行深度分析：\n1) 考查的知识点和能力\n2) 题目难度评估\n3) 常见错误类型\n4) 教学建议' },
    { id: uuid(), name: '命题思路', content: '请分析这道题目的命题思路：\n1) 命题人想考察什么\n2) 干扰项的设计逻辑\n3) 与课程标准的对应关系' },
  ],
};

export const CONTEXT_LABELS: Record<PromptContext, string> = {
  practice: '刷题',
  review: 'Review',
  analyze: '分析',
};

export function getDefaultTemplates(): Record<PromptContext, AIPromptTemplate[]> {
  return JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
}

export function getActivePrompt(config: AIConfig, context: PromptContext): string {
  const templates = config.promptTemplates?.[context];
  const activeId = config.activePromptIds?.[context];
  if (templates && activeId) {
    const t = templates.find(t => t.id === activeId);
    if (t) return t.content;
  }
  // fallback
  return DEFAULT_TEMPLATES[context][0].content;
}

export function getSelectedPromptName(config: AIConfig, context?: PromptContext): string {
  if (context && config.promptTemplates && config.activePromptIds) {
    const templates = config.promptTemplates[context];
    const activeId = config.activePromptIds[context];
    const t = templates?.find(t => t.id === activeId);
    if (t) return t.name;
  }
  // 旧版兼容
  if (config.selectedPromptIndex !== undefined) {
    return PROMPT_NAMES[config.selectedPromptIndex] || '自定义提示词';
  }
  return '自定义提示词';
}

export function loadAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw) as AIConfig;
    if (config.apiKey) {
      config.apiKey = atob(config.apiKey);
    }
    // 迁移旧版 customPrompts → 新版 promptTemplates
    if (!config.promptTemplates && config.customPrompts) {
      const defaults = getDefaultTemplates();
      config.promptTemplates = {
        practice: config.customPrompts.map((content, i) => ({
          ...defaults.practice[i],
          content,
        })),
        review: defaults.review,
        analyze: defaults.analyze,
      };
      config.activePromptIds = {
        practice: config.promptTemplates.practice[config.selectedPromptIndex || 0].id,
        review: config.promptTemplates.review[0].id,
        analyze: config.promptTemplates.analyze[0].id,
      };
      delete config.customPrompts;
      delete config.selectedPromptIndex;
    }
    // 确保新字段存在
    if (!config.promptTemplates || !config.activePromptIds) {
      config.promptTemplates = getDefaultTemplates();
      config.activePromptIds = {
        practice: config.promptTemplates.practice[0].id,
        review: config.promptTemplates.review[0].id,
        analyze: config.promptTemplates.analyze[0].id,
      };
    }
    return config;
  } catch {
    return null;
  }
}

export function saveAIConfig(config: AIConfig): void {
  const safe = { ...config, apiKey: btoa(config.apiKey) };
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(safe));
}

export function clearAIConfig(): void {
  localStorage.removeItem(AI_CONFIG_KEY);
}

export async function callAIAPI(prompt: string, config: AIConfig): Promise<string> {
  const platform = config.platform;

  if (platform === 'google') {
    return callGeminiAPI(prompt, config);
  }
  if (platform === 'claude') {
    return callClaudeAPI(prompt, config);
  }
  return callOpenAICompatAPI(prompt, config);
}

async function callOpenAICompatAPI(prompt: string, config: AIConfig): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: '你是一个专业的考试辅导助手，擅长解析题目、讲解解题思路和知识点。请用中文回答。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: config.maxTokens || 2000,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API 请求失败 (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI API 返回数据格式异常，未找到回复内容');
  }
  return content;
}

async function callClaudeAPI(prompt: string, config: AIConfig): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens || 2000,
      system: '你是一个专业的考试辅导助手，擅长解析题目、讲解解题思路和知识点。请用中文回答。',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API 请求失败 (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new Error('Claude API 返回数据格式异常，未找到回复内容');
  }
  return text;
}

async function callGeminiAPI(prompt: string, config: AIConfig): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `你是一个专业的考试辅导助手，擅长解析题目、讲解解题思路和知识点。请用中文回答。\n\n${prompt}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: config.maxTokens || 2000,
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API 请求失败 (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API 返回数据格式异常，未找到回复内容');
  }
  return text;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
};

export async function generateExplanation(
  question: Question,
  userAnswer: string[],
  config: AIConfig,
  context: PromptContext = 'practice',
): Promise<string> {
  const typeLabel = TYPE_LABELS[question.type] || '未知题型';
  const promptTemplate = getActivePrompt(config, context);

  let prompt = `${promptTemplate}\n\n`;
  prompt += `题型：${typeLabel}\n`;
  prompt += `题目：${question.content}\n`;

  if (question.options && question.options.length > 0) {
    prompt += `选项：\n`;
    for (const opt of question.options) {
      prompt += `${opt.key}. ${opt.content}\n`;
    }
  }

  // 简答大题：附加小题信息
  if (question.type === 'short' && question.subType === 'group' && question.subQuestions?.length) {
    prompt += `\n小题：\n`;
    for (const sq of question.subQuestions) {
      prompt += `${sq.label}\n参考答案：${sq.answer}\n`;
    }
  }

  prompt += `正确答案：${question.correctAnswer.join(', ')}\n`;
  prompt += `我的答案：${userAnswer.join(', ') || '未作答'}\n`;

  return callAIAPI(prompt, config);
}

function loadCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, string>): void {
  localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedExplanation(questionId: string): string | null {
  const cache = loadCache();
  return cache[questionId] || null;
}

export function saveCachedExplanation(questionId: string, text: string): void {
  const cache = loadCache();
  cache[questionId] = text;
  saveCache(cache);
}

export function clearAICache(): void {
  localStorage.removeItem(AI_CACHE_KEY);
}

export async function testConnection(config: AIConfig): Promise<void> {
  await callAIAPI('Hello, this is a connection test. Reply with "OK".', config);
}

export async function testModelIdentity(config: AIConfig): Promise<string> {
  return await callAIAPI('你是什么模型？请简单介绍你自己。', config);
}