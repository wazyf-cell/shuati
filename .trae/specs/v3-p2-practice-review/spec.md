# V3.0 P2: 刷题新增开关 + 刷题结果页改造

## Why
Phase 5 的两个新开关让刷题体验更灵活（查看答案模式、AI 解析模式）。Phase 7 的结果页改造将简单分数卡片升级为逐题回顾 + AI 解析的深度学习闭环，是 V3.0 AI 能力的最终落地。

## What Changes
- **修改 `src/components/Practice/index.tsx`**：阶段管理重构（boolean → Phase 枚举）、新增两个配置开关、新增"查看答案"按钮、新增 AI 解析按钮、新增 ReviewPanel
- 不新建文件：ReviewPanel / ReviewNav / AIExplanationCard 均内联于 Practice 组件内（方案.md 建议避免 props drilling）

## Impact
- Affected specs: v3-p1-ai-infra-config（依赖其 ai.ts 的 generateExplanation/getCachedExplanation/缓存函数）、v3-p0-types-wrongbook（依赖其 UserConfig 的 showAnswerSwitch/enableAIInPractice）
- Affected code: `src/components/Practice/index.tsx`

## 设计决策记录

| # | 决策点 | 选择 | 理由 |
|---|--------|------|------|
| 1 | Review 交互模式 | C — 分数概览栏 + Review 并存 | 兼顾总览与逐题回顾，一步到位 |
| 2 | Review 题号点击 | A — 仅切换显示 | 简单直观，避免不必要的 API 调用 |
| 3 | 阶段管理 | A — 枚举 `Phase = 'config' \| 'practice' \| 'review'` | 杜绝非法状态组合 |
| 4 | 查看答案位置 | A — 选项区下方，查看后不可逆 | 语义清晰，防止先看答案再作答 |
| 5 | AI 缓存 | A — 自动加载已缓存 | 减少重复调用 |
| 6 | 批量生成 | C — 最多 3 并发 | 兼顾速度与 API 限制 |
| 7 | Review 底部按钮 | B — 再来一次 + 返回配置 | 给用户选择权 |
| 8 | 查看答案样式 | A — 灰色低调 | 不抢提交按钮视觉焦点 |
| 9 | 移动端导航 | A — 上下布局，题号横向排列 | 充分利用屏幕宽度 |
| 10 | 开关位置 | A — 计时模式后 | 逻辑自然，追加式扩展 |
| 11 | 未配置 AI | A — 开关置灰 + 文字提示 | 提前告知，避免误操作 |

## ADDED Requirements

### Requirement: 阶段管理重构
系统 SHALL 用枚举 `Phase = 'config' | 'practice' | 'review'` 替代 `showConfig: boolean` + `practiceResult` 两个状态。

#### Scenario: 阶段流转
- **WHEN** 用户点击"开始刷题" → phase 从 config 变为 practice
- **WHEN** 用户提交答案 → phase 从 practice 变为 review
- **WHEN** 用户点击"再来一次" → phase 从 review 变为 config
- **WHEN** 用户点击"返回配置" → phase 从 review 变为 config

### Requirement: 查看正确答案开关（Phase 5）
系统 SHALL 在配置面板中提供"查看正确答案"开关，状态读写 UserConfig.showAnswerSwitch。

#### Scenario: 开关开启
- **WHEN** 开关开启且在刷题中
- **THEN** 每道题选项区下方显示灰色 `💡 查看正确答案` 按钮
- **WHEN** 用户点击查看答案按钮
- **THEN** 绿色高亮正确答案、禁用该题所有选项、该题不计正确率

#### Scenario: 开关关闭
- **WHEN** 开关关闭
- **THEN** 无查看答案按钮，正常刷题

### Requirement: 启用 AI 解析开关（Phase 5）
系统 SHALL 在配置面板中提供"启用 AI 解析"开关，状态读写 UserConfig.enableAIInPractice。

#### Scenario: 开关开启
- **WHEN** 开关开启且在刷题中
- **THEN** 每道题下方出现 `🤖 AI解析` 按钮

#### Scenario: 未配置 AI 平台
- **WHEN** 未保存过 AI 配置
- **THEN** 开关置灰 + 下方显示"请先在导航栏配置 AI 平台"提示

#### Scenario: 结果回顾页
- **WHEN** 处于 review 阶段
- **THEN** AI 解析按钮始终显示，不受此开关影响

### Requirement: 刷题结果页改造（Phase 7）
系统 SHALL 在提交答案后展示 Review 阶段，替代当前简单分数卡片。

#### Scenario: Review 布局
- **WHEN** 进入 review 阶段
- **THEN** 顶部固定显示分数概览条（✅ 对/总数 · 百分比 · 用时）
- **THEN** 桌面端：左侧题号导航栏 + 右侧题目详情
- **THEN** 移动端：上方横向题号导航 + 下方题目详情

#### Scenario: 题号导航
- **WHEN** 渲染题号导航
- **THEN** 每道题按题型着色（复用现有 typeBadges）+ ✅ 绿色边框 / ❌ 红色边框
- **WHEN** 用户点击题号
- **THEN** 右侧切换显示对应题目详情

#### Scenario: 题目详情
- **WHEN** 显示某题详情
- **THEN** 展示题型 badge、题目内容、选项（错误选项标红 + 用户答案、正确选项标绿 + 正确答案）

### Requirement: AI 解析卡片（Phase 7）
系统 SHALL 在 Review 每道题下方显示 AI 解析卡片。

#### Scenario: 未生成状态
- **WHEN** 该题无缓存且未请求过
- **THEN** 显示 `🤖 AI解析本题` 按钮

#### Scenario: 生成中
- **WHEN** 点击生成且 API 调用中
- **THEN** 显示加载动画 + "AI 正在思考..."

#### Scenario: 已生成
- **WHEN** 解析已返回（或已有缓存）
- **THEN** 显示解析文本 + 平台标签 + 生成时间 + 📋复制按钮

#### Scenario: 生成失败
- **WHEN** API 调用失败
- **THEN** 显示错误信息 + 重试按钮

#### Scenario: 自动加载缓存
- **WHEN** 进入 review 阶段
- **THEN** 自动检查所有题目的 AI 缓存，有缓存的直接显示

### Requirement: 一键生成所有错题解析
系统 SHALL 在 Review 页顶部提供"一键生成所有错题解析"按钮。

#### Scenario: 批量生成
- **WHEN** 用户点击一键生成
- **THEN** 最多同时 3 个并发请求，逐题更新解析卡片

### Requirement: Review 底部操作
系统 SHALL 在 Review 页底部提供"再来一次"(返回配置页)和"返回配置"(返回配置页)两个按钮。

#### Scenario: 返回
- **WHEN** 用户点击任意底部按钮
- **THEN** phase 回到 config，保留配置状态

### Requirement: 查看答案不计正确率
系统 SHALL 对查看过答案的题目不计入正确率统计。

#### Scenario: 标记已查看
- **WHEN** 用户在某题点击"查看答案"
- **THEN** 该题加入 `viewedAnswerIds: Set<string>`，提交时 results 中该题记为 false
- **THEN** 该题不生成 PracticeRecord 的正确统计