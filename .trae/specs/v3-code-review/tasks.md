# V3.0 代码审查 — 修复任务清单

## P0 — 立即修复（可靠性 + 数据一致性 + UX 阻塞）

- [ ] **Task 1**: AI API 调用添加超时控制（#1 🔴）
  - 在 `callOpenAICompatAPI`、`callClaudeAPI`、`callGeminiAPI` 三个函数中添加 `AbortController`，设置 30 秒超时
  - 超时后 reject 并显示 Toast 提示用户
  - 涉及文件：`src/utils/ai.ts`

- [ ] **Task 2**: 大文件导入防阻塞（#4 🔴）
  - TXT/Excel 导入迁移到 Web Worker 或使用 `requestIdleCallback` 分片处理
  - 添加进度指示（当前仅有 loading 状态，无进度百分比）
  - 涉及文件：`src/utils/excelParser.ts`、`src/utils/txtParser.ts`

- [ ] **Task 3**: AI 解析自动持久化修复（#6 🔴）
  - `QuestionForm` 的 `handleAIAnalyze` 改为只更新本地 state，不调用 `updateQuestion`
  - 用户点击"保存"时才统一持久化所有修改（含 AI 解析）
  - 涉及文件：`src/components/Bank/QuestionForm.tsx`

## P1 — 高优先级（安全 + 可维护性 + 可靠性）

- [ ] **Task 4**: Tauri CSP 配置（#2 🔴）
  - `tauri.conf.json` 的 `csp` 从 `null` 改为 `default-src 'self'; style-src 'self' 'unsafe-inline'`
  - 涉及文件：`src-tauri/tauri.conf.json`

- [ ] **Task 5**: Gemini API Key 安全传输（#10 🔴）
  - Gemini API Key 从 URL query string 改为 HTTP header 传输
  - 如 Gemini API 不支持 header 方式，至少添加文档警告注释
  - 涉及文件：`src/utils/ai.ts`

- [ ] **Task 6**: Practice 组件拆分（#21 🟡）
  - 从 `Practice/index.tsx`（~1100 行）中拆分 `ReviewPanel` 为独立组件
  - 拆分后 Practice 主组件控制在 500 行以内
  - 涉及文件：`src/components/Practice/index.tsx`、新建 `src/components/Practice/ReviewPanel.tsx`

- [ ] **Task 7**: localStorage 写入添加错误保护（#22 🟡）
  - `setBanks`、`setWrong`、`setRecords` 函数加 try-catch
  - 写入失败时 Toast 提示用户（配额超限等情况）
  - 涉及文件：`src/utils/storage.ts`

## P2 — 中优先级（代码质量 + 功能完整性）

- [ ] **Task 8**: 双轨解析器合并（#3 🔴）
  - 将旧版 `excel.ts` 和 `txt.ts` 中的导出函数迁移到 `excelParser.ts` 和 `txtParser.ts`
  - 删除旧文件 `src/utils/excel.ts` 和 `src/utils/txt.ts`
  - 更新所有 import 引用
  - 涉及文件：`src/utils/excel.ts`（删）、`src/utils/txt.ts`（删）、`src/utils/excelParser.ts`、`src/utils/txtParser.ts`、`src/components/Bank/*.tsx`

- [ ] **Task 9**: 删除 AIConfigModal 死代码（#7 🔴）
  - 删除 `src/components/AI/AIConfigModal.tsx`
  - 确认无任何引用后删除
  - 涉及文件：`src/components/AI/AIConfigModal.tsx`（删）

- [ ] **Task 10**: clearAll 清理所有 localStorage（#8 🔴）
  - 扩展 `clearAll()` 函数，同时清理 `ai_config` 和 `ai_explanations`
  - 涉及文件：`src/utils/storage.ts`

- [ ] **Task 11**: Tauri open_url 跨平台修复（#9 🔴）
  - `cmd /c start` 改为 `tauri::api::shell` 或 `open` 库
  - 添加 URL 白名单校验，仅允许已知域名
  - 涉及文件：`src-tauri/src/lib.rs`

- [ ] **Task 12**: Rust 阻塞 HTTP 改为异步（#5 🔴）
  - `reqwest::blocking` 改为 `reqwest` async
  - 所有命令改为 `async fn`
  - 涉及文件：`src-tauri/src/lib.rs`

- [ ] **Task 13**: Config 阶段 localStorage 读取优化（#11 🔴）
  - `getRecords()` 调用从 JSX inline 移到 useMemo
  - 涉及文件：`src/components/Practice/index.tsx`

- [ ] **Task 14**: Toast 颜色语义修正（#12 🟡）
  - success → 绿色、error → 红色、warning → 橙色、info → 蓝色
  - 涉及文件：`src/components/Toast/ToastContainer.tsx`

- [ ] **Task 15**: Header 添加收藏导航入口（#13 🟡）
  - 添加"收藏"按钮，跳转 `/favorite` 路由
  - 涉及文件：`src/components/Layout/Header.tsx`

- [ ] **Task 16**: Settings 添加数据导出/导入功能（#14 🟡）
  - 实现完整的题库/错题/配置导出为 JSON 文件
  - 实现 JSON 文件导入恢复数据
  - 涉及文件：`src/components/Settings/index.tsx`、新建 `src/utils/backupRestore.ts`

- [ ] **Task 17**: 引入 dataVersion 数据迁移机制（#15 🟡）
  - 新建 `quiz_data_version` localStorage key
  - 在 `getBanks`/`loadConfig` 中检测版本号，执行渐进式迁移
  - 涉及文件：`src/utils/storage.ts`

- [ ] **Task 18**: bankId→bankIds 归一化逻辑统一（#16 🟡）
  - 所有归一化逻辑收敛到 `recordCompat.ts` 并在 `getRecords()` 中自动调用
  - 删除 Statistics 等处的重复代码
  - 涉及文件：`src/utils/recordCompat.ts`、`src/utils/storage.ts`、`src/components/Statistics/index.tsx`

- [ ] **Task 19**: typeLabels/typeBadges 常量提取（#17 🟡）
  - 提取到 `src/utils/constants.ts`
  - 更新 BankDetail、QuestionForm、ImportModal、FavoriteBank 的引用
  - 涉及文件：新建 `src/utils/constants.ts`，修改 4 个组件文件

- [ ] **Task 20**: CSS color-scheme 修正（#18 🟡）
  - `color-scheme: only light` → `color-scheme: light dark`
  - 涉及文件：`src/index.css`

- [ ] **Task 21**: AI 缓存数量上限（#19 🟡）
  - 设置 500 条上限，超出时淘汰最旧条目
  - 涉及文件：`src/utils/ai.ts`

- [ ] **Task 22**: BankDetail 标题颜色修复（#20 🟡）
  - `text-surface-500` → `text-surface-900`
  - 涉及文件：`src/components/Bank/BankDetail.tsx`

- [ ] **Task 23**: Tauri Cargo.toml 版本同步（#24 🟡）
  - 版本号 `0.1.0` → `1.0.4`
  - 涉及文件：`src-tauri/Cargo.toml`

- [ ] **Task 24**: Capacitor 配置增强（#25 🟡）
  - 添加 `server.androidScheme`、`android.minWebViewVersion`
  - 涉及文件：`capacitor.config.ts`

- [ ] **Task 25**: FavoriteBank 取消收藏确认（#26 🟡）
  - 取消收藏前弹出 ConfirmDialog 二次确认
  - 涉及文件：`src/components/FavoriteBank/index.tsx`

- [ ] **Task 26**: Dashboard 删除题库统一 ConfirmDialog（#27 🟡）
  - 原生 `confirm()` 替换为 ConfirmDialog 组件
  - 涉及文件：`src/components/Dashboard/index.tsx`

- [ ] **Task 27**: WrongBook 空状态反馈（#28 🟡）
  - 错题重刷全部答对后显示 Toast 或成功提示
  - 涉及文件：`src/components/WrongBook/index.tsx`

## P3 — 低优先级（轻微优化）

- [ ] **Task 28**: 轻微问题批量修复（#29-#41 🟢）
  - #29: BankCard gradientMap[3] 和 [4] 同色值 → 区分颜色
  - #30: AI 解析按钮 emoji vs 文字风格混用 → 统一为 Lucide 图标
  - #31: forced-color-adjust: none → 评估后可移除
  - #32: CSS shadow token → 评估收益后保留或移除
  - #33: crypto.randomUUID → 添加 polyfill 兜底
  - #34: txtParser 大文件字符串数组 → 逐行处理
  - #35: 旧版 excel.ts 数字类型 → 已随 Task 8 一并处理
  - #36: Tauri 窗口最小尺寸 → 添加 minWidth/minHeight 约束
  - #37: 导入/导出按钮图标 → 统一语义（ArrowUp/ArrowDown）
  - #38: recordCompat 归一化重复 → 已随 Task 18 处理
  - #39: getTxtTemplate 格式不兼容 → 更新模板匹配新 parser
  - #40: @theme shadow-* 覆盖 → 改用自定义 key 名避免冲突
  - #41: AIExplanationCard getCachedExplanation → 移到 useEffect

## 任务依赖

- Task 8（解析器合并）必须在其他涉及解析器 import 的任务之前完成
- Task 9（删除 AIConfigModal）必须在 Task 6 之后确认无引用
- Task 17（dataVersion）需要先完成再考虑未来数据迁移
- Task 19（常量提取）需在 Task 6（Practice 拆分）之前完成以避免冲突
- Task 3（AI 持久化修复）需优先于其他 QuestionForm 相关修改