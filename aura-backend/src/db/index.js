import mysql from "mysql2/promise";

const host = (process.env.MYSQL_HOST || "localhost").trim();
const port = Number(process.env.MYSQL_PORT || 3306);
const user = (process.env.MYSQL_USER || "root").trim();
const password = (process.env.MYSQL_PASSWORD || "").trim();
const database = (process.env.MYSQL_DATABASE || "aura_app").trim();

let pool = null;

export function getPool() {
  if (!pool) {
    if (!password && process.env.NODE_ENV !== "test") {
      console.warn("[aura-backend] MYSQL_PASSWORD not set. DB APIs will fail.");
    }
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function ensureUser(deviceId) {
  const db = getPool();
  const [rows] = await db.execute(
    "INSERT INTO users (device_id) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
    [deviceId],
  );
  const [[row]] = await db.execute(
    "SELECT id FROM users WHERE device_id = ? LIMIT 1",
    [deviceId],
  );
  return row?.id ?? null;
}

export async function saveProfile(userId, profile) {
  const db = getPool();
  const { birthDate, birthTime, region = {} } = profile;
  const province = (region.province ?? "").toString();
  const city = (region.city ?? "").toString();
  const district = (region.district ?? "").toString();
  await db.execute(
    `INSERT INTO profiles (user_id, birth_date, birth_time, region_province, region_city, region_district)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       birth_date = VALUES(birth_date),
       birth_time = VALUES(birth_time),
       region_province = VALUES(region_province),
       region_city = VALUES(region_city),
       region_district = VALUES(region_district)`,
    [userId, birthDate || "", birthTime || null, province, city, district],
  );
}

export async function getProfile(userId) {
  const db = getPool();
  const [rows] = await db.execute(
    "SELECT birth_date, birth_time, region_province, region_city, region_district FROM profiles WHERE user_id = ? LIMIT 1",
    [userId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    birthDate: r.birth_date,
    birthTime: r.birth_time || undefined,
    region: {
      province: r.region_province,
      city: r.region_city,
      district: r.region_district,
    },
  };
}

export async function saveBaziResult(userId, result) {
  const db = getPool();
  const scoresJson = JSON.stringify(result.scores || {});
  const detailText = (result.detailText ?? "").toString().slice(0, 16383);
  await db.execute(
    "INSERT INTO bazi_results (user_id, dominant, scores_json, detail_text) VALUES (?, ?, ?, ?)",
    [userId, result.dominant || "", scoresJson, detailText],
  );
}

export async function getLatestBazi(userId) {
  const db = getPool();
  const [rows] = await db.execute(
    "SELECT dominant, scores_json, detail_text FROM bazi_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    [userId],
  );
  const r = rows[0];
  if (!r) return null;
  let scores = {};
  try {
    scores = typeof r.scores_json === "string" ? JSON.parse(r.scores_json) : r.scores_json || {};
  } catch {}
  return {
    dominant: r.dominant,
    scores,
    detailText: r.detail_text,
  };
}

export async function saveTarotReading(userId, data) {
  const db = getPool();
  const cardsJson = data.cards ? JSON.stringify(data.cards) : null;
  const interpretation = (data.interpretation ?? "").toString().slice(0, 16383);
  const crystalName = (data.crystal?.name ?? "").toString().slice(0, 64);
  const crystalReason = (data.crystal?.reason ?? "").toString().slice(0, 255);
  await db.execute(
    "INSERT INTO tarot_readings (user_id, cards_json, interpretation, crystal_name, crystal_reason) VALUES (?, ?, ?, ?, ?)",
    [userId, cardsJson, interpretation, crystalName, crystalReason],
  );
}

export async function getCrystalIds(userId) {
  const db = getPool();
  const [rows] = await db.execute(
    "SELECT crystal_id FROM crystal_collections WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map((r) => r.crystal_id);
}

export async function addCrystal(userId, crystalId, crystalName) {
  const db = getPool();
  await db.execute(
    "INSERT INTO crystal_collections (user_id, crystal_id, crystal_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE crystal_name = VALUES(crystal_name)",
    [userId, crystalId, crystalName || crystalId],
  );
}

export async function removeCrystal(userId, crystalId) {
  const db = getPool();
  await db.execute("DELETE FROM crystal_collections WHERE user_id = ? AND crystal_id = ?", [userId, crystalId]);
}
