import { QuestionBank, WrongQuestion, PracticeRecord, UserConfig } from '../types';

const STORAGE_KEYS = {
  BANKS: 'quiz_banks',
  WRONG: 'quiz_wrong',
  RECORDS: 'quiz_records',
  CONFIG: 'quiz_config',
};

const defaultConfig: UserConfig = {
  darkMode: false,
  currentBankId: '',
  randomOptionOrder: false,
  multiBankTypeOrder: ['judge', 'single', 'multiple', 'fill', 'short'],
  showAnswerSwitch: false,
  enableAIInPractice: false,
};

export const storage = {
  getBanks(): QuestionBank[] {
    const data = localStorage.getItem(STORAGE_KEYS.BANKS);
    return data ? JSON.parse(data) : [];
  },

  setBanks(banks: QuestionBank[]): void {
    try { localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks)); } catch {}
  },

  getWrong(): WrongQuestion[] {
    const data = localStorage.getItem(STORAGE_KEYS.WRONG);
    const raw: any[] = data ? JSON.parse(data) : [];
    return raw.map((w: any) => ({
      ...w,
      correctAnswer: w.correctAnswer || [],
      firstWrongAt: w.firstWrongAt || w.lastWrongAt || Date.now(),
    }));
  },

  setWrong(wrong: WrongQuestion[]): void {
    try { localStorage.setItem(STORAGE_KEYS.WRONG, JSON.stringify(wrong)); } catch {}
  },

  getRecords(): PracticeRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  setRecords(records: PracticeRecord[]): void {
    try { localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records)); } catch {}
  },

  getConfig(): UserConfig {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const stored = data ? JSON.parse(data) : {};
    return Object.assign({ ...defaultConfig }, stored);
  },

  setConfig(config: UserConfig): void {
    try { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config)); } catch {}
  },

  clearAll(): void {
    try { localStorage.removeItem(STORAGE_KEYS.BANKS); } catch {}
    try { localStorage.removeItem(STORAGE_KEYS.WRONG); } catch {}
    try { localStorage.removeItem(STORAGE_KEYS.RECORDS); } catch {}
    try { localStorage.removeItem(STORAGE_KEYS.CONFIG); } catch {}
    try { localStorage.removeItem('ai_config'); } catch {}
    try { localStorage.removeItem('ai_explanations'); } catch {}
  },

  exportData(): string {
    const records = this.getRecords().map((r) => ({
      ...r,
      bankIds: r.bankIds || (r.bankId ? [r.bankId] : []),
      bankId: r.bankId || (r.bankIds ? r.bankIds[0] : ''),
    }));
    let aiConfig = null;
    try {
      const raw = localStorage.getItem('ai_config');
      if (raw) aiConfig = JSON.parse(raw);
    } catch { /* ignore */ }
    return JSON.stringify({
      banks: this.getBanks(),
      wrong: this.getWrong(),
      records,
      config: this.getConfig(),
      aiConfig,
    }, null, 2);
  },

  importData(jsonStr: string): { success: boolean; error?: string; preview?: { banks: number; questions: number; wrong: number; records: number } } {
    try {
      const data = JSON.parse(jsonStr);

      // Validate structure
      if (!data || typeof data !== 'object') {
        return { success: false, error: '数据格式无效：不是有效的 JSON 对象' };
      }

      // Validate banks field
      if (data.banks !== undefined && !Array.isArray(data.banks)) {
        return { success: false, error: 'banks 字段格式错误：应为数组' };
      }

      // Validate wrong field
      if (data.wrong !== undefined && !Array.isArray(data.wrong)) {
        return { success: false, error: 'wrong 字段格式错误：应为数组' };
      }

      // Validate records field
      if (data.records !== undefined && !Array.isArray(data.records)) {
        return { success: false, error: 'records 字段格式错误：应为数组' };
      }

      // Compute preview
      const bankCount = data.banks?.length || 0;
      const questionCount = data.banks?.reduce((sum: number, b: any) => sum + (b.questions?.length || 0), 0) || 0;
      const wrongCount = data.wrong?.length || 0;
      const recordCount = data.records?.length || 0;

      // Store data
      if (data.banks) this.setBanks(data.banks);
      if (data.wrong) this.setWrong(data.wrong);
      if (data.records) {
        const normalizedRecords = data.records.map((r: any) => ({
          ...r,
          bankIds: r.bankIds || (r.bankId ? [r.bankId] : []),
          bankId: r.bankId || (r.bankIds ? r.bankIds[0] : ''),
        }));
        this.setRecords(normalizedRecords);
      }
      if (data.config) this.setConfig(data.config);
      if (data.aiConfig) {
        localStorage.setItem('ai_config', JSON.stringify(data.aiConfig));
      }

      return { success: true, preview: { banks: bankCount, questions: questionCount, wrong: wrongCount, records: recordCount } };
    } catch (e) {
      // Differentiate JSON parse error from other errors
      const message = e instanceof Error ? e.message : '未知错误';
      if (message.includes('JSON')) {
        return { success: false, error: `JSON 格式无效：${message}` };
      }
      return { success: false, error: `数据校验失败：${message}` };
    }
  },
};