# Tasks

## Phase 1: 类型扩展 + 数据迁移

- [x] Task 1: 扩展类型定义
  - [x] `types/index.ts`：新增 `AIConfig`、`AIPlatformDef` 接口
  - [x] `WrongQuestion` 接口新增 `correctAnswer: string[]`、`firstWrongAt: number` 字段
  - [x] `PracticeRecord` 接口新增 `source?: 'bank' | 'wrong-review'` 字段
  - [x] `UserConfig` 接口新增 `showAnswerSwitch: boolean`、`enableAIInPractice: boolean` 字段
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 2: 数据迁移 + 存储兼容
  - [x] `storage.ts`：`getWrong()` 读取时自动补全旧数据缺失字段（correctAnswer: [], firstWrongAt: lastWrongAt || Date.now()）
  - [x] `storage.ts`：`defaultConfig` 增加 `showAnswerSwitch: false`、`enableAIInPractice: false`
  - [x] `storage.ts`：`getConfig()` 用 `Object.assign({...defaultConfig}, stored)` 补全缺失字段
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 3: addWrong 签名扩展
  - [x] `store/wrong.ts`：`addWrong` 签名改为 `(questionId, bankId, userAnswer, correctAnswer)`
  - [x] 新增错题时存储 `correctAnswer` 和 `firstWrongAt: Date.now()`
  - [x] 重复错题时更新 `lastWrongAt` 但不覆盖 `correctAnswer` 和 `firstWrongAt`
  - [x] `store/config.ts`：`UserConfig` 默认值增加新字段 + setters
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 2: 错题本改造

- [x] Task 4+5+6: 错题本全面改造
  - [x] 双视图切换 `viewMode: 'time' | 'bank'`（替换旧的 group/flat/table）
  - [x] 按时间分组：`lastWrongAt` 向下取整到分钟，同分钟归一组，时间组倒序，组内按题库二级分组
  - [x] 按题库分组：按 bankId 分组，组内按 lastWrongAt 倒序
  - [x] 折叠状态管理：`useState<Set<string>>`
  - [x] 错题卡片：完整题目 + 选项（❌错/✅对）+ 错误次数 + 时间 + 解析
  - [x] 卡片底部：`[🔁 重刷此题]` + `[🗑 移除]`
  - [x] 勾选多题 + `[重刷选中]` `[重刷全部]` `[清空全部]`
  - [x] 空状态："暂无错题，继续保持！"
  - [x] 搜索/类型筛选在分组前过滤
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 3: 错题重刷闭环

- [x] Task 7: App.tsx 导航扩展
  - [x] 新增 `presetQuestionIds: string[] | null` state
  - [x] 新增 `practiceMode: 'normal' | 'wrong-review'` state
  - [x] 新增 `handleWrongReview` 处理函数
  - [x] WrongBook 传入 `onWrongReview` prop
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 8: Practice 错题重刷模式
  - [x] 新增 `presetQuestionIds?: string[]` prop
  - [x] 新增 `mode?: 'normal' | 'wrong-review'` prop
  - [x] presetQuestionIds 有值时：跳过抽题直接加载
  - [x] 隐藏"排除已刷题目"开关
  - [x] 配置页显示"错题重刷"+"已锁定 N 道错题"
  - [x] 验证：`npx tsc --noEmit` 零错误

- [x] Task 9: 提交时答对自动移除 + 记录来源
  - [x] `doSubmit` 中：mode='wrong-review' 且 correct → `removeWrong(qId)`
  - [x] PracticeRecord 设置 `source: mode === 'wrong-review' ? 'wrong-review' : 'bank'`
  - [x] 验证：`npx tsc --noEmit` 零错误

# Task Dependencies
- Task 2 依赖 Task 1 ✓
- Task 3 依赖 Task 1、Task 2 ✓
- Task 4+5+6 依赖 Task 1、2、3 ✓
- Task 7 无硬依赖 ✓
- Task 8 依赖 Task 7 ✓
- Task 9 依赖 Task 3、Task 8 ✓