# Tasks

## Phase 1: 存储层

- [x] Task 1: configStore 新增 multiBankTypeOrder 字段 + 持久化
  - [x] 在 `src/store/config.ts` 的 State 接口中新增 `multiBankTypeOrder: QuestionType[]`
  - [x] 默认值设为 `['judge', 'single', 'multiple', 'fill', 'short']`
  - [x] 确保 `storage.setConfig/getConfig` 自动写入/读取 localStorage
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 2: 排序逻辑

- [x] Task 2: Practice 组件多题库题目按题型分组排序
  - [x] 在 `handleStartPractice` 中，多题库合并题目后新增 `multiBankTypeOrder` 排序步骤
  - [x] 按 `multiBankTypeOrder` 的索引值升序排列题目
  - [x] 随机抽取开启时：同题型组内随机打乱（`groups[type].sort(() => Math.random() - 0.5)`）
  - [x] 随机抽取关闭时：同题型组内保持原始题库顺序
  - [x] 某题型无题目时自动跳过
  - [x] 单题库模式不受影响（进入现有分支）
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 3: UI

- [x] Task 3: 多题库配置面板新增题型排序 UI
  - [x] 在 Practice 组件多题库配置区域底部新增"题型出现顺序" section
  - [x] 复用单题库题型排序的同款 UI 结构（题型标签 + ↑↓ 按钮）
  - [x] 点击 ↑↓ 按钮调用 `setMultiBankTypeOrder` 更新 store
  - [x] 仅在 `isMultiBank`（`bankIds.length >= 2`）时渲染
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 4: 验证

- [x] Task 4: 端到端功能验证
  - [x] 单题库模式题型顺序不受影响（代码路径不变）
  - [x] 多题库模式题型顺序生效（按 multiBankTypeOrder 分组排序）
  - [x] 同题型题目内部随机排列（isRandom 开启时组内随机）
  - [x] 刷新页面后顺序保持（storage.setConfig 持久化）
  - [x] 验证：`npx tsc --noEmit` 零错误

# Task Dependencies
- Task 2 依赖 Task 1（先有字段才能排序）
- Task 3 依赖 Task 1（先有字段才有 UI 交互）
- Task 4 依赖 Task 2、3（全部实现后验证）