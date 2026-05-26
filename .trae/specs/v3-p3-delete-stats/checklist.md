# Checklist: V3.0 P3 题库删除按钮红色 + 错题次数列 + 统计清空

## 功能验证

- [x] BankCard 删除按钮默认显示红色 `text-red-400`
- [x] BankCard 删除按钮 hover 变深红 `text-red-600` + 红色背景
- [x] BankDetail 删除按钮默认显示红色 `text-red-400`
- [x] BankDetail 删除按钮 hover 变深红 `text-red-600`
- [x] BankDetail 题目卡片中有错题记录时显示红色 `❌ N次`
- [x] BankDetail 题目卡片中无错题记录时不显示
- [x] Statistics 页面有记录时显示"清空统计"按钮
- [x] Statistics 页面无记录时不显示按钮
- [x] 点击"清空统计"弹出确认对话框
- [x] 确认后数据清空、页面自动刷新

## 回归验证

- [x] BankCard 删除功能正常（点击仍弹出确认并删除）
- [x] BankDetail 编辑/删除功能正常
- [x] Statistics 图表和汇总卡片在清空后正常重置
- [x] 题库过滤功能正常

## 验证命令

```bash
npx tsc --noEmit  # 0 errors
npx vite build    # success
```