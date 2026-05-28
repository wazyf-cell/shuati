export type QuestionType = 'single' | 'multiple' | 'judge' | 'fill' | 'short';

export interface AIPromptTemplate {
  id: string;
  name: string;
  content: string;
}

export type PromptContext = 'practice' | 'review' | 'analyze';

export interface AIConfig {
  platform: 'siliconflow' | 'openai' | 'deepseek' | 'azure' | 'google' | 'claude' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  customPlatformName?: string;
  customModelName?: string;
  // 旧字段（兼容迁移）
  customPrompts?: [string, string, string];
  selectedPromptIndex?: number;
  // 新字段
  promptTemplates?: Record<PromptContext, AIPromptTemplate[]>;
  activePromptIds?: Record<PromptContext, string>;
}

export interface AIPlatformDef {
  name: string;
  baseUrl: string;
  models: { id: string; name: string }[];
  apiKeyHelp: string;
  website?: string;
}

export interface QuestionOption {
  key: string;
  content: string;
}

export interface SubQuestion {
  id: string;
  label: string;
  answer: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options: QuestionOption[];
  correctAnswer: string[];
  analysis: string;
  subType?: 'single' | 'group';
  subQuestions?: SubQuestion[];
}

export interface QuestionBank {
  id: string;
  name: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

export interface WrongQuestion {
  questionId: string;
  bankId: string;
  wrongCount: number;
  lastWrongAt: number;
  userAnswers: string[];
  correctAnswer: string[];
  firstWrongAt: number;
}

export interface PracticeRecord {
  id: string;
  bankId?: string;
  bankIds?: string[];
  questionIds: string[];
  answers: Record<string, string[] | Record<string, string>>;
  results: Record<string, boolean>;
  startTime: number;
  endTime: number;
  totalCount: number;
  correctCount: number;
  source?: 'bank' | 'wrong-review';
}

export interface NormalizedRecord {
  id: string;
  bankIds: string[];
  questionIds: string[];
  answers: Record<string, string[] | Record<string, string>>;
  results: Record<string, boolean>;
  startTime: number;
  endTime: number;
  totalCount: number;
  correctCount: number;
}

export interface UserConfig {
  darkMode: boolean;
  currentBankId: string;
  randomOptionOrder: boolean;
  multiBankTypeOrder?: QuestionType[];
  showAnswerSwitch: boolean;
  enableAIInPractice: boolean;
  autoAddWrong?: boolean;
  favorites?: string[];
}