# Tasks

## Phase 1: 刷题切题抖动修复

- [x] Task 1: 稳定题目卡片区域高度
  - [x] 为 Practice/index.tsx 第 601 行 `<div className="card p-6">` 添加 `min-h-[360px]` 样式
  - [x] 为同一 div 添加 `key={questions[currentIndex].id}` 属性确保 React 干净过渡
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 2: 提交确认弹窗组件

- [x] Task 2: 创建 ConfirmDialog 组件
  - [x] 新建 `src/components/shared/ConfirmDialog.tsx`
  - [x] 组件接收 props: `open: boolean`, `message: string`, `onConfirm: () => void`, `onCancel: () => void`
  - [x] 实现毛玻璃遮罩层（`backdrop-blur-sm bg-black/30 fixed inset-0 z-50`）
  - [x] 实现居中卡片容器（圆角、阴影、padding）
  - [x] 实现渐变样式确认按钮（`bg-gradient-to-r from-accent-500 to-surface-400`）
  - [x] 实现取消按钮（`btn-ghost` 样式）
  - [x] 复用项目现有设计 tokens（surface、accent 色系）

- [x] Task 3: 在 Practice 中集成 ConfirmDialog
  - [x] 新增 state: `const [confirmOpen, setConfirmOpen] = useState(false);`
  - [x] 修改 `handleSubmit`：有未答题时 `setConfirmOpen(true)` 代替 `confirm()`
  - [x] 提取 `doSubmit` 函数包含原有提交逻辑
  - [x] 取消回调中关闭弹窗
  - [x] 在 JSX 末尾添加 `<ConfirmDialog open={confirmOpen} ... />`
  - [x] 验证：`npx tsc --noEmit` 零错误，grep 确认 confirm() 调用已移除

## Phase 3: 题库导航高亮修复

- [x] Task 4: 导航点击即时高亮
  - [x] BankDetail.tsx 第 220 行 onClick 中 `el.scrollIntoView(...)` 之后添加 `setActiveIndex(i)`
  - [x] 验证：`npx tsc --noEmit` 零错误

# Task Dependencies
- Task 1、Task 2、Task 4 无相互依赖，可并行执行
- Task 3 依赖 Task 2（ConfirmDialog 组件先创建）