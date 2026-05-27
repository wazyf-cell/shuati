# V3.0 代码审查分析报告

## Why
V3.0 全部 12 个 Phase 实现完毕，版本号升至 1.0.4。在下一步功能开发前，需要对整个项目做一次全面的代码审查，从功能完整性、用户体验、性能、安全、可扩展性等维度识别问题，为后续迭代提供优先级参考。

## What Changes
- **不新增功能**，仅识别问题和改进建议
- 覆盖全部 46 个源文件的静态分析
- 按严重程度分级：🔴严重 / 🟡中等 / 🟢轻微

## Impact
- 受影响：所有模块
- 无代码变更（仅分析报告）

---

## 🔴 严重问题（11 项）

### 1. AI API 调用无超时控制
- **文件**：[ai.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/ai.ts#L139-L236)
- **问题**：`callOpenAICompatAPI`、`callClaudeAPI`、`callGeminiAPI` 三个函数均无 `AbortController`。网络不通时 `fetch` 默认超时 90-300 秒，用户需等待极长时间才知道失败
- **影响**：可靠性
- **建议**：添加 30 秒 AbortController 超时

### 2. Tauri CSP 完全禁用
- **文件**：[tauri.conf.json](file:///f:/Code/Traecncode/Program/program6-shuati/src-tauri/tauri.conf.json#L22-L24)
- **问题**：`csp: null` 完全禁用内容安全策略，WebView 可加载任意来源脚本
- **影响**：安全性
- **建议**：设置最小 CSP：`default-src 'self'; style-src 'self' 'unsafe-inline'

### 3. 双轨 Excel/TXT 解析器
- **文件**：[excel.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/excel.ts) / [txt.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/txt.ts)
- **问题**：旧版 `excel.ts` 的 `parseExcel` 和 `txt.ts` 的 `parseTxt` 已无人引用但仍存在。新版 [excelParser.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/excelParser.ts) 和 [txtParser.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/txtParser.ts) 承担解析，但导出函数（`exportQuestionsToExcel`/`exportQuestionsToTxt`）仍在旧文件中
- **影响**：维护性、代码质量
- **建议**：迁移导出函数到新文件，删除旧文件

### 4. 大文件导入主线程阻塞
- **文件**：[excelParser.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/excelParser.ts) / [txtParser.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/txtParser.ts)
- **问题**：Excel/TXT 导入全部在主线程同步执行。>5000 条题目时 UI 冻结数秒
- **影响**：用户体验
- **建议**：迁移到 Web Worker 或 requestIdleCallback 分片

### 5. Rust 阻塞 HTTP 调用
- **文件**：[lib.rs](file:///f:/Code/Traecncode/Program/program6-shuati/src-tauri/src/lib.rs#L70-L107)
- **问题**：所有 Rust 命令用 `reqwest::blocking`，阻塞 Tauri 线程池
- **影响**：性能
- **建议**：改为 async fn + reqwest async

### 6. QuestionForm AI 解析自动持久化
- **文件**：[QuestionForm.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Bank/QuestionForm.tsx#L188-L203)
- **问题**：`handleAIAnalyze` 调用 `updateQuestion` 立即持久化 AI 解析内容。用户之后点"取消"关闭弹窗，解析已被写入 store
- **影响**：数据一致性
- **建议**：AI 生成后只更新本地 state，等用户点击"保存"再统一持久化

### 7. AIConfigModal 死代码
- **文件**：[AIConfigModal.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/AI/AIConfigModal.tsx)
- **问题**：完全未被引用（功能被 [AIConfigPage.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/AI/AIConfigPage.tsx) 替代）
- **影响**：bundle 体积、维护成本
- **建议**：删除

### 8. clearAll 不清理 AI 存储
- **文件**：[storage.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/storage.ts)
- **问题**：`clearAll()` 不清理 `ai_config` 和 `ai_explanations`
- **影响**：功能完整性
- **建议**：统一清理所有 localStorage key

### 9. Tauri open_url 跨平台不兼容
- **文件**：[lib.rs](file:///f:/Code/Traecncode/Program/program6-shuati/src-tauri/src/lib.rs#L61-L67)
- **问题**：使用 `cmd /c start` 仅 Windows 可用，且不对 URL 做白名单校验
- **影响**：跨平台、安全性
- **建议**：改用 `tauri::api::shell` 或 `open` 库，加 URL 白名单

### 10. Gemini API Key 在 URL 中传输
- **文件**：[ai.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/ai.ts#L207)
- **问题**：`?key=${config.apiKey}` 拼在 URL query string 中，暴露在浏览器历史、代理日志、referrer header
- **影响**：安全性
- **建议**：改用 header 传输或至少文档警告

### 11. Config 阶段 JSX 中 inline 读 localStorage
- **文件**：[Practice/index.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Practice/index.tsx)
- **问题**：Config 渲染时在 JSX 中直接调用 `storage.getRecords()` 计算已刷题目数，每次渲染都读 localStorage
- **影响**：性能
- **建议**：移到 useMemo

---

## 🟡 中等问题（17 项）

### 12. Toast 颜色语义混淆
- **文件**：[ToastContainer.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Toast/ToastContainer.tsx)
- **描述**：success 和 error 共用紫色系，info 和 warning 共用灰色系
- **建议**：success→绿、error→红、warning→橙、info→蓝

### 13. Header 缺少收藏导航入口
- **文件**：[Header.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Layout/Header.tsx)
- **描述**：`'favorite'` 路由在 App.tsx 中存在，`FavoriteBank` 组件完整，但 Header 无对应按钮

### 14. Settings 缺少数据导出/导入功能
- **文件**：[Settings/index.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Settings/index.tsx)
- **描述**：更新日志提到"新增导入/导出数据"但未实现

### 15. 版本号未引入 dataVersion 机制
- **文件**：[storage.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/storage.ts)
- **描述**：无数据格式版本号，未来结构变更只能靠 try-catch + 默认值兜底
- **建议**：引入 `quiz_data_version` key 实现渐进式迁移

### 16. bankId→bankIds 归一化逻辑 3 处重复
- **文件**：recordCompat.ts / storage.ts / Statistics
- **建议**：提取到 `recordCompat.ts` 并在 `getRecords()` 中自动调用

### 17. typeLabels/typeBadges 4 处重复定义
- **文件**：BankDetail / QuestionForm / ImportModal / FavoriteBank
- **建议**：提取到 `utils/constants.ts`

### 18. CSS color-scheme 硬编码 light
- **文件**：[index.css](file:///f:/Code/Traecncode/Program/program6-shuati/src/index.css#L40)
- **问题**：`color-scheme: only light` 导致暗色模式下原生表单控件仍是白色
- **建议**：改为 `color-scheme: light dark`

### 19. AI 缓存无量上限
- **文件**：[ai.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/ai.ts#L77)
- **建议**：加条目数上限（如 500 条），超出时淘汰最旧条目

### 20. BankDetail 标题颜色错误
- **文件**：[BankDetail.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Bank/BankDetail.tsx#L118)
- **问题**：`text-surface-500` 在浅色主题下几乎不可见
- **建议**：改为 `text-surface-900`

### 21. Practice 组件过大（~1100 行）
- **文件**：[Practice/index.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Practice/index.tsx)
- **建议**：拆分 Review 阶段为独立组件 `ReviewPanel`

### 22. localStorage 写入无 try-catch
- **文件**：[storage.ts](file:///f:/Code/Traecncode/Program/program6-shuati/src/utils/storage.ts)
- **建议**：`setBanks`/`setWrong`/`setRecords` 加 try-catch + Toast

### 23. Rust open_url 跨平台问题
- 见🔴#9 的跨平台说明

### 24. Tauri Cargo.toml 版本不同步
- **文件**：[Cargo.toml](file:///f:/Code/Traecncode/Program/program6-shuati/src-tauri/Cargo.toml)
- **问题**：版本 `0.1.0`，package.json 是 `1.0.4`

### 25. Capacitor 配置精简
- **文件**：capacitor.config.ts
- **建议**：添加 `server.androidScheme`、`android.minWebViewVersion`

### 26. FavoriteBank 取消收藏无二次确认
- **文件**：[FavoriteBank/index.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/FavoriteBank/index.tsx)

### 27. Dashboard 删除题库用原生 confirm
- **文件**：[Dashboard/index.tsx](file:///f:/Code/Traecncode/Program/program6-shuati/src/components/Dashboard/index.tsx)
- **建议**：统一用 ConfirmDialog

### 28. WrongBook 空状态 Toast 缺失
- 错题重刷全部答对后回到空状态，无反馈提示

---

## 🟢 轻微问题（13 项）

29. BankCard gradientMap[3] 和 [4] 同色值
30. AI 解析按钮 emoji vs 文字风格混用
31. forced-color-adjust: none 影响可访问性
32. CSS shadow token 收益有限
33. crypto.randomUUID 非 HTTPS 不可用
34. txtParser parseTxt 大文件字符串数组内存浪费
35. 旧版 excel.ts convertToQuestion 数字类型与新 parser 不兼容
36. Tauri 窗口无最小尺寸约束 (1100×750)
37. 导入/导出按钮图标语义相反
38. recordCompat 与 storage 归一化逻辑 3 处重复
39. getTxtTemplate 模板与旧 parseTxt 格式不兼容
40. @theme shadow-* 覆盖 Tailwind 内置阴影
41. AIExplanationCard 每次渲染重复调用 getCachedExplanation

---

## 优先级建议

| 优先级 | 条目 | 严重度 | 类别 |
|--------|------|--------|------|
| P0 🔴 | #1 AI API 超时 | 严重 | 可靠性 |
| P0 🔴 | #4 大文件导入阻塞 | 严重 | UX |
| P0 🔴 | #6 AI 解析自动持久化 | 严重 | 数据一致性 |
| P1 🔴 | #2 Tauri CSP 禁用 | 严重 | 安全 |
| P1 🔴 | #10 Gemini Key URL 暴露 | 严重 | 安全 |
| P1 🟡 | #21 Practice 过大需拆分 | 中等 | 可维护性 |
| P1 🟡 | #22 localStorage 写入无保护 | 中等 | 可靠性 |
| P2 🔴 | #3 双轨解析器 | 严重 | 代码质量 |
| P2 🔴 | #7 AIConfigModal 死代码 | 严重 | 代码质量 |
| P2 🔴 | #8 clearAll 不完整 | 严重 | 功能完整性 |
| P2 🟡 | #12-28 其他中等问题 | 中等 | 多项 |
| P3 🟢 | #29-41 轻微问题 | 轻微 | 多项 |