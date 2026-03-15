-- Aura 小程序 MySQL 建表脚本
-- 执行：mysql -u root -p aura_app < src/db/schema.sql
-- 或：先创建数据库 CREATE DATABASE IF NOT EXISTS aura_app; 再执行本文件

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64) NOT NULL UNIQUE COMMENT '客户端设备标识（匿名用户）',
  openid VARCHAR(64) DEFAULT NULL COMMENT '微信 openid（后期登录用）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  birth_date VARCHAR(20) NOT NULL COMMENT '出生日期 YYYY-MM-DD',
  birth_time VARCHAR(20) DEFAULT NULL COMMENT '出生时间 HH:mm',
  region_province VARCHAR(64) DEFAULT '',
  region_city VARCHAR(64) DEFAULT '',
  region_district VARCHAR(64) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bazi_results (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  dominant VARCHAR(16) NOT NULL COMMENT '主导五行：金/木/水/火/土',
  scores_json JSON NOT NULL COMMENT '{"metal":0,"wood":0,"water":0,"fire":0,"earth":0}',
  detail_text TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tarot_readings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  cards_json JSON DEFAULT NULL COMMENT '三张牌信息',
  interpretation TEXT DEFAULT NULL,
  crystal_name VARCHAR(64) DEFAULT NULL,
  crystal_reason VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crystal_collections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  crystal_id VARCHAR(64) NOT NULL COMMENT '图鉴中的水晶 id',
  crystal_name VARCHAR(64) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_crystal (user_id, crystal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
