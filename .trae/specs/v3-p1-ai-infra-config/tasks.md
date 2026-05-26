# Tasks

## Phase 1: AI 基础设施

- [x] Task 1: 创建 AI 工具模块 `src/utils/ai.ts`
  - [x] 定义 7 个平台预设 `PLATFORM_PRESETS: Record<string, AIPlatformDef>`
  - [x] 实现 `loadAIConfig(): AIConfig | null` — 从 localStorage 'ai_config' 读取，atob 解码 API Key
  - [x] 实现 `saveAIConfig(config: AIConfig): void` — btoa 编码 API Key 后写入 localStorage
  - [x] 实现 `callAIAPI(prompt: string, config: AIConfig): Promise<string>` — 核心 fetch 封装
    - OpenAI 兼容平台：POST `{baseUrl}/chat/completions`，Bearer auth，解析 choices[0].message.content
    - Claude：POST `{baseUrl}/messages`，x-api-key header，解析 content[0].text
    - Google Gemini：POST `{baseUrl}/models/{model}:generateContent`，URL 参数 key，解析 candidates[0].content.parts[0].text
  - [x] 实现 `generateExplanation(question: Question, userAnswer: string[], config: AIConfig): Promise<string>`
    - 构建 prompt：包含题目内容、题型、选项、正确答案、用户答案，要求 AI 给出解题思路和知识点
    - 调用 callAIAPI 并返回结果
  - [x] 实现缓存函数：`getCachedExplanation(questionId)` / `saveCachedExplanation(questionId, text)` / `clearAICache()`
    - localStorage key: 'ai_explanations'，存储 `Record<string, string>`
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 2: AI 配置模态框

- [x] Task 2: 创建 AIConfigModal 组件 `src/components/AI/AIConfigModal.tsx`
  - [x] Props：`open: boolean`, `onClose: () => void`
  - [x] 状态管理：platform, apiKey, baseUrl, model, maxTokens, showKey
  - [x] UI：毛玻璃遮罩 + 居中卡片（复用 ConfirmDialog 的遮罩风格）
  - [x] 平台选择：`<select>` 绑定 7 个平台，切换时自动更新 baseUrl/model
  - [x] API Key：`<input type="password/text">` + 显示/隐藏切换按钮
  - [x] Base URL：`<input>` 非自定义平台只读，自定义平台可编辑
  - [x] 模型选择：`<select>` 根据平台动态更新
  - [x] 最大 Token：`<input type="range">` 100-10000，默认 2000
  - [x] 平台说明卡片：显示当前平台简介
  - [x] 自定义平台：额外显示"平台名称"和"模型 ID"输入框
  - [x] 保存按钮：校验 API Key 非空 → saveAIConfig → toast → onClose
  - [x] 打开时自动调用 loadAIConfig 回填
  - [x] 取消按钮/点击遮罩 → onClose（不保存）
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 3: Header 入口

- [x] Task 3: Header 添加 AI 配置按钮
  - [x] `src/components/Layout/Header.tsx`：导航栏新增"AI配置"按钮
  - [x] 样式与其他导航按钮一致（`p-2 rounded-xl transition-colors`）
  - [x] 点击打开 AIConfigModal
  - [x] 验证：`npx tsc --noEmit` 零错误

# Task Dependencies
- Task 2 依赖 Task 1（AIConfigModal 调用 loadAIConfig/saveAIConfig/PLATFORM_PRESETS）
- Task 3 依赖 Task 2（Header 渲染 AIConfigModal）