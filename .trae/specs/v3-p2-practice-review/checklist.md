# Checklist: V3.0 P2 刷题新增开关 + 刷题结果页改造

## 功能验证

- [x] 枚举 Phase 替代 boolean，三个阶段正常流转
- [x] config → practice: 配置正常生效（题型、数量、随机等）
- [x] practice → review: 提交后进入 review，不再显示旧分数卡片
- [x] review → config: "再来一次"和"返回配置"均正常工作
- [x] 查看正确答案开关：开/关状态持久化到 localStorage
- [x] 查看正确答案按钮：开启后在选项区显示，点击后绿色高亮、选项禁用
- [x] 查看答案不计正确率：查看过的题目 results 记为 false
- [x] 启用 AI 解析开关：开/关状态持久化
- [x] 未配置 AI 时开关置灰 + 提示文案
- [x] 刷题面板 AI 解析按钮：开启后在题目下方显示
- [x] 刷题面板 AI 解析功能：调用成功显示结果，写入缓存
- [x] Review 顶部分数概览条：显示对/总数、百分比、用时
- [x] Review 题号导航：题型着色、✅/❌标记、点击切换
- [x] Review 题目详情：选项对比（错误红、正确绿）、用户答案标记
- [x] Review 上一题/下一题：按钮正常翻题
- [x] AIExplanationCard: 4 种状态正确渲染（idle/loading/done/error）
- [x] AI 缓存：进入 review 自动加载已有缓存
- [x] AI 生成：点击按钮 → 调用 API → 显示结果 → 写入缓存
- [x] AI 复制：📋按钮复制解析文本到剪贴板
- [x] 一键生成所有错题解析：最多 3 并发，已缓存的不重复
- [x] 移动端：导航栏横向排列在上方，题目详情在下方
- [x] 错题重刷模式：review 阶段同样可用（presetQuestionIds）

## 回归验证

- [x] 单题库刷题：配置 → 答题 → 提交 → review → 返回，全流程正常
- [x] 多题库刷题：同上全流程正常
- [x] 错题重刷：从错题本进入 → 锁定题目 → 答题 → 提交 → review，正常
- [x] 计时模式：正计时和倒计时在 review 阶段显示正常
- [x] 排除已刷题目功能正常
- [x] 题型排序功能正常
- [x] ConfigStore 持久化：showAnswerSwitch / enableAIInPractice 重启应用后保持

## 边缘情况

- [x] 全部答对时 review 导航栏全部 ✅（无红色）
- [x] 全部答错时 review 导航栏全部 ❌（无绿色）
- [x] 查看答案后提交，不计正确率
- [x] AI 配置未保存时，一键生成按钮仍可用（自动打开配置）
- [x] API Key 失效时显示具体错误 + 重试按钮
- [x] 网络不通时显示具体错误
- [x] AI 解析生成为空前显示错误
- [x] 错题重刷全部答对后的 review 显示

## 验证命令

```bash
npx tsc --noEmit  # 0 errors
npx vite build    # success
```