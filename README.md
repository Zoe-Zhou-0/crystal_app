# Aura - 智能水晶疗愈与全息能量管家

本仓库包含 Aura 微信小程序（Uni-app）与一个本地可跑通的 Kimi(Moonshot) 代理后端。

## 目录

- `aura-miniapp/`：Uni-app（Vue3 + TS）微信小程序
- `aura-backend/`：Node.js 后端（代理 Moonshot/Kimi；Key 不进入小程序）
- `docs/`：产品与接口文档

## 本地跑通（MVP）

### 1) 启动后端

1. 复制环境变量文件：
   - `cp .env.example .env`
2. 编辑 `.env`，填入 `MOONSHOT_API_KEY`
3. 启动：
   - `cd aura-backend`
   - `npm i`
   - `npm run dev`

默认监听 `http://127.0.0.1:8787`，健康检查：`GET /health`。

### 2) 启动小程序（开发态）

- `cd aura-miniapp`
- `npm i`
- `npm run dev:mp-weixin`

然后用微信开发者工具导入：`aura-miniapp/dist/dev/mp-weixin`。

开发者工具里建议开启“**不校验合法域名**”，否则本地 `http://127.0.0.1:8787` 可能无法请求。

