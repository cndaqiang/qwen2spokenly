## 直接结论

* 追求 T0 效果且想白嫖的，注册 ElevenLabs 免费账户，每月约有 2.5 小时免费额度
* 用量不大的建议通过 OpenRouter API 接入 `mai-transcribe-1.5`
* 用量 >24h/月，直接选 Typeless 教育优惠套餐（折合 $6/月）

## Spokenly

* 一款语音输入法，支持自定义 API，也支持本地 Whisper Large v3 Turbo 模型识别
* 为什么不用豆包/微信？这些总是会切换系统输入法，而 Spokenly 并不改变系统输入法，只是通过快捷键触发，再写入输入框
* 同类产品推荐 Typeless（非常推荐，教育优惠年费折合 $6/月）；按月购买可以通过邀请小号降到 $10/月

## 模型设置

在设置中直接配置 API 即可
![图片|690x256](upload://8ky0EymbcwNUFDEg7vyz8o3Iq5W.png)

## 模型排名

* 来源：[speech-to-text](https://artificialanalysis.ai/speech-to-text/non-streaming)
* 这个排名和我实际体验的效果还是很接近的：**ElevenLabs 的 Scribe v2 实力 T0；微软的 MAI 和 GPT-4o Transcribe 属第一梯队，价格相同（偏高）。** 阿里的 ASR 暂时无法直接接入（qwen3-asr-flash 可以从百炼接入，但 flash 属于第二梯队）
* 关键 AA-WER（词错误率，越低越准）：Scribe v2 **2.2%**、MAI **2.4%**、Voxtral Small **2.8%**、Universal-3 Pro **3.1%**；本地 Whisper Large v3 约 **4.1%–4.5%**
  ![图片|611x500](upload://1EMeSi6HiK4NZWDGoHsJOt01jHQ.png)

## 完整对比

下表中的标识说明：

* `本地`表示 Spokenly 的本地运行模型
* `百炼`表示从阿里百炼接入，转为 OpenAI 兼容的模式（L站里面有教程），再接入 Spokenly
* `qwen/xxx, openai/xxx, microsoft/xxx, google/xxx`表示从 OpenRouter 购买 API，直接接入 Spokenly
* `elevenlabs`表示从 ElevenLabs 注册获取的 API

| 模型 | 每小时价格 | 评价（相比本地） |
|----|---:|----|
| 本地/Whisper Large v3 Turbo | 免费 | 精度尚可且响应很快；不支持标点，不适合长对话 |
| 百炼/fun-asr | $0.116 | 仅支持异步调用，**未找到接入Spokenly方案** |
| 百炼/fun-asr-flash-2026-06-15 | $0.116 | 准确率与本地接近，带中文标点；低价，但**依赖自建 Worker 的网络稳定性** |
| 百炼/qwen3-asr-flash-2026-02-10 | $0.116 | 同版本实测准确度达到 GPT-4o Transcribe 同档；使用中文标点，输出风格与 MAI 接近 |
| qwen/qwen3-asr-flash-2026-02-10 | $0.126 | **不推荐**，同百炼千问，但价格更高且充值有手续费 |
| openai/gpt-4o-mini-transcribe | 约 $0.180 | 中英文混合能够满足基本要求；使用英文标点，但可能将陌生专有名词改写为常见词 |
| openai/gpt-4o-transcribe | 约 $0.360 | 准确度较高，使用英文标点；适合重要内容 |
| openai/whisper-large-v3-turbo | $0.040 | **不推荐**，识别效果与本地相近；本地速度更快且免费 |
| openai/whisper-large-v3 | $0.090 | **不推荐**，结果不稳定，有时不识别中文或自动翻译成英文 |
| microsoft/mai-transcribe-1.5 | $0.360 | 中英文混合识别效果较好；使用中文标点，整体体验与千问类似，但价格较高 |
| google/chirp-3 | $0.960 | **不推荐**，单纯用于语音转写价格过高 |
| openai/whisper-1 | $0.360 | **不推荐**，属于旧版 Whisper，建议使用本地模型 |
| elevenlabs/scribe_v2 | 约 $1.46 | **每月免费 10K 积分约可转写 2.5 小时**；按 $3.64/10K 积分充值价格折算；**风控严格，批量注册获取的 API 也不让用** |
| assemblyai/universal-3-pro | $0.210 | 注册简单且免费额度大，准确率较高；**返回文本太慢** |
| mistral/voxtral-small-2507 | $0.240 | 注册与配置简单，准确率较高；**中文输出没有标点**,英文有标点 |

如果长对话需要标点符号，我的优先使用顺序：

> elevenlabs > mai-transcribe-1.5 \~ gpt-4o-transcribe >> openai/gpt-4o-mini-transcribe \~ qwen3-asr-flash > Whisper Large v3 Turbo

（Mistral 中文输出没有标点、AssemblyAI 返回太慢，因此未列入；Groq 和 Deepgram 准确率不及本地 Whisper，可以不考虑）

## 当前在用方案

按每月约 24 小时语音输入计算：

| 档位 | 模型 | 每月大致价格 | 长期使用后反馈
| --- | --- | ---: | ---: |
| 日常使用T2 | `fun-asr-flash-2026-06-15` | $2.80 | |
| 日常使用T2 | `qwen3-asr-flash-2026-02-10` | $2.80 | `qwen3-asr-flash`和`gpt-4o-mini-transcribe` 在语速快和复杂场景一样拉跨 |
| 日常使用T2 | `openai/gpt-4o-mini-transcribe` | 约 $4.32 | |
| 优先使用T0 | `elevenlabs/scribe_v2` | 约 $35.00（按官网积分充值价格折算） | 微软量级；免费账号每月 10K 积分，实测约可转写 2.5 小时，可以一直注册 |
| 按需使用T1 | `openai/gpt-4o-transcribe` | 约 $8.64 | **贵有贵的道理啊，语速快也能稳定** |
| 按需使用T1 | `microsoft/mai-transcribe-1.5` | $8.64 | 同上|
| 本地备用T3 | `Whisper Large v3 Turbo` | 免费 | |


## 后续个人准备的方案

* ElevenLabs 用几个邮箱尽量注册，充值太贵了
* ElevenLabs 不行后，就继续在 OpenRouter 上用 `mai-transcribe-1.5`
* Typeless 按月购买 $10/月，改成教育优惠年费后折合 $6/月，其实比上面的模型都便宜；不想折腾的时候就回归 Typeless


