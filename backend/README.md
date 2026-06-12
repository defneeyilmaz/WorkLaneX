# WorkLaneX Backend

ASP.NET Core Web API using Clean Architecture.

## Projects

| Project | Responsibility |
|---------|----------------|
| `WorkLaneX.Domain` | Entities, enums, domain rules |
| `WorkLaneX.Application` | Commands, queries, validation, MediatR handlers |
| `WorkLaneX.Infrastructure` | EF Core, external services (OpenAI, email) |
| `WorkLaneX.Api` | HTTP API, SignalR hubs, DI composition |

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download) (or compatible SDK)

## Run locally

```bash
cd backend
dotnet restore
dotnet run --project src/WorkLaneX.Api
```

API: `http://localhost:5147` (see `launchSettings.json`)

Start PostgreSQL first (from repo root):

```bash
docker compose -f docker/docker-compose.yml up -d
```

Health check: `GET /api/health`

## Demo data (development)

On startup in Development, the API seeds a demo account if it does not exist yet:

| Field | Value |
|-------|-------|
| Email | `defne.demo@worklanex.com` |
| Password | `admin123` |

The seed includes a workspace, project, kanban tasks, a doc, comments, and activity entries.

Example response when the database is running:

```json
{
  "status": "healthy",
  "service": "WorkLaneX.Api",
  "database": "connected",
  "timestamp": "..."
}
```

If PostgreSQL is stopped, `status` is `degraded` and `database` is `unavailable`.

OpenAPI document (development): `/openapi/v1.json`

## Docker (production)

Build the API image from the `backend/` directory:

```bash
cd backend
docker build -t worklanex-api .
```

Run against a PostgreSQL instance (set env vars for your host):

```bash
docker run --rm -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;Port=5433;Database=worklanex;Username=postgres;Password=postgres" \
  -e Jwt__Secret="REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS" \
  -e Cors__AllowedOrigins__0="http://localhost:3000" \
  worklanex-api
```

Health check: `GET http://localhost:8080/api/health`

Copy `src/WorkLaneX.Api/appsettings.Production.example.json` as a reference for production settings. Demo seed data runs only in Development.

## Solution structure

```
backend/
├── WorkLaneX.slnx
└── src/
    ├── WorkLaneX.Api/
    ├── WorkLaneX.Application/
    ├── WorkLaneX.Domain/
    └── WorkLaneX.Infrastructure/
```
