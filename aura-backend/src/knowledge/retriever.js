/**
 * RAG 检索模块 —— 启动时加载 vector-store.json，
 * 运行时将用户 query 向量化后做余弦相似度检索。
 */

import dotenv from "dotenv";
import OpenAI from "openai";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const embeddingBaseURL = (process.env.EMBEDDING_BASE_URL || "https://api.siliconflow.cn/v1").trim();
const embeddingApiKey = (process.env.EMBEDDING_API_KEY || "").trim();
const embeddingModel = (process.env.EMBEDDING_MODEL || "netease-youdao/bce-embedding-base_v1").trim();

const storePath = fileURLToPath(new URL("./vector-store.json", import.meta.url));

let store = null;
let client = null;

function ensureLoaded() {
  if (store) return true;
  if (!existsSync(storePath)) {
    console.warn("[retriever] vector-store.json not found — run `npm run build:vectors` first");
    return false;
  }
  store = JSON.parse(readFileSync(storePath, "utf-8"));
  if (embeddingApiKey) {
    client = new OpenAI({ apiKey: embeddingApiKey, baseURL: embeddingBaseURL, timeout: 15000 });
  }
  console.log(`[retriever] loaded ${store.chunks.length} vectors (model: ${store.model})`);
  return true;
}

function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedQuery(text) {
  const res = await client.embeddings.create({ model: embeddingModel, input: text });
  return res.data[0].embedding;
}

/**
 * 检索与 query 最相关的 topK 个知识片段。
 * 返回 [{ id, source, category, text, score }]
 */
export async function retrieve(query, topK = 3) {
  if (!ensureLoaded() || !client) {
    console.warn("[retriever] RAG unavailable, returning empty results");
    return [];
  }

  const qVec = await embedQuery(query);

  const scored = store.chunks.map((chunk) => ({
    id: chunk.id,
    source: chunk.source,
    category: chunk.category,
    text: chunk.text,
    score: cosineSimilarity(qVec, chunk.vector),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * 当 RAG 不可用时（无 vector-store 或无 embedding key），
 * server.js 可调用此函数判断是否应该 fallback 到全量注入。
 */
export function isAvailable() {
  return ensureLoaded() && !!client;
}
