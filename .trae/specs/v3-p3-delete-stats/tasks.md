# Tasks

## Phase 4: 题库删除按钮红色 + 错题次数列

- [x] Task 1: BankCard 删除按钮改红色
  - [x] `text-surface-400` → `text-red-400`
  - [x] `hover:text-red-500` → `hover:text-red-600`
  - [x] 暗色模式保持一致

- [x] Task 2: BankDetail 删除按钮改红色
  - [x] `text-accent-500 hover:text-accent-600` → `text-red-400 hover:text-red-600`

- [x] Task 3: BankDetail 新增"错误次数"列
  - [x] 从 `useWrongStore().wrongQuestions` 读取数据
  - [x] `wrongCount > 0` → 显示红色 `❌ N次`
  - [x] `wrongCount === 0` → 不显示
  - [x] 列位于题目内容和操作按钮之间

## Phase 9: 统计清空

- [x] Task 4: Statistics 新增"清空统计"按钮
  - [x] 页面标题右侧显示红色 `🗑 清空统计` 按钮
  - [x] 仅当有练习记录时显示

- [x] Task 5: Statistics 确认对话框
  - [x] 复用 `ConfirmDialog` 组件
  - [x] 文案："确定清空所有练习统计数据吗？题库和错题不受影响。"
  - [x] 确认 → `storage.setRecords([])` → 刷新数据

## 验证结果

```bash
npx tsc --noEmit   # 0 errors
npx vite build     # success
```