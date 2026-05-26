# V3.0 P1: AI 基础设施 + AI 配置模态框

## Why
AI 解析功能是 V3.0 的核心差异化能力。AI 基础设施提供通用的 API 调用和缓存层，AI 配置弹窗让用户管理自己的 API Key 和平台偏好。这两个模块独立性高，可并行于错题本改造开发。

## What Changes
- **新建 `src/utils/ai.ts`**：AI 调用核心模块（平台预设表、callAIAPI、generateExplanation、缓存管理）
- **新建 `src/components/AI/AIConfigModal.tsx`**：AI 配置模态框（平台选择、API Key 管理、模型配置）
- **修改 `src/components/Layout/Header.tsx`**：导航栏新增"AI配置"入口按钮

## Impact
- Affected specs: v3-p0-types-wrongbook（依赖其 AIConfig/AIPlatformDef 类型）
- Affected code: `src/utils/ai.ts`（新建）, `src/components/AI/AIConfigModal.tsx`（新建）, `src/components/Layout/Header.tsx`

## ADDED Requirements

### Requirement: AI 平台预设表
系统 SHALL 内置 7 个 AI 平台预设（硅基流动、DeepSeek、OpenAI、Azure、Google Gemini、Claude、自定义），各含默认 Base URL 和推荐模型列表。

#### Scenario: 获取平台预设
- **WHEN** 组件或 store 调用平台预设表
- **THEN** 返回包含 name/baseUrl/models/apiKeyHelp 的 AIPlatformDef 数组

### Requirement: AI API 调用
系统 SHALL 提供统一的 `callAIAPI` 函数，封装 fetch + 响应解析，支持 OpenAI 兼容格式和非 OpenAI 格式。

#### Scenario: 调用 OpenAI 兼容 API
- **WHEN** 调用 callAIAPI(prompt, config) 且平台为硅基流动/DeepSeek/OpenAI/自定义
- **THEN** 发送 POST 到 `{baseUrl}/chat/completions`，携带 Authorization Bearer header

#### Scenario: 调用非 OpenAI 格式 API
- **WHEN** 平台为 Google Gemini 或 Claude
- **THEN** 使用各平台原生 API 格式

#### Scenario: 错误处理
- **WHEN** API 返回错误或网络不通
- **THEN** 区分网络错 / API 返回错 / 解析错，抛出具体错误信息

### Requirement: AI 解析生成
系统 SHALL 提供 `generateExplanation` 函数，构建题目解析 prompt → 调用 AI API → 返回解析文本。

#### Scenario: 生成题目解析
- **WHEN** 调用 generateExplanation(question, userAnswer, config)
- **THEN** 构建包含题目内容、选项、正确答案、用户答案的 prompt，调用 AI 返回解析文本

### Requirement: AI 解析缓存
系统 SHALL 以 questionId 为 key 缓存 AI 解析结果（localStorage key: 'ai_explanations'）。

#### Scenario: 缓存命中
- **WHEN** getCachedExplanation(questionId) 被调用且缓存存在
- **THEN** 直接返回缓存的解析文本

#### Scenario: 清空缓存
- **WHEN** clearAICache() 被调用
- **THEN** 删除所有 localStorage 中的 AI 解析缓存

### Requirement: AI 配置保存/加载
系统 SHALL 在 localStorage (key: 'ai_config') 中持久化 AIConfig，API Key 做 Base64 混淆。

#### Scenario: 保存配置
- **WHEN** saveAIConfig(config) 被调用
- **THEN** API Key 经 btoa() 编码后写入 localStorage

#### Scenario: 加载配置
- **WHEN** loadAIConfig() 被调用且配置存在
- **THEN** 从 localStorage 读取并 atob() 解码 API Key

### Requirement: AI 配置模态框
系统 SHALL 提供配置模态框，支持平台选择、API Key 输入（显示/隐藏切换）、Base URL 编辑、模型选择、最大 Token 设置。

#### Scenario: 打开模态框
- **WHEN** 用户点击 Header 中的"AI配置"按钮
- **THEN** 弹出模态框，自动回填已有配置

#### Scenario: 切换平台
- **WHEN** 用户切换平台下拉框
- **THEN** 自动更新 Base URL、模型列表、平台说明

#### Scenario: 保存配置
- **WHEN** 用户填写 API Key 并点击保存
- **THEN** 校验非空 → 写入 localStorage → toast "AI 配置已保存" → 关闭弹窗

#### Scenario: 自定义平台
- **WHEN** 用户选择"自定义"平台
- **THEN** 显示"自定义平台名称"和"自定义模型 ID"额外输入框

### Requirement: Header AI 配置入口
系统 SHALL 在 Header 导航栏中显示"AI配置"按钮，样式与其他导航按钮一致。

#### Scenario: 未配置时提示
- **WHEN** 用户点击"AI配置"按钮且尚未配置
- **THEN** 打开配置模态框，引导用户填写