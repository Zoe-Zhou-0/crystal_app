#!/usr/bin/env node
/**
 * 初始化 MySQL 数据库与表结构
 * 使用方式：在 aura-backend 目录执行 npm run db:init
 * 需先配置项目根目录 .env 中的 MYSQL_* 变量
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

const host = process.env.MYSQL_HOST || "localhost";
const port = Number(process.env.MYSQL_PORT || 3306);
const user = process.env.MYSQL_USER || "root";
const password = process.env.MYSQL_PASSWORD || "";
const database = process.env.MYSQL_DATABASE || "aura_app";

async function main() {
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`[db:init] Database ${database} ready.`);

    await conn.changeUser({ database });
    const schemaPath = join(__dirname, "schema.sql");
    const sql = readFileSync(schemaPath, "utf-8");
    await conn.query(sql);
    console.log("[db:init] Tables created successfully.");
  } catch (err) {
    console.error("[db:init] Error:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
