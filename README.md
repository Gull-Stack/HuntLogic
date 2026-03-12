# HuntLogic Concierge

AI-powered hunting intelligence platform for western big game hunters. Get personalized draw strategies, real-time deadline alerts, and data-driven recommendations.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL 16 (pgvector + PostGIS)
- **Cache**: Redis 7
- **Search**: Meilisearch
- **Storage**: MinIO (S3-compatible)
- **AI**: Anthropic Claude (concierge, recommendations, playbooks)
- **ML**: Python FastAPI service (draw odds forecasting)

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd HuntLogic
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your API keys and configuration
```

### 3. Start infrastructure services

```bash
docker compose up -d
```

This starts PostgreSQL (with pgvector + PostGIS), Redis, Meilisearch, and MinIO.

### 4. Run database migrations

```bash
npm run db:push
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/       # React components (ui, hunt, dashboard, chat, layout)
  lib/
    api/            # API client
    db/             # Drizzle ORM schema, migrations, connection
    ai/             # Claude AI client, RAG pipeline, prompts
    hooks/          # React hooks
    stores/         # Zustand stores
    types/          # Shared TypeScript types
    config/         # App configuration
    validations/    # Zod validation schemas
  services/         # Domain service modules
  styles/           # Design tokens

services/
  forecasting-api/  # Python FastAPI ML forecasting service
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Services

| Service | Port | Dashboard |
|---------|------|-----------|
| Next.js | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| Meilisearch | 7700 | http://localhost:7700 |
| MinIO API | 9000 | http://localhost:9001 |
| Forecasting API | 8000 | http://localhost:8000/docs |

## License

Proprietary. All rights reserved.
