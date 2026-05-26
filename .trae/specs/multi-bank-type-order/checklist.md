# Checklist

## configStore

* [x] `multiBankTypeOrder: QuestionType[]` 字段已添加到 State 接口
* [x] 默认值为 `['judge', 'single', 'multiple', 'fill', 'short']`
* [x] persist 中间件正确持久化到 localStorage
* [x] 刷新页面后顺序保持不变

## 排序逻辑

* [x] 多题库模式下题目按 multiBankTypeOrder 分组排序
* [x] 同题型组内题目随机打乱（随机抽取开启时）
* [x] 随机抽取关闭时同题型组内保持原始顺序
* [x] 某题型无题目时跳过不报错
* [x] 单题库模式不受影响

## UI

* [x] 多题库配置面板底部显示"题型出现顺序"区域
* [x] 每个题型的 ↑↓ 按钮可正常移动
* [x] UI 样式与单题库题型排序一致
* [x] 仅在 bankIds.length >= 2 时显示
* [x] 按钮触摸目标 ≥ 44px

## TypeScript

* [x] `npx tsc --noEmit` 零错误