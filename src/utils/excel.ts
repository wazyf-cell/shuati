import * as XLSX from 'xlsx';
import { Question, QuestionType, QuestionOption } from '../types';

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
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        const questions: ExcelQuestion[] = jsonData
          .map((row) => ({
            type: (row['类型'] || row['type'] || '单选') as string,
            content: (row['题目'] || row['content'] || '') as string,
            options: [
              row['A'] || row['选项A'] || '',
              row['B'] || row['选项B'] || '',
              row['C'] || row['选项C'] || '',
              row['D'] || row['选项D'] || '',
              row['E'] || row['选项E'] || '',
              row['F'] || row['选项F'] || '',
            ].filter(Boolean) as string[],
            correctAnswer: (row['答案'] || row['answer'] || '') as string,
            analysis: (row['解析'] || row['analysis'] || '') as string,
          }))
          .filter((q) => q.content && q.content.trim());

        resolve(questions);
      } catch (error) {
        reject(new Error('解析Excel文件失败'));
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
    '填空': 'fill',
    '简答': 'short',
    'single': 'single',
    'multiple': 'multiple',
    'judge': 'judge',
    'fill': 'fill',
    'short': 'short',
    '1': 'single',
    '2': 'multiple',
    '3': 'judge',
    '4': 'fill',
    '5': 'short',
  };

  const type = typeMap[excelQuestion.type] || 'single';

  let options: QuestionOption[];
  let correctAnswer: string[];

  if (type === 'judge') {
    options = [
      { key: '对', content: '' },
      { key: '错', content: '' },
    ];
    const answer = excelQuestion.correctAnswer.trim();
    correctAnswer = answer === '对' || answer === '正确' || answer === '1' ? ['对'] : ['错'];
  } else if (type === 'fill') {
    // 填空题：答案可能是逗号分隔的多个空位答案
    options = [];
    correctAnswer = excelQuestion.correctAnswer
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (type === 'short') {
    // 简答题：把整个答案文本作为一个元素
    options = [];
    correctAnswer = excelQuestion.correctAnswer.trim()
      ? [excelQuestion.correctAnswer.trim()]
      : [];
  } else {
    options = excelQuestion.options.map((content, index) => ({
      key: String.fromCharCode(65 + index),
      content,
    }));
    correctAnswer = excelQuestion.correctAnswer
      .split('')
      .filter((c) => /[A-Za-z]/.test(c))
      .map((c) => c.toUpperCase());
  }

  return {
    type,
    content: excelQuestion.content,
    options,
    correctAnswer,
    analysis: excelQuestion.analysis,
  };
};

// ============================================================================
// Excel 导出
// ============================================================================

/** Excel 行数据 */
interface ExcelRow {
  '题型': string;
  '题干': string;
  '选项A': string;
  '选项B': string;
  '选项C': string;
  '选项D': string;
  '选项E': string;
  '选项F': string;
  '正确答案': string;
  '解析': string;
}

/** 根据题目生成显示用题型名 */
function getTypeLabel(q: Question): string {
  if (q.type === 'fill') return '填空';
  if (q.type === 'short') {
    if (q.subType === 'group') return '简答-大题';
    return '简答';
  }
  const labels: Record<string, string> = {
    single: '单选',
    multiple: '多选',
    judge: '判断',
  };
  return labels[q.type] ?? q.type;
}

/** 根据题目生成 Excel 答案列字符串 */
function getAnswerDisplay(q: Question): string {
  if (q.type === 'fill') {
    return q.correctAnswer.join(', ');
  }
  if (q.type === 'short') {
    if (q.subType === 'group' && q.subQuestions && q.subQuestions.length > 0) {
      return q.subQuestions.map((sq) => `${sq.label}: ${sq.answer}`).join('; ');
    }
    return q.correctAnswer[0] ?? '';
  }
  return q.correctAnswer.join('');
}

/**
 * 将题目数组导出为 Excel 文件并触发浏览器下载
 *
 * @param questions - 题目数组
 * @param filename  - 导出文件名（不含扩展名），默认 "题库导出"
 */
export function exportQuestionsToExcel(
  questions: Question[],
  filename: string = '题库导出',
): void {
  const rows: ExcelRow[] = questions.map((q) => ({
    '题型': getTypeLabel(q),
    '题干': q.content,
    '选项A': q.options[0]?.content ?? '',
    '选项B': q.options[1]?.content ?? '',
    '选项C': q.options[2]?.content ?? '',
    '选项D': q.options[3]?.content ?? '',
    '选项E': q.options[4]?.content ?? '',
    '选项F': q.options[5]?.content ?? '',
    '正确答案': getAnswerDisplay(q),
    '解析': q.analysis,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '题目');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}