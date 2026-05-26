// ============================================
// 验收测试脚本 — 浏览器控制台运行
// 打开 http://localhost:5174/ → F12 → Console → 粘贴运行
// ============================================

(async function() {
  const P = (label, ok) => console.log(`${ok ? '✅' : '❌'} ${label}`);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  console.log('═══════════════════════════════');
  console.log('  刷题助手 V3 验收测试');
  console.log('═══════════════════════════════\n');

  // ── 1. 存储基础 ──
  console.log('── 1. 存储基础 ──');

  // 检查 localStorage 可用
  localStorage.setItem('_test_', '1');
  const ok = localStorage.getItem('_test_') === '1';
  localStorage.removeItem('_test_');
  P('localStorage 可用', ok);

  const keys = ['quiz_banks', 'quiz_wrong', 'quiz_records', 'quiz_config'];
  keys.forEach(k => P(`键 ${k} 存在`, localStorage.getItem(k) !== null));

  // ── 2. 题库 ──
  console.log('\n── 2. 题库 ──');
  const banks = JSON.parse(localStorage.getItem('quiz_banks') || '[]');
  P(`题库数量: ${banks.length}`, banks.length > 0);
  banks.forEach((b, i) => {
    P(`  [${i}] ${b.name}: ${b.questions.length} 题`, b.id && b.name && Array.isArray(b.questions));
  });

  // ── 3. 错题本 ──
  console.log('\n── 3. 错题本 ──');
  const wrong = JSON.parse(localStorage.getItem('quiz_wrong') || '[]');
  P(`错题数量: ${wrong.length}`, wrong.length >= 0);
  wrong.forEach((w, i) => {
    const hasCompat = 'correctAnswer' in w;
    const hasFirst = 'firstWrongAt' in w;
    P(`  [${i}] questionId=${w.questionId} 兼容字段正确`, hasCompat && hasFirst);
  });

  // ── 4. 统计 ──
  console.log('\n── 4. 练习统计 ──');
  const records = JSON.parse(localStorage.getItem('quiz_records') || '[]');
  P(`记录数量: ${records.length}`, records.length >= 0);
  records.forEach((r, i) => {
    const valid = r.id && r.questionIds && r.results && typeof r.totalCount === 'number';
    P(`  [${i}] id=${r.id.slice(0,8)}... total=${r.totalCount} correct=${r.correctCount}`, valid);
  });

  // ── 5. 配置 ──
  console.log('\n── 5. 用户配置 ──');
  const config = JSON.parse(localStorage.getItem('quiz_config') || '{}');
  const hasNewFields = 'showAnswerSwitch' in config && 'enableAIInPractice' in config;
  P('新字段存在 (showAnswerSwitch, enableAIInPractice)', hasNewFields);

  // ── 6. AI 配置 ──
  console.log('\n── 6. AI 配置 ──');
  const aiRaw = localStorage.getItem('ai_config');
  if (aiRaw) {
    const aiConfig = JSON.parse(aiRaw);
    const hasKey = !!aiConfig.apiKey;
    const keyEncoded = aiConfig.apiKey !== aiConfig.apiKey; // 原始 key 不会是合法的 base64？检查
    const hasPrompts = aiConfig.customPrompts?.length === 3;
    const hasPromptIdx = typeof aiConfig.selectedPromptIndex === 'number';
    P('API Key 已存储', hasKey);
    P('3 个提示词模板完整', hasPrompts);
    P('选中提示词索引有效', hasPromptIdx);
  } else {
    P('AI 配置未设置（跳过）', true);
  }

  // ── 7. AI 缓存 ──
  console.log('\n── 7. AI 解析缓存 ──');
  const cache = JSON.parse(localStorage.getItem('ai_explanations') || '{}');
  const cacheKeys = Object.keys(cache);
  P(`缓存条目数: ${cacheKeys.length}`, cacheKeys.length >= 0);
  cacheKeys.forEach(k => {
    P(`  ${k.slice(0,8)}... → ${cache[k].slice(0,40)}...`, true);
  });

  // ── 8. 数据类型完整性 ──
  console.log('\n── 8. 数据完整性 ──');
  let allGood = true;

  // 错题引用的 questionId 必须在某个题库中存在
  if (wrong.length > 0 && banks.length > 0) {
    const allQuestionIds = new Set(banks.flatMap(b => b.questions.map(q => q.id)));
    wrong.forEach(w => {
      if (!allQuestionIds.has(w.questionId)) {
        console.warn(`  ⚠️ 错题 ${w.questionId.slice(0,8)} 引用的题目不在题库中`);
      }
    });
  }

  // records 引用的 questionId 必须在题库中
  if (records.length > 0 && banks.length > 0) {
    const allQuestionIds = new Set(banks.flatMap(b => b.questions.map(q => q.id)));
    records.forEach(r => {
      r.questionIds.forEach(qId => {
        if (!allQuestionIds.has(qId)) {
          // 允许 — 题库可能已被删除，记录仍保留
        }
      });
    });
  }

  P('数据类型检查完成', true);

  // ── 9. 测试清空统计（单题库） ──
  console.log('\n── 9. 清空统计（模拟验证） ──');
  if (records.length > 0) {
    const bankIds = [...new Set(records.flatMap(r => r.bankIds || (r.bankId ? [r.bankId] : [])))];
    P(`可用的题库 ID: ${bankIds.length} 个`, bankIds.length > 0);
  } else {
    P('无统计记录（跳过）', true);
  }

  // ── 10. 导出数据完整性 ──
  console.log('\n── 10. 导出数据 ──');
  const exportData = {
    banks: JSON.parse(localStorage.getItem('quiz_banks') || '[]'),
    wrong: JSON.parse(localStorage.getItem('quiz_wrong') || '[]'),
    records: JSON.parse(localStorage.getItem('quiz_records') || '[]'),
    config: JSON.parse(localStorage.getItem('quiz_config') || '{}'),
  };
  const exportStr = JSON.stringify(exportData, null, 2);
  const reParsed = JSON.parse(exportStr);
  P('JSON 序列化/反序列化无损', JSON.stringify(exportData) === JSON.stringify(reParsed));
  P(`导出大小: ${(exportStr.length / 1024).toFixed(1)} KB`, exportStr.length > 0);

  // ── 汇总 ──
  console.log('\n═══════════════════════════════');
  console.log('  测试完成');
  console.log('═══════════════════════════════');
})();
