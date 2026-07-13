# 技术方案与数据流

## 架构组件

- **Spokenly**：发送 OpenAI Audio Transcriptions 风格的听写请求。
- **Cloudflare Worker**：解析请求、选择百炼模型并统一响应格式。
- **DashScope 临时 OSS**：保存本次请求使用的临时音频对象。
- **百炼 ASR**：执行 `qwen3-asr-flash` 或 `fun-asr-flash-2026-06-15` 同步识别。

## 路由说明

| 路由 | 方法 | 说明 |
| --- | --- | --- |
| `/healthz` | GET | 健康检查，返回 `ok` |
| `/v1/models` | GET | 返回 Spokenly 可选择的模型列表 |
| `/v1/audio/transcriptions` | POST | 接收音频并返回转写文本 |

## 请求与响应

Spokenly 请求：

```text
POST /v1/audio/transcriptions
Content-Type: multipart/form-data
Authorization: Bearer <百炼 API Key>
```

主要表单字段：

| 字段 | 说明 |
| --- | --- |
| `file` | 音频文件 |
| `model` | 模型 ID |
| `language` | 语言或 `auto` |
| `prompt` | 可选上下文 |

Worker 统一响应：

```json
{"text":"识别结果"}
```

## 模型适配

| 项目 | `qwen3-asr-flash` | `fun-asr-flash-2026-06-15` |
| --- | --- | --- |
| 模型 ID | `qwen3-asr-flash` | `fun-asr-flash-2026-06-15` |
| 音频字段 | `audio` | `input_audio` |
| 参数 | `asr_options` | `format` |
| ITN | `enable_itn` | 无独立参数 |
| 文本结果 | `output.choices[].message.content[].text` | `output.text` 或 `output.output.sentence.text` |

`qwen3-asr-flash:itn` 会在调用上游前转换为 `qwen3-asr-flash`，并设置 `enable_itn=true`。

`fun-asr-flash-2026-06-15` 的 `format` 根据上传文件扩展名生成；可选 prompt 会作为 `input_text` 放在音频消息之前。

## 数据流

1. Spokenly 调用 `/v1/models` 检查模型。
2. Spokenly 将音频和模型参数发送到 `/v1/audio/transcriptions`。
3. Worker 使用百炼 API Key 获取临时 OSS 上传策略。
4. Worker 将音频上传到临时 OSS，获得 `oss://...` 地址。
5. Worker 按模型构造 DashScope 同步请求。
6. 百炼返回识别结果。
7. Worker 提取文本并返回 `{"text":"..."}`。

## 鉴权与数据处理

- Worker 从 `Authorization: Bearer ...` 读取百炼 API Key。
- API Key 仅用于当前请求，不写入源码、Cloudflare 变量或日志。
- 音频只上传到百炼临时 OSS；Worker 不保存音频或转写文本。

## 上游接口

Worker 使用公共 DashScope 地址：

```text
https://dashscope.aliyuncs.com/api/v1
```

涉及两个上游路由：

```text
GET  /uploads?action=getPolicy&model=<model>
POST /services/aigc/multimodal-generation/generation
```

## 限制

- 仅适配同步的 `qwen3-asr-flash` 和 `fun-asr-flash-2026-06-15`。
- 不实现异步任务轮询、实时流式识别、时间戳或说话人分离。
