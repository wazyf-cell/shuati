# Tasks

- [x] **Task 1**: 修改数据模型 `src/types/index.ts`
  - QuestionType 扩为 `'single' | 'multiple' | 'judge' | 'fill' | 'short'`
  - 新增可选字段 `subType?: 'single' | 'group'`
  - 新增可选字段 `subQuestions?: { id: string; label: string; answer: string }[]`
  - 编译验证：所有 Record<QuestionType, ...> 无 TS 报错

- [x] **Task 2**: 改造添加/编辑题目表单 `src/components/Bank/QuestionForm.tsx`
  - 题型按钮行加"填空题"和"简答题"两个按钮
  - 填空题：隐藏选项区，显示 content + 答案(逗号分隔提示) + 解析
  - 简答题：子类型切换(单题单答/大题多小题)，分别表单
  - 简答题大题模式：动态添加/删除小题，最少 1 个
  - 提交校验：fill 跳过 options 校验；short 按子类型校验
  - 编辑模式回填：fill/short 数据正确还原
  - 编译验证

- [x] **Task 3**: 改造答题区 `src/components/Practice/OptionPanel.tsx`
  - fill 类型：渲染 N 个 input（N=correctAnswer.length），不显示选项
  - short-single 类型：渲染 textarea
  - short-group 类型：渲染 subQuestions 列表（label + input）
  - 已提交模式：fill 逐空比对接绿/红框；short-single 模糊匹配；short-group 逐小题判分
  - 提示文字按题型变化
  - 编译验证

- [x] **Task 4**: 改造判分逻辑 `src/store/practice.ts`
  - fill：逐元素 trim() 比对，全对算对
  - short-single：去空格标点忽略大小写模糊匹配
  - short-group：遍历 subQuestions 逐小题匹配，全对算对
  - single/multiple/judge 逻辑不变
  - 编译验证

- [x] **Task 5**: 全局 typeLabels/typeBadges/typeColors 补齐（4个文件）
  - `src/components/Practice/QuestionView.tsx`：fill/short 类型标签、颜色、badge
  - `src/components/Practice/index.tsx`：typeLabels+badges，typeOrder+typeCounts
  - `src/components/Bank/ImportModal.tsx`：typeLabels+badges
  - `src/components/shared/QuestionTable.tsx`：typeLabels+badges+typeSortOrder(fill=3,short=4)
  - 编译验证

- [x] **Task 6**: TXT 解析器新增题型格式 `src/utils/txtParser.ts`
  - [填空] 标签：填空题解析，无答案行报错
  - [简答] 标签：简答题单题单答解析
  - [简答-大题] 标签：大题多小题解析（小题/答案行匹配）
  - 无小题报错
  - 更新 getTxtTemplate() 加示例
  - 编译验证

- [x] **Task 7**: Excel 解析器扩容 `src/utils/excelParser.ts`
  - TYPE_MAP 加填空/简答键值
  - fill/short 类型跳过 options 校验
  - short 校验 correctAnswer 非空
  - fill 答案按逗号/顿号拆分，不做字母校验
  - short 答案直接 trim() 入数组
  - Excel 大题多小题简化方案（仅单行导入）
  - 编译验证

- [x] **Task 8**: 导出功能适配（Excel导出 + 导出组件）
  - 填空题题型列写"填空"，答案逗号拼接
  - 简答题题型列写"简答"，答案填 correctAnswer[0]
  - 简答题大题写"简答-大题"，答案填"见小题"
  - TXT 导出按格式反向输出 [填空]/[简答]/[简答-大题]
  - 编译验证

- [x] **Task 9**: 错题本新题型适配 `src/components/WrongBook/index.tsx`
  - 题型标签显示"填空"/"简答"
  - fill 用户答案：逗号拼接 + 正确答案对比
  - short 用户答案：显示前 30 字
  - 编译验证

- [x] **Task 10**: tsc + vite build 全面验证
  - `npx tsc --noEmit` 通过（零错误）
  - `npx vite build` 通过

# Task Dependencies
- Task 2 依赖 Task 1（需要新 types）
- Task 3 依赖 Task 1（需要新 types）
- Task 4 依赖 Task 1（需要新 types）
- Task 5 依赖 Task 1（需要新 types）
- Task 6 依赖 Task 1（需要新 types）
- Task 7 依赖 Task 1（需要新 types）
- Task 3、4 可并行实施
- Task 5、6、7 可与 Task 2、3、4 并行
- Task 8 可独立实施
- Task 9 依赖 Task 1（需要 types）
- Task 10 依赖所有 Task 完成