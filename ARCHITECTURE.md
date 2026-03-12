# HuntLogic Concierge — Full Architecture & Implementation Plan

## Executive Summary

HuntLogic Concierge is an AI-powered, nationwide hunt planning and application platform that functions as a personal hunting strategist, tag consultant, and deadline manager. This document defines the complete end-to-end architecture: frontend, backend, AI/ML systems, data pipeline, infrastructure, and phased rollout.

**Guiding Principles:**
- Nothing hardcoded — every configuration, rule, species, state, and workflow is data-driven
- Mobile-first — every screen designed for phones first, scaled up to desktop
- Dynamic everything — admin-configurable, API-driven, real-time adaptable

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [System Architecture](#2-system-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema](#5-database-schema)
6. [AI/ML Architecture](#6-aiml-architecture)
7. [Data Ingestion Pipeline](#7-data-ingestion-pipeline)
8. [Authentication & Security](#8-authentication--security)
9. [API Design](#9-api-design)
10. [Mobile-First Design System](#10-mobile-first-design-system)
11. [Infrastructure & DevOps](#11-infrastructure--devops)
12. [Phased Implementation](#12-phased-implementation)
13. [Dynamic Configuration System](#13-dynamic-configuration-system)
14. [Monitoring & Observability](#14-monitoring--observability)

---

## 1. Tech Stack

### Frontend
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **Next.js 15** (App Router) | SSR/SSG, SEO, API routes, PWA-capable |
| Language | **TypeScript** (strict mode) | Type safety across full stack |
| Styling | **Tailwind CSS v4** + **shadcn/ui** | Mobile-first utility classes, accessible components |
| State (server) | **TanStack Query v5** | Cache, sync, dedup server state |
| State (client) | **Zustand** | Lightweight, no boilerplate |
| Maps | **Mapbox GL JS** / **MapLibre** | Unit boundaries, public land overlays, interactive maps |
| Charts | **Recharts** / **Nivo** | Draw odds trends, forecasting visualizations |
| Animations | **Framer Motion** | Smooth mobile transitions |
| Forms | **React Hook Form** + **Zod** | Validation shared with backend |
| PWA | **next-pwa** / **Serwist** | Offline support, push notifications, home screen install |
| Real-time | **Socket.io** client | Live notifications, strategy updates |

### Backend
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API Gateway | **Next.js API Routes** (BFF) | Unified frontend-backend, edge-ready |
| Services | **Node.js + Fastify** | High-perf microservices |
| Language | **TypeScript** | Shared types with frontend |
| ORM | **Drizzle ORM** | Type-safe, performant, SQL-close |
| Queue | **BullMQ** + **Redis** | Background jobs, data ingestion, notifications |
| Scheduler | **node-cron** + BullMQ repeatable | Deadline tracking, data refresh cycles |
| Validation | **Zod** | Shared schemas frontend ↔ backend |
| Email | **React Email** + **Resend** | Transactional emails, reminders |
| Push | **Web Push API** + **FCM** | Mobile push notifications |

### AI / ML
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| LLM | **Claude API** (Anthropic) | Strategy generation, explanations, conversational onboarding |
| Embeddings | **Voyage AI** / **OpenAI Embeddings** | Semantic search across hunting data corpus |
| Vector Store | **pgvector** (PostgreSQL extension) | Unified DB, no separate vector service |
| ML Models | **Python** (scikit-learn, Prophet, XGBoost) | Point creep forecasting, draw odds modeling |
| ML Serving | **FastAPI** microservice | Model inference endpoints |
| RAG Pipeline | Custom retrieval pipeline | Source-aware retrieval for recommendations |

### Data & Storage
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Primary DB | **PostgreSQL 16** + **pgvector** | Relational + vector in one |
| Cache | **Redis 7** | Sessions, rate limiting, hot data cache |
| Object Storage | **S3** / **R2** (Cloudflare) | Scraped documents, PDFs, harvest reports |
| Search | **Meilisearch** | Fast full-text search for hunts, units, species |

### Infrastructure
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend Hosting | **Vercel** | Edge network, automatic scaling, preview deploys |
| Backend Services | **AWS ECS Fargate** or **Fly.io** | Container orchestration without Kubernetes overhead |
| Database | **AWS RDS** or **Supabase** | Managed PostgreSQL with pgvector |
| CI/CD | **GitHub Actions** | Native to repo, matrix builds |
| Monitoring | **Sentry** + **Axiom** | Error tracking + structured logs |
| Analytics | **PostHog** | Product analytics, feature flags, A/B testing |
| Feature Flags | **PostHog** / **LaunchDarkly** | Dynamic feature rollout |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Mobile-First)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   PWA (Web)  │  │  iOS (future)│  │ Android (fut)│              │
│  │  Next.js 15  │  │ React Native │  │ React Native │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / BFF LAYER                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            Next.js API Routes (Edge + Node Runtime)          │   │
│  │  • Auth middleware  • Rate limiting  • Request validation     │   │
│  │  • Response caching • API versioning • CORS / CSP            │   │
│  └──────────────────────────────────┬───────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  PROFILE SERVICE │  │ INTELLIGENCE ENGINE   │  │ NOTIFICATION SERVICE │
│  • Hunter profile│  │ • Recommendations     │  │ • Deadline tracking  │
│  • Preferences   │  │ • Playbook generation │  │ • Push / email / SMS │
│  • Point holdings│  │ • Strategy ranking    │  │ • Calendar sync      │
│  • History       │  │ • ROI calculations    │  │ • Action items       │
└────────┬─────────┘  └──────────┬───────────┘  └──────────┬───────────┘
         │                       │                          │
         ▼                       ▼                          ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ FORECASTING SVC  │  │   AI / LLM SERVICE   │  │  DATA INGESTION SVC  │
│ • Point creep    │  │ • Claude API          │  │ • State agency scrape│
│ • Draw odds model│  │ • RAG pipeline        │  │ • Harvest reports    │
│ • Trend analysis │  │ • Conversational AI   │  │ • Draw odds ETL      │
│ • Probability    │  │ • Explanation engine  │  │ • Regulation parsing │
│   engine         │  │ • Adaptive questions  │  │ • Forum monitoring   │
└────────┬─────────┘  └──────────┬───────────┘  └──────────┬───────────┘
         │                       │                          │
         └───────────────────────┼──────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ PostgreSQL │  │  Redis   │  │    S3    │  │   Meilisearch    │  │
│  │ + pgvector │  │  Cache   │  │  Object  │  │   Full-text      │  │
│  │  Primary   │  │ Sessions │  │  Storage │  │   Search         │  │
│  └────────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/           # Adaptive onboarding flow
│   ├── (dashboard)/              # Authenticated layout
│   │   ├── dashboard/            # Action dashboard / home
│   │   ├── playbook/             # Hunt playbook views
│   │   ├── strategy/             # Annual strategy plan
│   │   ├── recommendations/      # Hunt recommendation cards
│   │   ├── calendar/             # Deadlines & action calendar
│   │   ├── explore/              # National opportunity explorer
│   │   │   ├── map/              # Interactive map view
│   │   │   └── search/           # Search/filter hunts
│   │   ├── profile/              # Hunter profile management
│   │   │   ├── points/           # Point holdings by state
│   │   │   ├── preferences/      # Hunting preferences
│   │   │   └── history/          # Application & harvest history
│   │   ├── forecasts/            # Point creep & draw forecasting
│   │   └── settings/             # App settings, notifications
│   ├── (marketing)/              # Public marketing pages
│   │   ├── page.tsx              # Landing page
│   │   ├── pricing/
│   │   ├── features/
│   │   └── about/
│   ├── api/                      # API routes (BFF)
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── intelligence/
│   │   ├── playbook/
│   │   ├── forecasts/
│   │   ├── notifications/
│   │   ├── search/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── hunt/                     # Hunt-specific components
│   │   ├── RecommendationCard.tsx
│   │   ├── PlaybookView.tsx
│   │   ├── StrategyTimeline.tsx
│   │   ├── DrawOddsChart.tsx
│   │   ├── PointCreepGraph.tsx
│   │   ├── UnitMap.tsx
│   │   ├── SpeciesSelector.tsx
│   │   └── ROICalculator.tsx
│   ├── onboarding/               # Adaptive onboarding components
│   │   ├── OnboardingFlow.tsx
│   │   ├── QuestionCard.tsx
│   │   └── ProgressIndicator.tsx
│   ├── dashboard/                # Dashboard components
│   │   ├── ActionFeed.tsx
│   │   ├── DeadlineWidget.tsx
│   │   ├── StrategySnapshot.tsx
│   │   └── AlertBanner.tsx
│   ├── chat/                     # AI concierge chat interface
│   │   ├── ConciergeChat.tsx
│   │   ├── MessageBubble.tsx
│   │   └── SuggestedQuestions.tsx
│   └── layout/                   # Layout components
│       ├── MobileNav.tsx
│       ├── BottomTabBar.tsx
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── lib/
│   ├── api/                      # API client functions
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand stores
│   ├── utils/                    # Utility functions
│   ├── types/                    # Shared TypeScript types
│   └── config/                   # App configuration
├── styles/
│   └── design-tokens.css         # CSS custom properties / design tokens
└── public/
    ├── icons/
    ├── manifest.json             # PWA manifest
    └── sw.js                     # Service worker
```

### Key Frontend Patterns

**Mobile-First Navigation:**
- Bottom tab bar on mobile (Dashboard, Playbook, Explore, Chat, Profile)
- Sidebar navigation on tablet/desktop
- Swipe gestures for card navigation
- Pull-to-refresh on all list views
- Haptic feedback on key actions (PWA)

**Adaptive Onboarding Flow:**
- Step-based flow, not a single long form
- Each step = one high-value question
- AI determines next question based on previous answers
- Skip/defer options on every question
- Progress indicator shows "strategy readiness" not step count
- Generates preliminary playbook after minimum viable answers (3-5 questions)

**Real-Time Strategy Updates:**
- WebSocket connection for live notifications
- Optimistic UI updates for profile changes
- Background sync for offline-capable playbook access

---

## 4. Backend Architecture

### Service Decomposition

```
services/
├── gateway/                      # Next.js BFF + API Gateway
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification, session management
│   │   ├── rateLimit.ts          # Per-user, per-endpoint rate limiting
│   │   ├── validation.ts         # Zod schema validation
│   │   └── cache.ts              # Response caching strategy
│   └── routes/                   # API route handlers
│
├── profile-service/              # Hunter Profile Management
│   ├── handlers/
│   │   ├── profile.ts            # CRUD hunter profiles
│   │   ├── preferences.ts        # Preference management
│   │   ├── points.ts             # Point holdings tracking
│   │   └── history.ts            # Application & harvest history
│   └── models/
│
├── intelligence-engine/          # Core Recommendation Engine
│   ├── handlers/
│   │   ├── recommend.ts          # Generate recommendations
│   │   ├── playbook.ts           # Playbook generation & updates
│   │   ├── strategy.ts           # Annual strategy planning
│   │   └── roi.ts                # ROI calculations
│   ├── pipelines/
│   │   ├── scoring.ts            # Multi-factor hunt scoring
│   │   ├── ranking.ts            # Personalized ranking
│   │   ├── matching.ts           # Profile-to-opportunity matching
│   │   └── explanation.ts        # Generate recommendation rationale
│   └── models/
│
├── forecasting-service/          # Predictive Analytics
│   ├── models/
│   │   ├── pointCreep.py         # Point creep trajectory model
│   │   ├── drawOdds.py           # Draw odds forecasting
│   │   ├── trendAnalysis.py      # Applicant trend analysis
│   │   └── valueForecast.py      # Point value projection
│   ├── api/
│   │   └── serve.py              # FastAPI inference endpoints
│   └── training/
│       ├── pipelines/            # Training pipelines
│       └── data/                 # Training data management
│
├── ai-service/                   # LLM Integration Layer
│   ├── handlers/
│   │   ├── chat.ts               # Conversational concierge
│   │   ├── explain.ts            # Recommendation explanations
│   │   ├── onboard.ts            # Adaptive onboarding questions
│   │   └── summarize.ts          # Strategy summaries
│   ├── rag/
│   │   ├── retriever.ts          # Source-aware document retrieval
│   │   ├── chunker.ts            # Document chunking strategy
│   │   ├── embedder.ts           # Embedding generation
│   │   └── reranker.ts           # Result reranking
│   └── prompts/
│       ├── system/               # System prompts (versioned, DB-stored)
│       └── templates/            # Prompt templates
│
├── data-ingestion/               # Data Collection & ETL
│   ├── scrapers/
│   │   ├── base.ts               # Base scraper class
│   │   └── adapters/             # Per-source adapters (dynamic, config-driven)
│   ├── parsers/
│   │   ├── drawOdds.ts           # Draw odds report parsing
│   │   ├── harvest.ts            # Harvest report parsing
│   │   ├── regulations.ts        # Regulation document parsing
│   │   └── seasons.ts            # Season structure parsing
│   ├── normalizers/
│   │   ├── stateNormalizer.ts    # Cross-state data normalization
│   │   └── speciesNormalizer.ts  # Species taxonomy normalization
│   ├── schedulers/
│   │   └── refreshSchedule.ts   # Per-source refresh cadence
│   └── quality/
│       ├── validation.ts         # Data quality checks
│       ├── freshness.ts          # Staleness detection
│       └── scoring.ts            # Source authority scoring
│
├── notification-service/         # Notifications & Reminders
│   ├── handlers/
│   │   ├── deadlines.ts          # Deadline tracking & alerts
│   │   ├── reminders.ts          # Proactive reminders
│   │   ├── changes.ts            # Regulation/season change alerts
│   │   └── strategy.ts           # Strategy update notifications
│   ├── channels/
│   │   ├── push.ts               # Web push / FCM
│   │   ├── email.ts              # Email via Resend
│   │   ├── sms.ts                # SMS via Twilio
│   │   └── inApp.ts              # In-app notification feed
│   └── schedulers/
│       └── deadlineMonitor.ts    # Continuous deadline scanning
│
└── admin-service/                # Admin & Configuration
    ├── handlers/
    │   ├── states.ts             # State configuration management
    │   ├── species.ts            # Species configuration
    │   ├── sources.ts            # Data source management
    │   ├── prompts.ts            # AI prompt management
    │   └── features.ts           # Feature flag management
    └── dashboard/                # Admin dashboard
```

### Key Backend Patterns

**Dynamic Configuration:**
Every business rule, state-specific logic, species mapping, deadline, and workflow is stored in the database and administered via an admin interface. Zero hardcoded state/species/rule logic.

**Event-Driven Architecture:**
```
Profile Updated  →  Re-score recommendations  →  Update playbook
Data Refreshed   →  Re-run forecasts          →  Notify affected users
Deadline Near    →  Generate reminder          →  Send via preferred channel
Regulation Changed → Flag affected strategies → Notify + update playbook
```

**Source Authority Scoring:**
Each data source gets a dynamic trust score:
- Tier 1 (highest): State agency official publications
- Tier 2: Verified statistical databases
- Tier 3: Expert analysis, industry publications
- Tier 4: Community forums, anecdotal reports

---

## 5. Database Schema

### Core Tables

```sql
-- ========================
-- HUNTER PROFILE DOMAIN
-- ========================

-- Users / Accounts
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  display_name    TEXT,
  avatar_url      TEXT,
  onboarding_step TEXT DEFAULT 'welcome',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  timezone        TEXT DEFAULT 'America/Denver',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Dynamic hunter preferences (key-value, no hardcoded columns)
CREATE TABLE hunter_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,           -- 'species_interest', 'travel', 'budget', etc.
  key         TEXT NOT NULL,           -- 'elk', 'max_drive_hours', 'annual_budget'
  value       JSONB NOT NULL,          -- flexible value storage
  confidence  REAL DEFAULT 1.0,        -- system confidence in this preference (inferred vs stated)
  source      TEXT DEFAULT 'user',     -- 'user', 'inferred', 'behavioral'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, key)
);

-- Point holdings per state/species
CREATE TABLE point_holdings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  state_id    UUID REFERENCES states(id),
  species_id  UUID REFERENCES species(id),
  point_type  TEXT NOT NULL,           -- 'preference', 'bonus', 'loyalty'
  points      INTEGER NOT NULL DEFAULT 0,
  year_started INTEGER,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, state_id, species_id, point_type)
);

-- Application history
CREATE TABLE application_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  hunt_unit_id    UUID REFERENCES hunt_units(id),
  year            INTEGER NOT NULL,
  choice_rank     INTEGER,             -- 1st choice, 2nd, etc.
  result          TEXT,                -- 'drawn', 'unsuccessful', 'bonus_drawn', 'waitlisted'
  tag_type        TEXT,                -- 'resident', 'nonresident'
  cost_paid       DECIMAL(10,2),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Harvest history
CREATE TABLE harvest_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  hunt_unit_id    UUID REFERENCES hunt_units(id),
  year            INTEGER NOT NULL,
  success         BOOLEAN,
  weapon_type     TEXT,
  trophy_score    DECIMAL(6,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- HUNTING DATA DOMAIN
-- ========================

-- States (fully dynamic, admin-managed)
CREATE TABLE states (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,  -- 'CO', 'WY', 'AZ', etc.
  name            TEXT NOT NULL,
  region          TEXT,                  -- 'west', 'east', 'midwest', 'south'
  has_draw_system BOOLEAN DEFAULT FALSE,
  has_point_system BOOLEAN DEFAULT FALSE,
  agency_name     TEXT,
  agency_url      TEXT,
  config          JSONB DEFAULT '{}',    -- state-specific configuration blob
  enabled         BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Species (dynamic catalog)
CREATE TABLE species (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,  -- 'elk', 'mule_deer', 'whitetail', etc.
  common_name     TEXT NOT NULL,
  scientific_name TEXT,
  category        TEXT,                  -- 'big_game', 'small_game', 'waterfowl', 'turkey'
  config          JSONB DEFAULT '{}',
  enabled         BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- State-Species availability (which species in which states, dynamic)
CREATE TABLE state_species (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  hunt_types      JSONB DEFAULT '[]',    -- ['rifle', 'archery', 'muzzleloader']
  has_draw        BOOLEAN DEFAULT FALSE,
  has_otc         BOOLEAN DEFAULT FALSE,
  has_points      BOOLEAN DEFAULT FALSE,
  point_type      TEXT,                  -- 'preference', 'bonus', 'hybrid'
  max_points      INTEGER,
  config          JSONB DEFAULT '{}',    -- species-in-state specific settings
  UNIQUE(state_id, species_id)
);

-- Hunt Units (dynamic, per state)
CREATE TABLE hunt_units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  unit_code       TEXT NOT NULL,
  unit_name       TEXT,
  region_name     TEXT,
  geometry        GEOMETRY(MultiPolygon, 4326),  -- PostGIS boundary
  public_land_pct REAL,
  elevation_range INT4RANGE,
  terrain_class   TEXT,                  -- 'alpine', 'timber', 'prairie', etc.
  access_notes    TEXT,
  config          JSONB DEFAULT '{}',
  enabled         BOOLEAN DEFAULT TRUE,
  UNIQUE(state_id, unit_code, species_id)
);

-- Draw Odds (historical, per unit/species/state/year)
CREATE TABLE draw_odds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id          UUID REFERENCES states(id),
  species_id        UUID REFERENCES species(id),
  hunt_unit_id      UUID REFERENCES hunt_units(id),
  year              INTEGER NOT NULL,
  resident_type     TEXT NOT NULL,       -- 'resident', 'nonresident'
  weapon_type       TEXT,
  choice_rank       INTEGER,             -- 1st, 2nd, etc.
  total_applicants  INTEGER,
  total_tags        INTEGER,
  min_points_drawn  INTEGER,
  max_points_drawn  INTEGER,
  avg_points_drawn  REAL,
  draw_rate         REAL,                -- percentage
  source_id         UUID REFERENCES data_sources(id),
  raw_data          JSONB DEFAULT '{}',  -- preserve original data shape
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(state_id, species_id, hunt_unit_id, year, resident_type, weapon_type, choice_rank)
);

-- Harvest Statistics
CREATE TABLE harvest_stats (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id          UUID REFERENCES states(id),
  species_id        UUID REFERENCES species(id),
  hunt_unit_id      UUID REFERENCES hunt_units(id),
  year              INTEGER NOT NULL,
  weapon_type       TEXT,
  total_hunters     INTEGER,
  total_harvest     INTEGER,
  success_rate      REAL,
  avg_days_hunted   REAL,
  trophy_metrics    JSONB DEFAULT '{}',  -- B&C scores, age class data, etc.
  source_id         UUID REFERENCES data_sources(id),
  raw_data          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Season Structures (dynamic per state/species/year)
CREATE TABLE seasons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  hunt_unit_id    UUID REFERENCES hunt_units(id),
  year            INTEGER NOT NULL,
  season_name     TEXT,                  -- 'General Rifle', '1st Archery', etc.
  weapon_type     TEXT,
  start_date      DATE,
  end_date        DATE,
  tag_type        TEXT,                  -- 'draw', 'otc', 'leftover'
  quota           INTEGER,
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- DEADLINES & ACTIONS
-- ========================

-- Deadlines (dynamic, per state/species/year)
CREATE TABLE deadlines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  year            INTEGER NOT NULL,
  deadline_type   TEXT NOT NULL,         -- 'application', 'point_purchase', 'refund', 'results'
  title           TEXT NOT NULL,
  description     TEXT,
  deadline_date   DATE NOT NULL,
  reminder_days   INTEGER[] DEFAULT '{30,14,7,3,1}',
  url             TEXT,                  -- link to state page
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- User action items
CREATE TABLE user_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  deadline_id     UUID REFERENCES deadlines(id),
  action_type     TEXT NOT NULL,         -- 'apply', 'buy_points', 'verify_hunteEd', 'review_strategy'
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        DATE,
  priority        TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  status          TEXT DEFAULT 'pending',-- 'pending', 'in_progress', 'completed', 'skipped', 'missed'
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- RECOMMENDATIONS & PLAYBOOK
-- ========================

-- Playbooks (living strategy documents)
CREATE TABLE playbooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  version         INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'active', -- 'active', 'archived'
  goals_summary   JSONB DEFAULT '{}',
  strategy_data   JSONB DEFAULT '{}',
  generated_at    TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Individual recommendations within a playbook
CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id     UUID REFERENCES playbooks(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  hunt_unit_id    UUID REFERENCES hunt_units(id),
  rec_type        TEXT NOT NULL,         -- 'apply_now', 'build_points', 'otc_opportunity', 'watch'
  orientation     TEXT,                  -- 'trophy', 'opportunity', 'balanced'
  rank            INTEGER,
  score           REAL,                  -- composite score
  confidence      REAL,                  -- 0-1 confidence level
  rationale       TEXT,                  -- AI-generated explanation
  cost_estimate   JSONB DEFAULT '{}',    -- { tag: 600, license: 100, travel: 1200, total: 1900 }
  timeline        TEXT,                  -- 'this_year', '1-3_years', '5+_years'
  draw_odds_ctx   JSONB DEFAULT '{}',    -- current odds context
  forecast_ctx    JSONB DEFAULT '{}',    -- forward-looking forecast data
  factors         JSONB DEFAULT '{}',    -- scoring breakdown by factor
  status          TEXT DEFAULT 'active', -- 'active', 'saved', 'dismissed', 'applied'
  user_feedback   TEXT,                  -- 'like', 'dislike', 'save'
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- DATA MANAGEMENT
-- ========================

-- Data sources registry
CREATE TABLE data_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  source_type     TEXT NOT NULL,         -- 'state_agency', 'harvest_report', 'forum', 'expert'
  authority_tier  INTEGER DEFAULT 3,     -- 1=official, 2=verified, 3=expert, 4=community
  url             TEXT,
  scraper_config  JSONB DEFAULT '{}',    -- how to scrape/fetch
  refresh_cadence TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'annual', 'manual'
  last_fetched    TIMESTAMPTZ,
  last_success    TIMESTAMPTZ,
  status          TEXT DEFAULT 'active',
  enabled         BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Ingested documents (for RAG)
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES data_sources(id),
  title           TEXT,
  content         TEXT,
  doc_type        TEXT,                  -- 'regulation', 'harvest_report', 'draw_report', 'forum_post'
  state_id        UUID REFERENCES states(id),
  species_id      UUID REFERENCES species(id),
  year            INTEGER,
  metadata        JSONB DEFAULT '{}',
  embedding       VECTOR(1536),          -- pgvector embedding
  freshness_score REAL DEFAULT 1.0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- AI prompt templates (versioned, admin-managed)
CREATE TABLE ai_prompts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,  -- 'onboarding_question', 'strategy_summary', etc.
  name            TEXT NOT NULL,
  category        TEXT,
  template        TEXT NOT NULL,
  variables       JSONB DEFAULT '[]',    -- expected template variables
  model           TEXT DEFAULT 'claude-sonnet-4-6',
  version         INTEGER DEFAULT 1,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- FEATURE FLAGS & CONFIG
-- ========================

-- Dynamic app configuration
CREATE TABLE app_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace       TEXT NOT NULL,         -- 'onboarding', 'recommendations', 'notifications'
  key             TEXT NOT NULL,
  value           JSONB NOT NULL,
  description     TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(namespace, key)
);
```

---

## 6. AI/ML Architecture

### Conversational Onboarding (Claude API)

```
┌─────────────────────────────────────────────────┐
│           ADAPTIVE ONBOARDING ENGINE            │
│                                                 │
│  1. System determines next-best-question        │
│     based on current profile completeness       │
│     and information gain potential               │
│                                                 │
│  2. Claude generates natural-language question   │
│     with response options                       │
│                                                 │
│  3. User response is parsed → profile updated   │
│                                                 │
│  4. If profile meets "playbook threshold"        │
│     → trigger playbook generation               │
│     else → loop to step 1                       │
│                                                 │
│  Question Priority Queue (dynamic):             │
│  ┌─────────────────────────────────────┐        │
│  │ species_interest    → weight: 1.0   │        │
│  │ hunt_orientation    → weight: 0.95  │        │
│  │ timeline            → weight: 0.90  │        │
│  │ budget              → weight: 0.85  │        │
│  │ existing_points     → weight: 0.80  │        │
│  │ travel_tolerance    → weight: 0.75  │        │
│  │ hunt_style          → weight: 0.70  │        │
│  │ ...dynamically weighted...          │        │
│  └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Recommendation Engine Pipeline

```
Input: Hunter Profile + Hunting Data Corpus
                    │
                    ▼
    ┌───────────────────────────────┐
    │   1. CANDIDATE GENERATION    │
    │   Filter universe of hunts   │
    │   by hard constraints:       │
    │   - species interest         │
    │   - state eligibility        │
    │   - budget ceiling           │
    │   - travel radius            │
    │   - timeline fit             │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │   2. MULTI-FACTOR SCORING    │
    │   Score each candidate on:   │
    │   - draw_odds_score          │
    │   - trophy_quality_score     │
    │   - success_rate_score       │
    │   - cost_efficiency_score    │
    │   - access_score             │
    │   - forecast_score           │
    │   - personal_fit_score       │
    │   Weights from user profile  │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │   3. STRATEGY OPTIMIZATION   │
    │   Portfolio-level thinking:   │
    │   - Balance short/long term  │
    │   - Diversify across states  │
    │   - Budget allocation        │
    │   - Point investment strategy│
    │   - Risk/reward balancing    │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │   4. EXPLANATION GENERATION  │
    │   Claude generates:          │
    │   - Plain English rationale  │
    │   - "Why this fits you"      │
    │   - Tradeoff analysis        │
    │   - Confidence disclosure    │
    │   - Source attribution       │
    └───────────────┬───────────────┘
                    │
                    ▼
    Output: Ranked, explained, actionable recommendations
```

### Forecasting Models (Python)

| Model | Purpose | Algorithm | Training Data |
|-------|---------|-----------|---------------|
| Point Creep Predictor | Project future point thresholds | Time series (Prophet) + feature engineering | 10+ years draw data per state |
| Draw Odds Forecaster | Predict future draw probability | Gradient boosting (XGBoost) | Historical odds + applicant trends |
| Applicant Trend Model | Predict application volume changes | ARIMA + external factors | Multi-year applicant counts |
| ROI Optimizer | Maximize hunting value per dollar | Linear programming + Monte Carlo | Cost data + probability estimates |
| Trophy Trend Model | Track trophy quality trajectory | Bayesian regression | Harvest stats, age/score data |

### RAG (Retrieval-Augmented Generation) Pipeline

```
User Query / Recommendation Context
              │
              ▼
    ┌─────────────────────┐
    │  Query Embedding    │
    │  (Voyage AI)        │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Vector Search      │
    │  (pgvector)         │
    │  + Metadata Filter  │
    │  (state, species,   │
    │   year, doc_type)   │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Source-Aware        │
    │  Reranking           │
    │  - authority_tier    │
    │  - freshness_score   │
    │  - relevance_score   │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Context Assembly   │
    │  + Source Citations  │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Claude Generation  │
    │  with source-aware  │
    │  system prompt       │
    └─────────────────────┘
```

---

## 7. Data Ingestion Pipeline

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION PIPELINE                        │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  Scheduler   │───▶│  Fetchers   │───▶│  Parsers    │          │
│  │  (BullMQ)    │    │  (per-src)  │    │  (per-type) │          │
│  └─────────────┘    └─────────────┘    └──────┬──────┘          │
│                                                │                 │
│  ┌─────────────┐    ┌─────────────┐    ┌──────▼──────┐          │
│  │  Embedding   │◀───│  Normalizer │◀───│  Validator  │          │
│  │  + Index     │    │  (cross-st) │    │  (quality)  │          │
│  └──────┬──────┘    └─────────────┘    └─────────────┘          │
│         │                                                        │
│  ┌──────▼──────┐    ┌─────────────┐                              │
│  │  DB Write   │───▶│  Notify     │  ← alert if data changed    │
│  │  (upsert)   │    │  (affected) │    significantly             │
│  └─────────────┘    └─────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### Source Adapter Pattern (Nothing Hardcoded)

Each data source is configured in the `data_sources` table with a `scraper_config` JSONB blob:

```jsonc
{
  "adapter": "state_agency_web",
  "base_url": "https://cpw.state.co.us",
  "endpoints": [
    {
      "path": "/draw-results/{year}",
      "parser": "draw_odds_table",
      "params": { "year": "{{current_year}}" },
      "schedule": "0 6 * * 1"  // weekly Monday 6am
    }
  ],
  "auth": null,
  "rate_limit": { "requests_per_minute": 10 },
  "retry": { "max_attempts": 3, "backoff_ms": 5000 }
}
```

New states/sources are added entirely through configuration — no code changes needed.

---

## 8. Authentication & Security

### Auth Stack
- **Auth.js (NextAuth v5)** for authentication
- OAuth providers: Google, Apple, Email magic link
- JWT access tokens (short-lived, 15min) + refresh tokens (HTTP-only cookie, 30 days)
- Row-Level Security (RLS) in PostgreSQL for data isolation

### Security Measures
- All API routes authenticated + rate-limited
- Input validation via Zod on every endpoint
- CSRF protection on state-mutating requests
- Content Security Policy headers
- Encrypted credential vault for future state account linking
- SOC 2 Type I compliance path from day one
- PII encryption at rest for sensitive profile data
- Audit log for all data access and modifications

---

## 9. API Design

### API Versioning
All APIs versioned under `/api/v1/`. Version is a dynamic config — new versions can be deployed alongside old ones.

### Core Endpoints

```
AUTH
  POST   /api/v1/auth/signup
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  DELETE /api/v1/auth/logout

PROFILE
  GET    /api/v1/profile
  PATCH  /api/v1/profile
  GET    /api/v1/profile/preferences
  PUT    /api/v1/profile/preferences
  GET    /api/v1/profile/points
  PUT    /api/v1/profile/points
  GET    /api/v1/profile/history/applications
  GET    /api/v1/profile/history/harvests

ONBOARDING
  GET    /api/v1/onboarding/next-question
  POST   /api/v1/onboarding/answer
  GET    /api/v1/onboarding/progress

PLAYBOOK
  GET    /api/v1/playbook
  POST   /api/v1/playbook/generate
  PATCH  /api/v1/playbook/:id
  GET    /api/v1/playbook/history

RECOMMENDATIONS
  GET    /api/v1/recommendations
  GET    /api/v1/recommendations/:id
  POST   /api/v1/recommendations/:id/feedback
  GET    /api/v1/recommendations/filters

INTELLIGENCE
  GET    /api/v1/intelligence/states
  GET    /api/v1/intelligence/states/:code
  GET    /api/v1/intelligence/species
  GET    /api/v1/intelligence/units?state=:code&species=:slug
  GET    /api/v1/intelligence/draw-odds?state=:code&species=:slug&unit=:code
  GET    /api/v1/intelligence/harvest-stats?...
  GET    /api/v1/intelligence/seasons?...

FORECASTS
  GET    /api/v1/forecasts/point-creep?state=:code&species=:slug
  GET    /api/v1/forecasts/draw-odds?...
  GET    /api/v1/forecasts/roi?...

DEADLINES
  GET    /api/v1/deadlines
  GET    /api/v1/deadlines/upcoming
  GET    /api/v1/deadlines/:id

ACTIONS
  GET    /api/v1/actions
  PATCH  /api/v1/actions/:id
  GET    /api/v1/actions/dashboard

CHAT (Concierge AI)
  POST   /api/v1/chat/message          (streaming response)
  GET    /api/v1/chat/history
  GET    /api/v1/chat/suggested-questions

SEARCH
  GET    /api/v1/search?q=:query&type=:type

NOTIFICATIONS
  GET    /api/v1/notifications
  PATCH  /api/v1/notifications/:id/read
  PUT    /api/v1/notifications/preferences

ADMIN (protected)
  CRUD   /api/v1/admin/states
  CRUD   /api/v1/admin/species
  CRUD   /api/v1/admin/sources
  CRUD   /api/v1/admin/deadlines
  CRUD   /api/v1/admin/prompts
  CRUD   /api/v1/admin/config
  GET    /api/v1/admin/metrics
```

---

## 10. Mobile-First Design System

### Design Tokens (CSS Custom Properties)

```css
/* All tokens are dynamic — loaded from DB config, overridable per-theme */
:root {
  /* Spacing scale (mobile-optimized touch targets) */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */

  /* Touch targets: minimum 44px per Apple HIG */
  --touch-target-min: 2.75rem;   /* 44px */

  /* Typography (mobile-first sizes) */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* Breakpoints (mobile-first: styles apply upward) */
  /* sm: 640px  md: 768px  lg: 1024px  xl: 1280px */
}
```

### Mobile-First Layout Principles
1. **Bottom tab navigation** on mobile (thumb-zone friendly)
2. **Card-based content** — swipeable recommendation cards
3. **Progressive disclosure** — summary first, details on tap
4. **Sticky action bars** at bottom of screens
5. **Sheet/drawer patterns** for secondary content (not modal dialogs)
6. **Skeleton loading states** on every dynamic view
7. **Offline-capable** playbook view via service worker cache
8. **Native-feel animations** — 60fps transitions via Framer Motion

### Responsive Strategy
```
Mobile (default)     → Single column, bottom tabs, full-bleed cards
Tablet (md: 768px)   → Two columns where useful, sidebar appears
Desktop (lg: 1024px) → Full sidebar nav, multi-panel layouts, map + list split
```

---

## 11. Infrastructure & DevOps

### Environment Strategy
```
local        → Docker Compose (PostgreSQL, Redis, Meilisearch, MinIO)
preview      → Vercel preview deploys (per-PR)
staging      → Full mirror of production
production   → Vercel (frontend) + AWS/Fly (services) + RDS (database)
```

### CI/CD Pipeline (GitHub Actions)
```yaml
# Triggered on every push/PR
lint       → ESLint + Prettier + TypeScript check
test       → Vitest (unit) + Playwright (e2e mobile-first)
build      → Next.js build + Docker build
security   → npm audit + Snyk scan
preview    → Deploy to Vercel preview (PRs)
staging    → Auto-deploy main branch
production → Manual promotion from staging
```

### Docker Compose (Local Development)
```yaml
services:
  app           # Next.js dev server
  postgres      # PostgreSQL 16 + pgvector + PostGIS
  redis         # Redis 7
  meilisearch   # Full-text search
  minio         # S3-compatible object storage
  forecast-api  # Python FastAPI (ML models)
  bullboard     # BullMQ job dashboard
```

---

## 12. Phased Implementation

### Phase 1: Foundation (Weeks 1-6) — MVP Core

**Goal:** Hunters can sign up, complete onboarding, and receive a basic personalized hunt playbook.

| Week | Deliverable |
|------|-------------|
| 1-2 | Project scaffolding, DB schema, auth, CI/CD, design system |
| 3 | Adaptive onboarding flow (5-7 core questions) |
| 4 | Hunter profile system, point holdings entry |
| 5 | Basic recommendation engine (state/species matching + draw odds) |
| 6 | Playbook generation, recommendation cards, mobile-first UI polish |

**MVP Outputs:**
- Account creation + login
- Adaptive onboarding (species, orientation, timeline, budget, states, travel, style)
- Manual point entry
- Hunt playbook with ranked recommendations
- Recommendation cards with rationale
- Basic cost/timeline estimates
- Mobile-first responsive design

### Phase 2: Intelligence Layer (Weeks 7-12)

**Goal:** Deep data integration, forecasting, and national coverage.

| Week | Deliverable |
|------|-------------|
| 7-8 | Data ingestion pipeline, first 10 state integrations |
| 9 | Draw odds + harvest stats integration |
| 10 | Forecasting engine (point creep, draw odds projection) |
| 11 | ROI engine, cost optimization, budget allocation |
| 12 | National opportunity layer (eastern states, OTC, public land) |

### Phase 3: Concierge Experience (Weeks 13-18)

**Goal:** Proactive agent behavior, conversational AI, calendar management.

| Week | Deliverable |
|------|-------------|
| 13-14 | Deadline tracking, notification system, reminder engine |
| 15 | Action dashboard, calendar view, checklist management |
| 16-17 | Conversational AI concierge (Claude-powered chat) |
| 18 | Strategy update engine ("what changed since last visit") |

### Phase 4: Power Features (Weeks 19-26)

**Goal:** Advanced forecasting, maps, agentic workflows.

| Week | Deliverable |
|------|-------------|
| 19-20 | Interactive map with unit boundaries, public land overlay |
| 21 | Advanced forecasting (multi-year scenario modeling) |
| 22 | Annual strategy planner with year-over-year view |
| 23 | Application simulation engine |
| 24 | Outcome tracking, post-season feedback loops |
| 25-26 | Agentic submission prep (pre-filled applications, checklists) |

### Phase 5: Scale & Monetize (Weeks 27+)

- Subscription tiers (Free / Pro / Elite)
- Credential vaulting + state account linking
- Direct application submission workflows
- Guided/outfitter marketplace
- Family/group planning
- White-label partner API
- Travel/logistics integrations
- Native mobile apps (React Native)

---

## 13. Dynamic Configuration System

**The core principle: nothing is hardcoded.** Every piece of business logic, every state's quirks, every species, every deadline, every scoring weight is configurable through the admin interface or API.

### How This Works

```
┌──────────────────────────────────────────────────┐
│            ADMIN CONFIGURATION LAYER             │
│                                                  │
│  States         → CRUD in DB, not in code        │
│  Species        → CRUD in DB, not in code        │
│  Draw Rules     → JSONB config per state/species  │
│  Point Systems  → JSONB config per state/species  │
│  Deadlines      → CRUD in DB, year-specific      │
│  Scoring Weights→ JSONB config, A/B testable     │
│  AI Prompts     → Versioned in DB, hot-swappable │
│  Feature Flags  → PostHog / DB config            │
│  Scraper Config → JSONB per source               │
│  Notification   → Template + rules in DB         │
│    Templates                                     │
│  Onboarding     → Question bank in DB,           │
│    Questions      priority-weighted              │
│                                                  │
│  To add a new state:                             │
│  1. Insert into `states` table                   │
│  2. Insert `state_species` relationships         │
│  3. Configure deadlines                          │
│  4. Add data source config                       │
│  5. Done — no deploy needed                      │
└──────────────────────────────────────────────────┘
```

---

## 14. Monitoring & Observability

### Stack
- **Sentry** — Error tracking, performance monitoring, session replay
- **Axiom** — Structured logging, log aggregation
- **PostHog** — Product analytics, funnels, feature flags
- **BullMQ Dashboard** — Job queue monitoring
- **Custom health checks** — `/api/health` with DB, Redis, AI service status

### Key Metrics to Track
- Onboarding completion rate + drop-off points
- Time to first playbook
- Recommendation engagement (viewed, saved, dismissed)
- Forecast accuracy (predicted vs actual draw outcomes)
- Data freshness per source
- AI response latency + token usage
- Notification delivery + open rates
- DAU/WAU/MAU by user type

---

## Summary

HuntLogic Concierge is architected as a **modular, dynamic, mobile-first platform** where:

- **Every configuration is data-driven** — new states, species, rules, and sources are added without code changes
- **AI is woven throughout** — from conversational onboarding to strategy generation to proactive reminders
- **Mobile is the primary experience** — designed for phones first, enhanced for tablets and desktop
- **The system learns continuously** — from user feedback, behavioral signals, and fresh data
- **Trust is earned through transparency** — every recommendation comes with rationale, confidence levels, and source attribution

The goal is to build the most trusted digital hunt planner in the country — one that makes every hunter feel like they have a knowledgeable partner in their corner.
