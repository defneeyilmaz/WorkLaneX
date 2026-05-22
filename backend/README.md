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

API: `https://localhost:7xxx` (see `launchSettings.json`)

Health check: `GET /api/health`

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
