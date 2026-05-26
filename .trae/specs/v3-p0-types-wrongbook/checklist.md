# Checklist

## 类型扩展

- [x] `AIConfig` 接口已定义（platform/apiKey/baseUrl/model/maxTokens/customPlatformName/customModelName）
- [x] `AIPlatformDef` 接口已定义（name/baseUrl/models/apiKeyHelp）
- [x] `WrongQuestion` 包含 `correctAnswer: string[]` 字段
- [x] `WrongQuestion` 包含 `firstWrongAt: number` 字段
- [x] `PracticeRecord` 包含 `source?: 'bank' | 'wrong-review'` 字段
- [x] `UserConfig` 包含 `showAnswerSwitch: boolean` 字段
- [x] `UserConfig` 包含 `enableAIInPractice: boolean` 字段

## 数据迁移

- [x] `getWrong()` 对旧数据自动补全 `correctAnswer: []`
- [x] `getWrong()` 对旧数据自动补全 `firstWrongAt: lastWrongAt || Date.now()`
- [x] `defaultConfig` 包含 `showAnswerSwitch: false` 和 `enableAIInPractice: false`
- [x] `getConfig()` 使用 Object.assign 补全缺失字段

## addWrong 签名

- [x] `addWrong` 签名包含 `correctAnswer: string[]` 参数
- [x] 新增错题时存储 `correctAnswer` 和 `firstWrongAt`
- [x] 重复错题时不覆盖 `correctAnswer` 和 `firstWrongAt`
- [x] 所有调用 `addWrong` 处传入了 `correctAnswer` 参数

## 错题本双视图

- [x] 顶部有"按时间"和"按题库"切换按钮
- [x] 默认显示按时间视图
- [x] 按时间：lastWrongAt 向下取整到分钟分组，时间组倒序
- [x] 时间组内按题库二级分组
- [x] 按题库：按 bankId 分组，组内按 lastWrongAt 倒序
- [x] 搜索/类型筛选在分组前过滤
- [x] 空状态显示"暂无错题，继续保持！"

## 错题卡片

- [x] 每道错题显示完整题目内容
- [x] 显示所有选项，错误答案标红（❌），正确答案标绿（✅）
- [x] 显示累计错误次数
- [x] 显示最近错误时间
- [x] 有解析时显示解析
- [x] 有"重刷此题"和"移除"按钮
- [x] 支持勾选多题

## 错题重刷入口

- [x] 顶部有"重刷选中"按钮（有勾选题时可用）
- [x] 顶部有"重刷全部"按钮
- [x] 顶部有"清空全部"按钮（需确认）
- [x] 按题库视图下每组有"清空该题库"按钮

## App.tsx 导航

- [x] 包含 `presetQuestionIds: string[] | null` state
- [x] 包含 `practiceMode: 'normal' | 'wrong-review'` state
- [x] 错题本重刷能正确导航到 Practice 页并传参

## Practice 错题重刷模式

- [x] 接收 `presetQuestionIds` prop
- [x] 接收 `mode` prop
- [x] presetQuestionIds 有值时配置页锁题
- [x] 错题重刷模式隐藏"排除已刷题目"开关
- [x] 锁题时可调整题型排序/随机等参数

## 提交闭环

- [x] mode='wrong-review' 时答对自动 removeWrong(qId)
- [x] PracticeRecord 包含 `source: 'wrong-review'`
- [x] 正常刷题 PracticeRecord 包含 `source: 'bank'`

## TypeScript

- [x] `npx tsc --noEmit` 零错误
- [x] 无未使用导入/变量