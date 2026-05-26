# Tasks

- [x] **Task 1**: 安装依赖库 — xlsx (excel解析) 添加到 package.json
  - 验证：`npm ls xlsx` 确认安装成功

- [x] **Task 2**: 创建 Excel 解析工具 `src/utils/excelParser.ts`
  - 实现 `parseExcel(file: File): Promise<ParsedQuestion[]>` 函数
  - 支持 .xlsx/.xls 格式
  - 自动识别列：题型、题干、选项A-B-C-D、正确答案、解析
  - 返回解析结果和错误信息
  - 验证：TypeScript 编译通过

- [x] **Task 3**: 创建 TXT 解析工具 `src/utils/txtParser.ts`
  - 定义 TXT 格式模板（题型标记 [单选]/[多选]/[判断]，题干行，选项行 A. xxx，答案行 答案：A，解析行 解析：xxx）
  - 实现 `parseTxt(text: string): ParsedQuestion[]` 函数
  - 返回解析结果和错误信息
  - 验证：TypeScript 编译通过

- [x] **Task 4**: 创建导入预览弹窗组件 `src/components/Bank/ImportModal.tsx`
  - Props: `bankId, onClose, onImported`
  - 支持选择 Excel 或 TXT 文件
  - 解析后展示题目预览列表（显示题型、题干截断、状态标记有效/无效）
  - 显示"查看 TXT 格式模板"链接
  - 确认后批量调用 `addQuestion` 添加到当前题库
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 5**: 题库详情页添加"导入题目"按钮
  - 在 `BankDetail.tsx` 的"添加题目"按钮旁添加"导入题目"按钮
  - 使用 `Upload` 图标，保持视觉一致
  - 点击打开 ImportModal
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 6**: Header 添加 JSON 导出/导入功能
  - 在 Header 中添加"导出数据"按钮（触发 `storage.exportData()` 下载 JSON）
  - 添加"导入数据"按钮（选择 JSON 文件，展示预览确认弹窗后导入）
  - 导入前展示预览确认弹窗（题库数、题目数、错题数）
  - 导入校验失败时显示具体错误原因
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 7**: 刷题配置增强 — 按题型设题数
  - 在 `Practice/index.tsx` 的 `showConfig` 区域添加"按题型设置"开关
  - 开启后显示三个 slider：单选题数、多选题数、判断题数
  - 每个 slider 旁显示当前题库中该题型可用数量
  - 修改 `handleStartPractice` 按题型数量分别抽取
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 8**: 刷题配置增强 — 题型顺序控制
  - 在练习设置中添加题型顺序拖拽或选择器
  - 允许用户排列 single/multiple/judge 的顺序
  - 抽取题目后按此顺序排列
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 9**: 题目表格视图组件 `src/components/shared/QuestionTable.tsx`
  - Props: `questions: Question[], banks?: QuestionBank[], showBankColumn?: boolean, showWrongCount?: boolean, renderActions?: (q: Question) => ReactNode`
  - 表格列：序号、题型(badge)、题干(截断)、选项数、操作按钮、可选的题库名/错误次数
  - 支持点击列头排序（按题型、题干字母）
  - 响应式设计：移动端可横向滚动
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 10**: BankDetail 集成表格视图
  - 添加卡片/表格视图切换按钮
  - 表格模式下使用 QuestionTable 组件
  - 保留搜索和类型筛选
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 11**: 错题本增强 — 按题库分组 + 表格视图
  - 添加分组/平铺视图切换
  - 分组模式下按 bankId 分组展示错题
  - 表格模式下使用 QuestionTable（含题库名列和错误次数列）
  - 添加"刷错题"自定义题目数量设置
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 12**: 首页统计面板集成
  - 将 Statistics 页面的统计功能移到 Dashboard 页面底部
  - 显示题库列表标签页，默认选中"全部题库"显示汇总统计
  - 点击各题库标签切换为该题库的统计数据
  - 过滤 records 按 bankId 匹配
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 13**: 题目导航方块尺寸自适应
  - 修改 `QuestionNav.tsx` 中导航方块的尺寸逻辑
  - 当题目数 ≤ 10 时使用 `w-9 h-9` 方块
  - 当题目数 > 50 时使用 `w-7 h-7` 方块
  - 中间数量线性过渡
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 14**: 修复 JSON 导入预览功能（checklist #12）
  - Header 导入 JSON 前展示预览确认弹窗
  - 显示题库数、题目总数、错题数、练习记录数
  - 用户确认后执行导入，取消则关闭弹窗
  - 验证：TypeScript 编译 + 构建通过

- [x] **Task 15**: 修复 JSON 导入错误提示（checklist #13）
  - storage.importData 返回 { success, error?, preview? }
  - 校验失败时返回具体错误原因
  - Header 中显示具体错误信息
  - 验证：TypeScript 编译 + 构建通过

# Task Dependencies
- Task 4 依赖 Task 2, Task 3（需要 parser）
- Task 5 依赖 Task 4（需要 ImportModal）
- Task 7 依赖 Task 8（建议一起实现，共用状态）
- Task 10 依赖 Task 9（需要 QuestionTable）
- Task 11 依赖 Task 9（需要 QuestionTable）
- Task 12 可独立实现
- Task 13 可独立实现
- Task 6 可独立实现
- Task 1 必须先完成
- Task 14, Task 15 依赖 Task 6（修复已有功能）