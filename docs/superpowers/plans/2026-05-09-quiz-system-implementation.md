# 网页版刷题系统 · 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个纯前端网页版刷题系统，支持多题库管理、多种题型答题、错题自动收集和数据持久化存储。

**Architecture:** 采用 React + Tailwind CSS 技术栈，使用 Zustand 进行状态管理，localStorage 进行数据持久化。组件化设计，分离关注点。

**Tech Stack:** React 18+, Tailwind CSS 3+, Zustand 4+, SheetJS (xlsx), Lucide React

---

## 文件结构规划

```
src/
├── components/
│   ├── Layout/           # 布局组件
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── Dashboard/        # 首页组件
│   │   ├── BankCard.tsx
│   │   ├── BankList.tsx
│   │   └── QuickStats.tsx
│   ├── Bank/             # 题库管理组件
│   │   ├── SearchBar.tsx
│   │   ├── QuestionTable.tsx
│   │   ├── QuestionCard.tsx
│   │   └── QuestionForm.tsx
│   ├── Practice/         # 刷题组件
│   │   ├── ProgressBar.tsx
│   │   ├── QuestionNav.tsx
│   │   ├── QuestionView.tsx
│   │   ├── OptionPanel.tsx
│   │   └── FeedbackPanel.tsx
│   ├── WrongBook/        # 错题本组件
│   │   ├── FilterBar.tsx
│   │   ├── WrongList.tsx
│   │   └── ActionButtons.tsx
│   └── Statistics/       # 统计组件
│       ├── SummaryCards.tsx
│       └── TrendChart.tsx
├── store/               # 状态管理
│   ├── bank.ts
│   ├── practice.ts
│   ├── wrong.ts
│   └── config.ts
├── utils/               # 工具函数
│   ├── storage.ts
│   ├── excel.ts
│   └── txt.ts
├── types/               # 类型定义
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 阶段一：MVP 基础功能

### Task 1: 项目初始化与基础配置

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/storage.ts`
- Create: `index.html`
- Create: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

- [ ] **Step 1: 初始化 Vite + React 项目**

```bash
npm create vite@6.5.0 . -- --template react
```

- [ ] **Step 2: 安装依赖**

```bash
npm install tailwindcss@3 @tailwindcss/vite zustand lucide-react xlsx
```

- [ ] **Step 3: 配置 Tailwind CSS**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 4: 创建类型定义**

```typescript
// src/types/index.ts
export type QuestionType = 'single' | 'multiple' | 'judge';

export interface QuestionOption {
  key: string;
  content: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options: QuestionOption[];
  correctAnswer: string[];
  analysis: string;
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
}

export interface PracticeRecord {
  id: string;
  bankId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
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
}
```

- [ ] **Step 5: 创建存储工具**

```typescript
// src/utils/storage.ts
const STORAGE_KEYS = {
  BANKS: 'quiz_banks',
  WRONG: 'quiz_wrong',
  RECORDS: 'quiz_records',
  CONFIG: 'quiz_config',
};

export const storage = {
  getBanks(): QuestionBank[] {
    const data = localStorage.getItem(STORAGE_KEYS.BANKS);
    return data ? JSON.parse(data) : [];
  },

  setBanks(banks: QuestionBank[]): void {
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks));
  },

  getWrong(): WrongQuestion[] {
    const data = localStorage.getItem(STORAGE_KEYS.WRONG);
    return data ? JSON.parse(data) : [];
  },

  setWrong(wrong: WrongQuestion[]): void {
    localStorage.setItem(STORAGE_KEYS.WRONG, JSON.stringify(wrong));
  },

  getRecords(): PracticeRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  setRecords(records: PracticeRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },

  getConfig(): UserConfig {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? JSON.parse(data) : {
      darkMode: false,
      currentBankId: '',
      randomOptionOrder: false,
    };
  },

  setConfig(config: UserConfig): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },
};
```

- [ ] **Step 6: 提交基础配置**

```bash
git add .
git commit -m "chore: initial project setup with types and storage"
```

---

### Task 2: 创建状态管理 Store

**Files:**
- Create: `src/store/bank.ts`
- Create: `src/store/practice.ts`
- Create: `src/store/wrong.ts`
- Create: `src/store/config.ts`

- [ ] **Step 1: 创建题库状态管理**

```typescript
// src/store/bank.ts
import { create } from 'zustand';
import { storage } from '../utils/storage';

interface BankState {
  banks: QuestionBank[];
  currentBankId: string;
  setCurrentBankId: (id: string) => void;
  addBank: (name: string) => void;
  deleteBank: (id: string) => void;
  addQuestion: (bankId: string, question: Omit<Question, 'id'>) => void;
  updateQuestion: (bankId: string, questionId: string, question: Partial<Question>) => void;
  deleteQuestion: (bankId: string, questionId: string) => void;
}

export const useBankStore = create<BankState>((set) => ({
  banks: storage.getBanks(),
  currentBankId: storage.getConfig().currentBankId,
  
  setCurrentBankId: (id) => {
    set({ currentBankId: id });
    const config = storage.getConfig();
    storage.setConfig({ ...config, currentBankId: id });
  },
  
  addBank: (name) => {
    const newBank: QuestionBank = {
      id: Date.now().toString(),
      name,
      questions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => {
      const newBanks = [...state.banks, newBank];
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },
  
  deleteBank: (id) => {
    set((state) => {
      const newBanks = state.banks.filter(b => b.id !== id);
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },
  
  addQuestion: (bankId, question) => {
    const newQuestion: Question = {
      ...question,
      id: Date.now().toString(),
    };
    set((state) => {
      const newBanks = state.banks.map(bank =>
        bank.id === bankId
          ? { ...bank, questions: [...bank.questions, newQuestion], updatedAt: Date.now() }
          : bank
      );
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },
  
  updateQuestion: (bankId, questionId, updates) => {
    set((state) => {
      const newBanks = state.banks.map(bank =>
        bank.id === bankId
          ? {
              ...bank,
              questions: bank.questions.map(q =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
              updatedAt: Date.now(),
            }
          : bank
      );
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },
  
  deleteQuestion: (bankId, questionId) => {
    set((state) => {
      const newBanks = state.banks.map(bank =>
        bank.id === bankId
          ? {
              ...bank,
              questions: bank.questions.filter(q => q.id !== questionId),
              updatedAt: Date.now(),
            }
          : bank
      );
      storage.setBanks(newBanks);
      return { banks: newBanks };
    });
  },
}));
```

- [ ] **Step 2: 创建刷题状态管理**

```typescript
// src/store/practice.ts
import { create } from 'zustand';

interface PracticeState {
  currentIndex: number;
  questions: Question[];
  answers: Record<string, string[]>;
  results: Record<string, boolean>;
  marked: string[];
  startTime: number;
  isSubmitted: boolean;
  
  startPractice: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string[]) => void;
  markQuestion: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitAnswers: () => void;
  resetPractice: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  currentIndex: 0,
  questions: [],
  answers: {},
  results: {},
  marked: [],
  startTime: 0,
  isSubmitted: false,
  
  startPractice: (questions) => {
    set({
      currentIndex: 0,
      questions,
      answers: {},
      results: {},
      marked: [],
      startTime: Date.now(),
      isSubmitted: false,
    });
  },
  
  setAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },
  
  markQuestion: (questionId) => {
    set((state) => ({
      marked: state.marked.includes(questionId)
        ? state.marked.filter(id => id !== questionId)
        : [...state.marked, questionId],
    }));
  },
  
  nextQuestion: () => {
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
    }));
  },
  
  prevQuestion: () => {
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    }));
  },
  
  goToQuestion: (index) => {
    set({ currentIndex: index });
  },
  
  submitAnswers: () => {
    set((state) => {
      const results: Record<string, boolean> = {};
      state.questions.forEach(q => {
        const userAnswer = state.answers[q.id] || [];
        const correct = JSON.stringify(userAnswer.sort()) === JSON.stringify(q.correctAnswer.sort());
        results[q.id] = correct;
      });
      return { results, isSubmitted: true };
    });
  },
  
  resetPractice: () => {
    set({
      currentIndex: 0,
      questions: [],
      answers: {},
      results: {},
      marked: [],
      startTime: 0,
      isSubmitted: false,
    });
  },
}));
```

- [ ] **Step 3: 创建错题状态管理**

```typescript
// src/store/wrong.ts
import { create } from 'zustand';
import { storage } from '../utils/storage';

interface WrongState {
  wrongQuestions: WrongQuestion[];
  
  addWrong: (questionId: string, bankId: string, userAnswer: string[]) => void;
  removeWrong: (questionId: string) => void;
  clearAll: () => void;
}

export const useWrongStore = create<WrongState>((set) => ({
  wrongQuestions: storage.getWrong(),
  
  addWrong: (questionId, bankId, userAnswer) => {
    set((state) => {
      const existing = state.wrongQuestions.find(w => w.questionId === questionId);
      let newWrong: WrongQuestion[];
      
      if (existing) {
        newWrong = state.wrongQuestions.map(w =>
          w.questionId === questionId
            ? {
                ...w,
                wrongCount: w.wrongCount + 1,
                lastWrongAt: Date.now(),
                userAnswers: [...w.userAnswers, ...userAnswer],
              }
            : w
        );
      } else {
        newWrong = [
          ...state.wrongQuestions,
          {
            questionId,
            bankId,
            wrongCount: 1,
            lastWrongAt: Date.now(),
            userAnswers,
          },
        ];
      }
      
      storage.setWrong(newWrong);
      return { wrongQuestions: newWrong };
    });
  },
  
  removeWrong: (questionId) => {
    set((state) => {
      const newWrong = state.wrongQuestions.filter(w => w.questionId !== questionId);
      storage.setWrong(newWrong);
      return { wrongQuestions: newWrong };
    });
  },
  
  clearAll: () => {
    storage.setWrong([]);
    set({ wrongQuestions: [] });
  },
}));
```

- [ ] **Step 4: 创建配置状态管理**

```typescript
// src/store/config.ts
import { create } from 'zustand';
import { storage } from '../utils/storage';

interface ConfigState {
  darkMode: boolean;
  randomOptionOrder: boolean;
  
  toggleDarkMode: () => void;
  setRandomOptionOrder: (enabled: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => {
  const config = storage.getConfig();
  return {
    darkMode: config.darkMode,
    randomOptionOrder: config.randomOptionOrder,
    
    toggleDarkMode: () => {
      set((state) => {
        const newDarkMode = !state.darkMode;
        const config = storage.getConfig();
        storage.setConfig({ ...config, darkMode: newDarkMode });
        return { darkMode: newDarkMode };
      });
    },
    
    setRandomOptionOrder: (enabled) => {
      set({ randomOptionOrder: enabled });
      const config = storage.getConfig();
      storage.setConfig({ ...config, randomOptionOrder: enabled });
    },
  };
});
```

- [ ] **Step 5: 提交状态管理代码**

```bash
git add src/store/
git commit -m "feat: add zustand stores for state management"
```

---

### Task 3: 创建布局组件

**Files:**
- Create: `src/components/Layout/Header.tsx`
- Create: `src/index.css`

- [ ] **Step 1: 创建全局样式**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.dark body {
  background-color: #1f2937;
}
```

- [ ] **Step 2: 创建 Header 组件**

```tsx
// src/components/Layout/Header.tsx
import { useState } from 'react';
import { BookOpen, Plus, Upload, Download, Moon, Sun, Menu } from 'lucide-react';
import { useBankStore } from '../../store/bank';
import { useConfigStore } from '../../store/config';

export function Header() {
  const { banks, currentBankId, addBank, setCurrentBankId } = useBankStore();
  const { darkMode, toggleDarkMode } = useConfigStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');

  const handleAddBank = () => {
    if (newBankName.trim()) {
      addBank(newBankName.trim());
      setNewBankName('');
      setShowAddModal(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">刷题系统</h1>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={currentBankId}
              onChange={(e) => setCurrentBankId(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择题库</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              新增题库
            </button>

            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Upload className="h-5 w-5" />
            </button>

            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Download className="h-5 w-5" />
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button className="md:hidden p-2 text-gray-600 dark:text-gray-300">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">新增题库</h2>
            <input
              type="text"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder="输入题库名称"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddBank}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 3: 提交布局组件**

```bash
git add src/components/Layout/ src/index.css
git commit -m "feat: add Header component and global styles"
```

---

### Task 4: 创建首页仪表盘组件

**Files:**
- Create: `src/components/Dashboard/BankCard.tsx`
- Create: `src/components/Dashboard/BankList.tsx`
- Create: `src/components/Dashboard/QuickStats.tsx`
- Create: `src/components/Dashboard/index.tsx`

- [ ] **Step 1: 创建 BankCard 组件**

```tsx
// src/components/Dashboard/BankCard.tsx
import { BookOpen, Trash2, Edit3, PlayCircle } from 'lucide-react';

interface BankCardProps {
  bank: QuestionBank;
  onDelete: () => void;
  onPractice: () => void;
}

export function BankCard({ bank, onDelete, onPractice }: BankCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{bank.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{bank.questions.length} 道题目</p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>创建于 {formatDate(bank.createdAt)}</p>
        <p>更新于 {formatDate(bank.updatedAt)}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlayCircle className="h-4 w-4" />
          开始刷题
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Edit3 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 BankList 组件**

```tsx
// src/components/Dashboard/BankList.tsx
import { useBankStore } from '../../store/bank';
import { BankCard } from './BankCard';
import { Plus } from 'lucide-react';

export function BankList() {
  const { banks, deleteBank, addBank } = useBankStore();

  return (
    <div className="space-y-6">
      {banks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">还没有题库</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">点击上方按钮创建第一个题库</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <BankCard
              key={bank.id}
              bank={bank}
              onDelete={() => deleteBank(bank.id)}
              onPractice={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 Dashboard 组件**

```tsx
// src/components/Dashboard/index.tsx
import { BankList } from './BankList';

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">我的题库</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">选择一个题库开始刷题，或创建新的题库</p>
      </div>
      <BankList />
    </div>
  );
}
```

- [ ] **Step 4: 提交首页组件**

```bash
git add src/components/Dashboard/
git commit -m "feat: add Dashboard and BankList components"
```

---

### Task 5: 创建题目表单组件

**Files:**
- Create: `src/components/Bank/QuestionForm.tsx`

- [ ] **Step 1: 创建题目表单组件**

```tsx
// src/components/Bank/QuestionForm.tsx
import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useBankStore } from '../../store/bank';

interface QuestionFormProps {
  bankId: string;
  question?: Question;
  onClose: () => void;
}

export function QuestionForm({ bankId, question, onClose }: QuestionFormProps) {
  const { addQuestion, updateQuestion } = useBankStore();
  const [type, setType] = useState<QuestionType>(question?.type || 'single');
  const [content, setContent] = useState(question?.content || '');
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options || [
      { key: 'A', content: '' },
      { key: 'B', content: '' },
      { key: 'C', content: '' },
      { key: 'D', content: '' },
    ]
  );
  const [correctAnswer, setCorrectAnswer] = useState<string[]>(question?.correctAnswer || []);
  const [analysis, setAnalysis] = useState(question?.analysis || '');

  const handleAddOption = () => {
    const nextKey = String.fromCharCode(65 + options.length);
    setOptions([...options, { key: nextKey, content: '' }]);
  };

  const handleRemoveOption = (key: string) => {
    if (options.length > 2) {
      setOptions(options.filter((o) => o.key !== key));
      setCorrectAnswer(correctAnswer.filter((a) => a !== key));
    }
  };

  const handleOptionChange = (key: string, content: string) => {
    setOptions(options.map((o) => (o.key === key ? { ...o, content } : o)));
  };

  const handleAnswerToggle = (key: string) => {
    if (type === 'judge') {
      setCorrectAnswer([key]);
    } else if (type === 'single') {
      setCorrectAnswer([key]);
    } else {
      setCorrectAnswer(
        correctAnswer.includes(key)
          ? correctAnswer.filter((a) => a !== key)
          : [...correctAnswer, key]
      );
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || options.some((o) => !o.content.trim())) {
      alert('请填写完整的题目信息');
      return;
    }

    const questionData = {
      type,
      content,
      options,
      correctAnswer,
      analysis,
    };

    if (question) {
      updateQuestion(bankId, question.id, questionData);
    } else {
      addQuestion(bankId, questionData);
    }
    onClose();
  };

  const getTypeLabel = (t: QuestionType) => {
    const labels = { single: '单选题', multiple: '多选题', judge: '判断题' };
    return labels[t];
  };

  const renderOptions = () => {
    if (type === 'judge') {
      return (
        <div className="space-y-2">
          {['对', '错'].map((key, idx) => (
            <label key={key} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer">
              <input
                type="radio"
                checked={correctAnswer[0] === key}
                onChange={() => handleAnswerToggle(key)}
                className="w-4 h-4"
              />
              <span className="font-medium">{key}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.key} className="flex items-center gap-3">
            <button
              onClick={() => handleAnswerToggle(option.key)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                correctAnswer.includes(option.key)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.key}
            </button>
            <input
              type="text"
              value={option.content}
              onChange={(e) => handleOptionChange(option.key, e.target.value)}
              placeholder={`选项 ${option.key}`}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {options.length > 2 && (
              <button
                onClick={() => handleRemoveOption(option.key)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {options.length < 26 && (
          <button
            onClick={handleAddOption}
            className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500"
          >
            <Plus className="h-4 w-4" />
            添加选项
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {question ? '编辑题目' : '添加题目'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              题目类型
            </label>
            <div className="flex gap-2">
              {(['single', 'multiple', 'judge'] as QuestionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setCorrectAnswer([]);
                    if (t === 'judge') {
                      setOptions([{ key: '对', content: '' }, { key: '错', content: '' }]);
                    } else if (options.length < 2) {
                      setOptions([
                        { key: 'A', content: '' },
                        { key: 'B', content: '' },
                      ]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    type === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {getTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              题干
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入题目内容"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选项 {type === 'single' && '(单选)'} {type === 'multiple' && '(多选)'}
            </label>
            {renderOptions()}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              解析（可选）
            </label>
            <textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="请输入题目解析"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {question ? '保存修改' : '添加题目'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交题目表单组件**

```bash
git add src/components/Bank/QuestionForm.tsx
git commit -m "feat: add QuestionForm component"
```

---

## 阶段二：刷题模式与错题本

### Task 6: 创建刷题模式组件

**Files:**
- Create: `src/components/Practice/QuestionNav.tsx`
- Create: `src/components/Practice/QuestionView.tsx`
- Create: `src/components/Practice/OptionPanel.tsx`
- Create: `src/components/Practice/FeedbackPanel.tsx`
- Create: `src/components/Practice/index.tsx`

- [ ] **Step 1: 创建题目导航组件**

```tsx
// src/components/Practice/QuestionNav.tsx
import { usePracticeStore } from '../../store/practice';

export function QuestionNav() {
  const { questions, currentIndex, answers, marked, goToQuestion } = usePracticeStore();

  const getStatusClass = (index: number) => {
    const question = questions[index];
    const isAnswered = answers[question.id]?.length > 0;
    const isMarked = marked.includes(question.id);
    const isCurrent = index === currentIndex;

    let baseClass = 'w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors cursor-pointer';
    
    if (isCurrent) {
      return `${baseClass} bg-blue-600 text-white`;
    }
    
    if (isMarked) {
      return `${baseClass} bg-yellow-100 dark:bg-yellow-900 text-yellow-700`;
    }
    
    if (isAnswered) {
      return `${baseClass} bg-green-100 dark:bg-green-900 text-green-700`;
    }
    
    return `${baseClass} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">题目导航</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => goToQuestion(index)}
            className={getStatusClass(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900" />
          已答
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700" />
          未答
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900" />
          标记
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建题目视图组件**

```tsx
// src/components/Practice/QuestionView.tsx
import { Flag } from 'lucide-react';
import { usePracticeStore } from '../../store/practice';

export function QuestionView() {
  const { questions, currentIndex, marked, markQuestion, isSubmitted } = usePracticeStore();
  const question = questions[currentIndex];

  if (!question) return null;

  const isMarked = marked.includes(question.id);
  const isCorrect = isSubmitted ? usePracticeStore.getState().results[question.id] : null;

  const getTypeLabel = (type: QuestionType) => {
    const labels = { single: '单选题', multiple: '多选题', judge: '判断题' };
    return labels[type];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full text-sm font-medium">
            第 {currentIndex + 1} / {questions.length} 题
          </span>
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
            {getTypeLabel(question.type)}
          </span>
        </div>
        <button
          onClick={() => markQuestion(question.id)}
          className={`p-2 rounded-lg transition-colors ${
            isMarked
              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Flag className={`h-5 w-5 ${isMarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className={`text-lg leading-relaxed ${isSubmitted ? (isCorrect ? 'text-green-600' : 'text-red-600') : 'text-gray-900 dark:text-white'}`}>
        {question.content}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建选项面板组件**

```tsx
// src/components/Practice/OptionPanel.tsx
import { CheckCircle, XCircle } from 'lucide-react';
import { usePracticeStore } from '../../store/practice';

export function OptionPanel() {
  const { questions, currentIndex, answers, setAnswer, isSubmitted } = usePracticeStore();
  const question = questions[currentIndex];

  if (!question) return null;

  const userAnswer = answers[question.id] || [];
  const isCorrect = isSubmitted ? usePracticeStore.getState().results[question.id] : null;

  const handleOptionClick = (key: string) => {
    if (isSubmitted) return;

    if (question.type === 'single' || question.type === 'judge') {
      setAnswer(question.id, [key]);
    } else {
      const newAnswer = userAnswer.includes(key)
        ? userAnswer.filter((a) => a !== key)
        : [...userAnswer, key];
      setAnswer(question.id, newAnswer);
    }
  };

  const getOptionClass = (key: string) => {
    const isSelected = userAnswer.includes(key);
    const isCorrectAnswer = question.correctAnswer.includes(key);
    
    if (!isSubmitted) {
      return isSelected
        ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700'
        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600';
    }

    if (isCorrectAnswer) {
      return 'bg-green-100 dark:bg-green-900 border-green-500 text-green-700';
    }
    
    if (isSelected && !isCorrectAnswer) {
      return 'bg-red-100 dark:bg-red-900 border-red-500 text-red-700';
    }
    
    return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400';
  };

  const renderOptions = () => {
    if (question.type === 'judge') {
      return (
        <>
          <button
            onClick={() => handleOptionClick('对')}
            disabled={isSubmitted}
            className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-colors ${getOptionClass('对')}`}
          >
            {isSubmitted && question.correctAnswer.includes('对') && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {isSubmitted && userAnswer.includes('对') && !question.correctAnswer.includes('对') && (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">正确</span>
          </button>
          <button
            onClick={() => handleOptionClick('错')}
            disabled={isSubmitted}
            className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-colors ${getOptionClass('错')}`}
          >
            {isSubmitted && question.correctAnswer.includes('错') && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {isSubmitted && userAnswer.includes('错') && !question.correctAnswer.includes('错') && (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">错误</span>
          </button>
        </>
      );
    }

    return question.options.map((option) => (
      <button
        key={option.key}
        onClick={() => handleOptionClick(option.key)}
        disabled={isSubmitted}
        className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-colors ${getOptionClass(option.key)}`}
      >
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
          userAnswer.includes(option.key)
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}>
          {option.key}
        </span>
        {isSubmitted && question.correctAnswer.includes(option.key) && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {isSubmitted && userAnswer.includes(option.key) && !question.correctAnswer.includes(option.key) && (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className="flex-1 text-left">{option.content}</span>
      </button>
    ));
  };

  return (
    <div className="space-y-3">
      {renderOptions()}
    </div>
  );
}
```

- [ ] **Step 4: 创建反馈面板组件**

```tsx
// src/components/Practice/FeedbackPanel.tsx
import { Lightbulb } from 'lucide-react';
import { usePracticeStore } from '../../store/practice';

export function FeedbackPanel() {
  const { questions, currentIndex, isSubmitted, results } = usePracticeStore();
  const question = questions[currentIndex];

  if (!question || !isSubmitted) return null;

  const isCorrect = results[question.id];

  return (
    <div className={`rounded-xl p-6 ${isCorrect ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
      <div className="flex items-center gap-3 mb-3">
        <Lightbulb className={`h-6 w-6 ${isCorrect ? 'text-green-600' : 'text-red-600'}`} />
        <h3 className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
          {isCorrect ? '回答正确！' : '回答错误'}
        </h3>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">正确答案：</p>
        <p className="font-medium text-gray-900 dark:text-white">
          {question.correctAnswer.join('、')}
        </p>
      </div>
      
      {question.analysis && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">解析：</p>
          <p className="text-gray-700 dark:text-gray-300">{question.analysis}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 创建刷题主组件**

```tsx
// src/components/Practice/index.tsx
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Send, RotateCcw } from 'lucide-react';
import { usePracticeStore } from '../../store/practice';
import { useBankStore } from '../../store/bank';
import { useWrongStore } from '../../store/wrong';
import { QuestionNav } from './QuestionNav';
import { QuestionView } from './QuestionView';
import { OptionPanel } from './OptionPanel';
import { FeedbackPanel } from './FeedbackPanel';

interface PracticeProps {
  bankId: string;
}

export function Practice({ bankId }: PracticeProps) {
  const { banks } = useBankStore();
  const { startPractice, currentIndex, questions, answers, nextQuestion, prevQuestion, submitAnswers, isSubmitted, resetPractice } = usePracticeStore();
  const { addWrong } = useWrongStore();
  const [configOpen, setConfigOpen] = useState(true);
  const [singleCount, setSingleCount] = useState(5);
  const [multipleCount, setMultipleCount] = useState(5);
  const [judgeCount, setJudgeCount] = useState(5);
  const [isRandom, setIsRandom] = useState(true);

  const bank = banks.find((b) => b.id === bankId);

  const handleStartPractice = () => {
    let filteredQuestions: Question[] = [];
    
    if (bank) {
      const singleQuestions = bank.questions.filter((q) => q.type === 'single');
      const multipleQuestions = bank.questions.filter((q) => q.type === 'multiple');
      const judgeQuestions = bank.questions.filter((q) => q.type === 'judge');

      const sample = (arr: Question[], count: number) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
      };

      if (singleCount > 0) filteredQuestions.push(...sample(singleQuestions, singleCount));
      if (multipleCount > 0) filteredQuestions.push(...sample(multipleQuestions, multipleCount));
      if (judgeCount > 0) filteredQuestions.push(...sample(judgeQuestions, judgeCount));

      if (isRandom) {
        filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5);
      }
    }

    if (filteredQuestions.length === 0) {
      alert('没有符合条件的题目');
      return;
    }

    startPractice(filteredQuestions);
    setConfigOpen(false);
  };

  const handleSubmit = () => {
    submitAnswers();
    
    questions.forEach((q) => {
      const userAnswer = answers[q.id] || [];
      const isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(q.correctAnswer.sort());
      if (!isCorrect) {
        addWrong(q.id, bankId, userAnswer);
      }
    });
  };

  const handleReset = () => {
    resetPractice();
    setConfigOpen(true);
  };

  if (!bank) {
    return <div className="text-center py-16">题库不存在</div>;
  }

  if (configOpen) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">刷题设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                题库：{bank.name}
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  单选题数量
                </label>
                <input
                  type="number"
                  value={singleCount}
                  onChange={(e) => setSingleCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  多选题数量
                </label>
                <input
                  type="number"
                  value={multipleCount}
                  onChange={(e) => setMultipleCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  判断题数量
                </label>
                <input
                  type="number"
                  value={judgeCount}
                  onChange={(e) => setJudgeCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">随机抽取题目</span>
              <button
                onClick={() => setIsRandom(!isRandom)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isRandom ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isRandom ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              onClick={handleStartPractice}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              开始刷题
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <QuestionNav />
        </div>

        <div className="flex-1 space-y-6">
          <QuestionView />
          <OptionPanel />
          <FeedbackPanel />

          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <RotateCcw className="h-4 w-4" />
              重新开始
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                上一题
              </button>

              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Send className="h-4 w-4" />
                  提交答案
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  完成练习
                </button>
              )}

              <button
                onClick={nextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一题
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 提交刷题组件**

```bash
git add src/components/Practice/
git commit -m "feat: add Practice components for quiz mode"
```

---

### Task 7: 创建错题本组件

**Files:**
- Create: `src/components/WrongBook/FilterBar.tsx`
- Create: `src/components/WrongBook/WrongList.tsx`
- Create: `src/components/WrongBook/index.tsx`

- [ ] **Step 1: 创建错题本主组件**

```tsx
// src/components/WrongBook/index.tsx
import { useState } from 'react';
import { Trash2, PlayCircle, Search, Filter } from 'lucide-react';
import { useWrongStore } from '../../store/wrong';
import { useBankStore } from '../../store/bank';
import { usePracticeStore } from '../../store/practice';

export function WrongBook() {
  const { wrongQuestions, removeWrong, clearAll } = useWrongStore();
  const { banks } = useBankStore();
  const { startPractice } = usePracticeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [filterBank, setFilterBank] = useState('');

  const getQuestionById = (bankId: string, questionId: string): Question | undefined => {
    const bank = banks.find((b) => b.id === bankId);
    return bank?.questions.find((q) => q.id === questionId);
  };

  const filteredWrong = wrongQuestions.filter((w) => {
    const question = getQuestionById(w.bankId, w.questionId);
    if (!question) return false;

    if (searchTerm && !question.content.includes(searchTerm)) return false;
    if (filterType !== 'all' && question.type !== filterType) return false;
    if (filterBank && w.bankId !== filterBank) return false;

    return true;
  });

  const handlePracticeWrong = () => {
    const questions = filteredWrong
      .map((w) => getQuestionById(w.bankId, w.questionId))
      .filter((q): q is Question => q !== undefined);

    if (questions.length === 0) {
      alert('没有符合条件的错题');
      return;
    }

    startPractice(questions);
  };

  const handleRemoveAll = () => {
    if (confirm('确定要清空所有错题吗？')) {
      clearAll();
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    const labels = { single: '单选', multiple: '多选', judge: '判断' };
    return labels[type];
  };

  const getBankName = (bankId: string) => {
    return banks.find((b) => b.id === bankId)?.name || '未知题库';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">错题本</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePracticeWrong}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlayCircle className="h-4 w-4" />
            错题重刷
          </button>
          <button
            onClick={handleRemoveAll}
            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
            清空错题
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索题目内容..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">全部题库</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as QuestionType | 'all')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">全部题型</option>
              <option value="single">单选题</option>
              <option value="multiple">多选题</option>
              <option value="judge">判断题</option>
            </select>
          </div>
        </div>
      </div>

      {filteredWrong.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无错题</h3>
          <p className="text-gray-500 dark:text-gray-400">继续刷题，错题会自动收集到这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWrong.map((w) => {
            const question = getQuestionById(w.bankId, w.questionId);
            if (!question) return null;

            return (
              <div
                key={w.questionId}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 rounded text-xs font-medium">
                        {getTypeLabel(question.type)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                        {getBankName(w.bankId)}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 rounded text-xs">
                        错误 {w.wrongCount} 次
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white mb-3">{question.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <span
                          key={option.key}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            question.correctAnswer.includes(option.key)
                              ? 'bg-green-100 dark:bg-green-900 text-green-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {option.key}. {option.content}
                        </span>
                      ))}
                    </div>
                    {question.analysis && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{question.analysis}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeWrong(w.questionId)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 提交错题本组件**

```bash
git add src/components/WrongBook/
git commit -m "feat: add WrongBook components"
```

---

### Task 8: 创建数据导入工具

**Files:**
- Create: `src/utils/excel.ts`
- Create: `src/utils/txt.ts`

- [ ] **Step 1: 创建Excel导入工具**

```typescript
// src/utils/excel.ts
import * as XLSX from 'xlsx';

export interface ExcelQuestion {
  type: string;
  content: string;
  options: string[];
  correctAnswer: string;
  analysis: string;
}

export const parseExcel = (file: File): Promise<ExcelQuestion[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const questions: ExcelQuestion[] = jsonData.map((row: any) => ({
          type: row['类型'] || row['type'] || 'single',
          content: row['题目'] || row['content'] || '',
          options: [
            row['A'] || row['选项A'] || '',
            row['B'] || row['选项B'] || '',
            row['C'] || row['选项C'] || '',
            row['D'] || row['选项D'] || '',
            row['E'] || row['选项E'] || '',
            row['F'] || row['选项F'] || '',
          ].filter(Boolean),
          correctAnswer: row['答案'] || row['answer'] || '',
          analysis: row['解析'] || row['analysis'] || '',
        })).filter((q) => q.content.trim());
        
        resolve(questions);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
};

export const convertToQuestion = (excelQuestion: ExcelQuestion): Omit<Question, 'id'> => {
  const typeMap: Record<string, QuestionType> = {
    '单选': 'single',
    '多选': 'multiple',
    '判断': 'judge',
    'single': 'single',
    'multiple': 'multiple',
    'judge': 'judge',
  };

  const type = typeMap[excelQuestion.type] || 'single';
  
  let options: QuestionOption[];
  let correctAnswer: string[];

  if (type === 'judge') {
    options = [
      { key: '对', content: '' },
      { key: '错', content: '' },
    ];
    correctAnswer = excelQuestion.correctAnswer === '对' || excelQuestion.correctAnswer === '正确' ? ['对'] : ['错'];
  } else {
    options = excelQuestion.options.map((content, index) => ({
      key: String.fromCharCode(65 + index),
      content,
    }));
    correctAnswer = excelQuestion.correctAnswer.split('').filter((c: string) => c.match(/[A-Za-z]/));
  }

  return {
    type,
    content: excelQuestion.content,
    options,
    correctAnswer,
    analysis: excelQuestion.analysis,
  };
};
```

- [ ] **Step 2: 创建TXT导入工具**

```typescript
// src/utils/txt.ts
export interface TxtQuestion {
  type: string;
  content: string;
  options: Record<string, string>;
  correctAnswer: string;
  analysis: string;
}

export const parseTxt = (content: string): TxtQuestion[] => {
  const questions: TxtQuestion[] = [];
  const blocks = content.split(/\n\n+/);

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    if (lines.length < 3) return;

    const question: TxtQuestion = {
      type: 'single',
      content: '',
      options: {},
      correctAnswer: '',
      analysis: '',
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('类型:')) {
        question.type = trimmed.replace('类型:', '').trim();
      } else if (trimmed.startsWith('题目:')) {
        question.content = trimmed.replace('题目:', '').trim();
      } else if (/^[A-Za-z][．:.、]/.test(trimmed)) {
        const key = trimmed.charAt(0).toUpperCase();
        const optionContent = trimmed.slice(2).trim();
        question.options[key] = optionContent;
      } else if (trimmed.startsWith('答案:')) {
        question.correctAnswer = trimmed.replace('答案:', '').trim();
      } else if (trimmed.startsWith('解析:')) {
        question.analysis = trimmed.replace('解析:', '').trim();
      }
    });

    if (question.content && Object.keys(question.options).length > 0) {
      questions.push(question);
    }
  });

  return questions;
};

export const convertTxtToQuestion = (txtQuestion: TxtQuestion): Omit<Question, 'id'> => {
  const typeMap: Record<string, QuestionType> = {
    '单选': 'single',
    '多选': 'multiple',
    '判断': 'judge',
    'single': 'single',
    'multiple': 'multiple',
    'judge': 'judge',
  };

  const type = typeMap[txtQuestion.type] || 'single';
  
  let options: QuestionOption[];
  let correctAnswer: string[];

  if (type === 'judge') {
    options = [
      { key: '对', content: '' },
      { key: '错', content: '' },
    ];
    correctAnswer = txtQuestion.correctAnswer === '对' || txtQuestion.correctAnswer === '正确' ? ['对'] : ['错'];
  } else {
    const sortedKeys = Object.keys(txtQuestion.options).sort();
    options = sortedKeys.map((key) => ({
      key,
      content: txtQuestion.options[key],
    }));
    correctAnswer = txtQuestion.correctAnswer.split('').filter((c: string) => c.match(/[A-Za-z]/));
  }

  return {
    type,
    content: txtQuestion.content,
    options,
    correctAnswer,
    analysis: txtQuestion.analysis,
  };
};
```

- [ ] **Step 3: 提交导入工具**

```bash
git add src/utils/excel.ts src/utils/txt.ts
git commit -m "feat: add Excel and TXT import utilities"
```

---

### Task 9: 创建App.tsx主组件

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: 创建App组件**

```tsx
// src/App.tsx
import { useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard';
import { Practice } from './components/Practice';
import { WrongBook } from './components/WrongBook';
import { useConfigStore } from './store/config';
import './index.css';

function App() {
  const { darkMode } = useConfigStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderContent = () => {
    const path = window.location.pathname;
    
    if (path.startsWith('/practice/')) {
      const bankId = path.split('/')[2];
      return <Practice bankId={bankId} />;
    }
    
    if (path === '/wrong') {
      return <WrongBook />;
    }
    
    return <Dashboard />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="pb-8">{renderContent()}</main>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 创建main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: 提交主组件**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: add App and main components"
```

---

## 阶段三：体验提升与高级功能

### Task 10: 实现搜索与过滤功能

**Files:**
- Modify: `src/components/Bank/SearchBar.tsx`
- Modify: `src/components/Bank/QuestionTable.tsx`

- [ ] **Step 1: 创建搜索栏组件**

```tsx
// src/components/Bank/SearchBar.tsx
import { Search, Filter } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: QuestionType | 'all';
  onFilterChange: (type: QuestionType | 'all') => void;
}

export function SearchBar({ searchTerm, onSearchChange, filterType, onFilterChange }: SearchBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索题目内容..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value as QuestionType | 'all')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">全部题型</option>
          <option value="single">单选题</option>
          <option value="multiple">多选题</option>
          <option value="judge">判断题</option>
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交搜索组件**

```bash
git add src/components/Bank/SearchBar.tsx
git commit -m "feat: add search and filter functionality"
```

---

### Task 11: 实现练习统计功能

**Files:**
- Create: `src/components/Statistics/SummaryCards.tsx`
- Create: `src/components/Statistics/TrendChart.tsx`
- Create: `src/components/Statistics/index.tsx`

- [ ] **Step 1: 创建统计卡片组件**

```tsx
// src/components/Statistics/SummaryCards.tsx
import { Target, Clock, Award, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  totalQuestions: number;
  totalCorrect: number;
  avgTime: number;
  accuracy: number;
}

export function SummaryCards({ totalQuestions, totalCorrect, avgTime, accuracy }: SummaryCardsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cards = [
    {
      title: '总答题数',
      value: totalQuestions,
      icon: Target,
      color: 'blue',
    },
    {
      title: '正确数',
      value: totalCorrect,
      icon: Award,
      color: 'green',
    },
    {
      title: '平均用时',
      value: formatTime(avgTime),
      icon: Clock,
      color: 'orange',
    },
    {
      title: '正确率',
      value: `${accuracy}%`,
      icon: TrendingUp,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[card.color]}`}>
            <card.icon className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建趋势图表组件**

```tsx
// src/components/Statistics/TrendChart.tsx
import { useMemo } from 'react';

interface TrendChartProps {
  records: PracticeRecord[];
}

export function TrendChart({ records }: TrendChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.endTime - b.endTime);
    return sorted.slice(-7).map((record) => ({
      date: new Date(record.endTime).toLocaleDateString('zh-CN'),
      accuracy: Math.round((record.correctCount / record.totalCount) * 100),
    }));
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">暂无练习记录</p>
      </div>
    );
  }

  const maxAccuracy = Math.max(...chartData.map((d) => d.accuracy), 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">正确率趋势</h3>
      <div className="flex items-end justify-between h-48 gap-4">
        {chartData.map((item) => (
          <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white mb-1">{item.accuracy}%</span>
              <div
                className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg transition-all duration-300"
                style={{ height: `${(item.accuracy / maxAccuracy) * 150}px` }}
              >
                <div
                  className="w-full bg-blue-600 rounded-t-lg"
                  style={{ height: '100%' }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建统计主组件**

```tsx
// src/components/Statistics/index.tsx
import { useMemo } from 'react';
import { SummaryCards } from './SummaryCards';
import { TrendChart } from './TrendChart';
import { storage } from '../../utils/storage';

export function Statistics() {
  const records = storage.getRecords();

  const stats = useMemo(() => {
    const totalQuestions = records.reduce((sum, r) => sum + r.totalCount, 0);
    const totalCorrect = records.reduce((sum, r) => sum + r.correctCount, 0);
    const totalTime = records.reduce((sum, r) => sum + (r.endTime - r.startTime), 0);
    const avgTime = records.length > 0 ? Math.round(totalTime / 1000 / records.length) : 0;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return { totalQuestions, totalCorrect, avgTime, accuracy };
  }, [records]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">练习统计</h2>
      <SummaryCards {...stats} />
      <div className="mt-6">
        <TrendChart records={records} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交统计组件**

```bash
git add src/components/Statistics/
git commit -m "feat: add statistics components"
```

---

## 阶段四：高级功能

### Task 12: 实现快捷键支持

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: 创建键盘快捷键Hook**

```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';
import { usePracticeStore } from '../store/practice';

interface ShortcutHandlers {
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onMark?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { questions, currentIndex, answers } = usePracticeStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (key === 'arrowleft' || key === 'a') {
        handlers.onPrev?.();
      } else if (key === 'arrowright' || key === 'd') {
        handlers.onNext?.();
      } else if (key === 'enter') {
        const currentQuestion = questions[currentIndex];
        if (currentQuestion && answers[currentQuestion.id]?.length > 0) {
          handlers.onSubmit?.();
        }
      } else if (key === 'm') {
        handlers.onMark?.();
      } else if (/^[a-z]$/.test(key)) {
        const optionKey = key.toUpperCase();
        const currentQuestion = questions[currentIndex];
        if (currentQuestion) {
          const optionExists = currentQuestion.options.some((o) => o.key === optionKey);
          if (optionExists) {
            const currentAnswer = answers[currentQuestion.id] || [];
            const newAnswer = currentAnswer.includes(optionKey)
              ? currentAnswer.filter((a) => a !== optionKey)
              : [...currentAnswer, optionKey];
            usePracticeStore.getState().setAnswer(currentQuestion.id, newAnswer);
          }
        }
      }
    },
    [questions, currentIndex, answers, handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

- [ ] **Step 2: 在刷题组件中使用快捷键**

```tsx
// src/components/Practice/index.tsx (添加)
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// 在组件中添加
useKeyboardShortcuts({
  onPrev: prevQuestion,
  onNext: nextQuestion,
  onSubmit: handleSubmit,
  onMark: () => markQuestion(questions[currentIndex]?.id),
});
```

- [ ] **Step 3: 提交快捷键功能**

```bash
git add src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: add keyboard shortcuts support"
```

---

## 测试与部署

### Task 13: 添加测试脚本

**Files:**
- Create: `tests/storage.test.ts`
- Modify: `package.json`

- [ ] **Step 1: 添加测试依赖**

```bash
npm install -D jest @types/jest ts-jest
```

- [ ] **Step 2: 配置Jest**

```js
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
```

- [ ] **Step 3: 添加测试脚本到package.json**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "build": "vite build"
  }
}
```

- [ ] **Step 4: 提交测试配置**

```bash
git add jest.config.js package.json
git commit -m "chore: add test configuration"
```

---

## 项目启动

### Task 14: 启动开发服务器

- [ ] **Step 1: 运行开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 构建生产版本**

```bash
npm run build
```

---

## 总结

本实现计划包含以下核心功能：

1. **题库管理**：多题库支持、题目增删改、Excel/TXT导入
2. **刷题模式**：自定义数量、随机/顺序抽取、即时反馈
3. **错题本**：自动收集、筛选搜索、错题重刷
4. **数据持久化**：localStorage存储、JSON导入导出
5. **用户体验**：暗黑模式、统计图表、快捷键支持

所有功能都采用React + Tailwind CSS + Zustand技术栈实现，代码结构清晰，便于后续维护和扩展。

**文档版本**: v1.0  
**创建时间**: 2026-05-09  
**适用项目**: 网页版刷题系统