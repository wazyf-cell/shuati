# 本地构建指南

本文覆盖 Windows 桌面端（Tauri）和 Android（Capacitor）的本地构建。发布新版本前先读一遍「版本号」和「发布 Release」。

## 1. 前置条件

### 通用

- Node.js 20+（本项目在 Node 24 上验证）
- npm
- 稳定的网络（首次构建需要下载依赖）

### Windows 桌面端

- Rust stable，默认工具链 `stable-x86_64-pc-windows-msvc`
- Visual Studio Build Tools，勾选「使用 C++ 的桌面开发」
  - 需要 MSVC v143 和 Windows SDK
- WebView2 Runtime（Windows 10/11 通常已安装）
- 必须从 **Visual Studio 开发者命令提示符** 运行构建，或先执行：
  ```bat
  call "C:\Program Files (x86)\Microsoft Visual Studio\<版本>\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
  ```
  否则会出现 `link.exe not found`。

### Android

- JDK 21
- Android SDK 36（`compileSdk 36`）
- Android Studio（可选，命令行也能构建）
- 环境变量：
  - `JAVA_HOME` 指向 JDK 21
  - `ANDROID_HOME` 指向 Android SDK
  - `android/local.properties` 里写 `sdk.dir=...`（Android Studio 会自动生成）

## 2. 安装依赖

```bash
npm install
```

## 3. 版本号

唯一版本源是 `src/version.ts` 的 `APP_VERSION`。

```bash
npm run version:sync
```

会同步：

- `package.json`
- `package-lock.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `android/app/build.gradle` 的 `versionName` 和 `versionCode`

`versionCode` 规则：`major * 10000 + minor * 100 + patch`，例如 `1.0.10` → `10010`。

`npm run build` 前会自动执行 `version:check`，四处不一致会直接失败。

## 4. 开发模式

```bash
npm run dev
# 浏览器打开 http://localhost:5173
```

## 5. 构建 Windows 桌面端

在 VS 开发者命令提示符中：

```bat
npm run tauri:build
```

产物：

- `src-tauri/target/release/shuati.exe`（便携版，需要同目录的 `WebView2Loader.dll`）
- `src-tauri/target/release/bundle/nsis/shuati_<版本>_x64-setup.exe`（安装包，已包含 DLL）

> 如果只做便携版分发，请把 `shuati.exe`、`WebView2Loader.dll` 和 `导入格式规范.md` 打成一个 zip，不要单独发裸 exe，否则可能因缺少 DLL 启动失败。

## 6. 构建 Android APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

产物：`android/app/build/outputs/apk/debug/app-debug.apk`

### Gradle wrapper 下载失败

如果 `./gradlew` 卡在下载 Gradle，报 `PKIX path building failed`（代理/证书问题），可以：

1. 手动下载 Gradle 8.14.3（例如腾讯镜像 `https://mirrors.cloud.tencent.com/gradle/gradle-8.14.3-bin.zip`）
2. 解压到本地
3. 在 `android/` 目录直接运行解压后的 `bin/gradle.bat assembleDebug`

Android 依赖缓存默认在 `GRADLE_USER_HOME`，本项目建议保持和 Android Studio 一致。

## 7. Android 签名

- **1.0.10 仍然使用 debug 签名**，这样已安装的 1.0.8 可以直接覆盖升级。
- 下一次签名迁移（1.0.11 或之后）使用 release keystore：
  - keystore 保存在项目外（例如 `F:\Code\Traecncode\Program\keystores\shuati-release.jks`）
  - `android/key.properties` 指向它（已在 `.gitignore`）
  - `android/app/build.gradle` 已配置读取 `key.properties`
- 加密备份在私有仓库 `wazyf-cell/secret` 的 `signing/shuati-signing.7z`；压缩包密码在密码管理器里，不在仓库里。
- 切换签名后，旧 debug 包无法覆盖安装，必须：导出数据 → 卸载 → 安装新包 → 导入数据。

## 8. 校验文件

每次 Release 生成 `SHA256SUMS.txt`：

```bash
cd release-assets/vX.Y.Z
sha256sum *.exe *.apk | sed 's/ \*/  /' > SHA256SUMS.txt
```

桌面端和 Android 都会在下载完成后校验；校验失败不会执行/安装。

## 9. 发布 Release

1. 改 `src/version.ts`，运行 `npm run version:sync`
2. 构建桌面端和 Android
3. 整理资产：
   - `shuati.exe`
   - `shuati_<版本>_x64-setup.exe`
   - `app-debug.apk`
   - `SHA256SUMS.txt`
   - 可选：`shuati-portable.zip`
4. 在 `https://github.com/wazyf-cell/shuati/releases` 新建 Release，tag 填 `v<版本>`
5. Release 正文用 `- ` 列表写更新内容（应用只显示最新 Release 的正文）
6. 上传资产并发布

> 历史版本乱序发布时，用 Release 编辑页的「设为最新版本」控制 latest；正常只需保证最新版本是最后发布的。

## 10. 常见问题

### Windows 提示“未知发布者”

程序没有代码签名。点击 **更多信息 → 仍要运行**。如果 Defender 真的报毒（不是 SmartScreen），把文件提交到 Microsoft 误报申诉。不要给同学发“自签名证书”，他们还得手动信任，反而更麻烦。

### 桌面端闪退

先看日志：`%LOCALAPPDATA%\com.shuati.app\logs\shuati.log`。设置页有「打开日志文件夹」按钮。常见原因：

- 便携版缺 `WebView2Loader.dll`
- 同时开了多个实例（1.0.10 已加单实例限制）
- 杀软拦截/隔离了 exe

### Android 安装被拦截

首次安装 APK 需要在系统设置里允许「刷题助手」安装未知应用。应用内更新会先检查这个权限，并给出跳转入口。

### GitHub API 限流

未登录 API 限额 60 次/小时/IP。等待一段时间再试，或直接打开 Releases 页面手动下载。

### 网络访问不了 GitHub

应用使用 `api.github.com` 和 Release 资产地址（`browser_download_url`），需要能访问 GitHub。打不开时会提示并给出 Releases 页面链接。
