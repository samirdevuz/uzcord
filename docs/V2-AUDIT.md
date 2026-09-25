# UzCord V2 — Technical Audit & Feature Matrix

## 1. Executive Summary

UzCord is a Discord bot and web management dashboard designed for Uzbek Discord communities.
The project is currently transitioning from V1 (SQLite / monolith) to V2 (TypeScript, discord.js v14, Supabase PostgreSQL, Next.js 15 dashboard).

This audit evaluates the codebase, database schema, dashboard implementation, security posture, and feature readiness against the V2 specification.

---

## 2. Component Status & Architecture Review

### 2.1 Discord Bot Core (`src/`)
* **Technology**: TypeScript, `discord.js` v14, Node >= 20.
* **Command System**: Slash command handler with dynamic registration and permission verification (`src/core/registry.ts`).
* **Caching Layer**: In-memory hot cache (`src/db/cache.ts`) for guild settings, automod settings, and filtered word lists. Periodic background sync is active.
* **Scheduler**: Simple 30-second interval timer (`src/core/scheduler.ts`) for expired temp-bans. Needs expansion for reminders, giveaways, tickets, and polls.
* **i18n System**: Multi-language support (Uzbek `uz`, Russian `ru`, English `en`) with automatic fallbacks (`src/i18n/index.ts`).

### 2.2 Database Layer (`supabase/migrations/`)
* **Database**: Supabase PostgreSQL.
* **Migrations**:
  * `001_core_schema.sql`: `guilds`, `mod_cases`, `temp_actions`, `escalations`, `automod_settings`, `filtered_words`, `button_roles`.
  * `002_v2_features.sql`: Schema present for `ticket_settings`, `tickets`, `level_settings`, `member_levels`, `level_rewards`, `giveaways`, `giveaway_entries`, `reminders`, `starboard_settings`, `starboard_posts`, `tags`, `polls`, `poll_votes`, `dashboard_audit`.
  * `003_functions_and_rls.sql`: Stored procedure logic (`ensure_guild`, `create_mod_case`, `add_member_xp`, `next_ticket_number`, `level_from_xp`, `xp_for_level`, `member_rank`) and strict RLS enforcement across all tables.
* **Security**: All tables have RLS enabled and forced. RLS prevents direct `anon` or `authenticated` key access; all server queries use `service_role`.

### 2.3 Management Dashboard (`dashboard/`)
* **Framework**: Next.js 15 (App Router), React 18, Tailwind CSS, TypeScript.
* **Authentication**: Discord OAuth2 flow (`/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`) with HMAC signed stateless cookies/tokens (`src/lib/session.ts`).
* **Authorization**: Server-side access check (`requireGuildAccess`, `assertGuildAccess`) verifying `MANAGE_GUILD` permission.
* **Current UI Routes**: Landing page (`/`), Privacy (`/privacy`), Terms (`/terms`).
* **Missing UI Routes**: Server picker (`/dashboard`), server management routes (`/dashboard/[guildId]/...`). Server actions exist in `dashboard/src/lib/actions.ts` for automod, cases, and leveling, but UI pages are missing.

---

## 3. Comprehensive Feature Matrix

| Feature Module | Database Schema | Bot Command/Handler | Dashboard UI | i18n Strings | Status / Priority |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Moderation** | Complete | Complete | Partial | Complete | Working; needs dashboard management |
| **AutoMod** | Complete | Complete | Partial | Complete | Engine functional; needs dashboard UI |
| **Logging** | Complete | Complete | Partial | Complete | Functional; needs dashboard selector |
| **Welcome/Goodbye**| Complete | Complete | Partial | Complete | Functional; needs dashboard form |
| **Button Roles** | Complete | Complete | Partial | Complete | Functional; needs dashboard builder |
| **Tickets** | Complete | Missing | Missing | Missing | High Priority; DB ready, bot + UI missing |
| **Leveling / XP** | Complete | Missing | Partial | Partial | High Priority; DB ready, bot handlers + UI missing |
| **Giveaways** | Complete | Missing | Missing | Missing | High Priority; DB ready, bot handlers + UI missing |
| **Reminders** | Complete | Missing | Missing | Missing | High Priority; DB ready, bot handlers + UI missing |
| **Starboard** | Complete | Missing | Missing | Missing | High Priority; DB ready, bot handlers + UI missing |
| **Custom Tags** | Complete | Missing | Missing | Missing | High Priority; DB ready, bot handlers + UI missing |
| **Polls** | Complete | Missing | Missing | Missing | High Priority; DB ready, bot handlers + UI missing |
| **Quote System** | N/A | Missing | N/A | Missing | High Priority; bot slash + context command missing |
| **Music System** | N/A | Missing | N/A | Missing | High Priority; voice player & queue missing |
| **Suggestions** | Missing | Missing | Missing | Missing | Additional module |
| **Auto-role** | Complete | Complete | Missing | Complete | Functional in events; needs UI |
| **Server Counters** | Missing | Missing | Missing | Missing | Additional module |
| **Verification** | Missing | Missing | Missing | Missing | Additional module |
| **Temp Voice** | Missing | Missing | Missing | Missing | Additional module |
| **AFK** | Missing | Missing | Missing | Missing | Additional module |

---

## 4. Identified Gaps, Issues, and Recommendations

1. **Dashboard UI Pages Missing**:
   - Next.js route `/dashboard` (server selector) and `/dashboard/[guildId]` (module navigation + forms) do not exist yet. Server actions exist in `actions.ts`.
2. **Bot Commands Missing for V2 Modules**:
   - Tickets (`/ticket`), Leveling (`/rank`, `/leaderboard`, `/level-config`), Giveaways (`/giveaway`), Reminders (`/remind`, `/reminders`), Starboard (event handlers), Tags (`/tag`), Polls (`/poll`), Quote (`/quote`), Music (`/play`, `/skip`, etc.).
3. **Background Job Scheduler**:
   - Current scheduler in `src/core/scheduler.ts` only handles expired bans. Needs unified job runner handling giveaways ending, reminders delivering, and ticket auto-close.
4. **i18n Completeness**:
   - Translations in `uz.ts`, `ru.ts`, `en.ts` cover core moderation, automod, and config. Need full coverage for all new V2 modules.
5. **Testing Suite**:
   - Unit tests are currently missing. Need automated test suite covering XP level math, permission checks, giveaway picking, ticket permissions, and OAuth state verification.

---

## 5. Implementation Roadmap Strategy

1. **Phase 1: DB & Scheduler Infrastructure**:
   - Expand `src/core/scheduler.ts` to query due reminders, giveaways, and polls from Supabase.
   - Update DB helper methods in `src/db/` for all new modules.
2. **Phase 2: Bot V2 Feature Modules**:
   - Tickets, Leveling/XP, Giveaways, Reminders, Starboard, Custom Tags, Polls, Quote system, Music system.
3. **Phase 3: Dashboard Overhaul & Server Management UI**:
   - Build `/dashboard` server selection page.
   - Build `/dashboard/[guildId]/...` tabbed management interface (Overview, Moderation, AutoMod, Tickets, Leveling, Giveaways, Starboard, Tags, Polls, Settings).
4. **Phase 4: Public Website, Documentation & i18n**:
   - Revamp landing page (`/`), commands page, docs pages, terms, privacy.
   - Add full i18n support in bot and dashboard.
5. **Phase 5: Automated Testing, Security Audit & Verification**:
   - Write test suite using Vitest/Node test runner.
   - Audit RLS, OAuth CSRF, token handling, and guild isolation.
