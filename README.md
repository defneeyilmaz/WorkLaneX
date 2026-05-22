# WorkLaneX

AI-powered team productivity workspace for small software teams, student project groups, and startups.

Combine task management, documentation, team communication, meeting notes, and AI-assisted planning in one modern workspace — without the complexity of enterprise Jira.

## Features (roadmap)

| Module | MVP v1 | v2+ |
|--------|--------|-----|
| Authentication (JWT) | Planned | Email verify, refresh token |
| Workspaces & roles | Planned | Advanced permissions |
| Projects & Kanban | Planned | Sprint planning |
| Task comments | Planned | Attachments |
| Docs (Markdown) | Planned | Rich editor |
| Dashboard | Planned | Workload analytics |
| SignalR (tasks) | Planned | Chat, typing, presence |
| AI task breakdown | Planned | Meeting → tasks, summaries |
| Team chat | — | Realtime channels |
| Meetings & notifications | — | In-app + email |

## Tech stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, dnd-kit
- **Backend:** ASP.NET Core Web API, Clean Architecture, EF Core, PostgreSQL, SignalR, FluentValidation, MediatR
- **AI:** OpenAI API (via backend only)
- **Infra:** Docker Compose (PostgreSQL); deploy target Vercel + Railway + Neon

## Repository structure

```
WorkLaneX/
├── backend/          # ASP.NET Core solution
├── frontend/         # Next.js app (coming soon)
├── docker/           # Docker Compose (coming soon)
└── README.md
```

## Prerequisites

- [.NET SDK 8+](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) (for frontend)
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Getting started

Backend and frontend setup instructions will be added as each development phase lands.

```bash
# Clone
git clone https://github.com/<your-username>/WorkLaneX.git
cd WorkLaneX

# Backend (after Phase 1–2)
cd backend
dotnet restore
dotnet run --project src/WorkLaneX.Api
```

## Development phases

1. Project setup
2. Authentication
3. Workspace & project
4. Kanban board
5. Dashboard
6. Docs
7. Realtime (SignalR)
8. AI task breakdown
9. Polish & seed data
10. Deploy (Vercel + Railway)

## License

MIT — see [LICENSE](LICENSE) (to be added).

## Author

Built as a portfolio full-stack project demonstrating modern .NET and React ecosystems.
