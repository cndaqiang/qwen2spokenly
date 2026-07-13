# 语音模型对比与个人选择

本文记录 Spokenly 中本地、百炼与 OpenRouter 语音模型的实际测试结果。模型评价以个人使用体验为主，价格用于比较长期使用成本。

## 实际采用的模型

按每月约 24 小时语音输入计算：

| 档位 | 模型 | 每月大致价格 |
| --- | --- | ---: |
| 日常使用 | `fun-asr-flash-2026-06-15` | $2.80 |
| 日常使用 | `qwen3-asr-flash-2026-02-10` | $2.80 |
| 日常使用 | `openai/gpt-4o-mini-transcribe` | 约 $4.32 |
| 按需使用 | `openai/gpt-4o-transcribe` | 约 $8.64 |
| 按需使用 | `microsoft/mai-transcribe-1.5` | $8.64 |
| 本地备用 | `Whisper Large v3 Turbo` | 免费 |

## 完整对比

| 模型 | 每小时价格 | 评价（相比本地） |
| --- | ---: | --- |
| 本地/Whisper Large v3 Turbo | 免费 | 精度尚可且响应很快；不支持标点，不适合长对话 |
| 百炼/fun-asr | $0.116 | 仅支持异步调用，**不适合 Spokenly** |
| 百炼/fun-asr-flash-2026-06-15 | $0.116 | 准确率与本地接近，带中文标点；低价，但依赖自建 Worker 和网络稳定性 |
| 百炼/qwen3-asr-flash-2026-02-10 | $0.116 | 同版本实测准确度达到 GPT-4o Transcribe 同档；使用中文标点，输出风格与 MAI 接近 |
| qwen/qwen3-asr-flash-2026-02-10 | $0.126 | **不推荐**，同百炼千问，但价格更高且充值有手续费 |
| openai/gpt-4o-mini-transcribe | 约 $0.180 | 中英文混合能够满足基本要求；使用英文标点，但可能将陌生专有名词改写为常见词 |
| openai/gpt-4o-transcribe | 约 $0.360 | 准确度较高，使用英文标点；适合重要内容 |
| openai/whisper-large-v3-turbo | $0.040 | **不推荐**，识别效果与本地相近；本地速度更快且免费 |
| openai/whisper-large-v3 | $0.090 | **不推荐**，结果不稳定，有时不识别中文或自动翻译成英文 |
| microsoft/mai-transcribe-1.5 | $0.360 | 中英文混合识别效果较好；使用中文标点，整体体验与千问类似，但价格较高 |
| google/chirp-3 | $0.960 | **不推荐**，单纯用于语音转写价格过高 |
| openai/whisper-1 | $0.360 | **不推荐**，属于旧版 Whisper，建议使用本地模型 |

## 选择说明

- 联网模型普遍需要等待上传和接口返回；通过 Worker 或 OpenRouter 都会受到网络波动影响，不能把延迟归因于某一个模型。
- 百炼仍有免费额度或余额、Worker 与网络稳定时优先使用；Spokenly 如果支持百炼千问直连，则取消 Worker 中转。
- 工作量较低时暂不订阅 Typeless，优先使用百炼千问；假期结束后工作量明显增加时恢复订阅。Typeless 年费折合约 $6/月，持续高用量时更划算。
- 不同模型都会出现错识别，没有一个模型在所有内容上都更好；实际选择以转写场景和后续校订量为准。

## 价格口径

- 每月按 24 小时计算；每小时 $0.10 对应每月 $2.40。
- 百炼价格按 $1 = ¥6.80 换算。
- GPT Transcribe 将音频计为输入 Token、转写文字计为输出 Token，因此使用“约”。这种生成式计费可以解释其标点和语义归一化倾向，但不能证明后台额外执行了一次独立的文本转换。
- MAI Transcribe 按音频时长计费，OpenRouter 记录不显示 Token 明细；仅凭账单无法判断其定价较高的具体原因。
- 其他模型按音频时长计费。
- 价格参考：[百炼模型计费](https://help.aliyun.com/en/model-studio/model-pricing)、[OpenRouter 语音模型](https://openrouter.ai/collections/speech-to-text-models)、[OpenAI API 计费](https://developers.openai.com/api/docs/pricing)。
