# aura-backend

最小 Node.js 后端：代理 Moonshot(Kimi) 调用，避免把 Key 放进小程序端；MySQL 持久化用户数据。

## 环境变量

从仓库根目录复制：

- `cp ../.env.example ../.env`

需要填写：

- `MOONSHOT_API_KEY`

可选：

- `MOONSHOT_BASE_URL`（默认 `https://api.moonshot.cn/v1`）
- `MOONSHOT_MODEL`（默认 `kimi-k2.5`）
- `PORT`（默认 `8787`）
- `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE`（用于持久化）

## MySQL 初始化

首次使用前执行：

```bash
cd aura-backend
npm i
npm run db:init
```

需在 `.env` 中配置 `MYSQL_*` 变量。未配置时，数据 API 返回 503，小程序会退回本地存储。

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

数据接口（需 `x-device-id` 请求头）：

- `POST /api/profile` - 保存测算档案
- `GET /api/profile` - 获取档案
- `POST /api/bazi` - 保存五行结果
- `GET /api/bazi` - 获取最新五行
- `POST /api/tarot` - 保存塔罗解读
- `GET /api/crystals` - 获取晶匣收藏
- `POST /api/crystals` - 添加收藏
- `DELETE /api/crystals/:id` - 移除收藏

