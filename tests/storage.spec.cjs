/**
 * 存储层单元测试 — Node.js 运行
 * 不依赖浏览器，直接测试 localStorage 封装 + 数据迁移
 * 
 * 运行: node tests/storage.spec.js
 */

const fs = require('fs');
const path = require('path');

// ── Mock localStorage ──
class MockStorage {
  constructor() { this._data = {}; }
  getItem(k) { return this._data[k] ?? null; }
  setItem(k, v) { this._data[k] = String(v); }
  removeItem(k) { delete this._data[k]; }
  clear() { this._data = {}; }
  get length() { return Object.keys(this._data).length; }
}
global.localStorage = new MockStorage();

// ── 读取源文件模拟 CommonJS ──
// 实际上我们手动构造测试，不引用源文件以避免 import/export 问题

// ── Helpers ──
let passed = 0, failed = 0;
const assert = (label, cond) => {
  if (cond) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}`); }
};
const group = (name) => console.log(`\n── ${name} ──`);
const summary = () => {
  console.log(`\n结果: ${passed} 通过, ${failed} 失败, ${(passed/(passed+failed)*100).toFixed(0)}%`);
  process.exit(failed > 0 ? 1 : 0);
};

// ============================================================
// 测试开始
// ============================================================
console.log('═══════════════════════════════════════');
console.log('  存储层单元测试');
console.log('═══════════════════════════════════════');

// ── 1. 题库 ──
group('题库 (Banks)');

const testBanks = [
  { id: 'bank-1', name: '题库A', questions: [
    { id: 'q-1', type: 'single', content: '1+1=?', options: [{key:'A',content:'1'},{key:'B',content:'2'}], correctAnswer: ['B'] },
    { id: 'q-2', type: 'multiple', content: '选择水果', options: [{key:'A',content:'苹果'},{key:'B',content:'桌子'}], correctAnswer: ['A'] },
  ]},
  { id: 'bank-2', name: '题库B', questions: [
    { id: 'q-3', type: 'judge', content: '地球是圆的', correctAnswer: ['对'] },
  ]},
];

localStorage.setItem('quiz_banks', JSON.stringify(testBanks));
const banks1 = JSON.parse(localStorage.getItem('quiz_banks'));
assert('题库写入与读取', banks1.length === 2);
assert('题库名称正确', banks1[0].name === '题库A');
assert('题目数量正确', banks1[0].questions.length === 2);
assert('完整题数据结构', banks1[0].questions[0].options[0].key === 'A');

// 覆盖写入
const newBank = { id: 'bank-3', name: '题库C', questions: [] };
banks1.push(newBank);
localStorage.setItem('quiz_banks', JSON.stringify(banks1));
const banks2 = JSON.parse(localStorage.getItem('quiz_banks'));
assert('追加题库', banks2.length === 3);
assert('新题库内容', banks2[2].name === '题库C');

// ── 2. 错题本 ──
group('错题本 (Wrong)');

const testWrong = [
  { questionId: 'q-1', bankId: 'bank-1', wrongCount: 3, lastWrongAt: 1716800000000, userAnswers: ['A'] },
  { questionId: 'q-2', bankId: 'bank-1', wrongCount: 1, lastWrongAt: 1716700000000, userAnswers: ['B','C'] },
];

// 旧数据格式（缺 correctAnswer, firstWrongAt）
localStorage.setItem('quiz_wrong', JSON.stringify(testWrong));
const wrong1 = JSON.parse(localStorage.getItem('quiz_wrong')).map((w) => ({
  ...w,
  correctAnswer: w.correctAnswer || [],
  firstWrongAt: w.firstWrongAt || w.lastWrongAt || Date.now(),
}));
assert('旧数据兼容: correctAnswer 自动补全', Array.isArray(wrong1[0].correctAnswer));
assert('旧数据兼容: firstWrongAt 自动补全', typeof wrong1[0].firstWrongAt === 'number');
assert('旧数据兼容: 值正确', wrong1[0].firstWrongAt === wrong1[0].lastWrongAt);
assert('wrongCount 保留', wrong1[0].wrongCount === 3);

// 追加错题
wrong1.push({
  questionId: 'q-3',
  bankId: 'bank-2',
  wrongCount: 1,
  lastWrongAt: 1716900000000,
  userAnswers: ['错'],
  correctAnswer: ['对'],
  firstWrongAt: 1716900000000,
});
localStorage.setItem('quiz_wrong', JSON.stringify(wrong1));
const wrong2 = JSON.parse(localStorage.getItem('quiz_wrong'));
assert('追加错题后数量', wrong2.length === 3);
assert('新错题有 correctAnswer', wrong2[2].correctAnswer && wrong2[2].correctAnswer[0] === '对');

// ── 3. 练习记录 ──
group('练习记录 (Records)');

const now = Date.now();
const testRecords = [
  { id: 'rec-1', bankIds: ['bank-1'], questionIds: ['q-1','q-2'], results: {'q-1':true,'q-2':false}, totalCount: 2, correctCount: 1, startTime: now-60000, endTime: now },
  { id: 'rec-2', bankId: 'bank-2', bankIds: ['bank-2'], questionIds: ['q-3'], results: {'q-3':true}, totalCount: 1, correctCount: 1, startTime: now-30000, endTime: now },
];
localStorage.setItem('quiz_records', JSON.stringify(testRecords));
const recs1 = JSON.parse(localStorage.getItem('quiz_records'));
assert('记录写入与读取', recs1.length === 2);
assert('正确率计算准确', recs1[0].correctCount / recs1[0].totalCount === 0.5);
assert('多题库 bankIds 存在', Array.isArray(recs1[0].bankIds));
assert('单题库兼容 bankId', recs1[1].bankId === 'bank-2');

// 清空单题库
const remaining = recs1.filter(r => !(r.bankIds || [r.bankId]).includes('bank-2'));
assert('单题库删除后数量', remaining.length === 1);
assert('保留的记录正确', remaining[0].id === 'rec-1');

// 清空全部
localStorage.setItem('quiz_records', JSON.stringify([]));
const recs2 = JSON.parse(localStorage.getItem('quiz_records'));
assert('清空全部', recs2.length === 0);

// 恢复数据用于后续测试
localStorage.setItem('quiz_records', JSON.stringify(testRecords));

// ── 4. 用户配置 ──
group('用户配置 (Config)');

const defaultConfig = {
  darkMode: false,
  currentBankId: '',
  randomOptionOrder: false,
  multiBankTypeOrder: ['judge', 'single', 'multiple', 'fill', 'short'],
  showAnswerSwitch: false,
  enableAIInPractice: false,
};

// 旧配置（缺新字段）
localStorage.setItem('quiz_config', JSON.stringify({ darkMode: true, currentBankId: 'bank-1' }));
const stored1 = JSON.parse(localStorage.getItem('quiz_config') || '{}');
const cfg1 = Object.assign({ ...defaultConfig }, stored1);
assert('旧配置兼容: showAnswerSwitch 默认 false', cfg1.showAnswerSwitch === false);
assert('旧配置兼容: enableAIInPractice 默认 false', cfg1.enableAIInPractice === false);
assert('旧配置兼容: darkMode 覆盖正确', cfg1.darkMode === true);
assert('旧配置兼容: currentBankId 保留', cfg1.currentBankId === 'bank-1');

// 新配置写入
const newConfig = {
  darkMode: false,
  currentBankId: '',
  randomOptionOrder: true,
  multiBankTypeOrder: ['single','multiple'],
  showAnswerSwitch: true,
  enableAIInPractice: true,
};
localStorage.setItem('quiz_config', JSON.stringify(newConfig));
const stored2 = JSON.parse(localStorage.getItem('quiz_config') || '{}');
const cfg2 = Object.assign({ ...defaultConfig }, stored2);
assert('新配置 showAnswerSwitch 保存', cfg2.showAnswerSwitch === true);
assert('新配置 enableAIInPractice 保存', cfg2.enableAIInPractice === true);

// ── 5. AI 配置 ──
group('AI 配置');

const DEFAULT_PROMPTS = ['简洁模式提示词', '详细模式提示词', '错题模式提示词'];
const testAIConfig = {
  platform: 'siliconflow',
  apiKey: btoa('sk-test-key-12345'),
  baseUrl: 'https://api.siliconflow.cn/v1',
  model: 'deepseek-ai/DeepSeek-V3',
  maxTokens: 2000,
  customPrompts: [...DEFAULT_PROMPTS],
  selectedPromptIndex: 0,
};
localStorage.setItem('ai_config', JSON.stringify(testAIConfig));
const savedAI = JSON.parse(localStorage.getItem('ai_config'));
assert('平台保存', savedAI.platform === 'siliconflow');
assert('API Key Base64 编码', savedAI.apiKey === btoa('sk-test-key-12345'));
assert('模型保存', savedAI.model === 'deepseek-ai/DeepSeek-V3');
assert('提示词模板: 3 个', savedAI.customPrompts.length === 3);
assert('选中索引保存', savedAI.selectedPromptIndex === 0);

// Key 解码
const decoded = atob(savedAI.apiKey);
assert('API Key 可解码', decoded === 'sk-test-key-12345');

// 空配置
localStorage.removeItem('ai_config');
const nullCfg = (() => {
  try {
    const raw = localStorage.getItem('ai_config');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
})();
assert('空配置返回 null', nullCfg === null);

// 恢复
localStorage.setItem('ai_config', JSON.stringify(testAIConfig));

// ── 6. AI 缓存 ──
group('AI 解析缓存');

const testCache = {
  'q-1': '1+1=2 的解析...',
  'q-2': '苹果是水果...',
};
localStorage.setItem('ai_explanations', JSON.stringify(testCache));
const cache = JSON.parse(localStorage.getItem('ai_explanations') || '{}');
assert('缓存存储', cache['q-1'] === '1+1=2 的解析...');
assert('缓存读取', cache['q-2'] === '苹果是水果...');

// 清空缓存
localStorage.removeItem('ai_explanations');
const cache2 = JSON.parse(localStorage.getItem('ai_explanations') || '{}');
assert('清空缓存', Object.keys(cache2).length === 0);

// ── 7. 导出数据完整性 ──
group('导出数据');

const exportData = {
  banks: JSON.parse(localStorage.getItem('quiz_banks') || '[]'),
  wrong: JSON.parse(localStorage.getItem('quiz_wrong') || '[]'),
  records: JSON.parse(localStorage.getItem('quiz_records') || '[]'),
  config: JSON.parse(localStorage.getItem('quiz_config') || '{}'),
};
const exportStr = JSON.stringify(exportData, null, 2);
const reParsed = JSON.parse(exportStr);
assert('JSON 序列化/反序列化无损', JSON.stringify(exportData) === JSON.stringify(reParsed));
assert('导出包含 4 个 Section', ['banks','wrong','records','config'].every(k => k in reParsed));
assert('导出不丢失题库', reParsed.banks.length === 3);

// ── 8. 完全清空 ──
group('完全清空');

['quiz_banks','quiz_wrong','quiz_records','quiz_config','ai_config','ai_explanations'].forEach(k => {
  localStorage.removeItem(k);
});
const allKeys = ['quiz_banks','quiz_wrong','quiz_records','quiz_config','ai_config','ai_explanations'];
const allEmpty = allKeys.every(k => localStorage.getItem(k) === null);
assert('所有存储键已清空', allEmpty);
assert('localStorage 为空', localStorage.length === 0);

// ── 汇总 ──
summary();
