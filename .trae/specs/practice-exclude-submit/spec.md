# 题库详情页改造 Spec

## Why

当前 BankDetail 页面维护了表格视图和卡片视图两套渲染模式，增加了代码复杂度。卡片视图中题目缺少序号标识，无法快速定位；选项内容存在 20 字符硬截断，导致信息不完整。页面缺少题目级别导航，浏览长题库时体验差。需要统一为卡片视图并增强导航能力。

## What Changes

* **移除表格视图**：删除 viewMode 状态、表格/卡片切换按钮、QuestionTable 组件导入及渲染 — **BREAKING**：表格视图不可用

* **新增题目序号**：每张题目卡片左上角显示大号序号（1,2,3...），颜色与题型对应

* **新增题型颜色系统**：为五种题型定义独立 badage 颜色（沿用旧 QuestionTable 的 brand/mint/sun/sky/lava 五色逻辑，映射到新设计令牌）

* **新增左侧导航栏**：桌面端左侧 sticky 导航栏列出所有题目序号，按题型着色，点击跳转，高亮当前可见题目

* **文本完整展示**：选项内容取消 20 字符截断，改为完整显示 + `break-words` 自动换行

* **布局重构**：桌面端左右两栏结构（导航栏 + 卡片列表），小屏导航变为顶部横条

## Impact

* Affected specs: ui-minimalist-redesign（扩展题型颜色系统）

* Affected code:

  * `src/components/Bank/BankDetail.tsx` — 主要改造文件

  * `src/index.css` — 新增 5 个 badge 类 + 导航栏样式

***

## ADDED Requirements

### Requirement: 五色题型 Badge

系统 SHALL 为五种题型提供独立的颜色标识。

#### Scenario: 题型颜色映射

* **WHEN** 题目类型为 single / multiple / judge / fill / short

* **THEN** Badge 颜色分别为 indigo（蓝紫）/ emerald（绿）/ amber（琥珀）/ sky（天蓝）/ rose（玫红）

* 每个 badge 类包含：浅色背景 + 深色文字（亮模式）、半透明背景 + 亮色文字（暗模式）

### Requirement: 题目序号

系统 SHALL 在每张题目卡片上显示大号序号。

#### Scenario: 序号关联题型颜色

* **WHEN** 题目序号渲染在卡片左上角

* **THEN** 序号的文字颜色与当前题目题型颜色一致（如判断题=amber 文字色）

* 序号格式：大号数字（如 1、2、3），font-size ≥ 2rem，font-weight 700

#### Scenario: 序号在筛选后重新编号

* **WHEN** 用户应用题型筛选或搜索筛选

* **THEN** 序号从 1 开始重新编号（反映当前可见题目数量）

### Requirement: 左侧题目导航栏

系统 SHALL 在桌面端提供左侧 sticky 导航栏。

#### Scenario: 导航栏显示所有题目

* **WHEN** 用户打开题库详情页

* **THEN** 左侧导航栏列出所有（筛选后）题目的序号按钮，每个按钮背景色与题型对应

#### Scenario: 点击序号跳转

* **WHEN** 用户点击导航栏中的序号

* **THEN** 页面平滑滚动到对应题目卡片（卡片元素设置 `scroll-margin-top: 6rem` 确保不被 sticky 导航遮挡）

#### Scenario: 当前题目高亮

* **WHEN** 某道题目卡片的顶部进入视口或接近视口

* **THEN** 对应导航栏序号高亮（背景填充题型颜色 + 白色文字）

#### Scenario: 导航栏 sticky 定位

* **WHEN** 用户向下滚动页面

* **THEN** 导航栏保持固定在视口顶部（sticky top-24）

#### Scenario: 小屏导航（手机端）

* **WHEN** 视口宽度 < 1024px（lg 断点以下）

* **THEN** 导航栏变为顶部水平横条，序号横向排列，支持 `overflow-x-auto` 滚动

### Requirement: 选项内容完整展示

系统 SHALL 展示选项的完整文本内容。

#### Scenario: 长选项自动换行

* **WHEN** 选项内容超过单行宽度

* **THEN** 文本自动换行（`break-words`），不截断、不省略

***

## REMOVED Requirements

### Requirement: 表格视图模式

**Reason**: 维护两套视图增加复杂度，卡片视图已满足需求
**Migration**: 直接移除 viewMode 状态、切换 UI、QuestionTable 导入及条件渲染

***

## MODIFIED Requirements

### Requirement: 页面布局

原布局为搜索栏 → 单列卡片列表。改为：

* 桌面端（lg+）：左侧导航栏（w-12/w-14）+ 右侧卡片列表（flex-1）

* 小屏（< lg）：顶部导航横条 + 下方卡片列表

* 搜索栏和题型筛选保持在页面顶部

***

## Design Decisions

### 题型颜色映射

| 题型       | Badge 类        | 浅色背景        | 深色文字        | 暗色背景           | 暗色文字        |
| -------- | -------------- | ----------- | ----------- | -------------- | ----------- |
| single   | badge-single   | indigo-100  | indigo-700  | indigo-900/30  | indigo-300  |
| multiple | badge-multiple | emerald-100 | emerald-700 | emerald-900/30 | emerald-300 |
| judge    | badge-judge    | amber-100   | amber-700   | amber-900/30   | amber-300   |
| fill     | badge-fill     | sky-100     | sky-700     | sky-900/30     | sky-300     |
| short    | badge-short    | rose-100    | rose-700    | rose-900/30    | rose-300    |

### 导航栏高亮逻辑

* 使用 IntersectionObserver 监听每张题目卡片

* 当最高的一张可见卡片（topmost visible）改变时，更新高亮序号

* 阈值：卡片顶部距离视口顶部的 10% 以内即视为"当前"

### 序号颜色关联

* 序号的 `text-*` 颜色与题型 badge 的深色文字色一致

* 导航栏序号默认：浅色背景为 `surface-100`，暗色背景为 `surface-700`

* 导航栏序号高亮：背景填充题型色 + 白色文字（`bg-*-500 text-white`）

