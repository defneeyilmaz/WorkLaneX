# WorkLaneX deployment guide

Deploy the frontend to **Vercel**, the API to **Railway** or **Render**, and PostgreSQL to **Neon** (or the Postgres add-on on your host).

## Architecture

```text
Browser
  └── Vercel (Next.js)          NEXT_PUBLIC_API_URL
        └── Railway / Render    ASP.NET Core API + SignalR
              └── Neon Postgres connection string
```

| Service | Platform | Repo path |
|---------|----------|-----------|
| Frontend | Vercel | `frontend/` |
| API | Railway or Render | `backend/` (Dockerfile) |
| Database | Neon (recommended) or host Postgres | — |

## Prerequisites

- GitHub repo connected to Vercel and Railway/Render
- A managed PostgreSQL instance (SSL enabled)
- A long random JWT secret (32+ characters)

Local reference files:

- `backend/src/WorkLaneX.Api/appsettings.Production.example.json`
- `.env.example`
- `frontend/.env.example`

---

## 1. PostgreSQL (Neon)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string (or standard URI).
3. Convert to Npgsql format if needed:

```text
Host=YOUR_HOST.neon.tech;Port=5432;Database=worklanex;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require
```

4. On first deploy, the API applies EF Core migrations automatically on startup.
   You only need a reachable PostgreSQL connection string in
   `ConnectionStrings__DefaultConnection`.

Optional manual migration (same result as startup):

```bash
cd backend
export ConnectionStrings__DefaultConnection="Host=...;SSL Mode=Require;..."
dotnet ef database update \
  --project src/WorkLaneX.Infrastructure \
  --startup-project src/WorkLaneX.Api
```

Install the EF tool if needed: `dotnet tool install --global dotnet-ef`

---

## 2. API on Railway

1. New project → **Deploy from GitHub** → select this repo.
2. Add a service → **Dockerfile**:
   - Root directory: `backend`
   - Dockerfile path: `Dockerfile`
3. Set environment variables:

| Variable | Example |
|----------|---------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | Neon connection string |
| `Jwt__Secret` | long random string |
| `Jwt__Issuer` | `WorkLaneX` |
| `Jwt__Audience` | `WorkLaneX` |
| `Cors__AllowedOrigins__0` | `https://your-app.vercel.app` |
| `OpenAi__ApiKey` | optional |

4. Railway sets `PORT` automatically; the API listens on that port.
5. Deploy and note the public URL, e.g. `https://worklanex-api.up.railway.app`.
6. Verify: `GET https://YOUR_API_URL/api/health` → `"database": "connected"`.

**SignalR:** enable HTTP/WebSocket support on the service (Railway supports this by default for web services).

---

## 3. API on Render (alternative)

1. New **Web Service** → connect GitHub repo.
2. Environment: **Docker**
3. Root directory: `backend`
4. Dockerfile path: `./Dockerfile`
5. Instance type: at least **Starter** (SignalR needs a always-on web service).
6. Add the same environment variables as Railway (table above).
7. Health check path: `/api/health`

Render also injects `PORT`; no extra config required.

---

## 4. Frontend on Vercel

1. Import the GitHub repo in [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Next.js** (defaults are fine).
4. Environment variable:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR_API_URL` (no trailing slash) |

5. Deploy.

After the first Vercel deploy, update the API CORS origin if the URL changed:

```text
Cors__AllowedOrigins__0=https://your-final-domain.vercel.app
```

Redeploy the API after updating CORS.

---

## 5. Post-deploy checklist

- [ ] `GET /api/health` returns `healthy` and `database: connected`
- [ ] Register or log in from the Vercel URL
- [ ] Create workspace → project → task on the board
- [ ] Open a second browser tab and move a task (SignalR live update)
- [ ] Optional: set `OpenAi__ApiKey` for live AI breakdown (otherwise mock suggestions)

---

## Environment variable reference

### API (Railway / Render)

| Variable | Required | Notes |
|----------|----------|-------|
| `ConnectionStrings__DefaultConnection` | Yes | PostgreSQL with SSL |
| `Jwt__Secret` | Yes | 32+ chars; never commit |
| `Cors__AllowedOrigins__0` | Yes | Exact Vercel origin (`https://…`) |
| `Jwt__Issuer` / `Jwt__Audience` | No | Default `WorkLaneX` |
| `OpenAi__ApiKey` | No | Mock AI when empty |
| `ASPNETCORE_ENVIRONMENT` | No | Set to `Production` on host |

Multiple CORS origins: use indexed keys `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, …

### Frontend (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | Yes | Public API base URL |

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| CORS error in browser | `Cors__AllowedOrigins__0` does not match the Vercel URL exactly |
| `database: unavailable` | Wrong connection string or database not reachable from the API host |
| Login works locally, not in prod | `NEXT_PUBLIC_API_URL` missing or pointing to localhost |
| Board does not live-update | API URL wrong, WebSockets blocked, or API not reachable over HTTPS |
| AI always shows demo mode | `OpenAi__ApiKey` not set on the API service |

---

## Local Docker smoke test

Before cloud deploy, you can run the production image locally:

```bash
cd backend
docker build -t worklanex-api .
docker run --rm -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;Port=5433;Database=worklanex;Username=postgres;Password=postgres" \
  -e Jwt__Secret="REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS" \
  -e Cors__AllowedOrigins__0="http://localhost:3000" \
  worklanex-api
```

Then set `NEXT_PUBLIC_API_URL=http://localhost:8080` in `frontend/.env.local`.
