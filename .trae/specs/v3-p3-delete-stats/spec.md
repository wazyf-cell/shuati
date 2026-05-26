# V3.0 P3: 题库删除按钮红色 + 错题次数列 + 统计清空

## Why
Phase 4 和 Phase 9 是独立小改动：删除按钮红色提升危险操作视觉感知，错题次数列增强题库详情页信息密度，统计清空让用户能重置练习数据。

## What Changes
- **修改 `src/components/Dashboard/BankCard.tsx`**：删除按钮颜色改为红色
- **修改 `src/components/Bank/BankDetail.tsx`**：删除按钮颜色 + 新增"错误次数"列
- **修改 `src/components/Statistics/index.tsx`**：新增"清空统计"按钮 + ConfirmDialog

## Impact
- 无依赖：不依赖任何未完成的 Phase
- 无新文件：所有改动在现有文件中

## ADDED Requirements

### Requirement: 题库删除按钮红色
系统 SHALL 将 BankCard 和 BankDetail 中的删除按钮颜色改为红色主题。

#### Scenario: BankCard 删除按钮
- **WHEN** 用户在题库卡片上 hover 删除按钮
- **THEN** 按钮显示红色背景反馈 `hover:bg-red-50 dark:hover:bg-red-900/20`
- **THEN** 按钮默认显示 `text-red-400`，hover 变为 `text-red-600`

### Requirement: 题库题目表格新增"错误次数"列
系统 SHALL 在 BankDetail 题目表格中新增"错误次数"列。

#### Scenario: 有错题记录
- **WHEN** 某题在 WrongStore 中有 wrongCount > 0
- **THEN** 该列显示红色 `❌ N次`

#### Scenario: 无错题记录
- **WHEN** 某题 wrongCount === 0 或无记录
- **THEN** 该列空白

### Requirement: 统计清空
系统 SHALL 在 Statistics 页面提供清空统计数据功能。

#### Scenario: 清空统计
- **WHEN** 用户点击页面顶部的红色"清空统计"按钮
- **THEN** 弹出 ConfirmDialog："确定清空所有练习统计数据吗？题库和错题不受影响。"
- **WHEN** 用户确认
- **THEN** `storage.setRecords([])` → 刷新统计数据
- **WHEN** 用户取消
- **THEN** 不做任何操作