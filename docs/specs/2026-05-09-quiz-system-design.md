# 网页版刷题系统 · 项目设计文档

## 一、项目概述

本项目是一个纯前端网页版刷题系统，支持多题库管理、多种题型答题、错题自动收集和数据持久化存储。

## 二、功能需求清单

### 2.1 题库管理
- 多题库支持：创建、切换、删除独立题库
- 题目类型：单选题、多选题、判断题
- 选项设置：支持 A-Z 任意数量选项，默认 A-D
- 导入题目：支持 Excel (.xlsx/.xls) 和 TXT 格式
- 自定义添加题目：表单录入题干、选项、正确答案、解析
- 题目编辑与删除

### 2.2 刷题模式
- 自定义题目数量：按题型分别设置练习数量
- 抽取方式：随机抽取或顺序抽取
- 题目导航：侧边栏/底部显示题目序号列表，支持点击跳转
- 答题交互：单选点击、多选勾选、判断选择
- 即时反馈：提交后显示对错、正确答案与解析

### 2.3 错题本
- 自动收集答错题目，按题库分类
- 支持查看、移除、清空错题
- 错题重刷：支持题型数量自定义

### 2.4 数据持久化
- localStorage 存储所有数据
- JSON 导出/导入全部题库（含错题）

### 2.5 补充功能
- 暗黑模式：亮色/暗色主题切换
- 搜索与过滤：关键词搜索、题型筛选
- 练习记录与统计：正确率、用时、趋势图表
- 计时模式：倒计时/正计时
- 标记与收藏：独立于错题的标记功能
- 随机选项顺序
- 快捷键支持

## 三、数据结构设计

### 3.1 题库结构 (QuestionBank)
```typescript
interface QuestionBank {
  id: string;           // 唯一标识
  name: string;         // 题库名称
  questions: Question[]; // 题目列表
  createdAt: number;    // 创建时间戳
  updatedAt: number;    // 更新时间戳
}
```

### 3.2 题目结构 (Question)
```typescript
type QuestionType = 'single' | 'multiple' | 'judge';

interface Question {
  id: string;                    // 唯一标识
  type: QuestionType;            // 题目类型
  content: string;               // 题干内容
  options: QuestionOption[];     // 选项列表
  correctAnswer: string[];       // 正确答案（多选为数组）
  analysis: string;              // 解析内容
}

interface QuestionOption {
  key: string;    // 选项标识 A/B/C/D...
  content: string; // 选项内容
}
```

### 3.3 错题记录 (WrongQuestion)
```typescript
interface WrongQuestion {
  questionId: string;      // 对应题目ID
  bankId: string;          // 所属题库ID
  wrongCount: number;      // 错误次数
  lastWrongAt: number;     // 最后错误时间
  userAnswers: string[];   // 用户答案记录
}
```

### 3.4 练习记录 (PracticeRecord)
```typescript
interface PracticeRecord {
  id: string;                    // 唯一标识
  bankId: string;                // 题库ID
  questionIds: string[];         // 题目ID列表
  answers: Record<string, string[]>; // 用户答案
  results: Record<string, boolean>;  // 答题结果
  startTime: number;             // 开始时间
  endTime: number;               // 结束时间
  totalCount: number;            // 总题数
  correctCount: number;          // 正确数
}
```

### 3.5 用户配置 (UserConfig)
```typescript
interface UserConfig {
  darkMode: boolean;             // 暗黑模式
  currentBankId: string;         // 当前题库
  randomOptionOrder: boolean;    // 随机选项顺序
}
```

## 四、页面路由设计

| 路由 | 组件 | 说明 |
|------|------|------|
| `/` | Dashboard | 首页/仪表盘，展示题库列表和快速入口 |
| `/bank/:id` | QuestionList | 题库详情，题目列表与管理 |
| `/bank/:id/add` | QuestionForm | 添加题目 |
| `/bank/:id/edit/:qid` | QuestionForm | 编辑题目 |
| `/practice/:bankId` | PracticeMode | 刷题模式 |
| `/wrong` | WrongBook | 错题本页面 |
| `/statistics` | Statistics | 统计页面 |

## 五、组件结构

```
App
├── Layout
│   ├── Header          # 顶部导航栏
│   │   ├── Logo
│   │   ├── BankSelector    # 题库切换下拉
│   │   ├── Actions         # 新增/导入/导出按钮
│   │   └── ThemeToggle     # 暗黑模式开关
│   └── Sidebar         # 侧边导航（可选）
├── Dashboard           # 首页仪表盘
│   ├── BankList        # 题库卡片列表
│   └── QuickStats      # 统计概览
├── QuestionList        # 题目列表
│   ├── SearchBar       # 搜索过滤栏
│   ├── QuestionTable   # 题目表格
│   └── QuestionCard    # 题目卡片
├── QuestionForm        # 题目表单
│   ├── TypeSelector    # 题型选择
│   ├── ContentEditor   # 题干编辑
│   ├── OptionsEditor   # 选项编辑（动态增减）
│   └── AnswerSelector  # 正确答案选择
├── PracticeMode        # 刷题模式
│   ├── ProgressBar     # 进度条
│   ├── QuestionNav     # 题目导航（底部/侧边）
│   ├── QuestionView    # 题目展示
│   ├── OptionPanel     # 选项面板
│   └── FeedbackPanel   # 解析反馈
├── WrongBook           # 错题本
│   ├── FilterBar       # 筛选栏
│   ├── WrongList       # 错题列表
│   └── ActionButtons   # 操作按钮
└── Statistics          # 统计页面
    ├── SummaryCards    # 统计卡片
    └── TrendChart      # 趋势图表
```

## 六、界面布局思路

### 6.1 顶部导航栏
- 左侧：Logo + 标题
- 中间：题库切换下拉菜单
- 右侧：新增题库按钮、导入/导出按钮、暗黑模式开关、用户头像

### 6.2 刷题模式布局
- **左侧面板**（可折叠）：题目导航列表，显示序号、状态（已答/未答/标记）
- **中心区域**：题目内容、选项区域、提交按钮
- **右侧面板**（可折叠）：计时器、当前进度、正确率统计

### 6.3 错题本布局
- 顶部：筛选题型下拉、关键字搜索框、批量操作按钮
- 主体：表格展示错题（题目预览、错误次数、最后错误时间）
- 底部：分页控制

### 6.4 颜色方案
- **亮色主题**：白底黑字，蓝色主色调
- **暗色主题**：深灰底浅灰字，紫色主色调

## 七、开发分步实施建议

### 阶段一：MVP（最小可行产品）
1. 项目初始化：React + Tailwind CSS 配置
2. 数据存储层：封装 localStorage 操作
3. 题库管理基础：创建题库、添加题目
4. 刷题模式：单选/多选/判断题答题
5. 即时反馈：显示正确答案和解析

### 阶段二：核心功能完善
1. 错题本：自动收集、查看、删除
2. 题目导入：Excel 和 TXT 格式支持
3. 数据导出：JSON 备份
4. 题目编辑与删除

### 阶段三：体验提升
1. 暗黑模式
2. 搜索与过滤
3. 练习统计与图表
4. 计时模式
5. 标记功能

### 阶段四：高级功能
1. 快捷键支持
2. 随机选项顺序
3. PWA 离线支持
4. 导出错题 PDF

## 八、技术选型

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 18+ |
| 样式 | Tailwind CSS | 3+ |
| 状态管理 | Zustand | 4+ |
| Excel解析 | SheetJS (xlsx) | 0.18+ |
| 图表 | Chart.js / Recharts | - |
| 图标 | Lucide React | - |

## 九、文件结构

```
src/
├── components/          # 组件
│   ├── Layout/         # 布局组件
│   ├── Dashboard/      # 首页组件
│   ├── Bank/           # 题库管理组件
│   ├── Practice/       # 刷题组件
│   ├── WrongBook/      # 错题本组件
│   └── Statistics/     # 统计组件
├── store/              # 状态管理
│   ├── bank.ts         # 题库状态
│   ├── practice.ts     # 刷题状态
│   ├── wrong.ts        # 错题状态
│   └── config.ts       # 配置状态
├── utils/              # 工具函数
│   ├── storage.ts      # 存储封装
│   ├── excel.ts        # Excel解析
│   └── txt.ts          # TXT解析
├── types/              # 类型定义
│   └── index.ts        # 所有接口类型
├── App.tsx             # 根组件
├── main.tsx            # 入口文件
└── index.css           # 全局样式
```

## 十、API 接口设计（如需后端）

### 题库接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/banks | 获取所有题库列表 |
| POST | /api/banks | 创建新题库 |
| GET | /api/banks/:id | 获取题库详情 |
| PUT | /api/banks/:id | 更新题库信息 |
| DELETE | /api/banks/:id | 删除题库 |

### 题目接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/banks/:id/questions | 获取题库题目列表 |
| POST | /api/banks/:id/questions | 添加题目 |
| GET | /api/banks/:id/questions/:qid | 获取题目详情 |
| PUT | /api/banks/:id/questions/:qid | 更新题目 |
| DELETE | /api/banks/:id/questions/:qid | 删除题目 |

### 练习记录接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/records | 获取练习记录列表 |
| POST | /api/records | 保存练习记录 |
| DELETE | /api/records/:id | 删除练习记录 |

---

**文档版本**: v1.0  
**创建时间**: 2026-05-09  
**适用项目**: 网页版刷题系统