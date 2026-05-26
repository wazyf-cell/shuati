# Tasks

## Phase 1: 排除已刷题目

- [x] Task 1: 添加排除已刷题目功能
  - [x] 新增 `excludePracticed` state（`useState(false)`）
  - [x] 在 handleStartPractice 开头添加过滤逻辑：读取 storage.getRecords()，收集所有 `results[qId] === true` 的题目 ID，构建 `correctIds: Set<string>`
  - [x] 单题库模式：用 correctIds 过滤 allQuestions，排除已刷题目
  - [x] 多题库模式：对每个题库用 correctIds 过滤后再抽取
  - [x] 过滤后题目数为 0 时显示 toast 提示并 return
  - [x] 在配置面板"随机抽取题目"上方添加 toggle 开关（复用现有样式模式）
  - [x] 配置面板"共 N 道题"动态计算：excludePracticed 开启时显示"可用 N 道题目（已排除已刷）"
  - [x] 验证：`npx tsc --noEmit` 零错误

## Phase 2: 允许提前交卷

- [x] Task 2: 替换提交拦截为确认弹窗
  - [x] 定位 handleSubmit 函数（原第 163-167 行）
  - [x] 删除 `questions.some(...)` 拦截 + `addToast('请先回答所有题目', 'warning')`
  - [x] 替换为：计算未答题数量 `unanswered`，若 `unanswered > 0` 则弹 `confirm("还有 N 题未作答，未答题目将计为错误。确定提交吗？")`
  - [x] confirm 取消 → return 不提交
  - [x] confirm 确认 → 继续执行原有提交流程
  - [x] 验证：`npx tsc --noEmit` 零错误，grep 确认"请先回答所有题目"已移除

# Task Dependencies
- Task 1 和 Task 2 无依赖，可并行执行（改动不同代码区域）