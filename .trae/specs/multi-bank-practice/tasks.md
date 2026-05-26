# Tasks

## Phase 1: 类型层 & 数据兼容（基础依赖，无 UI 变更）

- [x] Task 1: 更新 `PracticeRecord` 类型定义并添加运行时归一化工具
  - [x] 在 `src/types/index.ts` 中为 `PracticeRecord` 新增 `bankIds?: string[]` 字段，保留 `bankId` 向后兼容
  - [x] 在 `src/utils/recordCompat.ts` 中添加 `normalizeRecord(r)` 函数：优先取 `bankIds`，fallback 到 `[bankId]`，无则为 `[]`
  - [x] 验证：旧格式 `{bankId:'a'}` → `{bankIds:['a']}`，新格式 `{bankIds:['a','b']}` → 原样通过

- [x] Task 2: 更新 Statistics 的题库过滤逻辑
  - [x] 在 `src/components/Statistics/index.tsx` 中将 `r.bankId === selectedBankId` 改为 `normalizeRecord(r).bankIds.includes(selectedBankId)`
  - [x] 验证：创建含 `bankIds:['a','b']` 的记录，选择题库 a 过滤时该记录应可见

- [x] Task 3: 更新导入导出兼容多题库记录
  - [x] 在 `src/utils/storage.ts` 的 `exportData()` 中确保导出的 record 同时包含 `bankId` 和 `bankIds`
  - [x] 在 `importData()` 中添加数据迁移逻辑：对旧记录补充 `bankIds`，对仅有 `bankId` 的补充 `bankIds`
  - [x] 验证：导出含新记录的 JSON，重新导入后 records 正确归一化

## Phase 2: Practice 组件改造（核心刷题逻辑）

- [x] Task 4: 修改 Practice 组件 Props 和 App.tsx 调用
  - [x] 在 `src/components/Practice/index.tsx` 中将 Props 从 `{bankId: string}` 扩展为 `{bankId?: string; bankIds?: string[]}`
  - [x] 在 `src/App.tsx` 中新增 `selectedBankIds: string[]` 状态，修改渲染逻辑适配两种调用路径
  - [x] 验证：现有单题库路径（BankDetail → 刷题）功能不变，TypeScript 编译无错误

- [x] Task 5: 实现多题库抽题配置 UI 和题目合并逻辑
  - [x] 在 Practice 配置页新增多题库面板：分行展示每个题库名、题目总数、抽题数滑块
  - [x] 在 `handleStartPractice()` 中实现多题库叠加抽题逻辑：遍历 bankIds → 按每个题库的配置数取题 → 合并 → 可选整体打乱
  - [x] 处理边界：某题库题目不足时取最大可用数，toast 提示
  - [x] 保持单题库模式（仅 1 个 bankId）UI 不变
  - [x] 验证：选 N 个题库各抽 M 题，最终 questionIds 数量正确且题目分散

- [x] Task 6: 更新 Practice 提交逻辑（PracticeRecord + WrongQuestion）
  - [x] 在 `handleSubmit()` 中构建 record 时写入 `bankIds` 字段（基于传入的 bankIds 参数）
  - [x] 在 `handleSubmit()` 的 `addWrong()` 调用中，为每道错题查找其原始所属题库 ID
  - [x] 验证：多题库刷题提交后，records 含 bankIds 数组，wrong questions 含正确原始 bankId

## Phase 3: UI 入口改造

- [x] Task 7: 实现 Dashboard 多选题库弹窗
  - [x] 新建 `src/components/Dashboard/BankSelectModal.tsx` 组件：模态弹窗 + 题库列表（复选框 + 题库名 + 题目数）+ 全选/取消全选 + 确认/取消按钮
  - [x] 在 `src/components/Dashboard/index.tsx` 中集成：当 `banks.length >= 2` 时显示"多题库刷题"按钮，点击打开弹窗
  - [x] 弹窗确认后回调 `onMultiBankPractice(bankIds: string[])` → App.tsx 设置 selectedBankIds 并跳转 Practice
  - [x] 验证：选多个题库确认后正确跳转 Practice 配置页

- [x] Task 8: App.tsx 路由状态更新
  - [x] 新增 `handleMultiBankPractice(bankIds: string[])` 处理多题库跳转
  - [x] App.tsx 传递 `onMultiBankPractice` 给 Dashboard，传递 `bankIds` 给 Practice
  - [x] 验证：全流程 TypeScript 编译无错误

## Phase 4: 最终集成验证

- [x] Task 9: 全链路端到端验证
  - [x] 类型系统通过 `npx tsc --noEmit`（零错误）
  - [x] 所有组件 Props 兼容新旧调用方式
  - [x] Statistics 过滤、导入导出、PracticeRecord、WrongQuestion 均适配