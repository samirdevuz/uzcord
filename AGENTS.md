# AGENTS.md — Guidance for AI Coding Agents

## Project Overview
UzCord is a production-ready Discord bot and Next.js 15 web management dashboard designed for Uzbek Discord communities.

* **Bot Tech Stack**: Node.js (>=20), TypeScript, `discord.js` v14, `@discordjs/voice`.
* **Dashboard Tech Stack**: Next.js 15 (App Router), React 18, Tailwind CSS, TypeScript.
* **Database & Auth**: Supabase PostgreSQL (Eu-Central-1) with strict Row Level Security (RLS) on all 21 tables. Bot and dashboard backend access Supabase via `service_role`. Discord OAuth2 is used for dashboard user authentication.
* **i18n**: Uzbek (`uz`), Russian (`ru`), English (`en`).

## Codebase Architecture
```
src/
  commands/       # Slash commands (/rank, /ticket, /giveaway, /remind, /tag, /poll, /quote, /music, etc.)
  events/         # Event listeners (xpListener, ticketButtons, giveawayButtons, starboardListener, afkListener, etc.)
  db/             # Supabase database helpers & caching layer
  core/           # Client initialization, command registry, background scheduler
  modules/        # Business logic modules (moderation, automod, music player, etc.)
  utils/          # Helper functions (time parser, XP math, embeds)
dashboard/
  src/app/        # Next.js 15 App Router (/dashboard, /dashboard/[guildId], /api/auth)
  src/lib/        # Session cookies, Discord OAuth, server actions, Supabase client
```

## Mandatory Commands
* Bot Typecheck: `npm run typecheck`
* Bot Unit Tests: `npm test`
* Dashboard Typecheck: `cd dashboard && npm run typecheck`

## Key Conventions
1. **Guild Isolation**: All database queries must include `guild_id`. Never leak state across guilds.
2. **Restart Safety**: Giveaways, reminders, polls, and temporary bans are scheduled via Supabase and processed asynchronously in `src/core/scheduler.ts`. Do not rely solely on in-memory `setTimeout`.
3. **i18n**: Do not hard-code user-facing strings; use `src/i18n/` translation keys.
