# UI 极简主义重设计 Spec

## Why
当前 UI 采用 Neo-brutalist（新粗野主义）风格：高饱和度品牌色（粉色/薄荷绿/紫色）、厚重硬阴影、多彩渐变背景、卡通感字体（Fredoka）。虽然活泼有趣，但缺乏专业感和简洁性。用户希望界面呈现**干净、极简、专业**的视觉效果，提升刷题工具的学习专注度。

## What Changes
- **色彩系统重构**：从高饱和多彩色 → 专业沉稳的中性色调为主，保留单一品牌强调色
- **字体升级**：Fredoka → 现代无衬线字体（如 Inter），Nunito 保留或替换
- **阴影系统简化**：Neo-brutalist 硬阴影 → 柔和自然阴影（0-1-2-3 层级）
- **背景简化**：多彩渐变 → 单一柔和底色
- **卡片/按钮风格**：玻璃态（glassmorphism）→ 扁平柔和卡片（flat + subtle shadow）
- **圆角规范化**：20px/14px 混合 → 统一 12px 系统
- **间距系统规范化**：确保 4/8dp 节奏一致性
- **暗色模式**：保持双主题，重新校准对比度

## Impact
- Affected specs: multi-bank-practice（UI 组件外观变更，功能不变）
- Affected code:
  - `src/index.css` — 设计令牌系统（颜色、字体、阴影、通用组件）**BREAKING**
  - `src/components/Dashboard/index.tsx` — 卡片样式迁移
  - `src/components/Dashboard/BankSelectModal.tsx` — 弹窗样式迁移
  - `src/components/Practice/index.tsx` — 按钮/滑块样式迁移
  - `src/components/Statistics/index.tsx` — 统计卡片样式迁移
  - `src/components/WrongBook/index.tsx` — 错题列表样式迁移
  - `src/components/Bank/BankDetail.tsx` — 题库详情样式迁移
  - 所有组件中的 `btn-*`、`card*` 等工具类保持一致（CSS 层统一变更，组件无需逐文件修改）

---

## ADDED Requirements

### Requirement: 极简色彩系统
系统 SHALL 采用专业、沉稳的配色方案，以中性色为主、单一品牌强调色为辅。

#### Scenario: 明亮模式配色
- **WHEN** 用户在明亮模式下使用应用
- **THEN** 主背景为柔和暖白（#FAFAF9/slate-50），卡片为纯白带微弱阴影，文字为深灰（#1A1A2E），强调色使用单一克制色彩（如靛蓝 #4F46E5 或保留用户已经熟悉的品牌色系但降低饱和度）

#### Scenario: 暗色模式配色
- **WHEN** 用户在暗色模式下使用应用
- **THEN** 背景为深色（#0F0F1A），卡片为半透明深色（rgba(255,255,255,0.04)），文字为暖灰白，强调色适当提亮

#### Scenario: 色彩语义化
- **WHEN** 开发者使用设计令牌
- **THEN** 所有颜色通过 CSS 变量引用（`--color-surface`、`--color-text-primary`、`--color-accent` 等），而非硬编码 hex 值

### Requirement: 专业字体系统
系统 SHALL 使用现代无衬线字体，提升可读性和专业感。

#### Scenario: 正文字体
- **WHEN** 用户阅读题目文字或界面文案
- **THEN** 使用 Inter 或系统原生无衬线字体栈，字号基准 16px，行高 1.6

#### Scenario: 标题字体
- **WHEN** 界面展示标题或章节名
- **THEN** 使用与正文同族但更粗的字重（semibold/bold），层级清晰（h1=28px, h2=22px, h3=18px）

### Requirement: 柔和阴影系统
系统 SHALL 使用自然柔和的阴影替代 Neo-brutalist 硬阴影。

#### Scenario: 卡片阴影
- **WHEN** 界面展示卡片组件
- **THEN** 卡片使用 `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` 的柔和阴影，hover 时阴影略加深但无位移

#### Scenario: 按钮阴影
- **WHEN** 界面展示主操作按钮
- **THEN** 按钮使用轻微阴影 `0 1px 2px rgba(0,0,0,0.1)`，hover 时阴影加深至 `0 2px 4px rgba(0,0,0,0.12)`，无硬位移效果

### Requirement: 简洁背景
系统 SHALL 使用单一柔和底色替代多彩渐变背景。

#### Scenario: 页面背景
- **WHEN** 用户打开任意页面
- **THEN** 背景为纯色（slate-50 或类似柔和中性色），暗色模式下为深色纯色背景，无渐变、无纹理

### Requirement: 扁平卡片风格
系统 SHALL 将卡片从玻璃态（glassmorphism + backdrop-blur）改为扁平柔和风格。

#### Scenario: 卡片外观
- **WHEN** 界面展示信息卡片
- **THEN** 卡片使用纯白/浅色背景（浅色模式）或微透明深色背景（暗色模式），配柔和阴影和一致圆角（12px），移除 backdrop-filter

### Requirement: 统一圆角规范
系统 SHALL 采用一致的圆角系统。

#### Scenario: 组件圆角
- **WHEN** 界面展示任何卡片、按钮、输入框
- **THEN** 使用统一圆角规范：小元素 8px（按钮、输入框）、中元素 12px（卡片）、大元素 16px（模态框），不再使用 20px 圆角

### Requirement: 暗色模式对比度合规
系统 SHALL 确保暗色模式下所有文本和交互元素满足 WCAG AA 对比度标准。

#### Scenario: 暗色模式文字可读性
- **WHEN** 用户在暗色模式下使用应用
- **THEN** 正文对比度 ≥ 4.5:1，辅助文字对比度 ≥ 3:1，分割线和边框在暗色背景下可见

### Requirement: 响应式与可访问性保持
系统 SHALL 在 UI 重设计过程中保持移动端和桌面端的响应式布局不退化，并遵守可访问性标准。

#### Scenario: 触控目标
- **WHEN** 用户在移动端操作
- **THEN** 所有可交互元素触控区域 ≥ 44×44px

#### Scenario: 聚焦状态
- **WHEN** 用户使用键盘导航
- **THEN** 所有可交互元素有可见的聚焦环（2px 强调色轮廓）

---

## MODIFIED Requirements

### Requirement: 保留现有布局结构
现有组件布局（栅格、列表、配置面板排列）**不变**。仅替换视觉样式（颜色、字体、阴影、圆角）。

### Requirement: 保留现有交互逻辑
所有组件的交互逻辑（点击、状态切换、数据流）**不变**。仅替换视觉呈现。

---

## Design Decisions

### 设计风格选择
**方案 A（极简灰白）**：slate 中性色系 + 靛蓝强调色。最干净、最专业的纯极简。
**方案 B（柔和暖调）**：暖灰 + 柔和蓝紫强调色。保留一丝温度感，适合学习工具。
**推荐：方案 B** — 学习工具需要一定的亲和力，全冷灰色可能过于疏离。暖灰底色 + 柔和的靛蓝/蓝紫强调色在专业与温暖间取平衡。

### 字体方案
**推荐**：Inter（正文 + 标题统一）。Inter 是现代 UI 的事实标准，x-height 高、数字等宽、可变字重，在屏幕上有优异的可读性。保留系统 fallback 栈。

### 改造策略
**手术式替换**：在 `index.css` 中集中修改设计令牌和组件类，非必要不逐个修改 TSX 文件。CSS 类名保持不变（`card`、`btn-primary` 等），仅修改其样式声明。这确保组件代码零改动。