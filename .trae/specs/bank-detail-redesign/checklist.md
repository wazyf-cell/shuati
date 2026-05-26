# Checklist

## CSS 样式

* [x] `badge-single` / `badge-multiple` / `badge-judge` / `badge-fill` / `badge-short` 五个类已添加到 index.css
* [x] 每个 badge 类包含 `.dark` 暗色模式变体
* [x] `.question-nav` 和 `.question-nav-item` 样式可用
* [x] 高亮样式 `.question-nav-item--active` 覆盖默认态

## 表格视图移除

* [x] `QuestionTable` 导入已删除
* [x] `LayoutGrid` / `Table` 图标导入已删除
* [x] `viewMode` state 已删除
* [x] 视图切换按钮组已删除
* [x] 三元条件渲染已简化为直接卡片视图
* [x] `typeBadges` 映射已更新为新五色

## 卡片增强

* [x] 每张卡片显示大号序号（text-3xl font-bold，≥ 2rem）
* [x] 序号颜色与题型关联（indigo/emerald/amber/sky/rose）
* [x] 筛选后序号从 1 重新编号
* [x] 选项内容无截断，完整显示
* [x] 长选项文本自动换行（break-words）

## 导航栏

* [x] 桌面端显示左侧 sticky 序号列表
* [x] 序号按题型颜色着色
* [x] 当前可见题目序号高亮（IntersectionObserver）
* [x] 点击序号平滑滚动到对应卡片（scrollIntoView + smooth）
* [x] 小屏 (< lg) 变为顶部横向滚动条
* [x] IntersectionObserver 在组件卸载时正确清理（useEffect cleanup）

## 布局

* [x] 桌面端左右两栏结构（lg:flex-row）
* [x] 小屏上下结构（横条 + 列表）
* [x] 空态逻辑保留且正常显示
* [x] 无横向溢出（min-w-0）

## TypeScript

* [x] `npx tsc --noEmit` 零错误
* [x] grep 确认无 QuestionTable/Table/LayoutGrid/viewMode/.slice(0,20) 残留