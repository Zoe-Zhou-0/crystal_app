import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

const port = Number(process.env.PORT || 8787);
const baseURL = (process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1").trim();
const model = (process.env.MOONSHOT_MODEL || "kimi-k2.5").trim();
const apiKey = (process.env.MOONSHOT_API_KEY || "").trim();

if (!apiKey) {
  // 不直接 throw，方便在没配 key 时也能启动并返回明确错误
  console.warn("[aura-backend] MOONSHOT_API_KEY is not set. /api/chat will return 500.");
}

const openai = new OpenAI({
  apiKey,
  baseURL,
});

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: true,
    credentials: false,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "aura-backend", model, baseURL });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message ?? "").toString().trim();
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "MOONSHOT_API_KEY is not set" });
    }

    const system = [
      "你是 Aura，一位温柔、专业、克制的智能水晶疗愈与全息能量管家。",
      "沟通法则：先接住情绪，再给玄学视角的疏导，最后才顺带提水晶建议。",
      "输出要简洁、有结构（分段/要点），避免长篇大论。",
      "现在先只返回自然语言文本；后续会扩展为可选 JSON 卡片协议。",
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model,
      temperature: 1,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "";
    res.json({ reply: reply || "我在。你可以慢慢说，我会一直在这里陪你。" });
  } catch (err) {
    console.error("[aura-backend] /api/chat error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`[aura-backend] listening on http://127.0.0.1:${port}`);
  console.log(`[aura-backend] baseURL=${baseURL}`);
  console.log(`[aura-backend] model=${model}`);
});

