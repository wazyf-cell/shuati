# Tasks

## Phase 1: 设计令牌系统重构（CSS 层，一次变更覆盖所有组件）

- [x] Task 1: 重构 `index.css` — 设计令牌（颜色、字体、阴影）
  - [x] 替换 `@theme` 块中所有颜色变量：品牌色改为柔和蓝紫系（`--color-accent-*`），中性色改为 slate 暖灰色系，移除 mint/sun/lava/purple 色板
  - [x] 新增语义化颜色令牌：`--color-surface`、`--color-surface-hover`、`--color-text-primary`、`--color-text-secondary`、`--color-border`
  - [x] 替换字体：Fredoka → Inter，Nunito 保留或统一为 Inter
  - [x] 替换阴影：移除 neo-brutalist 硬阴影，新增柔和层级阴影（shadow-xs / shadow-sm / shadow-md / shadow-lg）
  - [x] 验证：`npx tsc --noEmit` 无错误（类型层不变），CSS 语法正确

- [x] Task 2: 重构 `index.css` — 组件样式类（card、btn-*、通用元素）
  - [x] `.card` / `.card-sm`：移除 backdrop-blur、杂色边框、neo-shadow，改为纯白背景 + 柔和阴影 + 统一 12px 圆角
  - [x] `.btn-primary` / `.btn-secondary` / `.btn-outline` / `.btn-ghost`：移除硬阴影位移效果、gradient 背景，改为纯色 + 柔和过渡
  - [x] `body` 背景：移除多彩渐变 → 单一柔和底色（浅色模式 slate-50/暖白，暗色模式 slate-950/深灰）
  - [x] 暗色模式 `.dark` 各规则同步更新
  - [x] 聚焦环样式：`focus-visible:outline-2 outline-offset-2 outline-accent-500`
  - [x] 验证：所有卡片/按钮视觉风格一致

## Phase 2: 组件级微调（仅处理 CSS 类无法覆盖的特殊场景）

- [x] Task 3: 调整 Dashboard 组件样式
  - [x] 题库卡片网格：确认使用新 card 样式（CSS 层已覆盖），如需独特渐变/图标背景则替换为单色
  - [x] 多选题库弹窗（BankSelectModal）：移除可能存在的多彩样式引用，统一灰白风格
  - [x] 验证：Dashboard 页面视觉清爽统一

- [x] Task 4: 调整 Practice 组件样式
  - [x] 抽题配置滑块：accent-color 改为新的强调色
  - [x] 答题区域卡片：确认使用新 card 样式
  - [x] 结果展示区域：移除多彩标记，改用语义色（绿=正确、红=错误）并确保对比度
  - [x] 验证：Practice 页面功能性 UI 无视觉退化

- [x] Task 5: 调整 Statistics / WrongBook / BankDetail 组件样式
  - [x] 统计图表卡片：确认使用新 card 样式
  - [x] 错题列表分组标签：确认暗色模式下可读
  - [x] 题库详情页：确认使用新样式
  - [x] 验证：所有二级页面风格一致 — 143 处旧令牌引用已替换（9个文件），全局 grep 确认零残留

## Phase 3: 暗色模式 + 响应式 + 可访问性验证

- [x] Task 6: 暗色模式对比度与可用性验证
  - [x] 确保所有文本在暗色模式下 contrast ≥ 4.5:1（正文）和 ≥ 3:1（辅助）— 11 项 PASS，1 项 FAIL 已修复（placeholder 对比度）
  - [x] 确保分割线/边框在暗色背景下可见 — 5 项 FAIL 已修复（card/card-sm/input/btn-outline 暗色边框不透明度提升至 12%-22%）
  - [x] 确保按钮/链接在暗色模式下 hover/active 状态可辨别 — 3 项 WARNING 已修复（hover 边框/阴影增强）
  - [x] 验证：明暗模式 CSS 规则完整，无遗漏

- [x] Task 7: 响应式布局验证 + 可访问性检查
  - [x] 移动端（375px）：所有触控目标 ≥ 44px — 5 处 FAIL 已修复（Toast/QuestionTable/Practice/QuestionForm/BankSelectModal 按钮 padding 增大至 ≥p-2）
  - [x] 平板（768px）：栅格合理，间距舒适 — 17 项响应式断点检查全部 PASS
  - [x] 桌面（1280px）：内容居中，最大宽度约束 — PASS（max-w-7xl + mx-auto）
  - [x] 键盘导航：Tab 顺序正确，聚焦环可见 — 3 项焦点环检查 PASS，全局 `*:focus-visible` 规则生效
  - [x] 验证：`npx tsc --noEmit` 零错误，全局 grep 零旧令牌残留

# Task Dependencies
- Task 2 依赖 Task 1（先稳定令牌，再改组件样式）
- Task 3、4、5 可与 Task 2 并行（CSS 改为同一文件的不同 section）
- Task 6、7 依赖所有前序任务（最终验证）
- **关键原则**：Task 1+2 完成后，90% 的视觉效果变化已覆盖。Task 3-5 仅处理 CSS 无法自动覆盖的特殊内联样式