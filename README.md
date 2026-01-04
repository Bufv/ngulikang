# Ngulikang Monorepo

## Docker (Development Mode)

```bash
cp .env.example .env

docker compose up --build
```

Stop services:
```bash
docker compose down
```

Clean everything (including volumes):
```bash
docker compose down -v
```

### Access URLs

- Web User: http://localhost
- Panel Admin: http://localhost/admin
- Panel Tukang: http://localhost/tukang
- Backend API: http://localhost/api
- pgAdmin: http://localhost:5050

### Default Credentials (Seed)

- Admin: admin@ngulikang.com / admin123
- Tukang: tukang1@ngulikang.com / tukang123
- User: user1@example.com / user123
- pgAdmin: admin@ngulikang.local / admin

### Troubleshooting

- Port already in use: stop other services on 80/3000/5173/5174/5000/5432/5050.
- DB connection failed: check `.env` at root and ensure `postgres` service is healthy.
- Hot reload not working: ensure `CHOKIDAR_USEPOLLING` env is set in compose.
- CRA websocket issues: confirm `WDS_SOCKET_PATH=/tukang/sockjs-node`.

## Local Run (Without Docker)

Backend:
```bash
cd backend
cp .env.example .env
# edit DATABASE_URL if running without Docker
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

Frontend:
```bash
cd Panel-Admin-Ngulikang
cp .env.example .env
npm install
npm run start
```

```bash
cd Ngulikang-Web-Panel
cp .env.example .env
npm install
npm start
```

```bash
cd Web-Ngulikang
cp .env.example .env
npm install
npm run dev
```

## API Docs

- backend/docs/openapi.yaml
