import { Question, QuestionType } from '../types';

export type ParsedQuestion = Omit<Question, 'id'> & { errors?: string[] };

const TYPE_TAG_MAP: Record<string, { type: QuestionType; subType?: 'single' | 'group' }> = {
  '单选': { type: 'single' },
  '多选': { type: 'multiple' },
  '判断': { type: 'judge' },
  '填空': { type: 'fill' },
  '简答': { type: 'short', subType: 'single' },
  '简答-大题': { type: 'short', subType: 'group' },
};

function parseTypeTag(line: string): { type: QuestionType; subType?: 'single' | 'group' } | null {
  const match = line.trim().match(/^\[(.+)\]$/);
  if (!match) return null;
  return TYPE_TAG_MAP[match[1]] ?? null;
}

// ---- Shared helpers ----

/** 从指定位置向后查找答案行和解析行 */
function parseAnswerAndAnalysis(
  rawLines: string[],
  startIdx: number,
): { correctAnswerStr: string; analysis: string } {
  let idx = startIdx;
  let correctAnswerStr = '';
  let analysis = '';

  while (idx < rawLines.length) {
    const trimmed = rawLines[idx].trim();
    if (trimmed.startsWith('答案：') || trimmed.startsWith('答案:')) {
      correctAnswerStr = trimmed.replace(/^答案[：:]/, '').trim();
      idx++;
      break;
    }
    idx++;
  }

  while (idx < rawLines.length) {
    const trimmed = rawLines[idx].trim();
    if (trimmed.startsWith('解析：') || trimmed.startsWith('解析:')) {
      analysis = trimmed.replace(/^解析[：:]/, '').trim();
      break;
    }
    idx++;
  }

  return { correctAnswerStr, analysis };
}

// ---- Type-specific parsers ----

/** 解析填空题型：无选项，答案以逗号/顿号分隔 */
function parseFillQuestion(
  rawLines: string[],
  startIdx: number,
  content: string,
  blockIndex: number,
  errors: string[],
): ParsedQuestion {
  const { correctAnswerStr, analysis } = parseAnswerAndAnalysis(rawLines, startIdx);

  const correctAnswer = correctAnswerStr
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (correctAnswer.length === 0) {
    errors.push('缺少答案');
  }

  const result: ParsedQuestion = {
    type: 'fill',
    content,
    options: [],
    correctAnswer,
    analysis,
  };
  if (errors.length > 0) {
    result.errors = errors.map((e) => `第${blockIndex + 1}题: ${e}`);
  }
  return result;
}

/** 解析简答题型（single 子类型）：无选项，答案存为单元素数组 */
function parseShortSingleQuestion(
  rawLines: string[],
  startIdx: number,
  content: string,
  blockIndex: number,
  errors: string[],
): ParsedQuestion {
  const { correctAnswerStr, analysis } = parseAnswerAndAnalysis(rawLines, startIdx);

  const correctAnswer = correctAnswerStr ? [correctAnswerStr] : [];

  if (correctAnswer.length === 0) {
    errors.push('缺少答案');
  }

  const result: ParsedQuestion = {
    type: 'short',
    subType: 'single',
    content,
    options: [],
    correctAnswer,
    analysis,
  };
  if (errors.length > 0) {
    result.errors = errors.map((e) => `第${blockIndex + 1}题: ${e}`);
  }
  return result;
}

/** 解析简答-大题题型（group 子类型）：多小题，每道小题独立答案 */
function parseShortGroupQuestion(
  rawLines: string[],
  startIdx: number,
  content: string,
  blockIndex: number,
  errors: string[],
): ParsedQuestion {
  let idx = startIdx;
  const subQuestionLabels: string[] = [];
  const subQuestionAnswers: string[] = [];
  let analysis = '';

  const subQRegex = /^小题(\d+)[：:]\s*(.+)$/;
  const numQRegex = /^(\d+)[．.\u3000 ]\s*(.+)$/;
  const answerRegex = /^答案(\d+)[：:]\s*(.+)$/;

  while (idx < rawLines.length) {
    const trimmed = rawLines[idx].trim();

    const ansMatch = trimmed.match(answerRegex);
    const subMatch = trimmed.match(subQRegex);
    const numMatch = trimmed.match(numQRegex);

    if (ansMatch) {
      subQuestionAnswers.push(ansMatch[2].trim());
      idx++;
      continue;
    } else if (subMatch) {
      subQuestionLabels.push(subMatch[2].trim());
      idx++;
      continue;
    } else if (numMatch) {
      subQuestionLabels.push(numMatch[2].trim());
      idx++;
      continue;
    }

    // 解析行
    if (trimmed.startsWith('解析：') || trimmed.startsWith('解析:')) {
      analysis = trimmed.replace(/^解析[：:]/, '').trim();
    }

    idx++;
  }

  // 构建小题
  const maxLen = Math.max(subQuestionLabels.length, subQuestionAnswers.length);
  const subQuestions = [];
  for (let i = 0; i < maxLen; i++) {
    subQuestions.push({
      id: crypto.randomUUID(),
      label: subQuestionLabels[i] ?? '',
      answer: subQuestionAnswers[i] ?? '',
    });
  }

  if (subQuestions.length === 0) {
    errors.push('缺少小题');
  }

  const result: ParsedQuestion = {
    type: 'short',
    subType: 'group',
    content,
    options: [],
    correctAnswer: [],
    analysis,
    subQuestions,
  };
  if (errors.length > 0) {
    result.errors = errors.map((e) => `第${blockIndex + 1}题: ${e}`);
  }
  return result;
}

// ---- 主解析入口 ----

function parseQuestionBlock(block: string, blockIndex: number): ParsedQuestion {
  const rawLines = block.split('\n');
  const errors: string[] = [];
  let idx = 0;

  // 跳过空行
  while (idx < rawLines.length && rawLines[idx].trim() === '') idx++;
  if (idx >= rawLines.length) {
    const q: ParsedQuestion = {
      type: 'single',
      content: '',
      options: [],
      correctAnswer: [],
      analysis: '',
    };
    q.errors = [`第${blockIndex + 1}题: 空题目块`];
    return q;
  }

  // 题型标签
  const typeTag = rawLines[idx].trim();
  const tagData = parseTypeTag(typeTag);
  if (!tagData) {
    errors.push(
      `无法识别的题型标签 "${typeTag}"，支持：[单选]、[多选]、[判断]、[填空]、[简答]、[简答-大题]`,
    );
  }
  idx++;

  // 跳过空行
  while (idx < rawLines.length && rawLines[idx].trim() === '') idx++;

  const content = idx < rawLines.length ? rawLines[idx].trim() : '';
  if (!content) {
    errors.push('缺少题目内容');
  }
  idx++;

  // 根据题型分派到专用解析器
  const resolvedType = tagData?.type ?? 'single';
  const resolvedSubType = tagData?.subType;

  if (resolvedType === 'fill') {
    const result = parseFillQuestion(rawLines, idx, content, blockIndex, errors);
    if (errors.length > 0 && !result.errors) {
      result.errors = errors.map((e) => `第${blockIndex + 1}题: ${e}`);
    }
    return result;
  }

  if (resolvedType === 'short' && resolvedSubType === 'group') {
    return parseShortGroupQuestion(rawLines, idx, content, blockIndex, errors);
  }

  if (resolvedType === 'short') {
    return parseShortSingleQuestion(rawLines, idx, content, blockIndex, errors);
  }

  // 单选/多选/判断：解析选项
  const optionRegex = /^([A-Za-z])[．.:、]\s*(.+)$/;
  const options: { key: string; content: string }[] = [];
  const seenKeys = new Set<string>();

  while (idx < rawLines.length) {
    const trimmed = rawLines[idx].trim();
    const match = trimmed.match(optionRegex);
    if (!match) break;

    const key = match[1].toUpperCase();
    if (seenKeys.has(key)) {
      errors.push(`选项 "${key}" 重复`);
    } else {
      seenKeys.add(key);
    }
    options.push({ key, content: match[2].trim() });
    idx++;
  }

  if (options.length === 0) {
    errors.push('缺少选项');
  }

  // 解析答案和解析
  const { correctAnswerStr, analysis } = parseAnswerAndAnalysis(rawLines, idx);

  let correctAnswer: string[];
  if (resolvedType === 'judge') {
    // 支持字母（A/B）和中文（对/错/正确/错误）两种写法
    if (['对', '正确', '1', 'true', 'True', 'TRUE', 'A', 'a'].includes(correctAnswerStr)) {
      correctAnswer = ['A'];
    } else if (['错', '错误', '0', 'false', 'False', 'FALSE', 'B', 'b'].includes(correctAnswerStr)) {
      correctAnswer = ['B'];
    } else {
      correctAnswer = correctAnswerStr
        .split('')
        .filter((c) => /[A-Za-z]/.test(c))
        .map((c) => c.toUpperCase());
    }
  } else {
    correctAnswer = correctAnswerStr
      .split('')
      .filter((c) => /[A-Za-z]/.test(c))
      .map((c) => c.toUpperCase());
  }

  if (correctAnswer.length === 0) {
    errors.push('缺少答案');
  } else {
    const optionKeys = new Set(options.map((o) => o.key));
    for (const ans of correctAnswer) {
      if (!optionKeys.has(ans)) {
        errors.push(`答案 "${ans}" 在选项中不存在`);
      }
    }
    if (resolvedType === 'single' && correctAnswer.length > 1) {
      errors.push('单选题只能有一个答案');
    }
    if (resolvedType === 'multiple' && correctAnswer.length < 2) {
      errors.push('多选题至少需要两个答案');
    }
  }

  const result: ParsedQuestion = {
    type: resolvedType,
    content,
    options,
    correctAnswer,
    analysis,
  };

  if (errors.length > 0) {
    result.errors = errors.map((e) => `第${blockIndex + 1}题: ${e}`);
  }

  return result;
}

export function parseTxt(text: string): { questions: ParsedQuestion[]; errors: string[] } {
  if (!text || text.trim() === '') {
    return { questions: [], errors: ['文件内容为空'] };
  }

  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim() !== '');

  if (blocks.length === 0) {
    return { questions: [], errors: ['文件中没有找到任何题目'] };
  }

  const questions: ParsedQuestion[] = [];
  const globalErrors: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const q = parseQuestionBlock(blocks[i], i);
    if (q.errors) {
      globalErrors.push(...q.errors);
    }
    questions.push(q);
  }

  return { questions, errors: globalErrors };
}

export function getTxtTemplate(): string {
  return `[单选]
以下哪个是中国的首都？
A. 北京
B. 上海
C. 广州
D. 深圳
答案：A
解析：北京是中国的首都

[多选]
以下哪些是哺乳动物？
A. 猫
B. 狗
C. 蛇
D. 鸟
答案：AB
解析：猫和狗是哺乳动物

[判断]
太阳从东边升起。
A. 正确
B. 错误
答案：A
解析：这是基本常识

[填空]
水的化学式是__，二氧化碳的化学式是__。
答案：H2O, CO2
解析：常见化学式

[简答]
请简述光合作用的主要过程。
答案：光合作用是植物利用光能、水和二氧化碳合成有机物并释放氧气的过程。
解析：光合作用的基本概念

[简答-大题]
阅读以下材料，回答问题。
小题1：(1) 材料中描述的现象是什么？
答案1：温室效应
小题2：(2) 该现象产生的主要原因是什么？
答案2：二氧化碳排放过多
解析：环境保护相关知识点`;
}

export default parseTxt;