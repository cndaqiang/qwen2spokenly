# 语音模型对比与个人选择

本文记录 Spokenly 中本地、百炼、OpenRouter 与 ElevenLabs 语音模型的实际测试结果，并结合 Artificial Analysis 非流式榜单对比 Mistral、AssemblyAI 等其他服务。模型评价以个人使用体验为主，价格用于比较长期使用成本。

## 当前使用汇总

每月大致价格按 24 小时语音输入估算：

| 用途 | 模型 | 每月大致价格 | 备注 |
| --- | --- | ---: | --- |
| 日常主力 | `fun-asr-flash-2026-06-15`（百炼） | $2.80 | 准确率与本地接近，带中文标点；低价，但依赖自建 Worker 和网络稳定性 |
| 日常主力 | `qwen3-asr-flash-2026-02-10`（百炼） | $2.80 | 中文标点，输出风格与 MAI 接近；语速快和复杂场景与 gpt-4o-mini 一样拉跨 |
| 稳定备份（OpenRouter） | `openai/gpt-4o-mini-transcribe` | 约 $4.32 | 中英文混合够用；英文标点，可能把陌生专有名词改写为常见词 |
| 免费额度优先 | `elevenlabs/scribe_v2` | 约 $35.00 | 微软量级；每月免费 10K 积分约可转写 2.5 小时，能注册就注册 |
| 长时间大文件 | `AssemblyAI Universal-3 Pro` | 待补充（免费额度大） | 两三小时以上长音频效果最好；返回慢，不适合语音输入法 |
| 长时间大文件 | `Mistral Voxtral Small` | 待补充 | 注册简单、识别准确；输出无标点 |
| 按需付费 | `microsoft/mai-transcribe-1.5` | $8.64 | 中英文混合效果好，中文标点，整体体验与千问类似；与 gpt-4o-transcribe 同价，同价时优先 |
| 按需付费 | `openai/gpt-4o-transcribe` | 约 $8.64 | 贵有贵的道理，语速快也能稳定 ⭐；英文标点，适合重要内容 |
| 本地备用 | `Whisper Large v3 Turbo` | 免费 | 精度尚可、响应快；不支持标点，不适合长对话 |
| 应急备用 | 千问 full ASR（`fun-asr`，百炼） | —（$0.116/小时） | 仅异步调用，不参与 24h 统计；网页端单文件 ≤50MB，超出需拆分或压缩上传；识别效果不好，价格偏贵 |

## 备选模型评价

已测试但当前未采用，供以后不同任务选型参考：

| 模型 | 每小时价格 | 评价 |
| --- | ---: | --- |
| `openai/gpt-transcribe` | 约 $0.270 | 官方估算 $0.0045/分钟，价格介于 GPT-4o Mini Transcribe 与 GPT-4o Transcribe 之间；性能预期优于 gpt-4o-transcribe 且更便宜，但实测网络返回速度较慢，仅作日常备选；OpenAI 官方直连，OpenRouter 尚未上线 |
| `qwen/qwen3-asr-flash-2026-02-10`（OpenRouter） | $0.126 | 不推荐：同百炼千问，但价格更高且充值有手续费 |
| `openai/whisper-large-v3-turbo` | $0.040 | 不推荐：识别效果与本地相近；本地速度更快且免费 |
| `openai/whisper-large-v3` | $0.090 | 不推荐：结果不稳定，有时不识别中文或自动翻译成英文 |
| `openai/whisper-1` | $0.360 | 不推荐：旧版 Whisper，直接使用本地模型 |
| `google/chirp-3` | $0.960 | 不推荐：单纯用于语音转写价格过高 |
| Groq Whisper Large v3 Turbo | — | 与本地 Large v3 差距不大，只是云端更快，没有准确率优势 |
| Deepgram Nova-3 | — | 准确率还低于 Whisper，没有明显使用价值 |

## 长音频转录（特殊场景）

多次转录交叉校验后的综合准确率排名：**AssemblyAI > 本地 Whisper > 千问 full ASR > Mistral**。

注意千问 full ASR 的 ≤50MB 是体积限制而非时长限制：超长音频拆分或压缩后即可上传，并非时间长就会失败。长音频不走 Spokenly 实时输入，AssemblyAI 返回慢的问题在此场景可以接受。

## 选择说明

- 联网模型普遍需要等待上传和接口返回；通过 Worker 或 OpenRouter 都会受到网络波动影响，不能把延迟归因于某一个模型。
- 百炼仍有免费额度或余额、Worker 与网络稳定时优先使用；Spokenly 如果支持百炼千问直连，则取消 Worker 中转。
- 工作量较低时暂不订阅 Typeless，优先使用百炼千问；假期结束后工作量明显增加时恢复订阅。Typeless 年费折合约 $6/月，持续高用量时更划算。
- 不同模型都会出现错识别，没有一个模型在所有内容上都更好；实际选择以转写场景和后续校订量为准。

## Artificial Analysis 非流式榜单

数据来自 [Artificial Analysis 非流式语音识别榜单](https://artificialanalysis.ai/speech-to-text/non-streaming)。AA-WER 为榜单词错误率指标，越低越准确。

| 排名 | 服务 / 模型 | AA-WER↓ |
| -: | --- | ---: |
| 1 | ElevenLabs Scribe v2 | **2.2%** |
| 2 | Mistral Voxtral Small | **2.8%** |
| 3 | AssemblyAI Universal-3 Pro | **3.1%** |
| 4 | 本地 Whisper Large v3 | **约 4.1%–4.5%** |
| 5 | Groq Whisper Large v3 Turbo | **4.6%** |
| 6 | Deepgram Nova-3 | **5.2%** |

最快查看方式：打开 Speech to Text → Non-streaming 页面后：

1. 看最上面的 Artificial Analysis Word Error Rate Index (Non-streaming) 图。
2. 只看横轴或模型旁的 AA-WER，越低越准确。
3. 想直接查数字，拉到页面底部 Summary of Key Metrics & Further Information，按 `Ctrl+F` 搜索模型名称；该处同时列出模型、供应商、错误率、速度和价格。

## 价格口径

- 每月按 24 小时计算；每小时 $0.10 对应每月 $2.40。
- 百炼价格按 $1 = ¥6.80 换算。
- GPT Transcribe 按 Token 计费（音频计为输入、转写文字计为输出），表中每小时估价按当前 OpenRouter 单价反推，实际费用随语速、语言和分词结果变化；生成式计费可以解释其标点和语义归一化倾向。
- MAI Transcribe 按音频时长计费，OpenRouter 记录不显示 Token 明细。
- ElevenLabs `scribe_v2` 按账户积分统计：免费档每月 10K 积分，实测约 4.01K 积分/小时（10K 约可转写 2.5 小时）；按充值价格 $3.64 = 10K 积分折算，24 小时约 $35.00（约 $1.46/小时）。官方 API 价格页另显示 $0.22/小时，属于 API 美元计费口径，与账户积分口径不同。
- 其他模型按音频时长计费。
- 价格参考：[百炼模型计费](https://help.aliyun.com/en/model-studio/model-pricing)、[OpenRouter 语音模型](https://openrouter.ai/collections/speech-to-text-models)、[OpenAI API 计费](https://developers.openai.com/api/docs/pricing)、[ElevenLabs API 计费](https://elevenlabs.io/pricing/api?price.section=speech_to_text)。

## 参考链接

- [Introducing MAI-Transcribe-1.5](https://microsoft.ai/news/mai-transcribe-1-5more-accurate-context-aware-and-built-for-production/)：说明 FULL ASR > Microsoft > openai。
- [Artificial Analysis：MAI-Transcribe-1.5](https://artificialanalysis.ai/articles/mai-transcribe-1-5-new-speech-to-text-model-leading-the-accuracy-speed-pareto-frontier)：记录 `Scribe v2` 的 AA-WER 为 2.2%，略低于 MAI-Transcribe-1.5 的 2.4%；该结果作为待测试依据，不代替中文及中英文混合场景的个人实测。
