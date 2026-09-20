-- ============================================================
--  UzCord V2 — asosiy sxema (V1 dan ko'chirilgan jadvallar)
--  Discord ID lari snowflake (64-bit) — JS da aniqlik yo'qolmasligi
--  uchun text sifatida saqlanadi.
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Serverlar va umumiy sozlamalar ──────────────────────────
create table public.guilds (
  guild_id                text primary key,
  name                    text,
  icon                    text,
  member_count            integer,
  locale                  text        not null default 'uz',
  mod_log_channel_id      text,
  message_log_channel_id  text,
  member_log_channel_id   text,
  server_log_channel_id   text,
  voice_log_channel_id    text,
  welcome_channel_id      text,
  welcome_message         text,
  goodbye_channel_id      text,
  goodbye_message         text,
  autorole_id             text,
  dm_on_punish            boolean     not null default true,
  modules                 jsonb       not null default '{}'::jsonb,
  bot_present             boolean     not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger guilds_touch before update on public.guilds
  for each row execute function public.touch_updated_at();

comment on table public.guilds is 'Har bir Discord serverining UzCord sozlamalari';

-- ── Moderatsiya tarixi ──────────────────────────────────────
create table public.mod_cases (
  id            bigint generated always as identity primary key,
  guild_id      text        not null references public.guilds(guild_id) on delete cascade,
  case_number   integer     not null,
  type          text        not null,
  user_id       text        not null,
  user_tag      text,
  moderator_id  text        not null,
  moderator_tag text,
  reason        text,
  duration_ms   bigint,
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  unique (guild_id, case_number)
);

create index mod_cases_guild_user_idx on public.mod_cases (guild_id, user_id);
create index mod_cases_guild_type_idx on public.mod_cases (guild_id, type, active);
create index mod_cases_created_idx    on public.mod_cases (guild_id, created_at desc);

-- ── Muddati tugaydigan jazolar ──────────────────────────────
create table public.temp_actions (
  id          bigint generated always as identity primary key,
  guild_id    text        not null references public.guilds(guild_id) on delete cascade,
  user_id     text        not null,
  type        text        not null,
  case_number integer,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now(),
  unique (guild_id, user_id, type)
);

create index temp_actions_expires_idx on public.temp_actions (expires_at);

-- ── Ogohlantirishlar soniga qarab avtomatik jazo ────────────
create table public.escalations (
  guild_id    text    not null references public.guilds(guild_id) on delete cascade,
  warn_count  integer not null,
  action      text    not null check (action in ('timeout', 'kick', 'ban')),
  duration_ms bigint,
  primary key (guild_id, warn_count)
);

-- ── AutoMod ─────────────────────────────────────────────────
create table public.automod_settings (
  guild_id             text primary key references public.guilds(guild_id) on delete cascade,
  enabled              boolean not null default false,
  anti_spam            boolean not null default true,
  spam_limit           integer not null default 5,
  spam_window_ms       integer not null default 5000,
  anti_duplicate       boolean not null default true,
  anti_invite          boolean not null default true,
  anti_link            boolean not null default false,
  anti_mention         boolean not null default true,
  mention_limit        integer not null default 5,
  anti_caps            boolean not null default true,
  caps_percent         integer not null default 70,
  anti_emoji           boolean not null default false,
  emoji_limit          integer not null default 10,
  word_filter          boolean not null default true,
  anti_raid            boolean not null default true,
  raid_join_limit      integer not null default 8,
  raid_window_ms       integer not null default 15000,
  min_account_age_days integer not null default 0,
  punishment           text    not null default 'warn'
                         check (punishment in ('delete','warn','timeout','kick','ban')),
  punishment_ms        bigint  not null default 600000,
  ignored_channels     jsonb   not null default '[]'::jsonb,
  ignored_roles        jsonb   not null default '[]'::jsonb,
  allowed_domains      jsonb   not null default '[]'::jsonb,
  updated_at           timestamptz not null default now()
);

create trigger automod_touch before update on public.automod_settings
  for each row execute function public.touch_updated_at();

create table public.filtered_words (
  id         bigint generated always as identity primary key,
  guild_id   text not null references public.guilds(guild_id) on delete cascade,
  word       text not null,
  created_at timestamptz not null default now(),
  unique (guild_id, word)
);

-- ── Tugmali rollar ──────────────────────────────────────────
create table public.button_roles (
  id         bigint generated always as identity primary key,
  guild_id   text not null references public.guilds(guild_id) on delete cascade,
  channel_id text not null,
  message_id text not null,
  role_id    text not null,
  label      text not null,
  emoji      text,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  unique (message_id, role_id)
);

create index button_roles_message_idx on public.button_roles (message_id);
create index button_roles_guild_idx   on public.button_roles (guild_id);
