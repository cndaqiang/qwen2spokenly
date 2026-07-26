# 语音模型对比与个人选择

本文记录 Spokenly 中本地、百炼、OpenRouter 与 ElevenLabs 语音模型的实际测试结果，并结合 Artificial Analysis 非流式榜单对比 Mistral、AssemblyAI 等其他服务。模型评价以个人使用体验为主，价格用于比较长期使用成本。

## 实际采用的模型

按每月约 24 小时语音输入计算：

| 档位 | 模型 | 每月大致价格 | 长期使用后反馈
| --- | --- | ---: | ---: |
| 日常使用 | `fun-asr-flash-2026-06-15` | $2.80 | |
| 日常使用 | `qwen3-asr-flash-2026-02-10` | $2.80 | `qwen3-asr-flash`和`gpt-4o-mini-transcribe` 在语速快和复杂场景一样拉跨 |
| 日常使用 | `openai/gpt-4o-mini-transcribe` | 约 $4.32 | |
| 优先使用 | `elevenlabs/scribe_v2` | 约 $35.00（按官网积分充值价格折算） | 微软量级；免费账号每月 10K 积分，实测约可转写 2.5 小时，可以一直注册 |
| 按需使用 | `openai/gpt-4o-transcribe` | 约 $8.64 | **贵有贵的道理啊,语速快也能稳定** ⭐|
| 按需使用 | `microsoft/mai-transcribe-1.5` | $8.64 | |
| 本地备用 | `Whisper Large v3 Turbo` | 免费 | |

## 完整对比

| 模型 | 每小时价格 | 评价（相比本地） |
| --- | ---: | --- |
| 本地/Whisper Large v3 Turbo | 免费 | 精度尚可且响应很快；不支持标点，不适合长对话 |
| 百炼/fun-asr | $0.116 | 仅支持异步调用，**不适合 Spokenly** |
| 百炼/fun-asr-flash-2026-06-15 | $0.116 | 准确率与本地接近，带中文标点；低价，但依赖自建 Worker 和网络稳定性 |
| 百炼/qwen3-asr-flash-2026-02-10 | $0.116 | 同版本实测准确度达到 GPT-4o Transcribe 同档；使用中文标点，输出风格与 MAI 接近 |
| qwen/qwen3-asr-flash-2026-02-10 | $0.126 | **不推荐**，同百炼千问，但价格更高且充值有手续费 |
| openai/gpt-4o-mini-transcribe | 约 $0.180 | 中英文混合能够满足基本要求；使用英文标点，但可能将陌生专有名词改写为常见词 |
| elevenlabs/scribe_v2 | 约 $1.46 | 每月免费 10K 积分约可转写 2.5 小时；按 $3.64/10K 积分充值价格折算 |
| openai/gpt-4o-transcribe | 约 $0.360 | 准确度较高，使用英文标点；适合重要内容 |
| openai/whisper-large-v3-turbo | $0.040 | **不推荐**，识别效果与本地相近；本地速度更快且免费 |
| openai/whisper-large-v3 | $0.090 | **不推荐**，结果不稳定，有时不识别中文或自动翻译成英文 |
| microsoft/mai-transcribe-1.5 | $0.360 | 中英文混合识别效果较好；使用中文标点，整体体验与千问类似，但价格较高 |
| google/chirp-3 | $0.960 | **不推荐**，单纯用于语音转写价格过高 |
| openai/whisper-1 | $0.360 | **不推荐**，属于旧版 Whisper，建议使用本地模型 |

## Artificial Analysis 非流式榜单

数据来自 [Artificial Analysis 非流式语音识别榜单](https://artificialanalysis.ai/speech-to-text/non-streaming)。AA-WER 为榜单词错误率指标，越低越准确。

| 排名 | 服务 / 模型 | AA-WER↓ | 实际结论 |
| -: | --- | ---: | --- |
| 1 | ElevenLabs Scribe v2 | **2.2%** | 效果最好、标点正常；免费额度少，批量注册容易触发风控 |
| 2 | Mistral Voxtral Small | **2.8%** | 注册简单、识别准确；当前接口输出没有标点 |
| 3 | AssemblyAI Universal-3 Pro | **3.1%** | 免费额度大、注册简单；返回太慢，不适合语音输入法 |
| 4 | 本地 Whisper Large v3 | **约 4.1%–4.5%** | 可直接本地运行，综合更实用 |
| 5 | Groq Whisper Large v3 Turbo | **4.6%** | 与本地 Large v3 差距不大，只是云端更快，没有准确率优势 |
| 6 | Deepgram Nova-3 | **5.2%** | 准确率还低于 Whisper，没有明显使用价值 |

最快查看方式：打开 Speech to Text → Non-streaming 页面后：

1. 看最上面的 Artificial Analysis Word Error Rate Index (Non-streaming) 图。
2. 只看横轴或模型旁的 AA-WER，越低越准确。
3. 想直接查数字，拉到页面底部 Summary of Key Metrics & Further Information，按 `Ctrl+F` 搜索模型名称；该处同时列出模型、供应商、错误率、速度和价格。

目前实际选择顺序：**ElevenLabs > Mistral > AssemblyAI > 本地 Whisper**；Groq 和 Deepgram 可以不考虑。

## 选择说明

- 联网模型普遍需要等待上传和接口返回；通过 Worker 或 OpenRouter 都会受到网络波动影响，不能把延迟归因于某一个模型。
- 百炼仍有免费额度或余额、Worker 与网络稳定时优先使用；Spokenly 如果支持百炼千问直连，则取消 Worker 中转。
- 工作量较低时暂不订阅 Typeless，优先使用百炼千问；假期结束后工作量明显增加时恢复订阅。Typeless 年费折合约 $6/月，持续高用量时更划算。
- 不同模型都会出现错识别，没有一个模型在所有内容上都更好；实际选择以转写场景和后续校订量为准。

## 价格口径

- 每月按 24 小时计算；每小时 $0.10 对应每月 $2.40。
- 百炼价格按 $1 = ¥6.80 换算。
- GPT Transcribe 将音频计为输入 Token、转写文字计为输出 Token，因此使用“约”。按当前 OpenRouter 单价与表内每小时估价反推，在采用约 600 个音频输入 Token/分钟的前提下，隐含约 450 个输出 Token/分钟；若粗略按 1 个中文字符约等于 1 Token，即约 450 字/分钟（7.5 字/秒）。实际费用会随语速、语言和分词结果变化。这种生成式计费可以解释其标点和语义归一化倾向，但不能证明后台额外执行了一次独立的文本转换。
- MAI Transcribe 按音频时长计费，OpenRouter 记录不显示 Token 明细；仅凭账单无法判断其定价较高的具体原因。
- ElevenLabs `scribe_v2` 按官网账户积分统计。当前账户免费档每月提供 10K 积分；实测 1.47 小时消耗 5.89K 积分，约为 4.01K 积分/小时，因此 10K 积分约可转写 2.50 小时。按当前账户显示的充值价格 $3.64 = 10K 积分折算，使用 24 小时约需 $35.00，约合 $1.46/小时。这里的 $35.00 是本文实际使用场景下应采用的成本口径。官方 API 价格页另显示 Scribe v2 为 $0.22/小时，但该价格属于 API 美元计费口径，不用于换算本文的账户积分成本。不知道为什么充值的积分和这个价格是不一样的。但是可以每天免费注册一个账号顶上。
- 其他模型按音频时长计费。
- 价格参考：[百炼模型计费](https://help.aliyun.com/en/model-studio/model-pricing)、[OpenRouter 语音模型](https://openrouter.ai/collections/speech-to-text-models)、[OpenAI API 计费](https://developers.openai.com/api/docs/pricing)、[ElevenLabs API 计费](https://elevenlabs.io/pricing/api?price.section=speech_to_text)。

## 其他

- [Introducing MAI-Transcribe-1.5](https://microsoft.ai/news/mai-transcribe-1-5more-accurate-context-aware-and-built-for-production/)说明 FULL ASR > Microsoft > openai
- [Artificial Analysis：MAI-Transcribe-1.5](https://artificialanalysis.ai/articles/mai-transcribe-1-5-new-speech-to-text-model-leading-the-accuracy-speed-pareto-frontier)记录 `Scribe v2` 的 AA-WER 为 2.2%，略低于 MAI-Transcribe-1.5 的 2.4%；该结果作为待测试依据，不代替中文及中英文混合场景的个人实测。
