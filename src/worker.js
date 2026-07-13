// Upstream ASR endpoint (editable default)
const DEFAULT_UPSTREAM_ASR_ENDPOINT = "{proxy-url}";

// CORS response helpers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
function withCors(res) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders())) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
}
function ok(text, contentType = "text/plain; charset=utf-8") {
  return withCors(new Response(text, { status: 200, headers: { "Content-Type": contentType } }));
}
function json(data, status = 200) {
  return withCors(new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }));
}
function badRequest(message) {
  return json({ error: message }, 400);
}

// Efficient base64 encoding using chunks to avoid quadratic string concatenation
async function encodeBase64(ab) {
  const bytes = new Uint8Array(ab);
  const chunk = 0x8000;
  const parts = [];
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    parts.push(String.fromCharCode(...sub));
  }
  const binary = parts.join("");
  return btoa(binary);
}

// Determine MIME type from file extension
function mimeFromName(name, fallback = "application/octet-stream") {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return fallback;
  const ext = name.slice(dot + 1).toLowerCase();
  switch (ext) {
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "m4a": return "audio/mp4";
    case "flac": return "audio/flac";
    case "ogg":
    case "oga": return "audio/ogg";
    case "webm":
    case "weba": return "audio/webm";
    default: return fallback;
  }
}

// Fun-ASR-Flash requires the actual audio container/codec name in parameters.format.
function formatFromName(name) {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  const ext = name.slice(dot + 1).toLowerCase();
  switch (ext) {
    case "oga": return "ogg";
    case "weba": return "webm";
    case "aif":
    case "aifc": return "aiff";
    default: return ext;
  }
}

// DashScope transcription handler
async function handleDashscope({ file, language, prompt, modelRaw, enableITN, dashKey }) {
  // 解析模型，默认 qwen3-asr-flash，并去掉 :itn 后缀
  const model = (modelRaw || "").replace(/:itn$/i, "") || "qwen3-asr-flash";
  const isQwenASRFlash = /^qwen3-asr-flash(?:-|$)/i.test(model);
  const isFunASRFlash = /^fun-asr-flash(?:-|$)/i.test(model);
  if (!isQwenASRFlash && !isFunASRFlash) {
    return badRequest(`unsupported DashScope model: ${model}`);
  }

  // 1) 获取临时上传策略
  const policyResp = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/uploads?action=getPolicy&model=" + encodeURIComponent(model),
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${dashKey}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (!policyResp.ok) {
    return json({ error: "getPolicy failed", detail: await policyResp.text() }, 502);
  }
  const policyJSON = await policyResp.json().catch(async () => ({ error: await policyResp.text() }));
  const policy = policyJSON?.data;
  if (!policy) {
    return json({ error: "invalid getPolicy response", detail: policyJSON }, 502);
  }

  // 2) 上传文件到临时 OSS
  const uploadDir = (policy.upload_dir || "").replace(/\/+$/, "");
  const key = uploadDir ? `${uploadDir}/${file.name || "upload"}` : (file.name || "upload");
  const ossForm = new FormData();
  ossForm.set("OSSAccessKeyId", policy.oss_access_key_id);
  ossForm.set("Signature", policy.signature);
  ossForm.set("policy", policy.policy);
  if (policy.x_oss_object_acl) ossForm.set("x-oss-object-acl", policy.x_oss_object_acl);
  if (policy.x_oss_forbid_overwrite) ossForm.set("x-oss-forbid-overwrite", policy.x_oss_forbid_overwrite);
  if (policy.x_oss_security_token) ossForm.set("x-oss-security-token", policy.x_oss_security_token);
  ossForm.set("key", key);
  ossForm.set("success_action_status", "200");
  ossForm.set("file", file, file.name || "upload");
  const ossResp = await fetch(policy.upload_host, { method: "POST", body: ossForm });
  if (!ossResp.ok) {
    return json({ error: "OSS upload failed", detail: await ossResp.text() }, 502);
  }
  const ossUrl = `oss://${key}`;

  // 3) 调用 DashScope ASR
  let body;
  if (isFunASRFlash) {
    const format = formatFromName(file.name || "");
    if (!format) {
      return badRequest("Fun-ASR-Flash requires a file name with an audio format extension");
    }

    const messages = [];
    const context = prompt.trim().slice(0, 400);
    if (context) {
      messages.push({
        role: "user",
        content: [{ type: "input_text", text: context }],
      });
    }
    messages.push({
      role: "user",
      content: [{ type: "input_audio", input_audio: { data: ossUrl } }],
    });

    body = {
      model,
      input: { messages },
      // sample_rate is optional. Do not declare one because this Worker does not resample audio.
      parameters: { format },
    };
  } else {
    const asrOptions = {
      // 语言识别默认开启
      enable_lid: true,
      // ITN 默认关闭，若启用则置 true
      enable_itn: false,
      ...(language !== "auto" ? { language } : {}),
    };
    if (enableITN) asrOptions.enable_itn = true;

    body = {
      model,
      input: {
        messages: [
          { role: "system", content: [{ text: prompt || "" }] },
          { role: "user", content: [{ audio: ossUrl }] },
        ],
      },
      parameters: {
        asr_options: asrOptions,
      },
    };
  }

  const asrResp = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dashKey}`,
        "Content-Type": "application/json",
        "X-DashScope-OssResourceResolve": "enable",
        ...(isFunASRFlash ? { "X-DashScope-SSE": "disable" } : {}),
      },
      body: JSON.stringify(body),
    },
  );
  const asrJSON = await asrResp.json().catch(async () => ({ error: await asrResp.text() }));
  if (!asrResp.ok) return json({ error: "ASR not ok", detail: asrJSON }, 502);

  let text = "";
  if (isFunASRFlash) {
    text = asrJSON?.output?.text
      || asrJSON?.output?.sentence?.text
      || asrJSON?.output?.output?.text
      || asrJSON?.output?.output?.sentence?.text
      || "";
  } else {
    const msg = asrJSON?.output?.choices?.[0]?.message;
    text = Array.isArray(msg?.content) ? (msg.content.find((x) => x?.text)?.text || "") : "";
  }
  return json({ text }, 200);
}

export default {
  async fetch(request, env) {
    // Preflight
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return ok("ok");
    }

    // 新版 Spokenly 保存配置前会读取 OpenAI 标准模型列表
    if (url.pathname === "/v1/models") {
      if (request.method !== "GET") return badRequest("method must be GET");
      return json({
        object: "list",
        data: [
          {
            id: "qwen3-asr-flash",
            object: "model",
            created: 0,
            owned_by: "qwen",
          },
          {
            id: "qwen3-asr-flash:itn",
            object: "model",
            created: 0,
            owned_by: "qwen",
          },
          {
            id: "fun-asr-flash-2026-06-15",
            object: "model",
            created: 0,
            owned_by: "alibaba-cloud",
          },
        ],
      });
    }

    if (url.pathname === "/v1/audio/transcriptions") {
      if (request.method !== "POST") return badRequest("method must be POST");

      // Parse multipart form
      let form;
      try {
        form = await request.formData();
      } catch (e) {
        return badRequest(`failed to parse multipart form: ${String(e?.message || e)}`);
      }

      const file = form.get("file");
      if (!(file instanceof File)) {
        return badRequest("missing required file field");
      }

      const language = form.get("language")?.toString() || "auto";
      const prompt = form.get("prompt")?.toString() || "";
      const modelRaw = form.get("model")?.toString() || "";
      const enableITN = (() => {
        const m = modelRaw.trim().toLowerCase();
        return m === ":itn" || m.endsWith(":itn");
      })();

      // 路由判定：存在 Bearer token 则走 DashScope，否则走 Z.ai
      const auth = request.headers.get("Authorization");
      const dashKey = auth && auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
      if (dashKey) {
        return await handleDashscope({ file, language, prompt, modelRaw, enableITN, dashKey });
      }

      // Read file and encode to base64
      let b64 = "";
      let sizeBytes = 0;
      try {
        const ab = await file.arrayBuffer();
        sizeBytes = ab.byteLength;
        b64 = await encodeBase64(ab);
      } catch (e) {
        return json({ error: `failed to read file: ${String(e?.message || e)}` }, 500);
      }

      const upstream = (env && env.UPSTREAM_ASR_ENDPOINT) || DEFAULT_UPSTREAM_ASR_ENDPOINT;
      const payload = {
        audio_file: {
          data: b64,
          name: file.name || "upload",
          type: (file.type && file.type !== "application/octet-stream") ? file.type : mimeFromName(file.name || ""),
          size: (typeof file.size === "number" && file.size >= 0) ? file.size : sizeBytes,
        },
        language,
      };

      const context = prompt.trim();
      if (context) payload.context = context;
      if (enableITN) payload.enable_itn = true;

      let upResp;
      try {
        upResp = await fetch(upstream, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        return json({ error: `upstream request failed: ${String(e?.message || e)}` }, 502);
      }

      // Parse upstream response efficiently
      const ct = upResp.headers.get("content-type") || "";
      let upJSON;
      if (ct.includes("application/json")) {
        try {
          upJSON = await upResp.json();
        } catch (e) {
          // Fallback to text for error details
          const fallbackText = await upResp.text();
          return json({ error: "invalid upstream json", detail: fallbackText }, 502);
        }
        if (!upResp.ok) {
          return json({ error: "upstream not ok", detail: upJSON }, 502);
        }
      } else {
        const upText = await upResp.text();
        if (!upResp.ok) {
          return json({ error: "upstream not ok", detail: upText }, 502);
        }
        try {
          upJSON = JSON.parse(upText);
        } catch {
          return json({ error: "invalid upstream response", detail: upText }, 502);
        }
      }

      if (upJSON && upJSON.success === false) {
        return json(upJSON, 502);
      }

      const data = Array.isArray(upJSON?.data) ? upJSON.data : [];
      const recognizedText = data[0] || "";
      return json({ text: recognizedText }, 200);
    }

    return json({ error: "not found" }, 404);
  },
};
