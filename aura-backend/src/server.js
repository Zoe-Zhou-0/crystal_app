import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { readFileSync } from "node:fs";
import * as db from "./db/index.js";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

const port = Number(process.env.PORT || 8787);
const host = (process.env.HOST || "0.0.0.0").trim();
const baseURL = (process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1").trim();
const model = (process.env.MOONSHOT_MODEL || "kimi-k2.5").trim();
const apiKey = (process.env.MOONSHOT_API_KEY || "").trim();

if (!apiKey) {
  console.warn("[aura-backend] MOONSHOT_API_KEY is not set. /api/chat will return 500.");
}

const openai = new OpenAI({
  apiKey,
  baseURL,
  timeout: 90000,
});

async function callKimi(createFn) {
  return await createFn();
}

const TAROT_STRUCTURED_OUTPUT_PROMPT = [
  "# Tarot Structured Output",
  "在保持自然语言解读的前提下，请在最后追加一行结构化数据（不要 markdown 代码块）：",
  '<TAROT_DATA>{"crystal":{"name":"推荐水晶名","reason":"推荐理由（30-60字）"}}</TAROT_DATA>',
  "要求：",
  "1) crystal.name 必须是一个具体中文水晶名；",
  "2) crystal.reason 必须和三牌阵整体能量有关；",
  "3) 除最后这一行外，其余文本保持自然对话。",
].join("\n");

function extractTarotCrystal(replyText) {
  const raw = (replyText ?? "").toString();
  if (!raw) return { cleanReply: "", crystal: null };

  let crystal = null;
  const tagged = raw.match(/<TAROT_DATA>([\s\S]*?)<\/TAROT_DATA>/i);
  if (tagged?.[1]) {
    try {
      const parsed = JSON.parse(tagged[1]);
      const name = (parsed?.crystal?.name ?? "").toString().trim();
      const reason = (parsed?.crystal?.reason ?? "").toString().trim();
      if (name && reason) {
        crystal = { name, reason };
      }
    } catch (err) {
      console.warn("[aura-backend] tarot crystal parse failed:", err?.message || err);
    }
  }

  const cleanReply = raw.replace(/<TAROT_DATA>[\s\S]*?<\/TAROT_DATA>/gi, "").trim();
  return { cleanReply, crystal };
}

const GENERAL_CHAT_SYSTEM_PROMPT = [
  "你是 Aura，一位温柔、专业、克制的智能水晶疗愈与全息能量管家。",
  "沟通法则：先接住情绪，再给玄学视角的疏导，最后才顺带提水晶建议。",
  "输出要简洁、有结构（分段/要点），避免长篇大论。",
  "现在先只返回自然语言文本；后续会扩展为可选 JSON 卡片协议。",
].join("\n");

const BAZI_SYSTEM_PROMPT = `# Role
你是 Aura，一位充满高级感、精通现代心理学与晶石疗愈的“全息能量评估师”。

# Task
基于用户提供的【五行能量得分】（如：金80, 木10, 水50, 火90, 土20），结合知识库进行推演，并输出一份温暖、洞察、极具现代感的个人能量图谱解读。

# Constraint (绝对禁忌)
1. 严禁使用算命术语（如克夫、破财、大凶、忌神）。
2. 严禁制造容貌或命运焦虑。必须将“缺陷”解读为“待填补的能量空间”。
3. 必须优先检索知识库中的 <energy_elements> 和 <crystal_prescriptions> 进行作答。

# Output JSON Format (强制输出格式)
{
  "dominant_energy": "主导能量（如：🔥 热情与显化的火能量为主导）",
  "imbalance_analysis": "核心痛点分析。对比最高分和最低分的五行，检索 <energy_elements> 库，用现代隐喻说明这种落差带来的心理体验（约80字）。",
  "conflict_reading": "如果存在相克情况，检索 <能量冲突转译法则> 进行心理视角的解读。如果无明显冲突，给出温柔的日常建议。",
  "healing_action": "疗愈行动指南（如：今天试着放下手机，去接触泥土，补充土能量）。",
  "guardian_crystal": {
    "name": "推荐的晶石名称（必须从 <crystal_prescriptions> 库中挑选用于补齐最低分五行的晶石）",
    "reason": "疗愈逻辑（直接引用库中的 healing_logic 字段）"
  },
  "dominant": "仅用于程序存储的主导五行（金/木/水/火/土）",
  "scores": { "metal": 0-100, "wood": 0-100, "water": 0-100, "fire": 0-100, "earth": 0-100 },
  "detailText": "完整解读文本（可拼接上述分析）"
}

# Response Rule (展示与存储分离)
1. 先输出给用户看的自然语言解读（不要出现“JSON”“代码块”“字段名”等技术词）。
2. 最后单独追加一行隐藏数据，严格用以下包裹格式（不要使用 markdown 代码块）：
<BAZI_DATA>{"dominant":"火","scores":{"metal":42,"wood":55,"water":38,"fire":76,"earth":49},"detailText":"..."}</BAZI_DATA>
3. 除上述标签行外，其他文本必须保持对话感。`;

function loadKnowledgeJson(relativePath) {
  try {
    const fileUrl = new URL(relativePath, import.meta.url);
    const raw = readFileSync(fileUrl, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[aura-backend] failed to load knowledge: ${relativePath}`, err?.message || err);
    return null;
  }
}

const energyElementsKnowledge = loadKnowledgeJson("./knowledge/energy-elements.json");
const geographicEnergyWeightsKnowledge = loadKnowledgeJson("./knowledge/geographic-energy-weights.json");
const crystalPrescriptionsKnowledge = loadKnowledgeJson("./knowledge/crystal-prescriptions.json");

function buildBaziSystemPrompt() {
  const energyElements = energyElementsKnowledge?.energy_elements || {};
  const geographicEnergyWeights = geographicEnergyWeightsKnowledge?.geographic_energy_weights || {};
  const crystalPrescriptions = crystalPrescriptionsKnowledge?.crystal_prescriptions || {};
  return [
    BAZI_SYSTEM_PROMPT,
    "",
    "# KnowledgeBase",
    "<energy_elements>",
    JSON.stringify(energyElements, null, 2),
    "</energy_elements>",
    "",
    "<geographic_energy_weights>",
    JSON.stringify(geographicEnergyWeights, null, 2),
    "</geographic_energy_weights>",
    "",
    "<crystal_prescriptions>",
    JSON.stringify(crystalPrescriptions, null, 2),
    "</crystal_prescriptions>",
  ].join("\n");
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: true,
    credentials: false,
  }),
);

function getDeviceId(req) {
  return (req.headers["x-device-id"] ?? req.body?.device_id ?? "").toString().trim();
}

async function resolveUserId(req, res) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    res.status(400).json({ error: "x-device-id header required", message: "请传入设备标识" });
    return null;
  }
  try {
    const userId = await db.ensureUser(deviceId);
    return userId;
  } catch (err) {
    console.error("[aura-backend] DB resolve user:", err);
    res.status(503).json({ error: "database_unavailable", message: "数据服务暂不可用，请稍后再试" });
    return null;
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "aura-backend", model, baseURL });
});

app.post("/api/profile", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  const profile = req.body?.profile ?? req.body;
  if (!profile?.birthDate) {
    return res.status(400).json({ error: "profile.birthDate required" });
  }
  try {
    await db.saveProfile(userId, profile);
    res.json({ ok: true });
  } catch (err) {
    console.error("[aura-backend] /api/profile error:", err);
    res.status(503).json({ error: "database_unavailable", message: "保存失败，请稍后再试" });
  }
});

app.get("/api/profile", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  try {
    const profile = await db.getProfile(userId);
    res.json({ profile: profile || null });
  } catch (err) {
    console.error("[aura-backend] GET /api/profile error:", err);
    res.status(503).json({ error: "database_unavailable", message: "获取失败，请稍后再试" });
  }
});

app.post("/api/bazi", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  const result = req.body?.result ?? req.body;
  if (!result?.dominant || !result?.scores) {
    return res.status(400).json({ error: "result.dominant and result.scores required" });
  }
  try {
    await db.saveBaziResult(userId, result);
    res.json({ ok: true });
  } catch (err) {
    console.error("[aura-backend] /api/bazi error:", err);
    res.status(503).json({ error: "database_unavailable", message: "保存失败，请稍后再试" });
  }
});

app.get("/api/bazi", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  try {
    const bazi = await db.getLatestBazi(userId);
    res.json({ result: bazi || null });
  } catch (err) {
    console.error("[aura-backend] GET /api/bazi error:", err);
    res.status(503).json({ error: "database_unavailable", message: "获取失败，请稍后再试" });
  }
});

app.post("/api/tarot", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  const data = req.body?.data ?? req.body ?? {};
  try {
    await db.saveTarotReading(userId, data);
    res.json({ ok: true });
  } catch (err) {
    console.error("[aura-backend] /api/tarot error:", err);
    res.status(503).json({ error: "database_unavailable", message: "保存失败，请稍后再试" });
  }
});

app.get("/api/crystals", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  try {
    const ids = await db.getCrystalIds(userId);
    res.json({ ids });
  } catch (err) {
    console.error("[aura-backend] GET /api/crystals error:", err);
    res.status(503).json({ error: "database_unavailable", message: "获取失败，请稍后再试" });
  }
});

app.post("/api/crystals", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  const { crystal_id, crystal_name } = req.body ?? {};
  const id = (crystal_id ?? req.body?.id ?? "").toString().trim();
  const name = (crystal_name ?? req.body?.name ?? id).toString().trim();
  if (!id) return res.status(400).json({ error: "crystal_id required" });
  try {
    await db.addCrystal(userId, id, name);
    res.json({ ok: true });
  } catch (err) {
    console.error("[aura-backend] POST /api/crystals error:", err);
    res.status(503).json({ error: "database_unavailable", message: "保存失败，请稍后再试" });
  }
});

app.delete("/api/crystals/:id", async (req, res) => {
  const userId = await resolveUserId(req, res);
  if (userId === null) return;
  const id = (req.params?.id ?? "").toString().trim();
  if (!id) return res.status(400).json({ error: "crystal id required" });
  try {
    await db.removeCrystal(userId, id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[aura-backend] DELETE /api/crystals error:", err);
    res.status(503).json({ error: "database_unavailable", message: "删除失败，请稍后再试" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message ?? "").toString().trim();
    const systemContext = (req.body?.systemContext ?? "").toString().trim();
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "MOONSHOT_API_KEY is not set" });
    }

    const isBaziQuery = message.includes("[五行排盘]") || message.includes("五行排盘");
    let system = isBaziQuery ? buildBaziSystemPrompt() : GENERAL_CHAT_SYSTEM_PROMPT;
    if (systemContext) {
      system = `${system}\n\n${systemContext}`;
    }

    const completion = await callKimi(() =>
      openai.chat.completions.create({
        model,
        temperature: 1,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
      }),
    );

    const reply = completion.choices?.[0]?.message?.content?.trim() || "";
    res.json({ reply: reply || "我在。你可以慢慢说，我会一直在这里陪你。" });
  } catch (err) {
    console.error("[aura-backend] /api/chat error:", err);
    const is429 = err?.status === 429 || err?.error?.type === "engine_overloaded_error";
    if (is429) {
      return res.status(429).json({ error: "rate_limited", message: "Kimi 服务当前繁忙，请稍后再试" });
    }
    res.status(500).json({ error: "internal_error", message: "服务内部错误" });
  }
});

app.post("/api/tarot-reading", async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ error: "MOONSHOT_API_KEY is not set" });
    }

    const messages = req.body?.messages;
    const temperature = Number(req.body?.temperature ?? 1);
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages is required" });
    }

    const safeMessages = messages
      .map((m) => ({
        role: (m?.role ?? "").toString(),
        content: (m?.content ?? "").toString(),
      }))
      .filter((m) => m.role && m.content);

    if (safeMessages.length === 0) {
      return res.status(400).json({ error: "valid messages is required" });
    }

    const normalizedTemperature = Number.isFinite(temperature) ? temperature : 0.7;

    const completion = await callKimi(() =>
      openai.chat.completions.create({
        model,
        temperature: normalizedTemperature,
        messages: [{ role: "system", content: TAROT_STRUCTURED_OUTPUT_PROMPT }, ...safeMessages],
      }),
    );

    const reply = completion.choices?.[0]?.message?.content?.trim() || "";
    const { cleanReply, crystal } = extractTarotCrystal(reply);
    res.json({
      reply: cleanReply || "我在。我们可以一起慢慢解读这组三牌。",
      crystal,
    });
  } catch (err) {
    console.error("[aura-backend] /api/tarot-reading error:", err);
    const is429 = err?.status === 429 || err?.error?.type === "engine_overloaded_error";
    if (is429) {
      return res.status(429).json({ error: "rate_limited", message: "Kimi 服务当前繁忙，请稍后再试" });
    }
    res.status(500).json({ error: "internal_error", message: "服务内部错误" });
  }
});

app.listen(port, host, () => {
  console.log(`[aura-backend] listening on http://${host}:${port}`);
  console.log(`[aura-backend] baseURL=${baseURL}`);
  console.log(`[aura-backend] model=${model}`);
});

