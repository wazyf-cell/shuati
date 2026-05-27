import * as XLSX from 'xlsx';
import { Question, QuestionType, QuestionOption } from '../types';

/**
 * 解析后的题目，去除 id 字段，可选携带错误信息
 */
export type ParsedQuestion = Omit<Question, 'id'> & { errors?: string[] };

// ---------------------------------------------------------------------------
// 常量映射
// ---------------------------------------------------------------------------

/** 列名到内部字段名的映射（中英文均支持） */
const COLUMN_MAP: Record<string, string> = {
  '题型': 'type',
  'type': 'type',

  '题干': 'content',
  'content': 'content',
  'question': 'content',

  '选项A': 'optionA',
  'A': 'optionA',
  '选项B': 'optionB',
  'B': 'optionB',
  '选项C': 'optionC',
  'C': 'optionC',
  '选项D': 'optionD',
  'D': 'optionD',
  '选项E': 'optionE',
  'E': 'optionE',
  '选项F': 'optionF',
  'F': 'optionF',

  '正确答案': 'correctAnswer',
  'correctAnswer': 'correctAnswer',
  'answer': 'correctAnswer',

  '解析': 'analysis',
  'analysis': 'analysis',
  'explanation': 'analysis',
};

/** 题型字符串到 QuestionType 的映射 */
const TYPE_MAP: Record<string, QuestionType> = {
  '单选': 'single',
  'single': 'single',
  '单选题': 'single',

  '多选': 'multiple',
  'multiple': 'multiple',
  '多选题': 'multiple',

  '判断': 'judge',
  'judge': 'judge',
  '判断题': 'judge',

  '填空': 'fill',
  'fill': 'fill',
  '填空题': 'fill',

  '简答': 'short',
  'short': 'short',
  '简答题': 'short',
};

/** 选项键位顺序 */
const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

/**
 * 将表头行映射为 "列索引 → 内部字段名" 的字典
 */
function normalizeHeaders(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  headers.forEach((header, index) => {
    const key = (header ?? '').trim();
    const field = COLUMN_MAP[key];
    if (field) {
      mapping[index] = field;
    }
  });
  return mapping;
}

/**
 * 根据表头映射将一行数据转为字段值字典
 */
function parseRow(
  row: string[],
  headerMap: Record<number, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  row.forEach((cell, index) => {
    const field = headerMap[index];
    if (field) {
      result[field] = (cell ?? '').trim();
    }
  });
  return result;
}

/**
 * 从已解析的字段字典中提取选项列表（按 A-F 顺序）
 */
function collectOptions(data: Record<string, string>): QuestionOption[] {
  const options: QuestionOption[] = [];
  for (const key of OPTION_KEYS) {
    const content = data[`option${key}`];
    if (content) {
      options.push({ key, content });
    }
  }
  return options;
}

/**
 * 将题型字符串映射为 QuestionType，无法识别时返回 null
 */
function mapType(raw: string): QuestionType | null {
  return TYPE_MAP[raw.trim()] ?? null;
}

/**
 * 根据题型解析正确答案字符串
 *
 * - 判断题：'对'/'正确'/'1'/'true' → ['对']，其余 → ['错']
 * - 填空题：逗号/顿号分隔 → 拆分数组
 * - 简答题：整个字符串作为一个元素
 * - 单选/多选：
 *     - 逗号/顿号分隔（如 "A,B"、"A、B"）→ 拆分
 *     - 连续字母（如 "AB"）→ 逐字符拆分
 *  最终结果全部转为大写 A-Z（单选/多选）
 */
function parseCorrectAnswer(raw: string, type: QuestionType): string[] {
  const trimmed = raw.trim();

  if (type === 'judge') {
    if (['对', '正确', '1', 'true', 'True', 'TRUE'].includes(trimmed)) {
      return ['对'];
    }
    return ['错'];
  }

  if (type === 'fill') {
    // 填空题：逗号/顿号分隔多个空位答案
    return trimmed
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (type === 'short') {
    // 简答题：整个答案文本作为一个元素
    return trimmed ? [trimmed] : [];
  }

  // 移除空白后尝试逗号/顿号分隔
  const compact = trimmed.replace(/\s+/g, '');
  const parts = compact.split(/[,，、]/).filter(Boolean);
  if (parts.length > 1) {
    return parts
      .map((p) => p.toUpperCase())
      .filter((c): c is string => /^[A-Z]$/.test(c));
  }

  // 逐字符拆分（适用于 "AB" 格式）
  return compact
    .split('')
    .map((c) => c.toUpperCase())
    .filter((c): c is string => /^[A-Z]$/.test(c));
}

/**
 * 基础校验：检查必填字段是否存在且合法
 */
function validateRawData(data: Record<string, string>): string[] {
  const errors: string[] = [];

  if (!data['type']) {
    errors.push('缺少题型');
  } else if (!mapType(data['type'])) {
    errors.push(
      `无法识别的题型: "${data['type']}"，支持的类型: 单选/多选/判断/填空/简答`,
    );
  }

  if (!data['content']) {
    errors.push('缺少题干内容');
  }

  if (!data['correctAnswer']) {
    errors.push('缺少正确答案');
  }

  return errors;
}

/**
 * 校验解析后的正确答案是否有效（能解析出至少一个答案）
 */
function validateParsedAnswer(
  data: Record<string, string>,
  parsedAnswer: string[],
  type: QuestionType,
  errors: string[],
): void {
  if (!data['correctAnswer'] || parsedAnswer.length > 0) {
    return;
  }

  const raw = data['correctAnswer'];
  if (type === 'fill') {
    errors.push(
      `填空题答案格式无效: "${raw}"，请使用逗号、顿号等分隔各空答案`,
    );
  } else if (type === 'short') {
    errors.push(
      `简答题答案不能为空: "${raw}"`,
    );
  } else {
    errors.push(
      `正确答案格式无效: "${raw}"，应为字母（如 A / AB / A,B）`,
    );
  }
}

/**
 * 将一行解析后的字段数据构建为 ParsedQuestion
 */
function buildQuestion(data: Record<string, string>): ParsedQuestion {
  const errors = validateRawData(data);
  const type = mapType(data['type']) ?? 'single';

  // 收集选项
  let options: QuestionOption[];
  if (type === 'fill' || type === 'short') {
    // 填空和简答题没有选项
    options = [];
  } else if (type === 'judge') {
    options = collectOptions(data);
    if (options.length === 0) {
      options = [
        { key: '对', content: '' },
        { key: '错', content: '' },
      ];
    }
  } else {
    options = collectOptions(data);
  }

  const correctAnswer = parseCorrectAnswer(data['correctAnswer'] ?? '', type);
  validateParsedAnswer(data, correctAnswer, type, errors);

  // 简答题 subType / subQuestions
  let shortSubType: 'single' | 'group' | undefined;
  let subQuestions:
    | { id: string; label: string; answer: string }[]
    | undefined;
  if (type === 'short') {
    const rawSubType = (data['subType'] || data['subtype'] || '').trim();
    if (rawSubType === 'group' || rawSubType === '大题' || rawSubType === '简答-大题') {
      shortSubType = 'group';
      // 从 correctAnswer 列解析小题
      const parts = correctAnswer.join(',');
      const subParts = parts.split('|').filter(Boolean);
      if (subParts.length > 0) {
        subQuestions = subParts.map((p, i) => {
          const colonIdx = p.indexOf(':');
          if (colonIdx > 0) {
            return {
              id: crypto.randomUUID(),
              label: p.slice(0, colonIdx).trim(),
              answer: p.slice(colonIdx + 1).trim(),
            };
          }
          return {
            id: crypto.randomUUID(),
            label: `小题${i + 1}`,
            answer: p.trim(),
          };
        });
      }
    } else {
      shortSubType = 'single';
    }
  }

  const question: ParsedQuestion = {
    type,
    content: data['content'] ?? '',
    options,
    correctAnswer: shortSubType === 'group' ? [] : correctAnswer,
    analysis: data['analysis'] ?? '',
    ...(shortSubType ? { subType: shortSubType } : {}),
    ...(subQuestions ? { subQuestions } : {}),
  };

  if (errors.length > 0) {
    question.errors = errors;
  }

  return question;
}

/**
 * 判断一行数据是否为空行
 */
function isEmptyRow(row: string[]): boolean {
  return !row || row.every((cell) => !cell || String(cell).trim() === '');
}

// ---------------------------------------------------------------------------
// 主函数
// ---------------------------------------------------------------------------

/**
 * 解析 Excel 文件为题目数组，自动识别列名，逐行校验。
 *
 * @param file - 用户上传的 .xlsx / .xls 文件
 * @returns 解析结果，包含所有题目及汇总错误信息
 *
 * 支持的列名（中英文均可）：
 *   - 题型 / type
 *   - 题干 / content / question
 *   - 选项A / A … 选项F / F
 *   - 正确答案 / correctAnswer / answer
 *   - 解析 / analysis / explanation
 *
 * 支持的题型值（中英文均可）：
 *   - 单选 / single / 单选题
 *   - 多选 / multiple / 多选题
 *   - 判断 / judge / 判断题
 *   - 填空 / fill / 填空题
 *   - 简答 / short / 简答题
 */
export const parseExcel = (
  file: File,
): Promise<{ questions: ParsedQuestion[]; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // 将 sheet 转为二维数组（每行一个数组，便于定位行号）
        const rows: string[][] = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
        });

        if (rows.length === 0) {
          resolve({ questions: [], errors: ['Excel 文件为空'] });
          return;
        }

        // 第一行为表头
        const headers = rows[0];
        const headerMap = normalizeHeaders(headers);

        const questions: ParsedQuestion[] = [];
        const allErrors: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (isEmptyRow(row)) {
            continue;
          }

          const rowData = parseRow(row, headerMap);
          const question = buildQuestion(rowData);

          if (question.errors && question.errors.length > 0) {
            allErrors.push(
              `第 ${i + 1} 行: ${question.errors.join('; ')}`,
            );
          }

          // 至少要有题干内容才纳入结果
          if (question.content) {
            questions.push(question);
          }
        }

        resolve({ questions, errors: allErrors });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '未知错误';
        reject(new Error(`解析 Excel 文件失败: ${message}`));
      }
    };

    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
};

export default parseExcel;