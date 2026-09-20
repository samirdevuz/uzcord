-- ============================================================
--  UzCord V2 — yangi modullar
--  ticket, leveling, giveaway, eslatma, starboard, tag, so'rovnoma
-- ============================================================

-- ── Ticket (murojaat) tizimi ────────────────────────────────
create table public.ticket_settings (
  guild_id              text primary key references public.guilds(guild_id) on delete cascade,
  enabled               boolean not null default false,
  category_id           text,
  transcript_channel_id text,
  support_role_ids      jsonb   not null default '[]'::jsonb,
  panel_channel_id      text,
  panel_message_id      text,
  panel_title           text    not null default 'Yordam kerakmi?',
  panel_description     text    not null default 'Quyidagi tugmani bosib moderatorlarga murojaat qiling.',
  open_message          text    not null default 'Salom {user}! Muammoingizni batafsil yozing, moderatorlar tez orada javob beradi.',
  max_open_per_user     integer not null default 1,
  next_number           integer not null default 1,
  updated_at            timestamptz not null default now()
);

create trigger ticket_settings_touch before update on public.ticket_settings
  for each row execute function public.touch_updated_at();

create table public.tickets (
  id            bigint generated always as identity primary key,
  guild_id      text    not null references public.guilds(guild_id) on delete cascade,
  ticket_number integer not null,
  channel_id    text    not null,
  opener_id     text    not null,
  opener_tag    text,
  topic         text,
  status        text    not null default 'open' check (status in ('open','claimed','closed')),
  claimed_by    text,
  closed_by     text,
  close_reason  text,
  message_count integer not null default 0,
  transcript    text,
  created_at    timestamptz not null default now(),
  closed_at     timestamptz,
  unique (guild_id, ticket_number)
);

create index tickets_channel_idx on public.tickets (channel_id);
create index tickets_open_idx    on public.tickets (guild_id, status);

-- ── Leveling / XP ───────────────────────────────────────────
create table public.level_settings (
  guild_id            text primary key references public.guilds(guild_id) on delete cascade,
  enabled             boolean not null default false,
  xp_min              integer not null default 15,
  xp_max              integer not null default 25,
  cooldown_seconds    integer not null default 60,
  multiplier          numeric(4,2) not null default 1.00,
  announce_enabled    boolean not null default true,
  announce_channel_id text,
  level_up_message    text    not null default 'Tabriklaymiz {user}, siz **{level}**-darajaga yetdingiz!',
  ignored_channels    jsonb   not null default '[]'::jsonb,
  no_xp_roles         jsonb   not null default '[]'::jsonb,
  stack_rewards       boolean not null default true,
  updated_at          timestamptz not null default now()
);

create trigger level_settings_touch before update on public.level_settings
  for each row execute function public.touch_updated_at();

create table public.member_levels (
  guild_id        text   not null references public.guilds(guild_id) on delete cascade,
  user_id         text   not null,
  user_tag        text,
  avatar          text,
  xp              bigint not null default 0,
  level           integer not null default 0,
  messages        bigint not null default 0,
  last_message_at timestamptz,
  primary key (guild_id, user_id)
);

create index member_levels_board_idx on public.member_levels (guild_id, xp desc);

create table public.level_rewards (
  guild_id text    not null references public.guilds(guild_id) on delete cascade,
  level    integer not null,
  role_id  text    not null,
  primary key (guild_id, level)
);

-- ── Giveaway (konkurs) ──────────────────────────────────────
create table public.giveaways (
  id               bigint generated always as identity primary key,
  guild_id         text    not null references public.guilds(guild_id) on delete cascade,
  channel_id       text    not null,
  message_id       text    unique,
  prize            text    not null,
  description      text,
  winner_count     integer not null default 1,
  host_id          text    not null,
  required_role_id text,
  required_level   integer,
  ends_at          timestamptz not null,
  ended            boolean not null default false,
  winners          jsonb   not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create index giveaways_due_idx on public.giveaways (ends_at) where ended = false;

create table public.giveaway_entries (
  giveaway_id bigint not null references public.giveaways(id) on delete cascade,
  user_id     text   not null,
  entered_at  timestamptz not null default now(),
  primary key (giveaway_id, user_id)
);

-- ── Eslatmalar ──────────────────────────────────────────────
create table public.reminders (
  id         bigint generated always as identity primary key,
  guild_id   text references public.guilds(guild_id) on delete cascade,
  channel_id text,
  user_id    text not null,
  content    text not null,
  remind_at  timestamptz not null,
  delivered  boolean not null default false,
  created_at timestamptz not null default now()
);

create index reminders_due_idx  on public.reminders (remind_at) where delivered = false;
create index reminders_user_idx on public.reminders (user_id) where delivered = false;

-- ── Starboard ───────────────────────────────────────────────
create table public.starboard_settings (
  guild_id         text primary key references public.guilds(guild_id) on delete cascade,
  enabled          boolean not null default false,
  channel_id       text,
  emoji            text    not null default '⭐',
  threshold        integer not null default 3,
  allow_self_star  boolean not null default false,
  ignored_channels jsonb   not null default '[]'::jsonb,
  updated_at       timestamptz not null default now()
);

create trigger starboard_settings_touch before update on public.starboard_settings
  for each row execute function public.touch_updated_at();

create table public.starboard_posts (
  guild_id          text    not null references public.guilds(guild_id) on delete cascade,
  source_message_id text    not null,
  source_channel_id text    not null,
  star_message_id   text    not null,
  author_id         text,
  star_count        integer not null default 0,
  created_at        timestamptz not null default now(),
  primary key (guild_id, source_message_id)
);

-- ── Taglar (maxsus komandalar / avtojavoblar) ───────────────
create table public.tags (
  id         bigint generated always as identity primary key,
  guild_id   text   not null references public.guilds(guild_id) on delete cascade,
  name       text   not null,
  content    text   not null,
  as_embed   boolean not null default false,
  uses       bigint not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guild_id, name)
);

create trigger tags_touch before update on public.tags
  for each row execute function public.touch_updated_at();

-- ── So'rovnomalar ───────────────────────────────────────────
create table public.polls (
  id         bigint generated always as identity primary key,
  guild_id   text not null references public.guilds(guild_id) on delete cascade,
  channel_id text not null,
  message_id text unique,
  question   text not null,
  options    jsonb not null,
  multi      boolean not null default false,
  ends_at    timestamptz,
  ended      boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

create index polls_due_idx on public.polls (ends_at) where ended = false;

create table public.poll_votes (
  poll_id    bigint not null references public.polls(id) on delete cascade,
  user_id    text   not null,
  option_key text   not null,
  voted_at   timestamptz not null default now(),
  primary key (poll_id, user_id, option_key)
);

-- ── Dashboard audit jurnali ─────────────────────────────────
create table public.dashboard_audit (
  id         bigint generated always as identity primary key,
  guild_id   text not null references public.guilds(guild_id) on delete cascade,
  actor_id   text not null,
  actor_tag  text,
  action     text not null,
  details    jsonb,
  created_at timestamptz not null default now()
);

create index dashboard_audit_guild_idx on public.dashboard_audit (guild_id, created_at desc);
