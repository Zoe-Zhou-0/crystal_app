/**
 * Embedding 构建脚本 —— 将知识 chunks 向量化并写入 vector-store.json。
 *
 * Moonshot 不提供 Embedding API，默认使用 SiliconFlow（硅基流动）的免费
 * netease-youdao/bce-embedding-base_v1 模型（https://siliconflow.cn 注册即得 API Key）。
 *
 * 通过 .env 配置切换到其他 OpenAI 兼容的 embedding 服务：
 *   EMBEDDING_BASE_URL=https://api.siliconflow.cn/v1
 *   EMBEDDING_API_KEY=sk-xxx
 *   EMBEDDING_MODEL=netease-youdao/bce-embedding-base_v1
 */

import dotenv from "dotenv";
import OpenAI from "openai";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildChunks } from "./chunker.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const embeddingBaseURL = (process.env.EMBEDDING_BASE_URL || "https://api.siliconflow.cn/v1").trim();
const embeddingApiKey = (process.env.EMBEDDING_API_KEY || "").trim();
const embeddingModel = (process.env.EMBEDDING_MODEL || "netease-youdao/bce-embedding-base_v1").trim();

if (!embeddingApiKey) {
  console.error(
    "[embedder] EMBEDDING_API_KEY 未配置。\n" +
      "推荐免费方案：前往 https://siliconflow.cn 注册，获取 API Key，\n" +
      "然后在 .env 中添加：\n" +
      "  EMBEDDING_BASE_URL=https://api.siliconflow.cn/v1\n" +
      "  EMBEDDING_API_KEY=sk-你的key\n" +
      "  EMBEDDING_MODEL=netease-youdao/bce-embedding-base_v1",
  );
  process.exit(1);
}

const client = new OpenAI({ apiKey: embeddingApiKey, baseURL: embeddingBaseURL, timeout: 30000 });

async function embedTexts(texts) {
  const res = await client.embeddings.create({ model: embeddingModel, input: texts });
  return res.data.map((d) => d.embedding);
}

async function main() {
  const chunks = buildChunks();
  console.log(`[embedder] ${chunks.length} chunks ready, calling ${embeddingModel} …`);

  const batchSize = 8;
  const results = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.text);
    const vectors = await embedTexts(texts);
    for (let j = 0; j < batch.length; j++) {
      results.push({ ...batch[j], vector: vectors[j] });
    }
    console.log(`[embedder] embedded ${Math.min(i + batchSize, chunks.length)}/${chunks.length}`);
  }

  const outPath = fileURLToPath(new URL("./vector-store.json", import.meta.url));
  writeFileSync(outPath, JSON.stringify({ model: embeddingModel, chunks: results }, null, 2));
  console.log(`[embedder] wrote ${results.length} vectors → ${outPath}`);
}

main().catch((err) => {
  console.error("[embedder] fatal:", err);
  process.exit(1);
});
