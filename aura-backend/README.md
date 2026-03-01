# aura-backend

最小 Node.js 后端：代理 Moonshot(Kimi) 调用，避免把 Key 放进小程序端。

## 环境变量

从仓库根目录复制：

- `cp ../.env.example ../.env`

需要填写：

- `MOONSHOT_API_KEY`

可选：

- `MOONSHOT_BASE_URL`（默认 `https://api.moonshot.cn/v1`）
- `MOONSHOT_MODEL`（默认 `kimi-k2.5`）
- `PORT`（默认 `8787`）

## 本地启动

```bash
cd aura-backend
npm i
npm run dev
```

健康检查：

- `GET http://127.0.0.1:8787/health`

聊天接口：

- `POST http://127.0.0.1:8787/api/chat`
- Body：`{ "message": "你好" }`

