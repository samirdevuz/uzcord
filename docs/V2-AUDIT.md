# UzCord V2 — Technical Audit & Feature Matrix

## 1. Executive Summary

UzCord is a Discord bot and web management dashboard designed for Uzbek Discord communities.
The project is currently transitioning from V1 (SQLite / monolith) to V2 (TypeScript, discord.js v14, Supabase PostgreSQL, Next.js 15 dashboard).

This audit evaluates the codebase, database schema, dashboard implementation, security posture, and feature readiness against the V2 specification.

---

## 2. Component Status & Architecture Review

### 2.1 Discord Bot Core (`src/`)
* **Technology**: TypeScript, `discord.js` v14, Node >= 20.
* **Command System**: Dynamic slash command discovery and loader (`src/core/registry.ts`). All 33 commands are discovered and compiled into `dist/`.
* **Deployment Tooling**: Supports both global deployment (`npm run deploy`) and instant guild deployment (`npm run deploy:guild`).
* **Caching Layer**: In-memory hot cache (`src/db/cache.ts`) for guild settings, automod settings, and filtered word lists. Periodic background sync is active.
* **Scheduler**: Async background job runner (`src/core/scheduler.ts`) running every 15 seconds to deliver due reminders, select giveaway winners, resolve timed polls, and unban expired moderation cases.
* **i18n System**: Multi-language support (Uzbek `uz`, Russian `ru`, English `en`) with automatic fallbacks (`src/i18n/index.ts`).

### 2.2 Database Layer (`supabase/migrations/`)
* **Database**: Supabase PostgreSQL (Eu-Central-1).
* **Tables**: 21 tables created and verified.
* **Security**: All tables have Row Level Security (RLS) enabled and forced. RLS prevents direct `anon` or `authenticated` key access; all server queries use `service_role`.

### 2.3 Management Dashboard (`dashboard/`)
* **Framework**: Next.js 15 (App Router), React 18, Tailwind CSS, TypeScript.
* **Authentication**: Discord OAuth2 flow (`/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`) with HMAC signed stateless cookies/tokens (`src/lib/session.ts`).
* **Authorization**: Server-side access check (`requireGuildAccess`, `assertGuildAccess`) verifying `MANAGE_GUILD` permission.
* **UI Routes**: Server picker (`/dashboard`), Guild management dashboard (`/dashboard/[guildId]`), AutoMod management (`/dashboard/[guildId]/automod`), Landing page (`/`), Terms (`/terms`), Privacy (`/privacy`).

---

## 3. Comprehensive Feature Matrix

| Feature Module | Database Schema | Bot Command/Handler | Dashboard UI | Status |
| :--- | :---: | :---: | :---: | :--- |
| **Moderation** | Complete | Complete (`/ban`, `/kick`, `/timeout`, `/warn`, etc.) | Implemented | Implemented & Registered |
| **AutoMod** | Complete | Complete (`/automod`, message filter engine) | Implemented | Implemented & Registered |
| **Logging** | Complete | Complete (`src/events/messageDelete`, etc.) | Implemented | Implemented & Registered |
| **Welcome/Goodbye**| Complete | Complete (`src/events/guildMemberAdd`, etc.) | Implemented | Implemented & Registered |
| **Button Roles** | Complete | Complete (`/buttonrole`, interaction handlers) | Implemented | Implemented & Registered |
| **Tickets** | Complete | Complete (`/ticket`, `ticketButtons.ts`) | Implemented | Implemented & Registered |
| **Leveling / XP** | Complete | Complete (`/rank`, `/leaderboard`, `xpListener.ts`) | Implemented | Implemented & Registered |
| **Giveaways** | Complete | Complete (`/giveaway`, `giveawayButtons.ts`, scheduler) | Implemented | Implemented & Registered |
| **Reminders** | Complete | Complete (`/remind`, scheduler) | Implemented | Implemented & Registered |
| **Starboard** | Complete | Complete (`starboardListener.ts`) | Implemented | Implemented & Registered |
| **Custom Tags** | Complete | Complete (`/tag create/edit/delete/use/list`) | Implemented | Implemented & Registered |
| **Polls** | Complete | Complete (`/poll`, `pollButtons.ts`, scheduler) | Implemented | Implemented & Registered |
| **Quote System** | N/A | Complete (`/quote message_id:<id>`) | N/A | Implemented & Registered |
| **Music System** | N/A | Complete (`/music play/pause/skip/stop/queue/leave`) | N/A | Implemented & Registered |
| **Suggestions** | Complete | Complete (`/suggest`) | Implemented | Implemented & Registered |
| **Auto-role** | Complete | Complete (`guildMemberAdd.ts`) | Implemented | Implemented & Registered |
| **Temp Voice** | N/A | Complete (`tempVoice.ts`) | N/A | Implemented & Registered |
| **AFK** | N/A | Complete (`/afk`, `afkListener.ts`) | N/A | Implemented & Registered |

---

## 4. Verification & Command Registry Status

All 33 slash commands are compiled in `dist/commands/` and registered by the deployment scripts (`npm run deploy` / `npm run deploy:guild`).
