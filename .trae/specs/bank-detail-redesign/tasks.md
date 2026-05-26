# Tasks

## Phase 1: CSS 样式

- [x] Task 1: 新增五色 badge 类 + 导航栏样式
  - [x] 在 `src/index.css` 新增 `badge-single`、`badge-multiple`、`badge-judge`、`badge-fill`、`badge-short` 五个 CSS 类（含 `.dark` 变体）
  - [x] 颜色方案：single=indigo, multiple=emerald, judge=amber, fill=sky, short=rose
  - [x] 新增 `.question-nav` 导航栏容器样式（sticky, max-height, overflow-y-auto）
  - [x] 新增 `.question-nav-item` 按钮样式（默认态 + 高亮态 `question-nav-item--active`）
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 2: 移除表格视图

- [x] Task 2: 清理 BankDetail.tsx 表格视图代码
  - [x] 删除 `import { QuestionTable } from '../shared/QuestionTable'`
  - [x] 删除 `import { ..., LayoutGrid, Table, ... }` 中的 `LayoutGrid, Table`
  - [x] 删除 `viewMode` state
  - [x] 删除视图切换按钮组
  - [x] 删除 `{viewMode === 'table' ? (...) : (...)}` 三元条件，直接保留卡片视图内容
  - [x] 更新 `typeBadges` 映射为新五色 badge 类
  - [x] 验证：`npx tsc --noEmit` 零错误，grep 确认无 QuestionTable/Table/LayoutGrid/viewMode/.slice(0,20) 残留

## Phase 3: 卡片增强

- [x] Task 3: 添加题目序号 + 取消选项截断
  - [x] 每张卡片左上角添加大号序号（`text-3xl font-bold`），颜色与题型关联（`text-{color}-500 dark:text-{color}-400`）
  - [x] 序号使用筛选后索引 `idx + 1`（过滤后重新编号）
  - [x] 选项文本：替换截断逻辑为直接显示 `opt.content`
  - [x] 选项容器添加 `break-words` 确保长文本换行
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 4: 导航栏

- [x] Task 4: 实现左侧题目导航栏
  - [x] 新增 `activeIndex` 状态 + `cardRefs` useRef 管理高亮
  - [x] 使用 `IntersectionObserver`（rootMargin: '-10% 0px -70% 0px'）监听卡片进入视口，更新 `activeIndex`
  - [x] 导航栏渲染所有（筛选后）题目序号，每个序号按钮关联 `scrollIntoView({ behavior: 'smooth', block: 'start' })`
  - [x] 序号按钮默认态：`bg-surface-100 dark:bg-surface-700` + 题型文字色
  - [x] 序号按钮高亮态：`question-nav-item--active bg-{color}-500 text-white shadow-md`
  - [x] 卡片设置 `scroll-mt-24` 防止被 sticky 导航遮挡
  - [x] 导航栏设置 `lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto`
  - [x] 小屏 (< lg)：导航栏变为 `flex overflow-x-auto` 横条
  - [x] observer.disconnect() 在 useEffect cleanup 中正确清理
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 5: 布局重构

- [x] Task 5: 重构页面为左右两栏布局
  - [x] 桌面端（lg+）：`flex flex-col lg:flex-row` 布局，导航栏 `lg:w-12 lg:flex-shrink-0` + 卡片列表 `flex-1 min-w-0`
  - [x] 小屏（< lg）：导航横条 + 卡片列表
  - [x] 导航栏与卡片列表间 `gap-6` 间距
  - [x] 保留现有空态（无题目/无匹配）逻辑
  - [x] 验证：`npx tsc --noEmit` 零错误

# Task Dependencies
- Task 2 依赖 Task 1（先有 badge 类才能更新 typeBadges）
- Task 3、4、5 与 Task 2 合并为一次 BankDetail.tsx 改造（避免文件冲突）