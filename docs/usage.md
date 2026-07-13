# 使用手册

## 配置听写模型

在 Spokenly 的“听写模型 → OpenAI Compatible”中填写：

| 配置项 | 值 |
| --- | --- |
| 基础 URL | `https://<你的 Worker 域名>/v1` |
| 模型 ID | `fun-asr-flash-2026-06-15` |
| API 密钥 | 百炼 API Key |

基础 URL 只填写到 `/v1`，不要追加 `/models`、`/audio/transcriptions` 或 `/chat/completions`。填写完成后点击“测试并保存”。

## 可用模型

| 模型 ID | 说明 |
| --- | --- |
| `fun-asr-flash-2026-06-15` | 同步识别 |
| `qwen3-asr-flash` | 关闭 ITN |
| `qwen3-asr-flash:itn` | 开启 ITN |

## ITN

`qwen3-asr-flash:itn` 是本项目提供的模型别名。Worker 会实际调用 `qwen3-asr-flash`，并传递 `enable_itn=true`，将中文或英文口语数字转换为阿拉伯数字。

`fun-asr-flash-2026-06-15` 不使用 `:itn` 后缀。

## 常见问题

### 模型检查失败或 `/v1/models` 返回 404

- 确认基础 URL 以 `/v1` 结尾。
- 确认 Cloudflare 部署使用的是仓库最新版本。
- 在浏览器中访问 `https://<你的 Worker 域名>/v1/models` 检查模型列表。

### 转写返回 401、403 或 502

- 检查 Spokenly 中的百炼 API Key。
- 确认 API Key 与百炼调用地域匹配。
- 使用 `wrangler tail qwen2spokenly` 查看 Worker 请求状态。

## 限制说明

- `qwen3-asr-flash`：单段音频不超过 10 MB、5 分钟。
- `fun-asr-flash-2026-06-15`：单段音频不超过 5 分钟。
- 本项目不处理异步长音频任务，不提供时间戳或说话人分离。

## 隐私说明

- 百炼 API Key 由 Spokenly 随请求发送，Worker 不保存密钥。
- Worker 不保存音频或转写结果。
- 不要将 API Key 写入仓库、日志或截图。
