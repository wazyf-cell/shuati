# Shuati — Offline Quiz Tool for Chinese Political Exams 🎯

An offline, lightweight, cross-platform quiz application. Designed for **Chinese graduate entrance exam politics (考研政治) / college final exams / civil service exams**, supporting multiple question types, question banks, wrong answer review, favorites, and AI-powered explanations.

> ⚠️ The Windows executable is not code-signed. Some antivirus software (Windows Defender, 360, etc.) may flag it as a false positive. This is an open-source project — all source code is publicly available for review.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **5 Question Types** | Single choice / Multiple choice / True-False / Fill-in / Short answer (with sub-questions) |
| **Multi-bank Practice** | Select multiple question banks for combined practice |
| **Per-type Setup** | Set question count for each question type individually |
| **Timer Modes** | Count-up / Countdown (up to 300 minutes) |
| **Wrong Answer Book** | Auto-records wrong answers, supports replay by time / bank / subject group |
| **Favorites** | Star important questions for focused review |
| **Subject Classification** | Organize question banks by subject, supports rename |
| **Skip Solved** | Skip questions you've answered correctly, focus on weak spots |
| **Statistics** | Accuracy trend chart, daily practice volume, subject-level filtering |
| **AI Explanation** | Integrates 6 AI platforms for intelligent question analysis |
| **Import / Export** | Bulk import via TXT / Excel, JSON export for backup |
| **In-app Update** | Checks the latest GitHub Release, shows download progress, verifies SHA256, then installs (desktop replaces in place, Android opens the system installer) |
| **Cross-platform** | Windows desktop (Tauri) + Android mobile (Capacitor) |

## 🖥️ Download

| Platform | Download |
|----------|----------|
| **Windows Installer (recommended)** | Download `shuati_x.x.x_x64-setup.exe` from [Releases](https://github.com/wazyf-cell/shuati/releases) |
| **Windows Portable** | Download `shuati-portable.zip` from [Releases](https://github.com/wazyf-cell/shuati/releases) |
| **Android APK** | Download `app-debug.apk` from [Releases](https://github.com/wazyf-cell/shuati/releases) |
| **Checksums** | Every Release includes `SHA256SUMS.txt` |
| **Web (dev)** | Run `npm run dev` and open `http://localhost:5173` |

> On first launch Windows may show "Unknown publisher": click **More info → Run anyway**. The binaries are not code-signed, but the source is public and every Release ships SHA256 checksums.
>
> Builds up to 1.0.9 use the old Gitee update source; install 1.0.10 manually once, after that in-app updates work.

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/wazyf-cell/shuati.git
cd shuati

# Install dependencies
npm install

# Start dev server (browser)
npm run dev

# Build desktop app
npm run tauri:build

# Build web & sync Android
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

When releasing, change `src/version.ts` and run `npm run version:sync`; it updates `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and Android `versionName` / `versionCode`.

See [BUILD.md](BUILD.md) for Windows/Android prerequisites and troubleshooting (written in Chinese).

## 🧩 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript |
| Desktop | Tauri 2.x (Rust) |
| Android | Capacitor 8.x |
| Build | Vite |
| State | Zustand |
| Styling | Tailwind CSS |
| Storage | localStorage (JSON) |
| Icons | Lucide React |

## 📂 Project Structure

```
src/
├── App.tsx               # Routing & global state
├── main.tsx              # Entry point
├── version.ts            # Single source of truth for version
├── components/
│   ├── Dashboard/        # Home (bank grid · subject groups)
│   ├── Bank/             # Bank detail · question editor · import
│   ├── Practice/         # Quiz core (MCQ · fill-in · timer)
│   ├── WrongBook/        # Wrong answer review
│   ├── FavoriteBank/     # Favorites
│   ├── Statistics/       # Practice stats & charts
│   ├── Settings/         # Settings · latest Release notes
│   ├── Update/           # Update dialog · download progress · install
│   ├── AI/               # AI config · explanation card
│   └── Layout/Header.tsx # Nav bar
├── store/                # Zustand stores (including latest GitHub Release)
├── types/                # TypeScript type definitions
├── utils/                # Utilities (Release API, updater, storage, AI, parsers)
└── hooks/                # Custom hooks

scripts/sync-version.mjs  # Version sync
android/                  # Capacitor Android project
src-tauri/                # Tauri desktop project
```

## 📥 Import Format

Supports **TXT** and **Excel** import.

**TXT example:**

```
1. The basic line of the primary stage of socialism is?
A. One center, two basic points
B. Reform and opening up
C. Four cardinal principles
D. Economic construction as the center
Answer: A
Explanation: One center refers to economic construction...

2. The core position of the Scientific Outlook on Development is?
Answer: people-oriented
Explanation: ...

3. True or False: The essence of socialism is to liberate...
A. True
B. False
Answer: A
```

## 🔄 Updates

- Source: `https://api.github.com/repos/wazyf-cell/shuati/releases/latest`
- Changelog: only the latest Release body (bullet list)
- Desktop: download portable `shuati.exe` → SHA256 verify → confirm → replace in place and restart; falls back to the installer if the directory is not writable
- Android: native APK download with progress/cancel → SHA256 verify → open the system installer (requires allowing unknown apps)
- Every Release ships `SHA256SUMS.txt`; installs are blocked on checksum mismatch
- Logs: `%LOCALAPPDATA%\com.shuati.app\logs\shuati.log`

## 🔒 Privacy

- All data is stored **locally** (browser localStorage), never uploaded to any server
- AI explanation requires you to bring your own API key (supports 6 platforms), stored locally via base64 encoding
- The source code contains no hardcoded API keys or credentials

## 📄 License

[MIT License](LICENSE)
