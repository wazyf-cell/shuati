# Checklist

## 刷题切题抖动修复

- [x] 题目卡片 div 包含 `min-h-[360px]` class（第 608 行确认）
- [x] 题目卡片 div 包含 `key={questions[currentIndex].id}` 属性
- [x] 从不同高度题目间切换时卡片区域高度稳定

## ConfirmDialog 组件

- [x] `src/components/shared/ConfirmDialog.tsx` 文件已创建
- [x] 组件导出 `ConfirmDialog` 函数组件
- [x] 接收 `open`, `message`, `onConfirm`, `onCancel` props
- [x] 毛玻璃遮罩层覆盖全屏（backdrop-blur + 半透明背景 + z-50）
- [x] 卡片居中显示，有圆角和阴影
- [x] 确认按钮使用渐变样式（from-accent-500 to-surface-400）
- [x] 取消按钮使用 btn-ghost 样式
- [x] 点击遮罩层触发 onCancel

## Practice 集成 ConfirmDialog

- [x] `confirm()` 调用已完全移除（grep 确认无残留）
- [x] 新增 `confirmOpen` state
- [x] handleSubmit 中有未答题时设置 confirmOpen=true 而非 confirm()
- [x] doSubmit 确认回调正确执行原有 submitAnswers 等提交逻辑
- [x] 取消回调关闭弹窗不影响答题状态
- [x] ConfirmDialog 组件正确渲染在 JSX 中

## 题库导航高亮

- [x] 导航按钮 onClick 中在 scrollIntoView 后调用 setActiveIndex(i)（第 224 行确认）
- [x] 点击导航后对应按钮即时高亮为对应题型颜色
- [x] IntersectionObserver 逻辑无变动（滚动时仍能正确更新）

## TypeScript

- [x] `npx tsc --noEmit` 零错误（exit code 0）
- [x] 无未使用导入/变量