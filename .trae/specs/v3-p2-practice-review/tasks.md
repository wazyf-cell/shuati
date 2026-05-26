# Tasks

## Phase 5: 刷题新增开关

- [x] Task 1: 阶段管理重构（枚举 Phase）
  - [x] 在 Practice 组件顶部定义 `type Phase = 'config' | 'practice' | 'review'`
  - [x] 用 `phase` 状态替换 `showConfig` boolean + `practiceResult` 对象
  - [x] `handleStartPractice`: setPhase('practice')
  - [x] 提交流程: `doSubmit` 中 setPhase('review')，移除 `setPracticeResult`
  - [x] `handleReset`: setPhase('config')
  - [x] 三个 if 分支改为 switch/case 或 if/else if 链，覆盖所有 3 个 phase
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 2: 配置面板新增两个开关
  - [x] 从 configStore 读取 `showAnswerSwitch` / `enableAIInPractice` 和 setter
  - [x] 在计时模式开关后面追加两个 toggle（复用现有开关样式）
  - [x] "查看正确答案" — 正常 toggle
  - [x] "启用 AI 解析" — toggle + 未配置 AI 时 disabled + 灰色 + 提示文案
  - [x] 切换时通过 setter 持久化到 localStorage
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 3: 刷题面板"查看答案"功能
  - [x] 新增 `viewedAnswerIds: Set<string>` 状态
  - [x] 当 `showAnswerSwitch` 开启时，选项区下方显示灰色 `💡 查看正确答案` 按钮
  - [x] 点击 → `viewedAnswerIds.add(qId)` → 绿色高亮正确选项 → 禁用该题所有输入
  - [x] 提交时：`viewedAnswerIds` 中的题目 results 强制记为 false
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 4: 刷题面板"AI 解析"按钮
  - [x] 当 `enableAIInPractice` 开启时，当前题下方显示 `🤖 AI解析` 按钮
  - [x] 点击 → 调用 `generateExplanation(q, userAnswer, config)` → 显示结果
  - [x] 复用 review 阶段的 AIExplanationCard 状态逻辑（未生成/生成中/已生成/失败）
  - [x] 解析结果写入缓存
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 7: 刷题结果页改造

- [x] Task 5: ReviewPanel 主体框架
  - [x] phase === 'review' 时渲染 ReviewPanel
  - [x] 顶部固定分数概览条：✅ 对/总数 · 百分比 · 用时（复用 `formatTime`）
  - [x] 桌面端：左右两栏（左 260px 固定导航 + 右自适应题目详情）
  - [x] 移动端：上下布局（上横向题号 + 下题目详情，flex-col lg:flex-row）
  - [x] 当前选中的 review 题号状态 `reviewIndex: number`
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 6: ReviewNav 题号导航栏
  - [x] 遍历 questions 渲染题号列表
  - [x] 每道题按题型着色（复用 typeBadges）
  - [x] ✅ CheckCircle2 绿色 / ❌ XCircle 红色
  - [x] 底部汇总：对/总数
  - [x] 点击题号 → setReviewIndex
  - [x] 当前选中题号 ring-2 ring-accent-400/50 高亮态
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 7: Review 题目详情
  - [x] 显示题型 badge + 题号
  - [x] 显示题目内容（直接渲染 h3 + rq.content）
  - [x] 显示所有选项（OptionPanel showResult=true，标红错误/标绿正确 + 用户答案）
  - [x] "上一题"/"下一题" 按钮
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 8: AIExplanationCard 组件
  - [x] 内联于 ReviewPanel，接收 qId 从 aiStates 读取状态
  - [x] 4 种状态渲染：
    - idle: `🤖 AI解析本题` 按钮（虚线边框）
    - loading: Loader2 旋转动画 + "AI 正在思考..."
    - done: 解析文本 + 平台标签 + 生成时间 + 📋 Copy 复制按钮
    - error: 错误信息 + 重试按钮
  - [x] 进入 review 时检查 `getCachedExplanation` 自动加载已有缓存
  - [x] 点击生成 → loadAIConfig → generateExplanation → saveCachedExplanation
  - [x] 生成失败显示具体错误
  - [x] 复制功能：navigator.clipboard.writeText
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 9: 一键生成所有错题解析
  - [x] Review 概览栏下方显示"一键生成所有错题解析（N 题）"按钮
  - [x] 仅当有错题时显示
  - [x] 点击 → 筛选所有错题（results[qId] === false）
  - [x] 最多 3 并发 → 逐题更新各自 AIExplanationCard 状态
  - [x] 已缓存的不重复生成
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 10: Review 底部按钮
  - [x] 两个按钮："再来一次"（RotateCcw + 回到 config）和"返回配置"（ArrowLeft + 回到 config）
  - [x] 替换原有单一"再来一次"按钮
  - [x] 验证：`npx tsc --noEmit` 零错误

## 验证结果

```bash
npx tsc --noEmit   # 0 errors
npx vite build     # success
```