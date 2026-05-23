# WorkLaneX Frontend

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## UI components

shadcn/ui is configured in `components.json`. Primitives live under `components/ui/` (button, input, card, label).

Add more:

```bash
npx shadcn@latest add dialog
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
