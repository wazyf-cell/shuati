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
- 发版时同步更新 `package.json`、`src-tauri/tauri.conf.json`、`gitee-update/version.json`

### 更新日志（硬编码）
- `FALLBACK_CHANGELOG`（`src/components/Settings/index.tsx`）是**离线兜底**，每次发版必须更新
- `version.json.notes` 同步更新（网络源，Gitee CORS 下自动降级到 `FALLBACK_CHANGELOG`）

### 下载源
- **exe/setup** → Gitee  Raw
- **APK** → GitHub Raw
- **version.json** → Gitee

### 导入格式
- TXT：答案用 `答案：` 开头（不是 `正确答案：`）
- Excel：第一行表头，支持中英文列名
- 详见 `导入格式规范.md`

### 数据流
- localStorage keys: `quiz_banks`, `quiz_wrong`, `quiz_config`, `ai_config`, `ai_explanations`
- API key 经 btoa 编码、收藏夹在 `quiz_config.favorites` 数组

### AI 解析
- `question.analysis`（存题库）/ `AIExplanationCard`（缓存）
- 6 个平台：硅基流动、OpenAI、DeepSeek、Azure、Gemini、Claude

## 发布流程（严格遵守）

### 阶段 1：确认版本
1. 用户说"发布新版本"或"构建项目" → **必须先询问**："作为新版本发布还是仅重新构建？"
2. 如果是新版本 → 更新 `src/version.ts`，询问版本号和更新内容

### 阶段 2：更新日志 ⚠️ 最容易忘
**每次发版必须同步更新三处（缺一不可）：**
1. `src/components/Settings/index.tsx` — `FALLBACK_CHANGELOG`（exe/apk 硬编码兜底）
2. `gitee-update/version.json` — `version` + `notes`（Gitee 网络源，fetch 成功时用户看到的）
3. 两处 notes 内容必须完全一致

**验证：** 完成后 check `gitee-update/version.json` 版本号和第一条 notes 是否为新版本。

### 阶段 2.5：验证（网页版检查）⚠️ 必经
- 确保 `npm run dev` 正在运行
- 打开 `http://localhost:5173` → 设置 → 查看更新日志
- **验证第一行是否为新版本号**（如 v1.0.6）
- 如果不是 → 说明硬编码没更新或缓存未刷新 → 修复后再继续

### 阶段 3：构建
```bash
# 先关闭正在运行的 shuati.exe
taskkill /f /im shuati.exe

# 桌面端
npm run tauri:build

# 复制产物
copy /Y src-tauri\target\release\shuati.exe gitee-update\
copy /Y src-tauri\target\release\bundle\nsis\shuati_X.X.X_x64-setup.exe gitee-update\

# Android 同步
npm run build
npx cap sync android
```

### 阶段 4：APK（用户手动）
- 告诉用户：Android Studio → Build APK → 复制到 `gitee-update/app-debug.apk`
- 用户说"好了" → **自动改名** `app-debug.apk` → `app-{version}.apk`（如 `app-1.0.7.apk`）
- 同步更新 `gitee-update/version.json` 的 `apkDownloadUrl` 为 `app-{version}.apk`
- 同步更新 `src/components/Settings/index.tsx` 下载安卓版链接
- 提交并双推

### 阶段 5：提交
```bash
git add . && git commit -m "release vX.X.X - 更新内容"
git push origin master    # Gitee
git push github master    # GitHub
```

### 快速构建（非新版本）
如果只是改了代码想验证，不走完整发布流程：
```bash
npm run build              # Web
copy /Y ...                # 需要时
npx cap sync android       # 需要时
# 不上传 git
```

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
