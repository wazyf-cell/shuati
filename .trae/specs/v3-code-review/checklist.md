# V3.0 代码审查 — 验证检查点

## 审查覆盖范围确认

- [ ] 全部 46 个源文件均已遍历并分析
- [ ] 核心架构层（store、utils、types、hooks）已审查
- [ ] UI 组件层（Dashboard、Bank、Practice、WrongBook、Statistics、AI、Settings、FavoriteBank、Layout）已审查
- [ ] 平台层（Tauri Rust、Capacitor Android、Vite 构建配置）已审查
- [ ] 样式系统（Tailwind CSS v4、@theme 自定义 tokens、index.css）已审查

## 🔴 严重问题检查点（11 项）

- [ ] #1: AI API 无超时控制 — `callOpenAICompatAPI`/`callClaudeAPI`/`callGeminiAPI` 均缺乏 AbortController
- [ ] #2: Tauri CSP 为 null — 完全禁用内容安全策略
- [ ] #3: 双轨 Excel/TXT 解析器 — 旧版 `excel.ts`/`txt.ts` 无人引用但仍存在
- [ ] #4: 大文件导入主线程阻塞 — Excel/TXT 导入全部在主线程同步执行
- [ ] #5: Rust 阻塞 HTTP 调用 — `reqwest::blocking` 阻塞 Tauri 线程池
- [ ] #6: QuestionForm AI 解析自动持久化 — `handleAIAnalyze` 调用 `updateQuestion` 立即写入
- [ ] #7: AIConfigModal 死代码 — 完全未被引用（功能被 AIConfigPage 替代）
- [ ] #8: clearAll 不清理 AI 存储 — 不清理 `ai_config` 和 `ai_explanations`
- [ ] #9: Tauri open_url 跨平台不兼容 — `cmd /c start` 仅 Windows 可用
- [ ] #10: Gemini API Key 在 URL 中传输 — `?key=${config.apiKey}` 拼在 query string
- [ ] #11: Config 阶段 inline 读 localStorage — JSX 中直接调用 `storage.getRecords()`

## 🟡 中等问题检查点（17 项）

- [ ] #12: Toast 颜色语义混淆 — success/error 同色，info/warning 同色
- [ ] #13: Header 缺少收藏导航入口 — FavoriteBank 组件完整但无对应按钮
- [ ] #14: Settings 缺少数据导出/导入功能
- [ ] #15: 版本号未引入 dataVersion 机制
- [ ] #16: bankId→bankIds 归一化逻辑 3 处重复
- [ ] #17: typeLabels/typeBadges 4 处重复定义
- [ ] #18: CSS color-scheme 硬编码 `only light`
- [ ] #19: AI 缓存无量上限
- [ ] #20: BankDetail 标题颜色错误 `text-surface-500` 不可见
- [ ] #21: Practice 组件过大 ~1100 行
- [ ] #22: localStorage 写入无 try-catch
- [ ] #23: Rust open_url 跨平台问题（同 #9）
- [ ] #24: Tauri Cargo.toml 版本不同步 (`0.1.0` vs `1.0.4`)
- [ ] #25: Capacitor 配置可增强
- [ ] #26: FavoriteBank 取消收藏无二次确认
- [ ] #27: Dashboard 删除题库用原生 confirm
- [ ] #28: WrongBook 空状态无反馈提示

## 🟢 轻微问题检查点（13 项）

- [ ] #29: BankCard gradientMap[3] 和 [4] 同色值
- [ ] #30: AI 解析按钮 emoji vs 文字风格混用
- [ ] #31: forced-color-adjust: none 影响可访问性
- [ ] #32: CSS shadow token 收益有限
- [ ] #33: crypto.randomUUID 非 HTTPS 不可用
- [ ] #34: txtParser parseTxt 大文件字符串数组内存浪费
- [ ] #35: 旧版 excel.ts convertToQuestion 数字类型不兼容
- [ ] #36: Tauri 窗口无最小尺寸约束
- [ ] #37: 导入/导出按钮图标语义相反
- [ ] #38: recordCompat 与 storage 归一化逻辑重复（同 #16）
- [ ] #39: getTxtTemplate 模板与旧 parseTxt 格式不兼容
- [ ] #40: @theme shadow-* 覆盖 Tailwind 内置阴影
- [ ] #41: AIExplanationCard 每次渲染重复调用 getCachedExplanation

## 报告完整性检查

- [ ] 所有发现均标注严重程度（🔴🟡🟢）
- [ ] 所有发现均标注涉及文件路径
- [ ] 所有发现均给出改进建议
- [ ] 优先级排序表完整覆盖 P0-P3
- [ ] tasks.md 覆盖全部 41 项发现
- [ ] 任务依赖关系已标注
- [ ] 无遗漏模块或文件