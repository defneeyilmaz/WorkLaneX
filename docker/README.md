# Docker — WorkLaneX

## PostgreSQL (local development)

From the repository root:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Check status:

```bash
docker compose -f docker/docker-compose.yml ps
```

Stop:

```bash
docker compose -f docker/docker-compose.yml down
```

## API configuration

1. Start PostgreSQL with the command above.
2. Copy `backend/src/WorkLaneX.Api/appsettings.Development.example.json` to `appsettings.Development.json` (gitignored).
3. Run the API: `dotnet run --project backend/src/WorkLaneX.Api`

Default database: `worklanex` on `localhost:5432`.
