import { Question, QuestionType, QuestionOption } from '../types';

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
      type: '单选',
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
      } else if (/^[A-Za-z][．：:.、]/.test(trimmed)) {
        const key = trimmed.charAt(0).toUpperCase();
        const optionContent = trimmed.slice(2).trim();
        question.options[key] = optionContent;
      } else if (trimmed.startsWith('答案:')) {
        question.correctAnswer = trimmed.replace('答案:', '').trim();
      } else if (trimmed.startsWith('解析:')) {
        question.analysis = trimmed.replace('解析:', '').trim();
      }
    });

    if (question.content) {
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
    '填空': 'fill',
    '简答': 'short',
    'single': 'single',
    'multiple': 'multiple',
    'judge': 'judge',
    'fill': 'fill',
    'short': 'short',
  };

  const type = typeMap[txtQuestion.type] || 'single';

  let options: QuestionOption[];
  let correctAnswer: string[];

  if (type === 'judge') {
    options = [
      { key: '对', content: '' },
      { key: '错', content: '' },
    ];
    const answer = txtQuestion.correctAnswer.trim();
    correctAnswer = answer === '对' || answer === '正确' || answer === '1' ? ['对'] : ['错'];
  } else if (type === 'fill') {
    // 填空题：答案可能是逗号分隔的多个空位答案
    options = [];
    correctAnswer = txtQuestion.correctAnswer
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (type === 'short') {
    // 简答题：把整个答案文本作为一个元素
    options = [];
    correctAnswer = txtQuestion.correctAnswer.trim()
      ? [txtQuestion.correctAnswer.trim()]
      : [];
  } else {
    const sortedKeys = Object.keys(txtQuestion.options).sort();
    options = sortedKeys.map((key) => ({
      key,
      content: txtQuestion.options[key],
    }));
    correctAnswer = txtQuestion.correctAnswer
      .split('')
      .filter((c) => /[A-Za-z]/.test(c))
      .map((c) => c.toUpperCase());
  }

  return {
    type,
    content: txtQuestion.content,
    options,
    correctAnswer,
    analysis: txtQuestion.analysis,
  };
};

// ============================================================================
// TXT 导出
// ============================================================================

/**
 * 将题目数组导出为 TXT 格式字符串
 *
 * 格式：
 *   [单选/多选/判断] - 题型标签 + 题干 + 选项 + 答案 + 解析
 *   [填空]           - 题型标签 + 题干 + 答案（逗号分隔）+ 解析
 *   [简答]           - 题型标签 + 题干 + 答案（单个）+ 解析
 *   [简答-大题]      - 题型标签 + 大题题干 + 逐小题输出
 */
export function exportQuestionsToTxt(questions: Question[]): string {
  const blocks: string[] = [];

  for (const q of questions) {
    const lines: string[] = [];

    // --- 题型标签 ---
    if (q.type === 'fill') {
      lines.push('[填空]');
    } else if (q.type === 'short') {
      if (q.subType === 'group') {
        lines.push('[简答-大题]');
      } else {
        lines.push('[简答]');
      }
    } else {
      const tagMap: Record<string, string> = {
        single: '[单选]',
        multiple: '[多选]',
        judge: '[判断]',
      };
      lines.push(tagMap[q.type] ?? `[${q.type}]`);
    }

    // --- 题干 ---
    lines.push(q.content);

    // --- 选项（仅单选/多选/判断） ---
    if (q.type === 'single' || q.type === 'multiple' || q.type === 'judge') {
      for (const opt of q.options) {
        lines.push(`${opt.key}. ${opt.content}`);
      }
    }

    // --- 答案 ---
    if (q.type === 'fill') {
      lines.push(`答案：${q.correctAnswer.join(', ')}`);
    } else if (q.type === 'short') {
      if (q.subType === 'group') {
        // 简答大题：逐小题输出
        if (q.subQuestions && q.subQuestions.length > 0) {
          q.subQuestions.forEach((sq, idx) => {
            lines.push(`小题${idx + 1}：${sq.label}`);
            lines.push(`答案${idx + 1}：${sq.answer}`);
          });
        }
      } else {
        lines.push(`答案：${q.correctAnswer[0] ?? ''}`);
      }
    } else {
      lines.push(`答案：${q.correctAnswer.join('')}`);
    }

    // --- 解析 ---
    if (q.analysis) {
      lines.push(`解析：${q.analysis}`);
    }

    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n');
}

/**
 * 将题目数组导出为 TXT 文件并触发浏览器下载
 *
 * @param questions - 题目数组
 * @param filename  - 导出文件名（不含扩展名），默认 "题库导出"
 */
export function downloadQuestionsAsTxt(
  questions: Question[],
  filename: string = '题库导出',
): void {
  const content = exportQuestionsToTxt(questions);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}