# UzCord V2 Deployment Guide

## Docker Setup
Build and run using Docker Compose:
```bash
docker-compose up -d --build
```

## Environment Variables
Ensure `.env` contains:
- `DISCORD_TOKEN`: Discord Bot Token
- `DISCORD_CLIENT_ID`: Discord Application Client ID
- `DISCORD_CLIENT_SECRET`: Discord Application Client Secret
- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (server-only)
- `SESSION_SECRET`: Secret key for HMAC cookie signing
