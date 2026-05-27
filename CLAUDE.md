# CLAUDE.md — 刷题助手项目指南

## 项目简介

离线刷题工具，支持 Tauri 桌面端 + Capacitor Android APK。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | React 18 + TypeScript |
| 桌面端 | Tauri 1.x (Rust) |
| Android | Capacitor 2.x |
| 构建 | Vite 5.x |
| 状态 | Zustand (store) |
| 样式 | Tailwind CSS 3.x |
| 图标 | Lucide React |
| 数据 | localStorage (JSON) |

## 文件结构

```
src/
├── App.tsx                    # 路由、自动更新、全局状态
├── version.ts                 # ⭐ 唯一版本号出口
├── types/index.ts             # Question, QuestionBank, WrongQuestion, etc.
├── store/
│   ├── bank.ts                # 题库 CRUD
│   ├── config.ts              # 用户配置、收藏夹
│   ├── practice.ts            # 刷题状态管理
│   ├── wrong.ts               # 错题本
│   └── toast.ts               # 通知
├── components/
│   ├── Bank/                  # 题库管理、导入、题目编辑
│   ├── Practice/              # 刷题核心（QuestionView, OptionPanel, FeedbackPanel, Timer）
│   ├── WrongBook/             # 错题本
│   ├── FavoriteBank/          # 收藏题库
│   ├── Dashboard/             # 首页
│   ├── Settings/              # 设置、更新检测、更新日志
│   ├── Statistics/            # 统计
│   ├── AI/                    # AI 配置页、AI 解析卡片
│   └── Layout/Header.tsx      # 导航栏
├── utils/
│   ├── ai.ts                  # AI API 调用（多平台）、缓存
│   ├── txtParser.ts           # TXT 题目导入解析
│   ├── excelParser.ts         # Excel 题目导入解析
│   └── storage.ts             # localStorage 读写
├── hooks/
│   └── useKeyboardShortcuts.ts # 键盘快捷键
src-tauri/
├── tauri.conf.json            # Tauri 配置（版本号）
└── src/lib.rs                 # Rust 后端（更新检测）
gitee-update/                  # 发布产物目录
├── version.json               # 更新检测清单
├── shuati.exe                 # 最新桌面 exe
├── shuati_x.x.x_x64-setup.exe # 安装包
└── app-debug.apk              # Android APK
android/                        # Capacitor Android 项目
```

## 5 种题型

| 类型 | 标签 | 选项 | 答案格式 |
|------|------|------|---------|
| 单选 | `[单选]` | A-D 选项 | `A` |
| 多选 | `[多选]` | A-D 选项 | `AB` / `A,B` |
| 判断 | `[判断]` | A/B 选项（必须写） | `A` / `对` / `正确` |
| 填空 | `[填空]` | 无 | `H2O, CO2` |
| 简答 | `[简答]` / `[简答-大题]` | 无 | 文本 / 小题列表 |

`[简答-大题]` 支持 `小题N：` + `答案N：` 格式，完型/阅读写在 `content` 里。

## 关键约定

### 版本号 ⭐
- **唯一出口：** `src/version.ts` 的 `APP_VERSION`
- 同步更新：`package.json`、`src-tauri/tauri.conf.json`、`gitee-update/version.json`
- `Settings` 和 `App.tsx` 都从 `src/version.ts` import

### 更新日志
- `FALLBACK_CHANGELOG`（`src/components/Settings/index.tsx`）是**权威更新日志**，每次发版必须更新
- `gitee-update/version.json` 的 `notes` 同步更新（走 Gitee 的网络源）
- **CORS 问题：** 网页版 fetch Gitee 会被拦截 → 自动降级到 `FALLBACK_CHANGELOG`。Tauri/APK 不受影响
- **发版必须两处同步：** `FALLBACK_CHANGELOG` + `version.json.notes`

### 导入格式
- TXT：按题型标签分类，答案用 `答案：` 开头（不是 `正确答案：`）
- Excel：第一行表头，支持中英文列名
- 详见 `导入格式规范.md`

### 数据流
- 用户数据全在 localStorage（`quiz_banks`, `quiz_wrong`, `quiz_config`）
- AI 配置存 `ai_config`（API key 经 btoa 编码）
- AI 解析缓存存 `ai_explanations`（按题目 ID）
- 收藏夹在 `quiz_config.favorites` 数组

### AI 解析
- 两套独立体系：
  - `question.analysis`：通用解析（手动写 / 编辑时 AI 生成，存题库数据）
  - `AIExplanationCard`：个性化错题解析（缓存 localStorage `ai_explanations`）
- 支持 6 个平台：硅基流动、OpenAI、DeepSeek、Azure、Gemini、Claude
- 配置方式：AI 平台首页 → 选择平台 → 填 API Key → 测试连接

### 下载源
- **exe/setup** → Gitee（国内下载快）
- **APK** → GitHub Raw（`raw.githubusercontent.com/wazyf-cell/shuati/main/gitee-update/app-debug.apk`）
- **version.json** → Gitee

## 构建与发布

```bash
# 桌面端完整构建
npm run tauri:build

# 手动复制产物
copy src-tauri\target\release\shuati.exe gitee-update\
copy src-tauri\target\release\bundle\nsis\shuati_X.X.X_x64-setup.exe gitee-update\

# Android 同步（先 npm run build）
npx cap sync android
# → 然后 Android Studio Build APK → 复制到 gitee-update/app-debug.apk
```

每次发版：
1. 更新 `src/version.ts` + `package.json` + `tauri.conf.json`
2. 更新 `gitee-update/version.json`（版本号 + 累计 notes）
3. 执行 `npm run tauri:build`
4. 复制 exe/setup → `gitee-update/`
5. `npx cap sync android` → APK 构建 → 复制
6. 提交并双推 Gitee + GitHub

## Git 提交规范

- `release vX.X.X - 更新内容`（发布）
- `fix: 简短描述`（Bug 修复）
- `update APK vX.X.X`（APK 更新）
- 双推：`git push origin master`（Gitee）+ `git push github master`

## 常见问题

- **导航栏颜色对不上** → 检查 `Header.tsx` 当前页判断
- **更新弹窗老弹** → Settings 和 App.tsx 各有一份 `APP_VERSION`，现在已统一
- **APK 更新日志空白** → 需重新 `npm run build` + `cap sync` + Build APK
- **CORS 拦截** → 网页版 fetch Gitee 被拦，用 `FALLBACK_CHANGELOG` 兜底
- **导入简答不完整** → TXT 拆分按双换行，多行内容需在同一块内
