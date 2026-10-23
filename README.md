# 刷题助手 — 专注政治刷题 🎯

离线、轻量、跨平台的刷题工具。专为 **考研政治 / 期末政治 / 公考政治** 等文科刷题场景设计，支持多题型、多题库、错题本、收藏夹、AI 解析。

> ⚠️ 程序未经过微软数字签名，部分杀毒软件（Windows Defender / 360 等）可能会误报毒。请放心，这是开源项目，源码完全可查。

## ✨ 功能

| 功能 | 说明 |
|------|------|
| **5 种题型** | 单选 / 多选 / 判断 / 填空 / 简答（含大题小题） |
| **多题库** | 同时勾选多个题库联合练习 |
| **按题型刷题** | 每种题型单独设置题目数量 |
| **计时模式** | 正计时 / 倒计时（最长 300 分钟） |
| **错题本** | 自动记录错题，支持按时间 / 题库 / 学科分组重刷 |
| **收藏夹** | 标记好题，集中复习 |
| **学科分类** | 题库按学科管理，支持重命名 |
| **排除已刷** | 跳过已做对的题目，只刷未掌握的知识点 |
| **练习统计** | 正确率趋势图、每日练习量、学科级筛选 |
| **AI 解析** | 接入 6 个 AI 平台智能解析题目 |
| **导入导出** | 支持 TXT / Excel 批量导入，JSON 导出备份 |
| **一键更新** | 检查 GitHub 最新 Release，下载显示进度，SHA256 校验后自动安装（桌面端原地替换，安卓端跳转系统安装） |
| **跨平台** | Windows 桌面端（Tauri）+ Android 手机端（Capacitor） |

## 🖥️ 获取方式

| 平台 | 下载 |
|------|------|
| **Windows 安装包（推荐）** | [Releases](https://github.com/wazyf-cell/shuati/releases) 下载 `shuati_x.x.x_x64-setup.exe` |
| **Windows 便携版** | [Releases](https://github.com/wazyf-cell/shuati/releases) 下载 `shuati-portable.zip`（含 `WebView2Loader.dll`） |
| **Android** | [Releases](https://github.com/wazyf-cell/shuati/releases) 下载 `app-debug.apk` |
| **校验文件** | 每个 Release 附 `SHA256SUMS.txt` |
| **网页版** | `npm run dev` 本地运行，浏览器打开 `http://localhost:5173` |

> Windows 首次运行会提示“未知发布者”：点击 **更多信息 → 仍要运行**。程序未做代码签名，但源码完全公开，每个 Release 都附 SHA256 校验文件。
>
> 1.0.9 及更早版本使用旧的 Gitee 更新源，需要手动安装一次 1.0.10；之后即可在应用内一键更新。

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/wazyf-cell/shuati.git
cd shuati

# 安装依赖
npm install

# 启动开发模式（浏览器）
npm run dev

# 构建桌面端
npm run tauri:build

# 构建 Web 并同步 Android
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

完整的 Windows / Android 构建前置条件和常见问题见 [BUILD.md](BUILD.md)。

发布新版本时只改 `src/version.ts`，然后运行 `npm run version:sync`，会同步 `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 和 Android 的 `versionName` / `versionCode`。

## 🧩 技术栈

| 层 | 技术 |
|---|------|
| 框架 | React 18 + TypeScript |
| 桌面端 | Tauri 2.x (Rust) |
| Android | Capacitor 8.x |
| 构建 | Vite |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 数据 | localStorage (JSON) |
| 图标 | Lucide React |

## 📂 项目结构

```
src/
├── App.tsx               # 路由 & 全局状态
├── main.tsx              # 入口
├── version.ts            # 版本号唯一出口
├── components/
│   ├── Dashboard/        # 首页（题库广场 · 学科分组）
│   ├── Bank/             # 题库详情 · 题目编辑 · 导入
│   ├── Practice/         # 刷题核心（选择题 · 填空题 · 计时器）
│   ├── WrongBook/        # 错题本（时间 / 题库 / 学科视图）
│   ├── FavoriteBank/     # 收藏夹（题库 / 学科视图）
│   ├── Statistics/       # 练习统计（正确率 · 趋势图 · 学科筛选）
│   ├── Settings/         # 设置 · 最新 Release 日志 · 使用说明
│   ├── Update/           # 更新弹窗 · 下载进度 · 安装
│   ├── AI/               # AI 配置页 · 解析卡片
│   └── Layout/Header.tsx # 导航栏
├── store/                # Zustand 状态管理
│   ├── bank.ts           # 题库 CRUD
│   ├── config.ts         # 用户配置 · 收藏夹
│   ├── practice.ts       # 刷题状态
│   ├── wrong.ts          # 错题本
│   ├── toast.ts          # 通知
│   └── update.ts         # 最新 GitHub Release
├── types/                # TypeScript 类型定义
├── utils/                # 工具函数
│   ├── githubRelease.ts  # Release API · 资产选择 · SHA256
│   ├── shuatiUpdater.ts  # Android 原生更新插件
│   └── ...
└── hooks/                # 自定义 Hooks

scripts/sync-version.mjs  # 版本号同步
android/                  # Capacitor Android 工程
src-tauri/                # Tauri 桌面工程
```

## 📥 导入题目格式

支持 **TXT** 和 **Excel** 两种导入方式。

**TXT 格式示例：**

```
1. 社会主义初级阶段的基本路线是？
A. 一个中心，两个基本点
B. 改革开放
C. 四项基本原则
D. 以经济建设为中心
答案：A
解析：一个中心指以经济建设为中心，两个基本点指坚持四项基本原则、坚持改革开放。

2. 科学发展观的核心立场是？
答案：以人为本
解析：科学发展观第一要义是发展，核心立场是以人为本...

3. 判断：社会主义本质是解放生产力，发展生产力...
A. 正确
B. 错误
答案：A
```

## 🔄 更新机制

- 更新源：`https://api.github.com/repos/wazyf-cell/shuati/releases/latest`
- 更新日志：只显示最新 Release 的正文（`- ` 列表），不再内置历史日志
- 桌面端：下载便携版 `shuati.exe` → SHA256 校验 → 确认后原地替换并自动重启；当前目录不可写时回退到安装包
- Android：原生下载 APK → 进度/取消 → SHA256 校验 → 自动打开系统安装器（需允许安装未知应用）
- 每个 Release 附 `SHA256SUMS.txt`，校验不通过不会执行/安装
- 跨平台下载按钮直接打开对应 Release 资产
- 桌面日志：`%LOCALAPPDATA%\com.shuati.app\logs\shuati.log`（设置页可直接打开）

## 🔒 隐私说明

- 所有数据存储在 **本地**（浏览器 localStorage），不上传任何服务器
- AI 解析需要自行配置 API Key（支持 6 个平台），Key 经 base64 编码存储在本地
- 源码不含任何硬编码密钥

## 📄 开源协议

[MIT License](LICENSE)
