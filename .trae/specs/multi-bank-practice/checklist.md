# Checklist

## 类型层 & 数据兼容
- [x] `PracticeRecord` 类型新增 `bankIds?: string[]`，保留 `bankId?: string`
- [x] `normalizeRecord()` 工具函数正确将 `{bankId:'a'}` → `{bankIds:['a']}`，`{bankIds:['a','b']}` 原样通过
- [x] `normalizeRecord()` 处理空记录（无 bankId 无 bankIds）不抛异常（返回 `[]`）

## Statistics 过滤
- [x] `selectedBankId === 'all'` 时汇总所有记录（含多题库记录）
- [x] `selectedBankId === 'a'` 时过滤出 `bankIds` 包含 'a' 的记录
- [x] 过滤逻辑使用 `normalizeRecord()` 兼容旧格式

## 导入导出
- [x] `exportData()` 导出的 record 同时包含 `bankId`（首个 bankIds 元素）和 `bankIds`
- [x] `importData()` 对仅含 `bankId` 的旧记录自动补充 `bankIds`
- [x] 导入含新格式记录的 JSON 后，Statistics 和记录查看均正确

## Practice 组件
- [x] Props 从 `{bankId: string}` 改为 `{bankId?: string; bankIds?: string[]}`
- [x] 单题库路径（BankDetail → 刷题）功能不变：配置页显示单个题库名和题数
- [x] 多题库路径：配置页显示每个题库独立的抽题数滑块
- [x] 单题库模式下 UI 布局与改造前一致（无退化）：按题型设置和题目总数滑块正常显示
- [x] 多题库模式下各题库抽题配置独立生效
- [x] 某题库题目不足时取最大可用数，Math.min 已处理
- [x] 全局随机开关关闭时，题目按题库选择顺序排列
- [x] 全局随机开关开启时，合并后整体随机打乱

## PracticeRecord 生成
- [x] 多题库提交后 record 含 `bankIds: ['a','b']`，`bankId` 为首个元素
- [x] 单题库提交后 record 含 `bankIds: ['a']`，`bankId: 'a'`
- [x] record 正确写入 localStorage 并可在 Statistics 中读取

## WrongQuestion 记录
- [x] 多题库刷题错题记录的 `bankId` 为题目原始所属题库（非多题库列表）
- [x] 错题本分组仍按原始题库正确分组（逻辑未变）
- [x] `addWrong()` 签名和调用点无类型报错（TypeScript 编译通过）

## Dashboard 入口
- [x] `banks.length >= 2` 时显示"多题库刷题"按钮
- [x] `banks.length < 2` 时不显示或置灰（条件渲染）
- [x] 弹窗打开后展示所有题库（名 + 题目数 + 复选框）
- [x] 全选/取消全选功能正常
- [x] 已选计数实时更新
- [x] 未选任何题库时"开始刷题"按钮置灰（disabled）
- [x] 至少选 1 个题库后点击"开始刷题"正确跳转
- [x] 取消/点击遮罩关闭弹窗

## App.tsx 路由
- [x] `selectedBankIds` 状态管理正确
- [x] 单题库路径（`handleStartPractice`）不受影响，同时设置 selectedBankIds
- [x] 多题库路径（`handleMultiBankPractice`）正确传递 bankIds 给 Practice

## 全链路验证
- [x] TypeScript 类型系统通过 `npx tsc --noEmit`（零错误）
- [x] Statistics 按题库过滤多题库记录正确（`normalizeRecord` + `bankIds.includes`）
- [x] WrongBook 中错题按原始题库分组正确（逻辑未变，addWrong 使用查找的原始 bankId）
- [x] 导出数据同时包含 `bankId` 和 `bankIds`
- [x] 导入数据对旧记录自动补充 `bankIds`
- [x] 历史旧记录（仅 bankId）在 normalizeRecord 下正常兼容
- [x] 传统单题库路径（点击卡片 → BankDetail → 刷题）代码逻辑完全不受影响