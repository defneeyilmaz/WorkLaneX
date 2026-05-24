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
