# Checklist

## 设计令牌系统

* [x] `@theme` 块颜色令牌替换为新色系（accent + neutral/slate），移除旧 brand/mint/sun/lava/purple/warm/navy

* [x] 新增语义化令牌：`--color-surface`、`--color-surface-hover`、`--color-text-primary`、`--color-text-secondary`、`--color-border`

* [x] `--font-display` 替换为 Inter（或与 body 统一）

* [x] 阴影令牌替换为柔和层级系统（xs/sm/md/lg），移除所有 neo/glow 阴影

## 全局样式

* [x] `body` 背景改为单一纯色（明亮模式）和单一深色（暗色模式），移除四色渐变

* [x] `::selection` 颜色与新强调色匹配

* [x] 暗色模式 `.dark body` 背景正确

## 组件类样式

* [x] `.card` — 纯白/半透明深色背景，无 backdrop-blur，柔和阴影，12px 圆角

* [x] `.card:hover` — 阴影微加深，无不自然位移

* [x] `.card-sm` — 同理，14px → 12px 圆角

* [x] `.btn-primary` — 纯色背景（新强调色），无 gradient，无硬位移 hover 效果

* [x] `.btn-secondary` — 同理

* [x] `.btn-outline` — 简化边框，hover 用强调色

* [x] `.btn-ghost` — 保持轻量风格

* [x] 暗色模式所有 `.dark` 变体同步更新

## Dashboard

* [x] 题库卡片无旧色系引用

* [x] BankSelectModal 无多彩样式

* [x] "多题库刷题"按钮显示条件正确（banks.length >= 2）

## Practice

* [x] 滑块 accent-color 使用新强调色

* [x] 正确/错误/未答标记色语义准确且对比度合规

* [x] 配置面板（单题库 + 多题库）样式一致

## Statistics / WrongBook / BankDetail

* [x] Statistics 卡片无旧色系引用

* [x] WrongBook 分组/标签暗色模式可读

* [x] BankDetail 列表项样式一致

## 暗色模式

* [x] 正文对比度 ≥ 4.5:1

* [x] 辅助文字对比度 ≥ 3:1

* [x] 分割线/边框可见

* [x] hover/active/disabled 状态可辨别

## 响应式

* [x] 375px 移动端无横向滚动

* [x] 768px 平板栅格合理

* [x] 1280px 桌面最大宽度约束

## 可访问性

* [x] 触控目标 ≥ 44px

* [x] 聚焦环可见（2px 强调色）

* [x] Tab 顺序正确

## TypeScript

* [x] `npx tsc --noEmit` 零错误

