# Checklist

## AI 基础设施 (src/utils/ai.ts)

- [ ] `PLATFORM_PRESETS` 包含 7 个平台预设（硅基流动/DeepSeek/OpenAI/Azure/Google/Claude/自定义）
- [ ] `loadAIConfig()` 正确从 localStorage 加载并 atob 解码 API Key
- [ ] `saveAIConfig()` 正确 btoa 编码 API Key 后写入 localStorage
- [ ] `callAIAPI()` OpenAI 兼容格式正确（POST /chat/completions, Bearer auth）
- [ ] `callAIAPI()` Claude 格式正确（POST /messages, x-api-key header）
- [ ] `callAIAPI()` Gemini 格式正确（URL 参数 key）
- [ ] `callAIAPI()` 错误处理区分网络错/API 错/解析错
- [ ] `generateExplanation()` 构建的 prompt 包含题目核心信息
- [ ] `getCachedExplanation()` / `saveCachedExplanation()` 正确读写 localStorage
- [ ] `clearAICache()` 删除所有缓存

## AI 配置模态框 (AIConfigModal.tsx)

- [ ] 毛玻璃遮罩 + 居中卡片设计
- [ ] 平台下拉框 7 个选项，切换自动更新相关字段
- [ ] API Key 输入框支持显示/隐藏切换
- [ ] Base URL 非自定义时只读
- [ ] 模型下拉框根据平台动态更新
- [ ] 最大 Token 输入框范围 100-10000
- [ ] 平台说明卡片显示当前平台信息
- [ ] 自定义平台显示额外输入框
- [ ] 保存校验 API Key 非空
- [ ] 保存后 toast "AI 配置已保存"
- [ ] 打开时自动回填已有配置
- [ ] 取消/点击遮罩关闭不保存

## Header 入口

- [ ] Header 中有"AI配置"按钮
- [ ] 按钮样式与其他导航按钮一致
- [ ] 点击打开 AIConfigModal

## TypeScript

- [ ] `npx tsc --noEmit` 零错误
- [ ] 无未使用导入/变量