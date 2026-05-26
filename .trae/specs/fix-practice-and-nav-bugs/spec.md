# 刷题切题抖动 / 提交确认弹窗 / 题库导航高亮修复

## Why
1. 刷题模式下点击题目导航切换题目时，因题目内容高度差异导致卡片区域高度突变，整个界面出现抖动
2. 提交答案时使用原生 `confirm()` 方法，样式与项目 UI 设计风格不统一
3. 题库详情页点击导航按钮后，IntersectionObserver 因 `scroll-mt-24` 边界条件可能错误判定前一张卡片为 active，导致导航高亮不准确

## What Changes
- **Practice/index.tsx**：题目卡片外层加 `min-h-[360px]` 稳定高度 + `key={question.id}` 实现干净过渡；`confirm()` 替换为 ConfirmDialog 组件
- **新建 shared/ConfirmDialog.tsx**：卡片式 + 渐变按钮 + 毛玻璃遮罩的确认弹窗组件
- **BankDetail.tsx**：导航点击事件中立即调用 `setActiveIndex(i)`，不等 IntersectionObserver 回调

## Impact
- Affected specs: practice-exclude-submit, bank-detail-redesign
- Affected code: `src/components/Practice/index.tsx`, `src/components/Bank/BankDetail.tsx`, `src/components/shared/ConfirmDialog.tsx`（新建）

## MODIFIED Requirements

### Requirement: 刷题切题无抖动
刷题模式的题目卡片区域 SHALL 保持高度稳定，切换题目时不引起页面跳动。

#### Scenario: 切换题目时界面稳定
- **WHEN** 用户在刷题中通过题目导航（QuestionNav）点击切换题目
- **THEN** 题目卡片区域保持在同一位置，仅内容更新，无上下跳动

### Requirement: 提交确认弹窗
提交答案时的确认提示 SHALL 使用自定义 ConfirmDialog 组件，样式与项目设计规范一致。

#### Scenario: 有未答题时确认提交
- **WHEN** 用户点击"提交答案"且有 N 题未作答
- **THEN** 弹出 ConfirmDialog，显示"还有 N 题未作答，未答题目将计为错误。确定提交吗？"
- **AND** 点击确认后正常提交计算成绩
- **AND** 点击取消后关闭弹窗继续答题

#### Scenario: 无未答题时直接提交
- **WHEN** 用户点击"提交答案"且所有题均已作答
- **THEN** 直接提交，不弹出确认框

### Requirement: 题库导航高亮准确
题库详情页的导航按钮高亮 SHALL 即时响应用户点击，IntersectionObserver 仅在滚动时更新。

#### Scenario: 点击导航立即高亮
- **WHEN** 用户在题库详情页点击导航按钮跳转到某题
- **THEN** 导航按钮立即高亮为对应颜色，不等待滚动完成