# UzCord V2 Architecture Overview

## Overview
UzCord consists of two primary components:
1. **Discord Bot**: Built with Node.js, TypeScript, discord.js v14, and @discordjs/voice.
2. **Management Dashboard**: Built with Next.js 15 (App Router), React 18, and Tailwind CSS.

Both applications interface with a shared Supabase PostgreSQL backend in `eu-central-1`.

---

## Data Flow & Guild Isolation
- All tables enforce strict Row Level Security (RLS).
- Local in-memory caching (`src/db/cache.ts`) minimizes database lookups for high-frequency events.
- All persistent operations mandate `guild_id` partitioning.

---

## Scheduler Infrastructure
Background jobs (giveaways, reminders, timed polls, expired bans) are persisted in Supabase tables and checked asynchronously by `src/core/scheduler.ts` every 15 seconds.
