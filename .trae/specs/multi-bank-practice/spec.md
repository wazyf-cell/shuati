# 多题库联合刷题 Spec

## Why
当前系统仅支持每次选择一个题库进行刷题，用户无法将多个题库的题目混合练习。这限制了灵活性和刷题效率——例如用户想在"政治"和"法律"两个题库中随机抽取题目进行综合练习，必须先合并题库数据，操作繁琐。

## What Changes
- **入口选题库UI改造**：Dashboard 从点击单卡片进入 BankDetail → 再点刷题，改为直接多选弹窗勾选 + 批量配置，跳转至 Practice。
- **Practice 组件参数调整**：`bankId: string` → `bankIds: string[]`，支持多题库题目合并后传入 `startPractice()`。
- **PracticeRecord 数据结构更新**：`bankId: string` → `bankIds: string[]`，兼容历史单题库记录。
- **导入导出兼容**：`exportData`/`importData` 支持新旧两种记录格式。
- **WrongQuestion 适配**：`bankId` 字段在多题库场景下的记录策略调整。
- **Statistics 过滤更新**：支持按 `bankIds` 进行多题库联合统计筛选。

## Impact
- Affected specs: v2-feature-enhancement（导入导出部分）
- Affected code:
  - `src/types/index.ts` — PracticeRecord、新增加 MultiBankConfig
  - `src/App.tsx` — 页面路由状态 `selectedBankId` → `selectedBankIds`
  - `src/components/Dashboard/index.tsx` — 选题库入口
  - `src/components/Practice/index.tsx` — 参数 + 抽题配置UI + 记录生成
  - `src/components/Statistics/index.tsx` — 记录过滤
  - `src/components/WrongBook/index.tsx` — 错题分组/过滤
  - `src/store/wrong.ts` — `addWrong` 签名 + `getWrongByBank`
  - `src/utils/storage.ts` — 导入导出兼容

---

## ADDED Requirements

### Requirement: Multi-Bank Selection Modal
系统 SHALL 在 Dashboard 提供多题库选择弹窗，允许用户勾选一个或多个题库进行联合刷题。

#### Scenario: 打开多选弹窗
- **WHEN** 用户在 Dashboard 点击"多题库刷题"按钮
- **THEN** 系统弹出模态窗口，展示所有题库列表（含题库名和题目数），每个题库带有复选框

#### Scenario: 勾选/取消勾选题库
- **WHEN** 用户点击某个题库的复选框
- **THEN** 该题库进入选中/取消选中状态，底部显示已选 X 个题库的计数

#### Scenario: 全选/取消全选
- **WHEN** 用户点击"全选"复选框
- **THEN** 所有题库同时选中或取消选中，底部计数实时更新

#### Scenario: 确认开始刷题
- **WHEN** 用户至少选择一个题库后点击"开始刷题"
- **THEN** 系统关闭弹窗，跳转至 Practice 页面并传递选中的 bankIds 数组

#### Scenario: 未选任何题库时确认
- **WHEN** 用户未勾选任何题库且点击"开始刷题"
- **THEN** 按钮置灰不可点击或点击后弹出 toast 提示"请至少选择一个题库"

#### Scenario: 取消选择
- **WHEN** 用户点击弹窗的"取消"按钮或点击遮罩层
- **THEN** 弹窗关闭，不进入刷题

### Requirement: Per-Bank Question Configuration
系统 SHALL 在 Practice 配置页面支持为每个选中的题库单独设置抽题数量和随机策略。

#### Scenario: 展示多题库配置面板
- **WHEN** 用户通过多选方式进入 Practice 配置页
- **THEN** 页面展示每个题库的名称、总题目数，以及对应的「抽题数量」滑块（范围 1 ~ 该题库题目总数）

#### Scenario: 为各题库独立设置抽题数
- **WHEN** 用户分别将题库 A 设为 10 题、题库 B 设为 5 题
- **THEN** 系统从题库 A 随机/顺序抽取 10 题，从题库 B 随机/顺序抽取 5 题，合并为最终题目列表

#### Scenario: 抽题数为 0 的题库
- **WHEN** 用户将某个题库的抽题数滑块拖到最小值（1 题）
- **THEN** 该题库至少抽取 1 题；不允许设为 0

#### Scenario: 全局随机开关
- **WHEN** 用户在多题库模式下开启/关闭"随机抽取"
- **THEN** 所有选中题库统一使用该随机策略（与单题库模式行为一致）

### Requirement: Multi-Bank Question Merge
系统 SHALL 将多个题库抽取的题目合并为一个题目列表，并传递给 `startPractice()`。

#### Scenario: 题目合并
- **WHEN** 从题库 A（3 题）和题库 B（2 题）各抽取题目
- **THEN** 合并后的题目列表包含 5 题，传递给 `startPractice()`

#### Scenario: 题库间题目顺序
- **WHEN** 全局随机开关开启
- **THEN** 各题库内部进行随机抽取后，合并时整体再打乱一次顺序
- **WHEN** 全局随机开关关闭
- **THEN** 按题库选择顺序依次排列：题库 A 的题在前，题库 B 的题在后

### Requirement: PracticeRecord Multi-Bank Support
系统 SHALL 更新 `PracticeRecord` 数据结构以支持多题库记录，并保持对历史单题库记录的兼容。

#### Scenario: 多题库提交生成记录
- **WHEN** 用户在多题库模式下提交答案
- **THEN** 生成的 `PracticeRecord` 包含 `bankIds: ['bank-a', 'bank-b']`，不再包含 `bankId` 字段

#### Scenario: 单题库提交生成记录
- **WHEN** 用户通过传统单题库路径（如从 BankDetail 进入）提交答案
- **THEN** 生成的 `PracticeRecord` 包含 `bankIds: ['bank-a']`（单元素数组），同时保留 `bankId` 字段用于向后兼容

#### Scenario: 历史记录读取兼容
- **WHEN** 系统读取旧版 localStorage 中 `bankId: string` 格式的记录
- **THEN** 系统自动将 `bankId` 归一化为 `bankIds: [bankId]` 在使用时处理，无需数据迁移

### Requirement: Statistics Multi-Bank Filter
系统 SHALL 更新 Statistics 页面的题库过滤逻辑，支持多题库记录的筛选。

#### Scenario: 筛选包含指定题库的记录
- **WHEN** 用户选择按"题库 A"过滤
- **THEN** 系统展示所有 `bankIds` 数组中包含"题库 A"的记录（包括纯题库 A 的单题库记录和包含题库 A 的多题库记录）

#### Scenario: "全部题库"汇总
- **WHEN** 用户选择"全部题库"
- **THEN** 汇总所有记录（与现有行为一致）

### Requirement: WrongQuestion Multi-Bank Record
系统 SHALL 在多题库刷题场景下，错题记录关联到题目原始所属的题库。

#### Scenario: 多题库错题记录
- **WHEN** 用户在包含题库 A 和题库 B 的联合刷题中做错一道来自题库 A 的题目
- **THEN** 错题记录的 `bankId` 字段标记为该题的原始所属题库 A（而非多题库列表）

#### Scenario: 错题本分组不变
- **WHEN** 用户打开错题本
- **THEN** 错题仍按原始所属题库分组显示（行为与之前一致）

### Requirement: Import/Export Compatibility
系统 SHALL 确保导入导出功能兼容新旧两种 `PracticeRecord` 格式。

#### Scenario: 导出含多题库记录
- **WHEN** 用户点击"导出数据"
- **THEN** 导出的 JSON 中 records 数组同时包含 `bankIds` 和 `bankId` 字段（`bankId` 保留用于向后兼容）

#### Scenario: 导入旧格式记录
- **WHEN** 用户导入只包含 `bankId: string`（无 `bankIds`）的记录数据
- **THEN** 系统正常导入，读取时自动归一化处理

#### Scenario: 导入新格式记录
- **WHEN** 用户导入包含 `bankIds: string[]` 的记录数据
- **THEN** 系统正常导入，Statistics/WrongBook 等模块正确读取

---

## MODIFIED Requirements

### Requirement: Practice Component Props
原 `Practice` 组件接收 `bankId: string` 参数，修改为接收 `bankIds: string[]` 和可选 `bankId`（向后兼容）。

#### Scenario: 多题库入口调用 Practice
- **WHEN** Dashboard 多选弹窗确认后跳转
- **THEN** App.tsx 传递 `bankIds: ['a', 'b']` 给 Practice 组件

#### Scenario: 单题库入口调用 Practice
- **WHEN** 用户从 BankDetail 点击"刷题"（传统路径）进入
- **THEN** App.tsx 同时传递 `bankId: 'a'` 和 `bankIds: ['a']` 给 Practice 组件

### Requirement: Dashboard Entry Point
Dashboard 原有交互"点击卡片 → 进入 BankDetail"保持不变，新增"多题库刷题"入口按钮。

#### Scenario: 多题库刷题按钮可见性
- **WHEN** 题库数量 ≥ 2
- **THEN** Dashboard 显示"多题库刷题"按钮
- **WHEN** 题库数量 < 2
- **THEN** "多题库刷题"按钮隐藏或置灰

---

## Design Decisions

### 题目去重策略
**决定**：暂不实现跨题库自动去重。多题库刷题场景下，用户可能在不同题库中有相同知识点的不同表述题目，这些应被视为独立题目。如需去重，用户可手动管理题库内容。此决策可在后续版本中改为可配置项。

### 数据迁移策略
**决定**：采用运行时归一化（runtime normalization）而非物理数据迁移。读取 `PracticeRecord` 时统一检查 `bankIds` 和 `bankId`，优先使用 `bankIds`，fallback 到 `[bankId]`。好处：零迁移风险，对用户透明。

### WrongQuestion 的 bankId
**决定**：保持 `WrongQuestion.bankId` 为单数形式，记录错误题目原始所属的题库 ID。多题库刷题场景下，每道错题仍属于唯一原始题库，`bankId` 保持语义准确。