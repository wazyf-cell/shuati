# V3.0 P0: 类型扩展 + 错题本改造 + 错题重刷闭环

## Why
V3.0 升级的基础层。类型扩展是所有后续模块的底座，错题本改造是用户使用频次最高的功能，错题重刷闭环打通"错题→重练→自动移除"的完整数据流。

## What Changes
- **types/index.ts**：新增 AIConfig/AIPlatformDef 接口；WrongQuestion 增加 correctAnswer/firstWrongAt；PracticeRecord 增加 source；UserConfig 增加 showAnswerSwitch/enableAIInPractice
- **storage.ts**：getWrong 兼容旧数据迁移（correctAnswer/firstWrongAt 默认值）；UserConfig 默认值扩展；addWrong 存储 correctAnswer
- **store/wrong.ts**：addWrong 签名扩展 `(qId, bankId, userAnswer, correctAnswer)`
- **WrongBook/index.tsx**：重写为双视图（按时间/按题库）+ 时间分组 + 折叠 + 错题卡片（完整答案对照）+ 重刷入口 + 批量操作
- **Practice/index.tsx**：新增 `presetQuestionIds` prop + `mode` prop；错题重刷 → 配置页锁题；提交时答对自动 removeWrong + 生成 source='wrong-review' 的 PracticeRecord
- **App.tsx**：新增 `presetQuestionIds` / `practiceMode` state；错题本重刷 → 导航到 Practice
- **store/config.ts**：UserConfig 默认值增加新字段

## Impact
- Affected specs: practice-exclude-submit（排除逻辑增强）, fix-practice-and-nav-bugs（相同文件 Practice/index.tsx）
- Affected code: types/index.ts, utils/storage.ts, store/wrong.ts, store/config.ts, WrongBook/index.tsx, Practice/index.tsx, App.tsx

## ADDED Requirements

### Requirement: WrongQuestion 字段扩展
系统 SHALL 在 WrongQuestion 中存储正确答案和首次错误时间。

#### Scenario: 新增字段自动兼容旧数据
- **WHEN** 读取旧版本无 correctAnswer/firstWrongAt 的错题数据
- **THEN** 自动补全 `correctAnswer: []` 和 `firstWrongAt: lastWrongAt || Date.now()`

### Requirement: addWrong 记录正确答案
系统 SHALL 在记录错题时同时存储正确答案。

#### Scenario: Practice 提交时记录正确答案
- **WHEN** 用户提交答案且某题答错
- **THEN** addWrong 调用传入 `correctAnswer: question.correctAnswer`

### Requirement: PracticeRecord 来源标记
系统 SHALL 在 PracticeRecord 中记录刷题来源（正常刷题 / 错题重刷）。

#### Scenario: 错题重刷生成 source 标记
- **WHEN** 用户通过错题本重刷并提交
- **THEN** 生成的 PracticeRecord 包含 `source: 'wrong-review'`

### Requirement: 错题本双视图
系统 SHALL 提供"按时间"和"按题库"两种错题分组视图。

#### Scenario: 按时间视图
- **WHEN** 用户切换到"按时间"视图
- **THEN** 错题按 lastWrongAt 向下取整到分钟分组，时间组倒序，组内按题库二级分组

#### Scenario: 按题库视图
- **WHEN** 用户切换到"按题库"视图
- **THEN** 错题按 bankId 分组，组内按 lastWrongAt 倒序

### Requirement: 错题卡片（完整答案对照）
系统 SHALL 在错题卡片中同时显示用户的错误答案和正确答案。

#### Scenario: 展开错题卡片
- **WHEN** 用户点击某道错题展开
- **THEN** 显示题目内容 + 所有选项（错误标红、正确标绿）+ 累计错误次数 + 解析（如有）+ 移除 + 重刷按钮

### Requirement: 错题重刷流程
系统 SHALL 支持从错题本重刷错题（单题/选中/全部）。

#### Scenario: 错题重刷
- **WHEN** 用户点击重刷按钮
- **THEN** 导航到 Practice 配置页（题目范围锁定），可调参数后开始

### Requirement: 答对自动移除错题
系统 SHALL 在错题重刷答对时自动从错题本移除该题。

#### Scenario: 错题重刷答对
- **WHEN** mode='wrong-review' 且 results[qId] === true
- **THEN** 自动 removeWrong(qId)

## MODIFIED Requirements

### Requirement: 排除已刷增强
错题重刷模式 SHALL 隐藏"排除已刷题目"开关（错题重刷不需要此选项）。