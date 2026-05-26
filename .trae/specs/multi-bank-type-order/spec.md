# 多题库题型顺序 Spec

## Why
当前多题库刷题模式下，合并后的题目只做整体随机打乱，无法按题型分组排序。单题库模式已有的题型顺序功能未扩展到多题库场景，导致用户在多题库练习时失去了对做题节奏的控制——比如想先做判断题热身、再做选择题、最后做简答题，目前做不到。

## What Changes
- **Practice 组件**：多题库模式下新增独立题型排序面板，支持拖拽/按钮调整题型顺序
- **config Store**：新增 `multiBankTypeOrder` 字段，持久化到 localStorage
- **题目选择逻辑**：多题库合并题目后，按 `multiBankTypeOrder` 分组，每组内随机打乱

## Impact
- Affected specs: multi-bank-practice（扩展多题库功能）
- Affected code:
  - `src/stores/configStore.ts` — 新增 `multiBankTypeOrder` 字段 + 持久化
  - `src/components/Practice/index.tsx` — 新增多题库题型排序面板、修改多题库题目排序逻辑
  - `src/types/index.ts` — 无需修改（复用现有 `QuestionType` 枚举）

---

## ADDED Requirements

### Requirement: 多题库题型顺序独立配置
系统 SHALL 在多题库刷题模式下提供独立的题型顺序配置，与单题库配置互不干扰。

#### Scenario: 多题库排序面板显示
- **WHEN** 用户选择多题库模式（`bankIds` 存在且长度 ≥ 2）
- **THEN** 配置面板中显示题型排序区域，列出所有可用题型及其上下移动按钮

#### Scenario: 题型顺序调整
- **WHEN** 用户点击某题型的"上移"或"下移"按钮
- **THEN** 该题型在排序列表中的位置相应移动，且 `multiBankTypeOrder` 状态立即更新

#### Scenario: 独立于单题库配置
- **WHEN** 用户在单题库模式下调整题型顺序
- **THEN** 不会影响多题库的题型顺序设置，反之亦然

### Requirement: 题型顺序持久化
系统 SHALL 将多题库的题型顺序设置持久化到 localStorage。

#### Scenario: 保存顺序
- **WHEN** 用户调整多题库题型顺序后
- **THEN** 新顺序写入 localStorage，下次打开多题库时自动恢复

#### Scenario: 首次使用默认值
- **WHEN** 用户首次使用多题库功能（localStorage 无记录）
- **THEN** 题型顺序默认为：判断 → 单选 → 多选 → 填空 → 简答

### Requirement: 按题型分组排序 + 组内随机
系统 SHALL 在多题库模式下按用户设定的题型顺序分组排列题目，每组内部随机打乱。

#### Scenario: 题目排序
- **WHEN** 用户设定题型顺序为 [判断, 单选, 填空]，且从多个题库中抽题
- **THEN** 合并后的题目列表：首先是所有判断题（内部随机排列），然后所有单选题（内部随机排列），最后所有填空题（内部随机排列）

#### Scenario: 某题型无题时跳过
- **WHEN** 用户设定了某个题型的顺序，但合并后的题目中没有该题型
- **THEN** 该题型在最终题目列表中直接跳过，不影响后续题型

---

## MODIFIED Requirements

### Requirement: 随机抽取开关与题型排序共存
多题库模式下已有的"随机抽取"和"顺序抽取"开关保持不变。交互规则如下：

- **题型排序 + 随机抽取开启**：按题型分组排序，同题型组内随机打乱（符合用户选择的"按题型分段随机"行为）
- **题型排序 + 随机抽取关闭**：按题型分组排序，同题型组内保持原始题库顺序
- 题型排序始终是第一排序维度，随机开关仅影响组内排序

**Decision**: 题型排序是主导排序策略。"随机抽取"开关降级为控制组内是否打乱，不再控制全局排序。

---

## Design Decisions

### 存储方案
- Zustand configStore 新增 `multiBankTypeOrder: QuestionType[]` 字段
- 通过 `zustand/middleware` 的 `persist` 自动持久化到 localStorage key `practice-config`
- 默认值：`['judge', 'single', 'multiple', 'fill', 'short']`

### UI 方案
- 多题库配置面板底部新增"题型排序"区域（section）
- 样式与单题库题型排序面板保持一致
- 显示逻辑：仅在 `bankIds.length >= 2` 时渲染

### 排序逻辑
- 位置：`useMemo` 内，在题目合并（merge）之后、返回之前
- 算法：先按 `typeOrder.findIndex` 分组排序，组内 `Math.random() - 0.5` 打乱